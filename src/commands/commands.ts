import { CommandContext, CommandResult, CommandModule } from "../Command.ts";

const Commands: CommandModule = {
	sufficient_privilege: 0,

	// deno-lint-ignore require-await
	async execute(ctx: CommandContext): Promise<CommandResult> {
		const global_cmds = ctx.all_commands.join(", ");

		return {
			is_success: true,
			output: `@${ctx.caller} global commands: ${global_cmds}`,
		}
	},

	description(): string {
		return "Get a list of all the bot's commands available."
	},

	usage(cmd_prefix: string): string {
		return `${cmd_prefix}commands`;
	}
}

export default Commands;