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
