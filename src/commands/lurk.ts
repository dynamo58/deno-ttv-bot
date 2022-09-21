import { CommandContext, CommandModule, CommandResult } from "../Command.ts";

export interface Lurker {
	start: Date,
	message?: string,
}

const Lurk: CommandModule = {
	sufficient_privilege: 0,

	// deno-lint-ignore require-await
	async execute(ctx: CommandContext): Promise<CommandResult> {
		const kwargs = ctx.kwargs();

		let message: string | undefined;
		if (kwargs.get("msg"))
			message = kwargs.get("msg")!;
		else if (ctx.args.length > 0)
			message = ctx.args.join(" ");

		const lurker: Lurker = {
			start: new Date(),
			message,
		}

		return new CommandResult(200, `you are now lurking: ${message ?? "<no message>"}`, [`this.cfg.lurkers.set(${ctx.caller.id}, ${JSON.stringify(lurker)})`]);
	},

	description(): string {
		return "Signify that you are going AFK (cancels when you next type in chat)."
	},

	usage(cmd_prefix: string): string {
		return `${cmd_prefix}lurk msg?={some message}`;
	}
}

export default Lurk;