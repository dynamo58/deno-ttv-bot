import { TwitchChat } from "https://deno.land/x/tmi@v1.0.5/mod.ts";
import "https://deno.land/x/dotenv@v3.2.0/load.ts";
import { createHash } from "https://deno.land/std@0.77.0/hash/mod.ts";

import * as twitch from "./apis/twitch.ts";
import * as seven_tv from "./apis/7tv.ts";

import Hook from "./Hook.ts";
import { Credentials, TwitchChannel, UptimeStats } from "./Bot.ts";
import CronJob, { ICronJobConstructor } from "./CronJob.ts";
import { CommandModule } from "./Command.ts";

import "./std_redeclarations.ts";

import Ping from "./commands/ping.ts";
import New7Tv from "./commands/7tv.ts";
import Stats from "./commands/stats.ts";
import Commands from "./commands/commands.ts";
import Tf from "./commands/tf.ts";
import Sudo from "./commands/sudo.ts";
import Clip from "./commands/clip.ts";
import Weather from "./commands/weather.ts";
import Accage from "./commands/accage.ts";
import Uptime from "./commands/uptime.ts";
import Remind, { Reminder } from "./commands/remind.ts";
import Kappa from "./commands/kappa.ts";
import Lurk, { Lurker } from "./commands/lurk.ts";
import Wolfram from "./commands/wolfram.ts";
import Coinflip from "./commands/coinflip.ts";
import NotifyMe from "./commands/notifyme.ts";
import Define from "./commands/define.ts";

type DatabaseKind = undefined | "mongo";

interface IConfigConstructor {
	cmd_prefix?: string,
	database_kind: DatabaseKind,
}

interface IJoinChannel {
	name: string,
	subscribe_message?: string,
	resubscribe_message?: string,
	has_eventsub?: boolean
}

export default class Config {
	client: TwitchChat;
	credentials: Credentials;
	loopback_address: string | null;
	// twitch user IDs of people with the `UserPrivilege.Sudo` status
	sudoers: number[];
	channels: TwitchChannel[];
	cmd_prefix: string;
	disregarded_users: string[];
	startup_time: Date | null;
	cron_jobs: CronJob[];
	// map between user-ids and Reminder interfaces
	reminders: Map<number, Reminder[]>;
	commands: Map<string, CommandModule>;
	database_kind: DatabaseKind;
	// lurkers - people that have explicitly proclaimed to be AFK in the chatroom
	//           userId -> ...  
	lurkers: Map<number, Lurker>;

	constructor(cfg: IConfigConstructor) {
		try {
			this.cmd_prefix = cfg.cmd_prefix ?? "!";
			this.channels = [];
			this.disregarded_users = [];
			this.sudoers = [];
			this.lurkers = new Map();
			this.database_kind = cfg.database_kind;
			this.loopback_address = null;
			this.credentials = {
				login: Deno.env.get("TWITCH_LOGIN")!,
				oauth: Deno.env.get("TWITCH_OAUTH")!,
				client_id: Deno.env.get("TWITCH_CLIENT_ID")!,
				app_client_id: Deno.env.get("TWITCH_APP_CLIENT_ID")!,
				app_secret: Deno.env.get("TWITCH_APP_SECRET")!,
				wolfram_appid: Deno.env.get("WOLFRAMALPHA_APPID")!,
				secret: createHash("sha1").toString(),
			};
			this.client = new TwitchChat(this.credentials.oauth, this.credentials.login);
			this.startup_time = null;
			this.cron_jobs = [];
			this.reminders = new Map();
			this.commands = new Map([
				["remind", Remind],
				["ping", Ping],
				["commands", Commands],
				["new7tv", New7Tv],
				["stats", Stats],
				["tf", Tf],
				["sudo", Sudo],
				["clip", Clip],
				["weather", Weather],
				["accage", Accage],
				["uptime", Uptime],
				["kappa", Kappa],
				["lurk", Lurk],
				["afk", Lurk],
				["wolfram", Wolfram],
				["math", Wolfram],
				["cf", Coinflip],
				["coinflip", Coinflip],
				["notifyme", NotifyMe],
				["define", Define]
			])
		} catch (e) {
			throw e;
		}
	}

	get_all_commands(): string[] {
		return Array.from(this.commands.keys());
	}

	get_channel_idx_by_id(user_id: number): number | null {
		for (const [i, c] of this.channels.entries())
			if (c.id === user_id) return i;

		return null;
	}

	// -------------------------------------------------------------------------
	// builder pattern methods
	// -------------------------------------------------------------------------

	add_cronjob(c: ICronJobConstructor): Config {
		this.cron_jobs.push(new CronJob(c));
		return this;
	}

	async add_sudoers(sudoers: string[]): Promise<Config> {
		const r = await twitch.id_from_nick(this.credentials, sudoers);
		if (r.status !== 200) throw new Error(`Some sudoer isn't real or Twitch bricked`);
		const sudoer_ids = r.data!;

		if (sudoer_ids.length !== sudoers.length) throw new Error(`One or more sudoers aren't real Twitch users`);
		this.sudoers = sudoer_ids;
		return this;
	}

	disregard_users(users: string[]): Config {
		users = users.map(u => u.toLowerCase());
		this.disregarded_users = users;
		return this;
	}

	join_channels(channels: IJoinChannel[]): Config {
		for (const { name, subscribe_message, resubscribe_message, has_eventsub } of channels)
			this.channels.push({
				nickname: name.toLowerCase(),
				id: 0,
				uptime_stats: null,
				hooks: [],
				pyramid_tracker: { count: 0, is_ascending: true },
				resubscribe_message,
				subscribe_message,
				has_eventsub: has_eventsub ?? false
			});
		return this;
	}

	add_hook(channel_name: string, hook: Hook): Config {
		channel_name = channel_name.toLowerCase();
		let channel_idx: undefined | number;

		for (const [idx, c] of this.channels.entries())
			if (c.nickname === channel_name) {
				channel_idx = idx;
				break;
			}
		if (channel_idx === undefined) throw new Error(`Channel ${channel_name} not joined by the bot!`)

		this.channels[channel_idx].hooks.push({
			...hook,
			substring_criterion: hook.substring_criterion?.toLowerCase(),
			nickname_criterion: hook.nickname_criterion?.toLowerCase(),
		});

		return this;
	}

	enable_7tv_notifications(): Config {
		// wym callback hell?
		seven_tv.get_users(this.channels.map(c => c.nickname))
			.then(users => {
				// the 7tv API is just fucked... I would never make it this wasteful
				// if it wasn't for that reason
				if (users.status === 200) {
					users.data!.forEach((u, idx) => {
						const seven_tv_socket = () => {
							// This socket connection has failed on me, but I wasn't able to quite
							// figure out why that is the case, so this is the solution
							try {
								const ws = new WebSocket('wss://events.7tv.io/v3');
								ws.addEventListener('open', function open() {
									ws.send(JSON.stringify({
										op: 35,
										d: {
											type: "emote_set.update",
											condition: {
												object_id: u.id,
											}
										}
									}))
								});

								ws.addEventListener('message', (data) => {
									const d = JSON.parse(data.data).d;

									if (d.body) {
										const client = this.channels[idx].client;
										if (d.body.pulled) { // an emote was removed
											const emote_name = d.body.pulled[0].old_value.name;
											if (client) client.send(`7tvM an emote was removed: ${emote_name}`);
										}

										if (d.body.pushed) { // an emote was added
											const emote_name = d.body.pushed[0].value.name;
											if (client) client.send(`7tvM new emote added: ${emote_name}`);
										}
									}
								});
							} catch { seven_tv_socket() }
						}
						seven_tv_socket();
					});
				}
			});

		return this;
	}
}
