import { CommandContext, CommandModule, CommandResult } from "../Command.ts";
import * as twitch from "../apis/twitch.ts";
import { format_duration } from "../std_redeclarations.ts";

const Accage: CommandModule = {
	sufficient_privilege: 0,

	async execute(ctx: CommandContext): Promise<CommandResult> {
		const kwargs = ctx.kwargs();
		const pot_target = kwargs.get("user");
		const target = pot_target ? pot_target! : ctx.caller.nickname;

		const res = await twitch.get_users(ctx.credentials, [target]);
		if (res.status !== 200) return new CommandResult(502, EXTERNAL_API_FAIL_MESSAGE);
		if (res.data!.length === 0) return new CommandResult(400, USER_DOESNT_EXIST_MESSAGE);
		const age = format_duration((new Date()).valueOf() - (new Date(res.data![0].created_at)).valueOf(), false);

		if (target === ctx.caller.nickname) return new CommandResult(200, `your account is ${age} old.`);
		else return new CommandResult(200, `${target}'s account is ${age} old.`);
	},

	description(): string {
		return "Get the age of a Twitch account"
	},

	usage(cmd_prefix: string): string {
		return `${cmd_prefix}accage user?={string}`;
	}
}

export default Accage;