import Bot from "./Bot.ts";
import Config from "./Config.ts";

const config = new Config({
	cmd_prefix: "-",
	database_kind: "mongo",
})
	.join_channels([
		{
			// has_eventsub: true,
			name: "typhu26",
		}])
	.enable_7tv_notifications()
	.disregard_users([
		"lovcen", "fossabot", "fightbot", "snusbot",
		"streamelements", "schnozebot", "thepositiveBot",
		"kattahbot", "anotherttvviewer", "streamlabs", "moobot",
	])
	.add_sudoers(["typhu26"]);
const bot = new Bot(await config);
await bot.run();