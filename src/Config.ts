import { TwitchChat } from "https://deno.land/x/tmi@v1.0.5/mod.ts";
import "https://deno.land/x/dotenv@v3.2.0/load.ts";

import * as twitch from "./apis/twitch.ts";
import Hook from "./Hook.ts";
import { TwitchInfo, TwitchChannel } from "./bot.ts";
import CronJob from "./CronJob.ts";

import "./std_redeclarations.ts";

interface IConfigConstructor {
	cmd_prefix?: string,
}

export default class Config {
	client: TwitchChat;
	twitch_info: TwitchInfo;
	loopback_address: string | null;
	// twitch user IDs of people with the `UserPrivilege.Sudo` status
	sudoers: number[];
	channels: TwitchChannel[];
	cmd_prefix: string;
	disregarded_users: string[];
	startup_time: Date | null;
	cron_jobs: CronJob[];

	constructor(cfg: IConfigConstructor) {
		try {
			const twitch_oauth = Deno.env.get("TWITCH_OAUTH")!;
			const twitch_login = Deno.env.get("TWITCH_LOGIN")!;
			const twitch_client_id = Deno.env.get("TWITCH_CLIENT_ID")!;
			const twitch_client_secret = Deno.env.get("TWITCH_CLIENT_SECRET")!;

			this.cmd_prefix = cfg.cmd_prefix ?? "!";
			this.client = new TwitchChat(twitch_oauth, twitch_login);
			this.channels = [];
			this.disregarded_users = [];
			this.sudoers = []
			this.loopback_address = null;
			this.twitch_info = {
				login: twitch_login,
				oauth: twitch_oauth,
				client_id: twitch_client_id,
				client_secret: twitch_client_secret,
			};
			this.startup_time = null;
			this.cron_jobs = [];
		} catch {
			throw new Error("Credentials not in environment!");
		}
	}

	// -------------------------------------------------------------------------
	// builder pattern methods
	// ------------------------------------------------------------------------

	add_cronjob(c: CronJob): Config {
		this.cron_jobs.push(c);
		return this;
	}

	async add_sudoers(sudoers: string[]): Promise<Config> {
		const sudoer_ids = await twitch.id_from_nick(this.twitch_info, sudoers);
		if (sudoer_ids.length !== sudoers.length) throw new Error(`One or more sudoers aren't real Twitch users`);
		this.sudoers = sudoer_ids;
		return this;
	}

	disregard_users(users: string[]): Config {
		this.disregarded_users = users;
		return this;
	}

	join_channels(channels: string[]): Config {
		for (const c of channels)
			this.channels.push({ nickname: c, id: 0, uptime_stats: null, hooks: [] });
		return this;
	}

	add_hook(channel_name: string, hook: Hook): Config {
		let channel_idx: undefined | number;

		for (const [idx, c] of this.channels.entries())
			if (c.nickname === channel_name) {
				channel_idx = idx;
				break;
			}

		if (!channel_idx) throw new Error(`Channel ${channel_name} not joined by the bot!`)

		this.channels[channel_idx].hooks.push({
			...hook,
			substring_criterion: hook.substring_criterion?.toLowerCase(),
			nickname_criterion: hook.nickname_criterion?.toLowerCase(),
		});

		return this;
	}

	// -------------------------------------------------------------------------
	// file system IO
	// -------------------------------------------------------------------------

	async save_stats_to_file(channel: TwitchChannel) {
		try {
			await Deno.writeTextFile(
				`./cache/${(new Date()).toISOString()}.json`,
				JSON.stringify(channel)
			);
			console.log(`Saved stats for ${channel.nickname}.`);
		} catch {
			console.log(`Failed saving stats for ${channel.nickname}.`);
		}
	}

	async init_channels(): Promise<Config> {
		for (const [idx, c] of this.channels.entries()) {
			const channel = await twitch.get_channel(this.twitch_info, c.nickname);

			// if channel is not live
			if (channel.data.length === 0) {
				try {
					const channel_id = (await twitch.id_from_nick(this.twitch_info, [c.nickname]))[0];
					this.channels[idx] = { ...c, id: channel_id, nickname: c.nickname.toLowerCase() };
				} catch {
					throw new Error(`Channel ${c.nickname} does not exist!`);
				}

				continue;
			}

			// if channel is live
			this.channels[idx] = {
				nickname: c.nickname.toLowerCase(),
				id: parseInt(channel.data[0].user_id),
				uptime_stats: {
					messages_sent: 0,
					games_played: [channel.data[0].game_name],
					startup_time: new Date(channel.data[0].started_at),
					user_counts: new Map<number, number>()
				},
				hooks: []
			}
		}

		return this;
	}
}
