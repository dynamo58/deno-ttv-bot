import { CommandContext, CommandModule, CommandResult } from "../Command.ts";
import * as twitch from "../apis/twitch.ts";
import { format_duration } from "../std_redeclarations.ts";

const Accage: CommandModule = {
	sufficient_privilege: 0,

	async execute(ctx: CommandContext): Promise<CommandResult> {
		const kwargs = ctx.kwargs();
		const pot_target = kwargs.get("user");
		const target = pot_target ? pot_target! : ctx.caller.nickname;

		const user = (await twitch.get_users(ctx.twitch_info, [target]))[0];
		const age = format_duration((new Date()).valueOf() - (new Date(user.created_at)).valueOf(), false);

		if (target === ctx.caller.nickname)
			return {
				is_success: true,
				output: `@${ctx.caller.nickname} your account is ${age} old.`,
			}
		else
			return {
				is_success: true,
				output: `@${ctx.caller.nickname} ${target}'s account is ${age} old.`,
			}
	},

	description(): string {
		return "Get the age of a Twitch account"
	},

	usage(cmd_prefix: string): string {
		return `${cmd_prefix}accage user?={string}`;
	}
}

export default Accage;