import { SevenTvEmote } from "./adamcy.d.ts";
import { APICallResult } from "./_api.ts";

type json = SevenTvEmote[] | { error: string };

export async function get_7tv_emotes(channel_name: string): Promise<APICallResult<SevenTvEmote[]>> {
	try {
		const r = await fetch(`https://emotes.adamcy.pl/v1/channel/${channel_name}/emotes/7tv`);
		const json = await r.json();

		if (json.error && json.error === "User not found") return new APICallResult(400);

		return new APICallResult(200, json as SevenTvEmote[]);
	} catch { return new APICallResult(500) }
}
