import { TwitchChat } from "https://deno.land/x/tmi@v1.0.5/mod.ts";
import "https://deno.land/x/dotenv@v3.2.0/load.ts";

import * as twitch from "./apis/twitch.ts";
import Hook from "./Hook.ts";
import { TwitchInfo, TwitchChannel } from "./bot.ts";
import CronJob from "./CronJob.ts";
import { ICronJobConstructor } from "./CronJob.ts";

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

	add_cronjob(c: ICronJobConstructor): Config {
		this.cron_jobs.push(new CronJob(c));
		return this;
	}

	async add_sudoers(sudoers: string[]): Promise<Config> {
		const sudoer_ids = await twitch.id_from_nick(this.twitch_info, sudoers);
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

	// -------------------------------------------------------------------------
	// file system IO
	// -------------------------------------------------------------------------

	async save_stats_to_file(channel: TwitchChannel) {
		try {
			await Deno.writeTextFile(
				`./cache/${channel.nickname}__${(new Date()).toISOString()}.json`,
				JSON.stringify(channel)
			);
			console.log(`Saved stats for ${channel.nickname}.`);
		} catch (e) {
			console.log(`Failed saving stats for ${channel.nickname}.\n${e}`);
		}
	}
}
