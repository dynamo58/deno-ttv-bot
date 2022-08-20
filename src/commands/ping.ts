import { CommandContext, CommandModule, CommandResult } from "./Command.ts";


const Ping: CommandModule = {
	// for some reason I was getting some obscure errors while trying to mark this
	// as UserPrivilege.{...}, so it has to look this obfuscated :(
	sufficient_privilege: 0,

	async execute(ctx: CommandContext): Promise<CommandResult> {
		const uptime_mls = (new Date()).valueOf() - ctx.startup_time.valueOf();
		const hrs = uptime_mls / (1_000 * 60 * 60);

		return await {
			is_success: true,
			output: `Pong! Running for ${hrs.toFixed(2)} hrs.`,
		}
	},

	description(): string {
		return "Get a \"pong!\" response with the bot's uptime."
	},

	usage(cmd_prefix: string): string {
		return `${cmd_prefix}ping`;
	}
}

export default Ping;