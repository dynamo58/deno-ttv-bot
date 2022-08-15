import { TwitchInfo } from "../lib.ts";
import { HelixUsers } from "./twitch.d.ts";

export async function id_from_nick(t: TwitchInfo, nick: string): Promise<number> {
	const r = await fetch(`https://api.twitch.tv/helix/users?login=${nick}`, {
		headers: {
			"Client-ID": t.client_id,
			"Authorization": `Bearer ${t.oauth}`
		}
	})

	return parseInt(((await r.json()) as HelixUsers).data[0].id)!;
}
