import { Command, CommandContext, CommandResult, CommandModule } from "./Command.ts";

const Commands: CommandModule = {
	sufficient_privilege: 0,

	async execute(_: CommandContext): Promise<CommandResult> {
		const global_cmds = Command.get_all_commands().join(", ");

		return await {
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