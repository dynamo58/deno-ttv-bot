import { CommandContext, CommandModule, CommandResult } from "./Command.ts";

const Ping: CommandModule = {
	execute(_: CommandContext): CommandResult {
		const uptime_mls = (new Date()).valueOf() - (new Date(parseInt(Deno.env.get("startup_time")!))).valueOf();
		const hrs = uptime_mls / (1_000 * 60 * 60);

		return {
			is_success: true,
			output: `Pong! Uptime: ${hrs.toFixed(2)} hrs.`,
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