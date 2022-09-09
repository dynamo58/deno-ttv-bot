import { TwitchChannel, TwitchUserBasicInfo, UptimeStats } from "../Bot.ts";
import { MongoClient } from "https://deno.land/x/mongo@v0.31.0/mod.ts";

import { StreamStats, OnlineNotificationSubscribers } from "./schemas.ts";
import Log from "../Log.ts";
import { Lurker } from "../commands/lurk.ts";
import { Reminder } from "../commands/remind.ts";

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

async function push_map<T>(db_client: MongoClient, db_label: string, data: Map<number, T>) {
	const db = db_client.database("data");
	const db_t = db.collection<{ id: number, data: T }>(db_label);

	await db_t.delete({});
	const d = Array.from(data).map((d) => { return { id: d[0], data: d[1] } });
	if (d.length > 0) await db_t.insertMany(d);
}

async function pull_map<T>(db_client: MongoClient, db_label: string): Promise<Map<number, T>> {
	const db = db_client.database("data");
	const db_t = db.collection<{ id: number, data: T }>(db_label);
	return new Map((await db_t.find({}).toArray()).map((i) => [i.id, i.data]));
}

export async function push_all(db_client: MongoClient, reminders: Map<number, Reminder[]>, lurkers: Map<number, Lurker>, uptime_stats: Map<number, UptimeStats | null>) {
	await push_map(db_client, "reminders", reminders);
	await push_map(db_client, "lurkers", lurkers);
	await push_map(db_client, "uptime_stats", uptime_stats);
}

export async function pull_all(db_client: MongoClient): Promise<{ reminders: Map<number, Reminder[]>, lurkers: Map<number, Lurker>, uptime_stats: Map<number, UptimeStats | null> }> {
	return {
		reminders: await pull_map(db_client, "reminders"),
		lurkers: await pull_map(db_client, "lurkers"),
		uptime_stats: await pull_map(db_client, "uptime_stats"),
	}
}
