import Bot from "./Bot.ts";
import Config from "./Config.ts";
import { get_7tv_emotes } from "./apis/adamcy.ts";

const config = new Config({
	cmd_prefix: "-",
	database_kind: "mongo",
})
	.join_channels([
		{
			name: "gkey",
			// has_eventsub: true, // max 1 channel can have it cuz reasons
			subscribe_message: "@{{ NAME }} welcome to the G spot flushE",
			resubscribe_message: "@{{ NAME }} welcome back to the G spot flushE",
		},
		{
			name: "lovcen",
		}])
	.enable_7tv_notifications()
	.disregard_users([
		"lovcen", "fossabot", "fightbot", "snusbot",
		"streamelements", "schnozebot", "thepositiveBot",
		"kattahbot", "anotherttvviewer", "streamlabs", "moobot",
	])
	.add_cronjob({
		requires_live: true,
		channel_names: ["gkey"],
		period: [15 * 60, 25 * 60],
		execute: async () => `!showemote ${(await get_7tv_emotes("gkey")).unwrap().random().code}`,
	})
	.add_cronjob({
		requires_live: true,
		channel_names: ["gkey"],
		period: [10 * 60, 45 * 60],
		execute: () => `BebeLa 👉 Posture  ML`,
	})
	.add_sudoers(["pepega00000"]);
const bot = new Bot(await config);
await bot.run();
