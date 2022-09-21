import { CommandContext, CommandModule, CommandResult } from "../Command.ts";
import { format_duration } from "../std_redeclarations.ts";

const Ping: CommandModule = {
	// for some reason I was getting some obscure errors while trying to mark this
	// as UserPrivilege.{...}, so it has to look this obfuscated :(
	sufficient_privilege: 0,

	// deno-lint-ignore require-await
	async execute(ctx: CommandContext): Promise<CommandResult> {
		const uptime_mls = (new Date()).valueOf() - ctx.startup_time.valueOf();

		return new CommandResult(200, `Pong! Running for ${format_duration(uptime_mls, false)}.`);
	},

	description(): string {
		return "Get a \"pong!\" response with the bot's uptime."
	},

	usage(cmd_prefix: string): string {
		return `${cmd_prefix}ping`;
	}
}

export default Ping;