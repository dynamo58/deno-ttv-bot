import { CommandContext, CommandModule, CommandResult } from "../Command.ts";
import * as twitch from "../apis/twitch.ts";
import { Credentials } from "../Bot.ts";
import { format_duration } from "../std_redeclarations.ts";
import { _createWalkEntry } from "https://deno.land/std@0.125.0/fs/walk.ts";

import * as db from "../db/db.ts";

const get_most_active_chatter_nickname = async (t: Credentials, chatter_counts: Map<number, number>): Promise<[string, number] | null> => {
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
		if (ctx.args.includes("last")) {
			if (!ctx.db_client) return new CommandResult(500, FEATURE_NOT_AVAILABLE_MESSAGE);
			const latest = await db.get_latest_stats(ctx.db_client, ctx.channel.id);
			if (latest === null) return new CommandResult(400, `there is no previous record.`)

			const uptime_fmt = format_duration(latest.duration_hours * 3_600_000, false);
			const games = latest!.games_played.join(", ");
			const lines = latest!.messages_sent;

			return new CommandResult(200, `Uptime: ${uptime_fmt} | Games played: ${games} | Message count: ${lines}`);
		}


		if (ctx.channel.uptime_stats === null)
			return new CommandResult(200, CHANNEL_NOT_LIVE_MESSAGE);

		const uptime_fmt = format_duration((new Date()).valueOf() - (ctx.channel.uptime_stats!.startup_time).valueOf(), false);
		const games = ctx.channel.uptime_stats!.games_played.join(", ");
		const lines = ctx.channel.uptime_stats!.messages_sent;
		try {
			const most_active_chatter = await get_most_active_chatter_nickname(ctx.credentials, ctx.channel.uptime_stats!.user_counts);
			const chatter_str = most_active_chatter === null ? "" : `| Most active chatter: ${most_active_chatter[0]} with ${most_active_chatter[1]} messages Chatting`;

			return new CommandResult(200, `Uptime: ${uptime_fmt} | Games played: ${games} | Message count: ${lines} ${chatter_str}`);
		} catch { return new CommandResult(500, UNKNOWN_ERROR_MESSAGE) }
	},

	description(): string {
		return "Get some statistics about the current stream."
	},

	usage(cmd_prefix: string): string {
		return `${cmd_prefix}stats`;
	}
}

export default Stats;