import { CommandContext, CommandModule, CommandResult } from "../Command.ts";
import * as twitch from "../apis/twitch.ts";
import { TwitchInfo } from "../Bot.ts";
import { format_duration } from "../std_redeclarations.ts";

const get_most_active_chatter_nickname = async (t: TwitchInfo, chatter_counts: Map<number, number>): Promise<[string, number] | null> => {
	let highest: null | [number, number] = null;

	for (const c of chatter_counts)
		if (highest === null || highest[1] < c[1])
			highest = c;

	if (highest === null) return null;

	const nick = (await twitch.nick_from_id(t, [highest[0]])).data![0];
	return [nick, highest![1]];
}

const Stats: CommandModule = {
	sufficient_privilege: 0,

	async execute(ctx: CommandContext): Promise<CommandResult> {
		if (ctx.channel.uptime_stats === null)
			return {
				is_success: true,
				output: `channel is not live.`,
			}

		const uptime_fmt = format_duration((new Date()).valueOf() - (ctx.channel.uptime_stats!.startup_time).valueOf(), false);
		const games = ctx.channel.uptime_stats!.games_played.join(", ");
		const lines = ctx.channel.uptime_stats!.messages_sent;
		try {
			const most_active_chatter = await get_most_active_chatter_nickname(ctx.twitch_info, ctx.channel.uptime_stats!.user_counts);
			const chatter_str = most_active_chatter === null ? "" : `| Most active chatter: ${most_active_chatter[0]} with ${most_active_chatter[1]} messages Chatting`;

			return {
				is_success: true,
				output: `Uptime: ${uptime_fmt} | Games played: ${games} | Message count: ${lines} ${chatter_str}`,
			}
		} catch { return { is_success: false, output: `something went haywire ApuApustaja TeaTime` } }
	},

	description(): string {
		return "Get some statistics about the current stream."
	},

	usage(cmd_prefix: string): string {
		return `${cmd_prefix}stats`;
	}
}

export default Stats;