import { Command, CommandContext, CommandResult, CommandModule } from "./Command.ts";

const Commands: CommandModule = {
	execute(_: CommandContext): CommandResult {
		const global_cmds = Command.get_all_commands().join(", ");

		return {
			is_success: true,
			output: `Global commands: ${global_cmds}`,
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