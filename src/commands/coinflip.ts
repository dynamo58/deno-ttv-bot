import { CommandContext, CommandResult, CommandModule } from "../Command.ts";

const Coinflip: CommandModule = {
	sufficient_privilege: 0,

	// deno-lint-ignore require-await
	async execute(_ctx: CommandContext): Promise<CommandResult> {
		let out;
		if (Math.random() < 0.5) out = "TAILS";
		else out = "HEADS";

		return {
			is_success: true,
			output: `it is... ${out}!`,
		}
	},

	description(): string {
		return "Do a coinflip."
	},

	usage(cmd_prefix: string): string {
		return `${cmd_prefix}cf`;
	}
}

export default Coinflip;