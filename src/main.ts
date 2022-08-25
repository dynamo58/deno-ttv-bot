import Bot from "./bot.ts";
import Config from "./Config.ts";
import CronJob from "./CronJob.ts";
import { get_7tv_emotes } from "./apis/adamcy.ts";

async function main(): Promise<void> {
	const config = new Config({ cmd_prefix: "$", })
		.join_channels(["gkey", "pepega00000"])
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
		.add_cronjob(new CronJob({
			channel_names: ["gkey"],
			period: [2 * 60, 15 * 60],
			execute: async () => {
				return (await get_7tv_emotes("gkey")).random_el().code;
			}
		}))
		.add_sudoers(["pepega00000"]); // this one has to be last, lol
	const bot = new Bot(await config);
	await bot.run();
}

main();
