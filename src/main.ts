import Bot from "./bot.ts";
import Config from "./Config.ts";
import CronJob from "./CronJob.ts";

async function main(): Promise<void> {
	const config = new Config({ cmd_prefix: "$", })
		.join_channels(["pepega00000", "gkey"])
		.disregard_users([
			"lovcen", "fossabot", "fightbot", "snusbot",
			"streamelements", "schnozebot", "thepositiveBot",
			"kattahbot", "anotherttvviewer", "streamlabs", "moobot"
		])
		.add_hook("gkey", {
			nickname_criterion: "fossabot",
			substring_criterion: "just resubscribed",
			callback: () => { return "welcome back to the g spot gQueen" }
		})
		.add_hook("gkey", {
			nickname_criterion: "fossabot",
			substring_criterion: "just subscribed",
			callback: () => { return "welcome to the g spot gQueen" }
		})
		.add_cronjob(new CronJob({
			channel_names: ["gkey"],
			period: [2 * 60, 15 * 60],
			execute: () => `${["ApuApustaja TeaTime", "Jammies", "THIS", "THAT", "THESE", "THOSE", "Chatting test", "BatChest", "Okayeg TeaTime", "lol", "VeryEzh"].random_el()}`
		}))
		// this one has to be last, lol
		.add_sudoers(["pepega00000"]);
	const bot = new Bot(await config);
	await bot.run();
}

main();
