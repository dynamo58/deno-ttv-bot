import { TwitchChat } from "https://deno.land/x/tmi@v1.0.5/mod.ts";
import "https://deno.land/x/dotenv@v3.2.0/load.ts";

import * as twitch from "./apis/twitch.ts";
import * as seven_tv from "./apis/7tv.ts";

import Hook from "./Hook.ts";
import { Credentials, TwitchChannel } from "./Bot.ts";
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


type DatabaseKind = undefined | "mongo";

interface IConfigConstructor {
	cmd_prefix?: string,
	database_kind: DatabaseKind,
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
			const twitch_oauth = Deno.env.get("TWITCH_OAUTH")!;
			const twitch_login = Deno.env.get("TWITCH_LOGIN")!;
			const twitch_client_id = Deno.env.get("TWITCH_CLIENT_ID")!;
			const twitch_client_secret = Deno.env.get("TWITCH_CLIENT_SECRET")!;
			const wolfram_appid = Deno.env.get("WOLFRAMALPHA_APPID")!;

			this.cmd_prefix = cfg.cmd_prefix ?? "!";
			this.client = new TwitchChat(twitch_oauth, twitch_login);
			this.channels = [];
			this.disregarded_users = [];
			this.sudoers = [];
			this.lurkers = new Map();
			this.database_kind = cfg.database_kind;
			this.loopback_address = null;
			this.credentials = {
				login: twitch_login,
				oauth: twitch_oauth,
				client_id: twitch_client_id,
				client_secret: twitch_client_secret,
				wolfram_appid,
			};
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
			])
		} catch (e) {
			throw e;
		}
	}

	get_all_commands(): string[] {
		return Array.from(this.commands.keys());
	}

	// -------------------------------------------------------------------------
	// builder pattern methods
	// ------------------------------------------------------------------------

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

	join_channels(channels: string[]): Config {
		channels = channels.map(c => c.toLowerCase());
		for (const c of channels)
			this.channels.push({ nickname: c, id: 0, uptime_stats: null, hooks: [], pyramid_tracker: { count: 0, is_ascending: true } });
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
				users.unwrap().forEach((u, idx) => {
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
				});
			});

		return this;
	}
}
