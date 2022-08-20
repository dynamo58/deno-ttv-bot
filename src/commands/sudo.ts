import { CommandContext, CommandModule, CommandResult } from "./Command.ts";

const Sudo: CommandModule = {
	sufficient_privilege: 0,

	async execute(ctx: CommandContext): Promise<CommandResult> {
		if (!ctx.sudoers.includes(ctx.caller.id)) return await {
			is_success: false,
			output: `Only hackermen allowed B)`,
		}

		const kwargs = ctx.kwargs();
		if (!kwargs.get("action")) return {
			is_success: false,
			output: `No action an provided.`,
		}

		switch (kwargs.get("action")!) {
			case "kill":
				setTimeout(() => { Deno.exit(0); }, 100);

				return {
					is_success: false,
					output: "Going down FeelsBadMan 👍 ",
				}
			default:
				return await {
					is_success: false,
					output: `Subcommand ${ctx.args[0]} not recognized.`
				}
		}

	},

	description(): string {
		return "Access sudo commands."
	},

	usage(cmd_prefix: string): string {
		return `${cmd_prefix}sudo action={kill}`;
	}
}

export default Sudo;