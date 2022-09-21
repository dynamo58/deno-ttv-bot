import { CommandContext, CommandModule, CommandResult } from "../Command.ts";
import * as twitch from "../apis/twitch.ts";
import { get_rand_log_in_channel, get_users_available_log_channels, get_rand_log_of_user_in_channel } from "../apis/logs_ivr_fi.ts";

const Logs: CommandModule = {
	sufficient_privilege: 0,

	// deno-lint-ignore require-await
	async execute(ctx: CommandContext): Promise<CommandResult> {
		const kwargs = ctx.kwargs();

		let channel = ctx.channel.nickname;
		let user = ctx.caller.nickname;
		if (kwargs.get("user")) user = kwargs.get("user")!;
		else if (ctx.args.length > 0 && !ctx.args[0].includes('#'))
			user = ctx.args[0];

		if (kwargs.get("channel")) channel = kwargs.get("channel")!;
		else if (ctx.args.length > 1 && !ctx.args[1].includes('#'))
			channel = ctx.args[1];

		return new CommandResult(200, `ApuApustaja TakingNotes0 https://logs.ivr.fi/?channel=${channel}&username=${user}`);
	},

	description(): string {
		return "get a link to (un)specified logs."
	},

	usage(cmd_prefix: string): string {
		return `${cmd_prefix}logs user?={...} channel?={...} or ${cmd_prefix}logs <user?> <channel?>`;
	}
}

export const RandLog: CommandModule = {
	sufficient_privilege: 0,

	async execute(ctx: CommandContext): Promise<CommandResult> {
		const kwargs = ctx.kwargs();
		let r;
		if (kwargs.get("user"))
			r = await get_rand_log_of_user_in_channel(ctx.channel.nickname, kwargs.get("user")!);
		else
			r = await get_rand_log_in_channel(ctx.channel.nickname);

		if (r.status === 400) return new CommandResult(400, `that channel is not being tracked, sorry.`);
		if (r.status === 500) return new CommandResult(500, UNKNOWN_ERROR_MESSAGE);

		return new CommandResult(200, r.data!);
	},

	description(): string {
		return `get a random message from the channel.`
	},

	usage(cmd_prefix: string): string {
		return `${cmd_prefix}randlog or ${cmd_prefix}logrand`;
	},
}

export const GetLogs: CommandModule = {
	sufficient_privilege: 0,

	async execute(ctx: CommandContext): Promise<CommandResult> {
		let user_name: string | undefined;
		const kwargs = ctx.kwargs();
		if (kwargs.get("user")) user_name = kwargs.get("user")
		else if (ctx.args.length > 0) user_name = ctx.args[0];

		let user_id: number | string;
		if (user_name === undefined) {
			user_name = ctx.caller.nickname;
			user_id = ctx.caller.id;
		} else {
			const r = await twitch.get_users(ctx.credentials, [user_name]);
			if (r.status === 400) return new CommandResult(400, USER_DOESNT_EXIST_MESSAGE);
			if (r.status === 500) return new CommandResult(500, UNKNOWN_ERROR_MESSAGE);
			user_id = r.data![0].id;
		}

		const channels_with_logs = await get_users_available_log_channels(user_id);
		if (channels_with_logs.status === 500) return new CommandResult(500, UNKNOWN_ERROR_MESSAGE);

		return new CommandResult(200, `(out of tracked channels) ${user_name} has logs in ${channels_with_logs.data!.length}: ${channels_with_logs.data!.join(", ")}`);
	},

	description(): string {
		return `get the list of all channels that a user has logs in that are on logs.ivr.fi`
	},

	usage(cmd_prefix: string): string {
		return `${cmd_prefix}getlogs user?={some user} or ${cmd_prefix}getlogs <some user>`;
	},
}

export default Logs;