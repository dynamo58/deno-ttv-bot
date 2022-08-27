import { CommandContext, CommandModule, CommandResult } from "../Command.ts";
import { get_7tv_emotes } from "../apis/adamcy.ts";

const MIN_COUNT = 1;
const DEFAULT_COUNT = 7;
const MAX_COUNT = 20;

const New7Tv: CommandModule = {
	sufficient_privilege: 0,

	async execute(ctx: CommandContext): Promise<CommandResult> {
		const emotes = await get_7tv_emotes(ctx.channel.nickname);
		const kwargs = ctx.kwargs();
		let count: number | null = null;
		const _count = kwargs.get("count");
		if (_count) {
			try { count = Math.clamp(parseInt(_count), MIN_COUNT, MAX_COUNT) }
			catch { count = DEFAULT_COUNT }
		} else {
			count = DEFAULT_COUNT;
		}
		const latest = emotes
			.slice(-count)
			.map(e => e.code);

		return {
			is_success: true,
			output: `Recently added 7tv emotes: ${latest.join(" ")}`,
		}
	},

	description(): string {
		return "Get the newest 7tv emotes added to the channel"
	},

	usage(cmd_prefix: string): string {
		return `${cmd_prefix}new7tv`;
	}
}

export default New7Tv;