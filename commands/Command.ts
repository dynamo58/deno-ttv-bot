import { IrcMessage } from "https://deno.land/x/tmi/mod.ts";
import { TwitchUserBasicInfo, Config } from "../lib.ts";

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

enum Command {
	// should be used if a command is not recognized
	None,
	Ping = "./commands/ping.ts"
}

// deno-lint-ignore no-namespace
namespace Command {
	export function from_str(s: string): Command {
		switch (s.toLowerCase()) {
			case "ping":
				return Command.Ping;
		}

		return Command.None;
	}
}

export interface ICommandContext {
	highest_priv: UserPrivilege,
	cmd: Command,
	args: string[],
	channel: TwitchUserBasicInfo,
}

// run before constructing to know if the message actually is a command or not
export function ircmsg_is_command_fmt(ircmsg: IrcMessage, cmd_prefix: string): boolean {
	return ircmsg.message.split(" ")[0].startsWith(cmd_prefix);
}

export class CommandContext implements ICommandContext {
	cmd: Command;
	highest_priv: UserPrivilege;
	args: string[];
	channel: TwitchUserBasicInfo;

	constructor(ircmsg: IrcMessage, cfg: Config) {
		const msg_split = ircmsg.message.split(" ");
		this.cmd = Command.from_str(msg_split[0].slice(cfg.cmd_prefix.length));
		this.args = msg_split.slice(1);

		this.highest_priv = UserPrivilege.from_ircmsg_badges_tag(ircmsg.tags.flags);

		// TODO: redo this to be less expensive lol
		const channel_id = cfg.channels
			.filter(c => c.login === ircmsg.channel)
			.map(c => c.id)[0]
		this.channel = { nickname: ircmsg.channel, id: channel_id };
	}
}

export interface CommandResult {
	is_success: boolean,
	output: string | null,
}

// all of the components (functions) that a command should have 
export interface CommandModule {
	execute(ctx: CommandContext): CommandResult,
	description(): string,
	usage(): string
}
