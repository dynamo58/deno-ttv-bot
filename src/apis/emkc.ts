import { APICallResult } from "./_api.ts";
import { EmkcResponse } from "./emkc.d.ts";
import { hasOwnProperty } from "https://deno.land/std@0.92.0/_util/has_own_property.ts";

export async function run_code(lang: string, code: string, args?: string[]): Promise<APICallResult<EmkcResponse>> {
	const r = await fetch(`https://emkc.org/api/v1/piston/execute`, {
		method: "POST",
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			language: lang,
			source: code,
			args: args ?? []
		})
	})

	const json = await r.json();
	if (hasOwnProperty(json, "message")) return new APICallResult(400);

	return new APICallResult(200, json as EmkcResponse);
}