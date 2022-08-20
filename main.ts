import "https://deno.land/x/dotenv@v3.2.0/load.ts";
import { Config } from "./lib.ts";

async function main(): Promise<void> {
	const bot = new Config({
		cmd_prefix: "GIGACHAD\ ",
	});
	bot.disregard_users([
		"lovcen", "fossabot", "fightbot", "snusbot",
		"streamelements", "schnozebot", "thepositiveBot",
		"kattahbot", "anotherttvviewer", "streamlabs", "moobot"
	]);
	bot.add_sudoers([149355320]);
	await bot.join_channels(["gkey", "pepega00000"]);
	await bot.run();
}

try {
	await main();
} catch (e) {
	console.error(e);
}
