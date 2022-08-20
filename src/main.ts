import Bot from "./bot.ts";
import Config from "./config.ts";

async function main(): Promise<void> {
	const config = new Config({
		cmd_prefix: "#",
	});
	const bot = new Bot(config);
	bot.cfg.disregard_users([
		"lovcen", "fossabot", "fightbot", "snusbot",
		"streamelements", "schnozebot", "thepositiveBot",
		"kattahbot", "anotherttvviewer", "streamlabs", "moobot"
	]);
	bot.cfg.add_sudoers([149355320]);
	await bot.cfg.join_channels(["pepega00000", "gkey"]);
	bot.cfg.add_hook("gkey", {
		substring_criterion: "gQueen",
		callback: () => { return "BOOBA" }
	});
	await bot.run();
}

try {
	await main();
} catch (e) {
	console.error(e);
}
