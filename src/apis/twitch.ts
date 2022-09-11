import { Credentials } from "../Bot.ts";
import Log from "../Log.ts";
import { CreateClip, HelixChannel, HelixUsers, TmiChatters, HelixUsersData } from "./twitch.d.ts";
import { APICallResult } from "./_api.ts";

export async function id_from_nick(t: Credentials, nicks: string[]): Promise<APICallResult<number[]>> {
	try {
		const r = await fetch(`https://api.twitch.tv/helix/users?login=${nicks.join("&login=")}`, {
			headers: {
				"Client-ID": t.client_id,
				"Authorization": `Bearer ${t.oauth}`
			}
		})

		return new APICallResult(200, ((await r.json()) as HelixUsers).data.map(d => parseInt(d.id)!));
	} catch { return new APICallResult(500) }
}

export async function get_users(t: Credentials, nicks: string[]): Promise<APICallResult<HelixUsersData[]>> {
	try {
		const r = await fetch(`https://api.twitch.tv/helix/users?login=${nicks.join("&login=")}`, {
			headers: {
				"Client-ID": t.client_id,
				"Authorization": `Bearer ${t.oauth}`
			}
		})

		return new APICallResult(200, ((await r.json()) as HelixUsers).data);
	} catch { return new APICallResult(500) }

}

export async function nick_from_id(t: Credentials, ids: number[]): Promise<APICallResult<string[]>> {
	try {
		const r = await fetch(`https://api.twitch.tv/helix/users?id=${ids.join("&id=")}`, {
			headers: {
				"Client-ID": t.client_id,
				"Authorization": `Bearer ${t.oauth}`
			}
		});

		return new APICallResult(200, ((await r.json()) as HelixUsers).data.map(d => d.login));

	} catch { return new APICallResult(500) }
}

export async function get_channel(t: Credentials, nick: string): Promise<APICallResult<HelixChannel>> {
	try {
		const r = await fetch(`https://api.twitch.tv/helix/streams?user_login=${nick}`, {
			headers: {
				"Client-ID": t.client_id,
				"Authorization": `Bearer ${t.oauth}`
			}
		});

		return new APICallResult(200, (await r.json()) as HelixChannel);
	} catch { return new APICallResult(500) }
}

export async function get_eventsub_accesstoken(_t: Credentials): Promise<APICallResult<string>> {
	try {
		const scope = encodeURI("channel:read:subscriptions");
		const r = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${_t.app_client_id}&client_secret=${_t.app_secret}&grant_type=client_credentials&scope=${scope}`, {
			method: "POST"
		});

		return new APICallResult(200, ((await r.json())).access_token as string);
	} catch { return new APICallResult(500) }
}

export async function request_eventsub_subscription(t: Credentials, loopback_url: string, access_token: string, user_id: number, sub_type: string) {
	const r = await fetch(`https://api.twitch.tv/helix/eventsub/subscriptions`, {
		method: "POST",
		headers: {
			'Content-Type': 'application/json',
			'Client-ID': t.app_client_id,
			'Authorization': 'Bearer ' + access_token
		},
		body: JSON.stringify({
			"type": sub_type,
			"version": "1",
			"condition": {
				"broadcaster_user_id": user_id.toString()
			},
			"transport": {
				"method": "webhook",
				"callback": `https://${loopback_url}/webhooks/${user_id}/eventsub`,
				"secret": t.secret
			}
		}),
	});

	const json = await r.json();
	if (json.data && json.data.length > 0) return;
	if (json.status == 429) {
		const ids = await get_eventsub_subscription_ids(t, access_token);
		await delete_eventsub_subscription_ids(t, ids, access_token);
		await request_eventsub_subscription(t, loopback_url, access_token, user_id, sub_type);
	} else {
		Log.error(JSON.stringify(json));
		Log.error(`Failed to get EventSub`);
		Deno.exit(1);
	}
}

async function get_eventsub_subscription_ids(t: Credentials, access_token: string) {
	const ids: string[] = [];
	const res = await fetch(`https://api.twitch.tv/helix/eventsub/subscriptions`, {
		headers: {
			'Client-ID': t.app_client_id,
			'Authorization': 'Bearer ' + access_token
		},
	})
	const json = await res.json();

	for (const sub of json.data)
		ids.push(sub.id);

	return ids
}

async function delete_eventsub_subscription_ids(t: Credentials, ids: string[], access_token: string) {
	for (const id of ids)
		await fetch(`https://api.twitch.tv/helix/eventsub/subscriptions?id=${id}`, {
			method: "DELETE",
			headers: {
				'Client-ID': t.app_client_id,
				'Authorization': 'Bearer ' + access_token
			}
		})
}

export async function get_chatters(channel_name: string): Promise<APICallResult<TmiChatters>> {
	try {
		const r = await fetch(`https://tmi.twitch.tv/group/user/${channel_name}/chatters`);
		return new APICallResult(200, ((await r.json()) as TmiChatters));
	} catch { return new APICallResult(500) }
}

export async function create_clip(t: Credentials, channel_id: number): Promise<APICallResult<CreateClip>> {
	try {
		const r = await fetch(`https://api.twitch.tv/helix/clips?broadcaster_id=${channel_id}`, {
			method: "POST",
			headers: {
				'Client-ID': t.client_id,
				'Authorization': 'Bearer ' + t.oauth,
			}
		});

		return new APICallResult(200, (await r.json()) as CreateClip);
	} catch { return new APICallResult(500) }
}
