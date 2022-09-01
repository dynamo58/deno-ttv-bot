import { User } from "./7tv.d.ts";
import { APICallResult } from "./_api.ts";

export async function get_users(user_names: string[]): Promise<APICallResult<User[]>> {
	const users: User[] = [];

	for (let i = 0; i < user_names.length; i++) {
		const r = await fetch(`https://api.7tv.app/v2/users/${user_names[i]}`);
		// deno-lint-ignore no-explicit-any
		const json = (await r.json()) as any;

		if (json.status_code && json.status_code === 404)
			return new APICallResult(400);
		users.push(json as User)
	}

	return new APICallResult(200, users);
}
