import { CommandContext, CommandModule, CommandResult } from "../Command.ts";
import * as twitch from "../apis/twitch.ts";


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

		return {
			is_success: true,
			output: `ApuApustaja TakingNotes0 https://logs.ivr.fi/?channel=${channel}&username=${user}`,
		}
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
		const r = await fetch(`https://logs.ivr.fi/channel/${ctx.channel.nickname}/random`);
		return {
			is_success: true,
			output: await r.text()
		}
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
		else if (ctx.args.length > 0) user_name = ctx.args[1];

		let user_id: number | string;
		if (user_name === undefined) {
			user_id = ctx.caller.id;
			user_name = ctx.caller.nickname;
		} else {
			const r = await twitch.get_users(ctx.credentials, [user_name]);
			if (r.status === 400) return { is_success: false, output: `that user doesn't exist.` }
			if (r.status === 500) return { is_success: false, output: `unknown error occured, please try again later` }
			user_id = r.data![0].id;
		}

		const all_channels = (await (await fetch(`https://logs.ivr.fi/channels`, {
			headers: {
				'Accept': 'application/json'
			}
		})).json()).channels as { userID: string, name: string }[];

		const channels_with_logs: string[] = [];

		for (const c of all_channels) {
			try {
				const r = await fetch(`https://logs.ivr.fi/list?channel=${c.name}&username=${user_name}&channelid=${c.userID}&userid=${user_id}`, {
					headers: {
						'Accept': 'application/json'
					}
				});

				// this will fail if there is no logs
				// because then the API sends a plaintext
				await r.json();

				channels_with_logs.push(c.name);
			}
			// deno-lint-ignore no-empty
			catch { }
		}

		return {
			is_success: true,
			output: `(⚠OUT OF THE TRACKED CHANNELS⚠) ${user_name} has logs in ${channels_with_logs.length}: ${channels_with_logs.join(", ")}`
		}
	},

	description(): string {
		return `get the list of all channels that a user has logs in that are on logs.ivr.fi`
	},

	usage(cmd_prefix: string): string {
		return `${cmd_prefix}getlogs user?={some user} or ${cmd_prefix}getlogs <some user>`;
	},
}

export default Logs;