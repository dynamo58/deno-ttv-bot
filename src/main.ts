import Bot from "./Bot.ts";
import Config from "./Config.ts";

import { get_7tv_emotes } from "./apis/adamcy.ts";

async function main(): Promise<void> {
	const config = new Config({
		cmd_prefix: "$",
		database_kind: "mongo",
	})
		.join_channels(["gkey", "pepega00000", "99sunrise"])
		.disregard_users([
			"lovcen", "fossabot", "fightbot", "snusbot",
			"streamelements", "schnozebot", "thepositiveBot",
			"kattahbot", "anotherttvviewer", "streamlabs", "moobot",
		])
		.add_hook("gkey", {
			nickname_criterion: "fossabot",
			substring_criterion: "just resubscribed",
			execute: () => "welcome back to the g spot gQueen",
		})
		.add_cronjob({
			requires_live: true,
			channel_names: ["gkey"],
			period: [2 * 60, 15 * 60],
			execute: async () => `!showemote ${(await get_7tv_emotes("gkey")).unwrap().random_el().code}`,
		})
		// .add_cronjob({
		// 	requires_live: true,
		// 	channel_names: ["gkey"],
		// 	period: [30 * 60, 60 * 60],
		// 	execute: () => `Don't see emotes like AlienUnpleased  or WALKING ? Get the 7tv browser extension at https://7tv.app/ for access to tons of cool emotes in the chat!`,
		// })
		.add_sudoers(["pepega00000"]); // this one has to be last, lol
	const bot = new Bot(await config);
	await bot.run();
}

main();
