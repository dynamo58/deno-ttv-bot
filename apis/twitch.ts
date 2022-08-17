import { TwitchInfo } from "../lib.ts";
import { HelixChannel, HelixUsers } from "./twitch.d.ts";

export async function id_from_nick(t: TwitchInfo, nick: string): Promise<number> {
	const r = await fetch(`https://api.twitch.tv/helix/users?login=${nick}`, {
		headers: {
			"Client-ID": t.client_id,
			"Authorization": `Bearer ${t.oauth}`
		}
	})

	return parseInt(((await r.json()) as HelixUsers).data[0].id)!;
}

export async function nick_from_id(t: TwitchInfo, id: number): Promise<string> {
	const r = await fetch(`https://api.twitch.tv/helix/users?id=${id}`, {
		headers: {
			"Client-ID": t.client_id,
			"Authorization": `Bearer ${t.oauth}`
		}
	})

	return ((await r.json()) as HelixUsers).data[0].login;
}

export async function get_channel(t: TwitchInfo, nick: string): Promise<HelixChannel> {
	const r = await fetch(`https://api.twitch.tv/helix/streams?user_login=${nick}`, {
		headers: {
			"Client-ID": t.client_id,
			"Authorization": `Bearer ${t.oauth}`
		}
	});

	return (await r.json()) as HelixChannel;
}

export async function get_eventsub_accesstoken(t: TwitchInfo): Promise<string> {
	const r = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${Deno.env.get("TWITCH_APP_CLIENT_ID")!}&client_secret=${Deno.env.get("TWITCH_APP_SECRET")!}&grant_type=client_credentials`, {
		method: "POST"
	});

	return ((await r.json())).access_token as string
}

export async function request_eventsub_subscription(t: TwitchInfo, loopback_url: string, user_id: number) {
	const access_token = await get_eventsub_accesstoken(t);

	const r = await fetch(`https://api.twitch.tv/helix/eventsub/subscriptions`, {
		headers: {
			'Content-Type': 'application/json',
			'Client-ID': t.client_id,
			'Authorization': 'Bearer ' + access_token
		},
		body: JSON.stringify({
			"type": "channel.subscribe",
			"version": "1",
			"condition": {
				"broadcaster_user_id": user_id
			},
			"transport": {
				"method": "webhook",
				"callback": loopback_url + '/notification',
				"secret": Deno.env.get("SECRET")!
			}
		}),
	});

	console.log(r);
}
