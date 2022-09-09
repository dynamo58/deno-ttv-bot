import { TwitchChannel, TwitchUserBasicInfo } from "../Bot.ts";
import { MongoClient } from "https://deno.land/x/mongo@v0.31.0/mod.ts";

import { StreamStats, OnlineNotificationSubscribers } from "./schemas.ts";
import Log from "../Log.ts";

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

enum AddUserAsLiveNotifSubscriberRes {
	UserAdded = 200,
	UserAlreadySubscribes = 400,
	UnknownError = 500,
}

// TODO: error-proof this
export async function get_channel_live_notif_subscribers(db_client: MongoClient, channel_id: number): Promise<TwitchUserBasicInfo[]> {
	const db = db_client.database("data");
	const db_notifs = db.collection<OnlineNotificationSubscribers>("live_notif_subscribers");

	const curr = await db_notifs.findOne({ channel_id });

	return curr?.subscribers ?? [];
}

export async function add_user_as_live_notif_subscriber(db_client: MongoClient, channel_id: number, user: TwitchUserBasicInfo): Promise<AddUserAsLiveNotifSubscriberRes> {
	try {
		const db = db_client.database("data");
		const db_notifs = db.collection<OnlineNotificationSubscribers>("live_notif_subscribers");

		const curr = await db_notifs.findOne({ channel_id });

		if (!curr) {
			await db_notifs.insertOne({ channel_id, subscribers: [user] });
			return 200;
		}
		const u = curr!.subscribers.filter(u => u.id === user.id);
		if (u.length > 0) return 400;

		db_notifs.updateOne(
			{ channel_id },
			{ $set: { subscribers: [...curr!.subscribers, user] } }
		)

		return 200;
	} catch (e) { Log.warn(e); return 500 }
}
