import Bot from "./Bot.ts";
import Config from "./Config.ts";

const config = new Config({
	cmd_prefix: "$",
	database_kind: "mongo",
})
	.join_channels([
		{
			has_eventsub: true,
			name: "pepega00000",
		}])
	.enable_7tv_notifications()
	.disregard_users([
		"lovcen", "fossabot", "fightbot", "snusbot",
		"streamelements", "schnozebot", "thepositiveBot",
		"kattahbot", "anotherttvviewer", "streamlabs", "moobot",
	])
	.add_sudoers(["pepega00000"]);
const bot = new Bot(await config);
await bot.run();