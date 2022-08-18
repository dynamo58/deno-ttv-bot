import { DEFAULT_CHUNK_SIZE } from "https://deno.land/x/oak@v10.6.0/util.ts";
import { CommandContext, CommandModule, CommandResult } from "./Command.ts";
import * as twitch from "../apis/twitch.ts";

// deno-lint-ignore no-inferrable-types
const DEFAULT_COUNT: number = 10;

const Tf: CommandModule = {
	async execute(ctx: CommandContext): Promise<CommandResult> {
		const kwargs = ctx.kwargs();
		// TODO: check for negativity
		let count: number | null = null;
		const _count = kwargs.get("count");
		if (_count) {
			try { count = parseInt(_count) } catch { count = DEFAULT_COUNT }
		} else {
			count = DEFAULT_COUNT;
		}

		const _c = (await twitch.get_chatters(ctx.channel.nickname)).chatters;
		const chatters = [..._c.admins, ..._c.broadcaster, ..._c.global_mods, ..._c.moderators, ..._c.staff, ..._c.viewers, ..._c.vips];
		// TODO: generating randoms and skipping duplicated might be better, no????
		// ---> benchmark
		chatters.shuffle();

		const chosen = chatters.slice(0, Math.min(chatters.length, count));

		return {
			is_success: true,
			output: `${chosen.join(" ")} :tf:`,
		}
	},

	description(): string {
		return "Troll a bunch of chatters by pinging them."
	},

	usage(cmd_prefix: string): string {
		return `${cmd_prefix}tf count={positive integer}`;
	}
}

export default Tf;