import { CommandContext, CommandModule, CommandResult } from "./Command.ts";
import * as twitch from "../apis/twitch.ts";
import { TwitchInfo } from "../lib.ts";


const get_most_active_chatter_nickname = async (t: TwitchInfo, chatter_counts: Map<number, number>): Promise<[string, number] | null> => {
	let highest: null | [number, number] = null;

	for (const c of chatter_counts)
		if (highest === null || highest[1] < c[1])
			highest = c;

	if (highest === null) return null;

	const nick = await twitch.nick_from_id(t, highest[0]);
	return [nick, highest![1]];
}

const Stats: CommandModule = {
	sufficient_privilege: 0,

	async execute(ctx: CommandContext): Promise<CommandResult> {
		if (ctx.channel.uptime_stats === null)
			return await {
				is_success: true,
				output: `Channel is not live.`,
			}

		const uptime_mls = (new Date()).valueOf() - (ctx.channel.uptime_stats!.startup_time).valueOf();
		const hrs = uptime_mls / (1_000 * 60 * 60);
		const games = ctx.channel.uptime_stats!.games_played.join(", ");
		const lines = ctx.channel.uptime_stats!.messages_sent;
		const most_active_chatter = await get_most_active_chatter_nickname(ctx.twitch_info, ctx.channel.uptime_stats!.user_counts);
		const chatter_str = most_active_chatter === null ? "" : `| Most active chatter: ${most_active_chatter[0]} with ${most_active_chatter[1]} messages Chatting`;

		return await {
			is_success: true,
			output: `Uptime: ${hrs.toFixed(2)} hours | Games played: ${games} | Message count: ${lines} ${chatter_str}`,
		}
	},

	description(): string {
		return "Get some statistics about the current stream."
	},

	usage(cmd_prefix: string): string {
		return `${cmd_prefix}stats`;
	}
}

export default Stats;