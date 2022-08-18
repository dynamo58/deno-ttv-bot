import { IrcMessage } from "https://deno.land/x/tmi@v1.0.5/mod.ts";
import { Config, TwitchChannel, TwitchInfo } from "../lib.ts";

import Ping from "./ping.ts";
import New7Tv from "./7tv.ts";
import Stats from "./stats.ts";
import Commands from "./commands.ts";

enum UserPrivilege {
	None,       // basic users
	VIP,        // VIPs
	Moderator,  // moderators
	Broadcaster, // the streamer himself
}

// deno-lint-ignore no-namespace
namespace UserPrivilege {
	export function from_ircmsg_badges_tag(badges_str: string): UserPrivilege {
		if (badges_str.includes("broadcaster"))
			return UserPrivilege.VIP;
		if (badges_str.includes("vip"))
			return UserPrivilege.VIP;
		if (badges_str.includes("moderator"))
			return UserPrivilege.VIP;

		return UserPrivilege.None;
	}
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
	Ping,
	Commands,
	New7tv,
	Stats,
}

// deno-lint-ignore no-namespace
export namespace Command {
	export function from_str(s: string): Command {
		switch (s.toLowerCase()) {
			case "ping":
				return Command.Ping;
			case "describe":
				return Command.Describe;
			case "usage":
				return Command.Usage;
			case "commands":
				return Command.Commands;
			case "new7tv":
				return Command.New7tv;
			case "stats":
				return Command.Stats;
		}

		return Command.None;
	}

	export function get_all_commands(): string[] {
		return ["describe", "usage", "ping", "commands", "new7tv", "stats"];
	}

	export function get_module(c: Command) {
		switch (c) {
			case Command.Ping:
				return Ping;
			case Command.New7tv:
				return New7Tv;
			case Command.Stats:
				return Stats;
			case Command.Commands:
				return Commands;
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

	constructor(ircmsg: IrcMessage, cfg: Config) {
		let msg_split = ircmsg.message.split(" ");
		// allow prefixes with 1 space in them
		if (cfg.cmd_prefix.includes(" "))
			msg_split = [[msg_split[0], msg_split[1]].join(" "), ...msg_split.slice(2)];
		this.cmd = Command.from_str(msg_split[0].slice(cfg.cmd_prefix.length));
		this.args = msg_split.slice(1);

		this.highest_priv = UserPrivilege.from_ircmsg_badges_tag(ircmsg.tags.flags);
		this.channel = cfg.channels.filter(c => c.nickname === ircmsg.channel.slice(1))[0];
		this.twitch_info = cfg.twitch_info;
		this.startup_time = cfg.startup_time!;
	}
}

export interface CommandResult {
	is_success: boolean,
	output: string | null,
}

// all of the components (functions) that a command should have 
export interface CommandModule {
	execute(ctx: CommandContext): Promise<CommandResult>,
	description(): string,
	usage(cmd_prefix: string): string
}
