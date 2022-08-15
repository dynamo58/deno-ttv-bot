import { SevenTvResponse } from "./adamcy.d.ts";

export async function get_7tv_emotes(channel_name: string): Promise<SevenTvResponse[]> {
	const r = await fetch(`https://emotes.adamcy.pl/v1/channel/${channel_name}/emotes/7tv`);
	return (await r.json()) as SevenTvResponse[];
}