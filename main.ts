import "https://deno.land/x/dotenv@v3.2.0/load.ts";
import { Config } from "./lib.ts";

// const PORT = (() => {
// 	const p = Deno.env.get("PORT");
// 	if (p) {
// 		return parseInt(p);
// 	}

// 	return 3000;
// })()

// try {
// 	Deno.env.set("PORT", PORT.toString());
// 	Deno.env.set("IS_LOCAL_DEVELOPMENT", "1");
// } catch { console.log(`Environment not suitable for env writing`) }


async function main(): Promise<void> {
	const bot = new Config(
		Deno.env.get("TWITCH_LOGIN")!,
		Deno.env.get("TWITCH_OAUTH")!,
		Deno.env.get("TWITCH_CLIENT_ID")!,
		Deno.env.get("TWITCH_CLIENT_SECRET")!,
		"GIGACHAD\ ",
	);
	bot.disregard_users([
		"lovcen", "Fossabot", "Nightbot", "Snusbot",
		"StreamElements", "SchnozeBot", "ThePositiveBot",
		"KattahBot", "AnotherTTVViewer", "Streamlabs", "moobot"
	]);
	await bot.join_channels(["gkey", "pepega00000"]);
	await bot.run();
}

try {
	await main();
} catch (e) {
	console.error(e);
}
