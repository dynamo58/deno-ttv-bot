import { _createWalkEntry } from "https://deno.land/std@0.125.0/fs/walk.ts";
import { CommandContext, CommandModule, CommandResult } from "../Command.ts";
import Log from "../Log.ts";

const Sudo: CommandModule = {
	sufficient_privilege: 0,

	// deno-lint-ignore require-await
	async execute(ctx: CommandContext): Promise<CommandResult> {
		if (!ctx.sudoers.includes(ctx.caller.id)) return {
			is_success: false,
			output: `Only hackermen allowed B)`,
		}

		let action: string | undefined;
		const kwargs = ctx.kwargs();
		if (kwargs.get("action")) action = kwargs.get("action");
		else if (ctx.args.length > 0) action = ctx.args[0];

		if (action === undefined) return {
			is_success: false,
			output: `No action an provided.`,
		}

		switch (action.toLowerCase()) {
			case "kill":
				setTimeout(() => {
					// TODO: do something about this lole
					Deno.run({ cmd: ["killall", "deno"] });
					Deno.run({ cmd: ["killall", "ngrok"] });
					Deno.exit(0);
				}, 100);
				return {
					is_success: false,
					output: "Going down FeelsBadMan 👍 ",
				}
			case "restart":
				setTimeout(async () => {
					const s = Deno.run({ cmd: ["git", "pull", "origin", "main"] })
					await s.status();
					Deno.run({ cmd: ["deno", "run", "-A", "src/main.ts", "&!"] });
					Log.success(`Goodbye, cruel world`);
					Deno.exit(0);
				}, 200);

				return { is_success: true, output: `pulling origin, rebooting... MrDestructoid` }
			default:
				return {
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