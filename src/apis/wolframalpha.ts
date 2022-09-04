import { Credentials } from "../Bot.ts";
import { APICallResult } from "./_api.ts";
import { WolframAlphaResponse } from "./wolframalpha.d.ts";

export async function query_wolframalpha(c: Credentials, query: string): Promise<APICallResult<WolframAlphaResponse>> {
	try {
		const r = await fetch(`http://api.wolframalpha.com/v2/query?input=${query}&appid=${c.wolfram_appid}&output=json`);
		return new APICallResult(200, ((await r.json()) as WolframAlphaResponse));
	} catch { return new APICallResult(500) }
}