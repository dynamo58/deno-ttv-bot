import { TwitchInfo } from "../Bot.ts";
import { CreateClip, HelixChannel, HelixUsers, TmiChatters, HelixUsersData } from "./twitch.d.ts";
import { APICallResult } from "./_api.ts";

export async function id_from_nick(t: TwitchInfo, nicks: string[]): Promise<APICallResult<number[]>> {
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

export async function get_users(t: TwitchInfo, nicks: string[]): Promise<APICallResult<HelixUsersData[]>> {
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

export async function nick_from_id(t: TwitchInfo, ids: number[]): Promise<APICallResult<string[]>> {
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

export async function get_channel(t: TwitchInfo, nick: string): Promise<APICallResult<HelixChannel>> {
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

export async function get_eventsub_accesstoken(_t: TwitchInfo): Promise<APICallResult<string>> {
	try {
		const r = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${Deno.env.get("TWITCH_APP_CLIENT_ID")!}&client_secret=${Deno.env.get("TWITCH_APP_SECRET")!}&grant_type=client_credentials`, {
			method: "POST"
		});

		return new APICallResult(200, ((await r.json())).access_token as string);
	} catch { return new APICallResult(500) }
}

// deno-lint-ignore require-await no-unused-vars
export async function request_eventsub_subscription(t: TwitchInfo, loopback_url: string, user_id: number) {
	throw new Error("TODO");
	// try {

	// } catch { return new APICallResult(500) }

	// const access_token = await get_eventsub_accesstoken(t);

	// const r = await fetch(`https://api.twitch.tv/helix/eventsub/subscriptions`, {
	// headers: {
	// 'Content-Type': 'application/json',
	// 'Client-ID': t.client_id,
	// 'Authorization': 'Bearer ' + access_token
	// },
	// body: JSON.stringify({
	// "type": "channel.subscribe",
	// "version": "1",
	// "condition": {
	// "broadcaster_user_id": user_id
	// },
	// "transport": {
	// "method": "webhook",
	// "callback": loopback_url + '/notification',
	// "secret": Deno.env.get("SECRET")!
	// }
	// }),
	// });
}

export async function get_chatters(channel_name: string): Promise<APICallResult<TmiChatters>> {
	try {
		const r = await fetch(`https://tmi.twitch.tv/group/user/${channel_name}/chatters`);
		return new APICallResult(200, ((await r.json()) as TmiChatters));
	} catch { return new APICallResult(500) }
}

export async function create_clip(t: TwitchInfo, channel_id: number): Promise<APICallResult<CreateClip>> {
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
