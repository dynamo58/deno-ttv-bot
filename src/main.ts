import Bot from "./bot.ts";
import Config from "./config.ts";
import CronJob from "./cron.ts";

async function main(): Promise<void> {
	const config = new Config({ cmd_prefix: "$", })
		;
	const bot = new Bot(config);
	bot.cfg.disregard_users([
		"lovcen", "fossabot", "fightbot", "snusbot",
		"streamelements", "schnozebot", "thepositiveBot",
		"kattahbot", "anotherttvviewer", "streamlabs", "moobot"
	]);
	bot.cfg.add_sudoers([149355320]);
	await bot.cfg.join_channels(["pepega00000", "gkey"]);
	bot.cfg.add_hook("gkey", {
		nickname_criterion: "fossabot",
		substring_criterion: "just resubscribed",
		callback: () => { return "welcome back to the g spot gQueen" }
	});
	bot.cfg.add_hook("gkey", {
		nickname_criterion: "fossabot",
		substring_criterion: "just subscribed",
		callback: () => { return "welcome to the g spot gQueen" }
	});
	bot.cfg.add_cronjob(new CronJob({
		channel_names: ["gkey"],
		period: [2 * 60, 15 * 60],
		execute: () => `${["ApuApustaja TeaTime", "Jammies", "THIS", "THAT", "THESE", "THOSE"].random_el()}`
	}));
	await bot.run();
}

try {
	await main();
} catch (e) {
	console.error(e);
}
