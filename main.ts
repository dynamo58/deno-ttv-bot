import "https://deno.land/x/dotenv@v3.2.0/load.ts";
import { Config } from "./lib.ts";

async function main(): Promise<void> {
	const bot = new Config(
		Deno.env.get("TWITCH_LOGIN")!,
		Deno.env.get("TWITCH_OAUTH")!,
		Deno.env.get("TWITCH_CLIENT_ID")!,
		"!",
	);
	await bot.join_channels(["gkey", "pepega00000"]);
	await bot.run();
}

try {
	await main();
} catch (e) {
	console.error(e);
}
