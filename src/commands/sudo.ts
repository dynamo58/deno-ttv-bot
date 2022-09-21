import { _createWalkEntry } from "https://deno.land/std@0.125.0/fs/walk.ts";
import { CommandContext, CommandModule, CommandResult } from "../Command.ts";
import Log from "../Log.ts";

const Sudo: CommandModule = {
	sufficient_privilege: 0,

	// deno-lint-ignore require-await
	async execute(ctx: CommandContext): Promise<CommandResult> {
		if (!ctx.sudoers.includes(ctx.caller.id)) return new CommandResult(400, `only hackermen allowed.`);

		let action: string | undefined;
		const kwargs = ctx.kwargs();
		if (kwargs.get("action")) action = kwargs.get("action");
		else if (ctx.args.length > 0) action = ctx.args[0];

		if (action === undefined) return new CommandResult(400, "no action provided");

		switch (action.toLowerCase()) {
			case "kill":
				setTimeout(() => {
					Deno.exit(0);
				}, 100);
				return new CommandResult(200, "Going down FeelsBadMan 👍 ");
			case "reboot":
			case "restart":
				setTimeout(async () => {
					await Deno.run({ cmd: ["git", "pull", "origin", "main"] }).status();

					if (Deno.env.get("TESTING")) {
						Deno.run({ cmd: ["deno", "run", "-A", "src/main.testing.ts", "&!"] });
						Deno.exit(0);
					}
					else
						Deno.run({ cmd: ["systemctl", "restart", "lovcen.service"] });

					Log.success(`Goodbye, cruel world`);
				}, 1000);

				return new CommandResult(200, `pulling origin, rebooting... MrDestructoid`, ["if (this.db_client) this.cfg.channels.forEach(async c => await db.save_stream_stats(this.db_client!, c))"]);
			default:
				return new CommandResult(400, `subcommand ${ctx.args[0]} not recognized.`);
		}

	},

	description(): string {
		return "Access sudo commands."
	},

	usage(cmd_prefix: string): string {
		return `${cmd_prefix}sudo action={kill|restart|reboot}`;
	}
}

export default Sudo;