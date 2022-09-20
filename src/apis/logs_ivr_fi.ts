import { APICallResult } from "./_api.ts";
import { RandLogResponse, AllChannelsResponse } from "./logs_ivr_fi.d.ts";

export async function get_rand_log_in_channel(channel_name: string): Promise<APICallResult<RandLogResponse>> {
	try {
		const r = await fetch(`https://logs.ivr.fi/channel/${channel_name}/random`);
		const body = await r.text();

		if (body === "could not load logs") return new APICallResult(400);
		return new APICallResult(200, body);

	} catch {
		return new APICallResult(500);
	}
}

export async function get_rand_log_of_user_in_channel(channel_name: string, user_name: string): Promise<APICallResult<RandLogResponse>> {
	try {
		const r = await fetch(`https://logs.ivr.fi/channel/${channel_name}/user/${user_name}/random`);
		const body = await r.text();

		if (body === "could not load logs") return new APICallResult(400);
		return new APICallResult(200, body);
	} catch { return new APICallResult(500) }
}

async function get_all_channels(): Promise<APICallResult<AllChannelsResponse>> {
	try {
		const r = await fetch(`https://logs.ivr.fi/channels`);

		return new APICallResult(200, (await r.json()) as AllChannelsResponse);
	} catch { return new APICallResult(500) }
}

export async function get_users_available_log_channels(u_id: string | number): Promise<APICallResult<string[]>> {
	const r = await get_all_channels();
	if (r.status !== 200) return new APICallResult(500);

	const channels: string[] = [];

	for (const c of r.data!.channels || []) {
		try {
			const rr = await fetch(`https://logs.ivr.fi/list?channelid=${c.userID}&userid=${u_id}`);
			// this will fail if there is no logs
			// because then the API sends a plaintext
			await rr.json();
			channels.push(c.name);
			// deno-lint-ignore no-empty
		} catch { }
	}

	return new APICallResult(200, channels)
}
