import { CommandContext, CommandModule, CommandResult } from "../Command.ts";
import * as twitch from "../apis/twitch.ts";

const DEFAULT_COUNT = 10;
const MIN_COUNT = 1;
const MAX_COUNT = 50;

const Tf: CommandModule = {
	sufficient_privilege: 1,

	async execute(ctx: CommandContext): Promise<CommandResult> {
		if (ctx.highest_priv < this.sufficient_privilege)
			return {
				is_success: false,
				output: "You must be at least VIP to use this command.",
			}

		const kwargs = ctx.kwargs();
		let count: number | null = null;
		const _count = kwargs.get("count");
		if (_count) {
			try { count = Math.clamp(parseInt(_count), MIN_COUNT, MAX_COUNT) }
			catch { count = DEFAULT_COUNT }
		} else {
			count = DEFAULT_COUNT;
		}

		const res = (await twitch.get_chatters(ctx.channel.nickname));
		if (res.status !== 200) return { is_success: false, output: `@${ctx.caller} something messed up ApuApustaja TeaTime` }
		const _c = res.data!.chatters;
		const chatters = [..._c.admins, ..._c.broadcaster, ..._c.global_mods, ..._c.moderators, ..._c.staff, ..._c.viewers, ..._c.vips];
		// TODO: generating randoms and skipping duplicated might be better, no????
		chatters.shuffle();

		const chosen = chatters.slice(0, Math.min(chatters.length, count));

		return {
			is_success: true,
			output: `@${chosen.join(" @")} :tf:`,
		}
	},

	description(): string {
		return "Troll a bunch of chatters by pinging them. :tf:"
	},

	usage(cmd_prefix: string): string {
		return `${cmd_prefix}tf count={positive integer}`;
	}
}

export default Tf;