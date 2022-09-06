import { MongoClient } from "https://deno.land/x/mongo@v0.31.0/mod.ts";
import { IrcMessage, Tags } from "https://deno.land/x/tmi@v1.0.5/mod.ts";
export interface ActualTags extends Tags {
	// for some reason this property is missing in the interface of the API
	// but the actual constructed interface has it...
	badges: string,
	"system-msg": string | undefined,
}
import { TwitchChannel, Credentials, TwitchUserBasicInfo } from "./Bot.ts";
import Config from "./Config.ts";

export enum UserPrivilege {
	None = 0,        // basic users
	VIP = 1,         // VIPs
	Moderator = 2,   // moderators
	Broadcaster = 3, // the streamer himself
}

// run before constructing to know if the message actually is a command or not
export function ircmsg_is_command_fmt(ircmsg: IrcMessage, cmd_prefix: string): boolean {
	return ircmsg.message.startsWith(cmd_prefix);
}

export class CommandContext {
	cmd: string;
	cmd_prefix: string;
	highest_priv: UserPrivilege;
	args: string[];
	channel: TwitchChannel;
	credentials: Credentials;
	startup_time: Date;
	caller: TwitchUserBasicInfo;
	sudoers: number[];
	all_commands: string[];
	db_client: MongoClient;

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

	constructor(ircmsg: IrcMessage, cfg: Config, db_client: MongoClient) {
		let msg_split = ircmsg.message.split(" ");
		// allow prefixes with 1 space in them
		if (cfg.cmd_prefix.includes(" "))
			msg_split = [[msg_split[0], msg_split[1]].join(" "), ...msg_split.slice(2)];
		this.cmd = msg_split[0].slice(cfg.cmd_prefix.length);
		this.args = msg_split.slice(1);

		this.highest_priv = this.get_highest_privilege((ircmsg.tags as ActualTags).badges);
		this.channel = cfg.channels.filter(c => c.nickname === ircmsg.channel.slice(1))[0];
		this.credentials = cfg.credentials;
		this.startup_time = cfg.startup_time!;
		this.caller = { nickname: ircmsg.username, id: parseInt(ircmsg.tags["user-id"]) };
		this.sudoers = cfg.sudoers;
		this.cmd_prefix = cfg.cmd_prefix;
		this.all_commands = cfg.get_all_commands();
		this.db_client = db_client;
	}
}

export interface CommandResult {
	is_success: boolean,
	output: string | null,
	system_commands?: string[]
}

// all of the components (functions) that a command should have 
export interface CommandModule {
	sufficient_privilege: UserPrivilege;
	execute(ctx: CommandContext): Promise<CommandResult>,
	description(): string,
	usage(cmd_prefix: string): string
}
