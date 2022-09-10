import { CommandContext, CommandModule, CommandResult } from "../Command.ts";


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

export default Logs;