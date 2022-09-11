// This is an example `main.ts` to show off the different features

import Bot from "./Bot.ts";
import Config from "./Config.ts";

// First you create a Config instance using a builder patter like so
const config = new Config({
	// the prefix for command like `$ping`
	cmd_prefix: "$",
	// specify the target database
	// currently the only one supported is MongoDB
	// TODO: v implement this xd
	// delete this line to use no database 
	database_kind: "mongo",
	// output logs to a file also
	// delete this line for no file logging 
	log_file: "log.txt",
})
	// provide an array of channels to join
	.join_channels([
		{
			name: "<my_amazing_channel>",
			has_eventsub: true, // max 1 channel can have it cuz reasons
			// remove those lines if you want no message
			subscribe_message: "@{{ NAME }} welcome to the G spot flushE",
			resubscribe_message: "@{{ NAME }} welcome back to the G spot flushE",
		},
		{
			name: "<other channel>",
		}])
	// provide live updates for newly added/removed 7tv emotes
	// as always, you can ommit this not to enable them
	.enable_7tv_notifications()
	// the users that the bot shall not process
	// (example has some of the common bots one may found on ttv)
	.disregard_users([
		"lovcen", "fossabot", "fightbot", "snusbot",
		"streamelements", "schnozebot", "thepositiveBot",
		"kattahbot", "anotherttvviewer", "streamlabs", "moobot",
	])
	// run something periodically in a chatroom
	.add_cronjob({
		requires_live: true,
		channel_names: ["gkey"],
		period: [2 * 60, 15 * 60],
		execute: () => `⭐ Star me on GitHub PogChamp 👉  https://github.com/dynamo58/deno-ttv-bot`,
	})
	// if you wanted to, you can add another .add_cronjob({...})

	// give access to the `sudo` command to people
	// ! WARNING ! only give this to people who you can trust with system-level privileges
	// this one has to be last, lol
	.add_sudoers(["pepega00000"]);

// now that the config was constructed, `await` it,
// make a Bot instance and run it 
const bot = new Bot(await config);
await bot.run();