import { IrcMessage, Tags } from "https://deno.land/x/tmi@v1.0.5/mod.ts";
interface ActualTags extends Tags {
	// for some reason this property is missing in the interface of the API
	// but the actual constructed interface has it...
	badges: string,
}
import { TwitchChannel, TwitchInfo, TwitchUserBasicInfo } from "./Bot.ts";
import Config from "./Config.ts";

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

export enum UserPrivilege {
	None = 0,        // basic users
	VIP = 1,         // VIPs
	Moderator = 2,   // moderators
	Broadcaster = 3, // the streamer himself
}

export enum Command {
	// -------------------------------------------------------------------------
	// meta commands
	// -------------------------------------------------------------------------

	None, // should be used if a command is not recognized
	Describe, // get the description of a command
	Usage, // get the usage of a command

	// -------------------------------------------------------------------------
	// individual commands
	// -------------------------------------------------------------------------
	Ping = "ping",
	Commands = "commands",
	New7tv = "new7tv",
	Stats = "stats",
	Tf = "tf",
	Clip = "clip",
	Weather = "weather",
	Accage = "accage",
	Uptime = "uptime",

	// -------------------------------------------------------------------------
	// admin-level commands
	// -------------------------------------------------------------------------
	Sudo = "sudo"
}

// deno-lint-ignore no-namespace
export namespace Command {
	export function from_str(s: string): Command {
		switch (s.toLowerCase()) {
			case "ping": return Command.Ping;
			case "describe": return Command.Describe;
			case "usage": return Command.Usage;
			case "commands": return Command.Commands;
			case "new7tv": return Command.New7tv;
			case "stats": return Command.Stats;
			case "tf": return Command.Tf;
			case "sudo": return Command.Sudo;
			case "clip": return Command.Clip;
			case "weather": return Command.Weather;
			case "accage": return Command.Accage;
			case "uptime": return Command.Uptime;
		}

		return Command.None;
	}

	export function get_all_commands(): string[] {
		return ["describe", "usage", "ping", "commands", "new7tv", "stats", "tf", "sudo", "clip", "weather"];
	}

	export function get_module(c: Command) {
		switch (c) {
			case Command.Ping: return Ping;
			case Command.New7tv: return New7Tv;
			case Command.Stats: return Stats;
			case Command.Commands: return Commands;
			case Command.Tf: return Tf;
			case Command.Sudo: return Sudo;
			case Command.Clip: return Clip;
			case Command.Weather: return Weather;
			case Command.Accage: return Accage;
			case Command.Uptime: return Uptime;
		}
	}
}

// run before constructing to know if the message actually is a command or not
export function ircmsg_is_command_fmt(ircmsg: IrcMessage, cmd_prefix: string): boolean {
	return ircmsg.message.startsWith(cmd_prefix);
}

export class CommandContext {
	cmd: Command;
	highest_priv: UserPrivilege;
	args: string[];
	channel: TwitchChannel;
	twitch_info: TwitchInfo;
	startup_time: Date;
	caller: TwitchUserBasicInfo;
	sudoers: number[];

	// get a map of keyword arguments
	// allowed delimiters: (none), '', "",
	kwargs(): Map<string, string> {
		const args = this.args.join(' ');
		const map = new Map<string, string>();
		let curr_idx = 0;
		while (curr_idx + 1 < args.length) {
			const slice = args.slice(curr_idx);
			let kwarg = null;
			const eq_idx = slice.indexOf('=');

			if (eq_idx === -1) return map;

			const pre_eq_idx_space_idx = slice.slice(0, eq_idx).lastIndexOf('\ ');
			kwarg = slice.slice(pre_eq_idx_space_idx + 1, eq_idx);

			let delimiter: string | null = null;
			if (slice[eq_idx + 1] === '\'') delimiter = '\'';
			if (slice[eq_idx + 1] === '\"') delimiter = '\"';

			if (delimiter === null) {
				let next_space_idx = slice.slice(eq_idx + 1).indexOf('\ ');
				if (next_space_idx === -1) next_space_idx = slice.length;
				else next_space_idx += eq_idx + 1;
				map.set(kwarg.toLowerCase(), slice.slice(eq_idx + 1, next_space_idx));
				curr_idx += next_space_idx + 1;
				continue;
			} else {
				let next_delimiter_idx = slice.slice(eq_idx + 2).indexOf(delimiter);
				if (next_delimiter_idx === -1) next_delimiter_idx = slice.length;
				else next_delimiter_idx += eq_idx + 2;
				map.set(kwarg.toLowerCase(), slice.slice(eq_idx + 2, next_delimiter_idx));
				console.log(`got ${slice.slice(eq_idx + 2, next_delimiter_idx)}`)
				curr_idx += next_delimiter_idx + 1;
				continue;
			}
		}
		return map;
	}

	get_highest_privilege(ircmsg_badges_tag: string): UserPrivilege {
		if (ircmsg_badges_tag.includes("broadcaster"))
			return UserPrivilege.Broadcaster;
		if (ircmsg_badges_tag.includes("vip"))
			return UserPrivilege.VIP;
		if (ircmsg_badges_tag.includes("moderator"))
			return UserPrivilege.Moderator;

		return UserPrivilege.None;
	}

	constructor(ircmsg: IrcMessage, cfg: Config) {
		let msg_split = ircmsg.message.split(" ");
		// allow prefixes with 1 space in them
		if (cfg.cmd_prefix.includes(" "))
			msg_split = [[msg_split[0], msg_split[1]].join(" "), ...msg_split.slice(2)];
		this.cmd = Command.from_str(msg_split[0].slice(cfg.cmd_prefix.length));
		this.args = msg_split.slice(1);

		this.highest_priv = this.get_highest_privilege((ircmsg.tags as ActualTags).badges);
		this.channel = cfg.channels.filter(c => c.nickname === ircmsg.channel.slice(1))[0];
		this.twitch_info = cfg.twitch_info;
		this.startup_time = cfg.startup_time!;
		this.caller = { nickname: ircmsg.username, id: parseInt(ircmsg.tags["user-id"]) };
		this.sudoers = cfg.sudoers;
	}
}

export interface CommandResult {
	is_success: boolean,
	output: string | null,
}

// all of the components (functions) that a command should have 
export interface CommandModule {
	sufficient_privilege: UserPrivilege;
	execute(ctx: CommandContext): Promise<CommandResult>,
	description(): string,
	usage(cmd_prefix: string): string
}