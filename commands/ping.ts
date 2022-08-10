import { CommandContext, CommandResult } from "./Command.ts";

export function execute(_: CommandContext): CommandResult {
	const uptime_mls = (new Date()).valueOf() - (new Date(parseInt(Deno.env.get("startup_time")!))).valueOf();
	const hrs = uptime_mls / (1_000 * 60 * 60);

	return {
		is_success: true,
		output: `Pong! Uptime: ${hrs.toFixed(2)} hrs.`,
	}
}

export function description(): string {
	return "Get a pong! response with the bot uptime."
}

export function usage(): string {
	return "<prefix>ping";
}
