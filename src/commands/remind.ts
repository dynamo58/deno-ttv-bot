import { CommandContext, CommandModule, CommandResult } from "../Command.ts";
import * as twitch from "../apis/twitch.ts";

export interface Reminder {
	from_nick: string,
	datetime_sent: Date,
	datetime_to_arrive: Date,
	message?: string,
}

const Remind: CommandModule = {
	sufficient_privilege: 0,

	async execute(ctx: CommandContext): Promise<CommandResult> {
		const kwargs = ctx.kwargs();
		let target_user_id;
		if (kwargs.get("user")) {
			const res = await twitch.id_from_nick(ctx.credentials, [kwargs.get("user")!]);
			if (res.status !== 200) return new CommandResult(502, EXTERNAL_API_FAIL_MESSAGE);
			if (res.data!.length !== 1) return new CommandResult(400, USER_DOESNT_EXIST_MESSAGE);

			target_user_id = res.data![0]
		} else
			target_user_id = ctx.caller.id;

		let date;
		if (kwargs.get("in")) {
			const d = kwargs.get("in")!.parse_to_date()
			if (d === null) return new CommandResult(400, `bad input, usage: ${this.usage(ctx.cmd_prefix)}`);
			date = d
		} else { date = new Date() }


		const reminder = {
			message: kwargs.get("msg"),
			datetime_to_arrive: date,
			datetime_sent: new Date(),
			from_nick: ctx.caller.nickname,
		}

		return new CommandResult(200, "reminder saved.", [`this.cfg.reminders.get(${target_user_id}) ? this.cfg.reminders.set(${target_user_id}, [...this.cfg.reminders.get(${target_user_id}), ${JSON.stringify(reminder)}]) : this.cfg.reminders.set(${target_user_id}, [${JSON.stringify(reminder)}])`]);
	},

	description(): string {
		return "Remind someone (or yourself) something in chat."
	},

	usage(cmd_prefix: string): string {
		return `${cmd_prefix}remind user?='nickname:string' in='<duration>' msg='message: string' | example: ${cmd_prefix}`;
	}
}

export default Remind;