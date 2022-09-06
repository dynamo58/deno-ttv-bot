import { CommandContext, CommandModule, CommandResult } from "../Command.ts";
import * as db from "../db/db.ts";

export interface Reminder {
	from_nick: string,
	datetime_sent: Date,
	datetime_to_arrive: Date,
	message?: string,
}

const NotifyMe: CommandModule = {
	sufficient_privilege: 0,

	async execute(ctx: CommandContext): Promise<CommandResult> {
		const kwargs = ctx.kwargs();

		switch (kwargs.get("when")) {
			case undefined:
				return { is_success: false, output: `Please provide a "when" clause, e.g.: ${ctx.cmd_prefix}notifyme when=live` }
			// deno-lint-ignore no-case-declarations
			case "live":
				const res = await db.add_user_as_live_notif_subscriber(ctx.db_client, ctx.channel.id, ctx.caller);
				switch (res) {
					case 200: return { is_success: true, output: `you will now get pinged when ${ctx.channel.nickname} goes live.` };
					case 400: return { is_success: false, output: `you are already subscribed to the live notification.` };
					case 500: return { is_success: false, output: `something went wrong, please try again later.` };
				}
				break;
			default:
				return { is_success: false, output: `unsupported "when" clause. See the usage command ApuApustaja` };
		}

		throw new Error("UNREACHABLE");
	},

	description(): string {
		return "Get pinged when channel goes live."
	},

	usage(cmd_prefix: string): string {
		return `${cmd_prefix}notifyme when={live}`;
	}
}

export default NotifyMe;