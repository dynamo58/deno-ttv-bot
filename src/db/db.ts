import { TwitchChannel } from "../Bot.ts";
import { MongoClient } from "https://deno.land/x/mongo@v0.31.0/mod.ts";

import { StreamStats } from "./schemas.ts";

export async function save_stream_stats(db_client: MongoClient, channel: TwitchChannel) {
	const db = db_client.database("data");
	const db_stats = db.collection<StreamStats>("stats");

	const stats: StreamStats = {
		channel_id: channel.id,
		channel_name: channel.nickname,
		messages_sent: Array.from(channel.uptime_stats!.user_counts.values()).sum(),
		startup_time: channel.uptime_stats!.startup_time,
		games_played: channel.uptime_stats!.games_played,
		duration_hours: +(((new Date()).valueOf() - channel.uptime_stats!.startup_time.valueOf()) / (1000 * 60 * 60)).toPrecision(2),
	};

	await db_stats.insertOne(stats);
}
