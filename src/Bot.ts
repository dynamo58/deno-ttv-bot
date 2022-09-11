import "https://deno.land/x/dotenv@v3.2.0/load.ts";

import { format_duration } from "./std_redeclarations.ts";

import { Channel, IrcMessage } from "https://deno.land/x/tmi@v1.0.5/mod.ts";
import * as twitch from "./apis/twitch.ts";
import { CommandContext } from "./Command.ts";
import Hook, { validate_hook } from "./Hook.ts";
import Config from "./Config.ts";
import { Reminder } from "./commands/remind.ts";
import { ActualTags } from "./Command.ts";

import { Application, Router } from "https://deno.land/x/oak@v10.6.0/mod.ts";
import { Ngrok } from "https://deno.land/x/ngrok@4.0.1/mod.ts";
import { sleep } from "https://deno.land/x/sleep@v1.2.1/mod.ts";

import { MongoClient, } from "https://deno.land/x/mongo@v0.31.0/mod.ts";
import * as db from "./db/db.ts";

import Log from "./Log.ts";

export interface TwitchUserBasicInfo {
	nickname: string,
	id: number,
}

export interface UptimeStats {
	// number of messages sent since stream went live
	messages_sent: number,
	// the games (categories) a streamer was in since ...
	games_played: string[],
	// the date when streamer went live
	startup_time: Date,
	// map between chatter user-id twitch ids and their message counts
	user_counts: Map<number, number>
}

export interface TwitchChannel extends TwitchUserBasicInfo {
	// tmi.js client
	client?: Channel,
	// statistics about a live broadcast that have to be kept all the time
	// null if channel isn't live 
	uptime_stats: UptimeStats | null,
	// hooks in a channel, see ./Hook.ts for more info
	hooks: Hook[],
	// keep track of "pyramids" in chat
	// pyramids are when a user types emotes in chat in consencutive messages
	// in such quantities, that they resemble a pyramid, example:
	// pepega00000: TriHard
	// pepega00000: TriHard TriHard
	// pepega00000: TriHard TriHard TriHard
	// pepega00000: TriHard TriHard
	// pepega00000: TriHard
	pyramid_tracker: {
		unit?: string,
		user_id?: number
		count: number,
		max_count?: number,
		is_ascending: boolean,
	},
	subscribe_message?: string,
	resubscribe_message?: string,
	has_eventsub: boolean,
}

// credentials used to access and interact with the Twitch API 
export interface Credentials {
	login: string,
	oauth: string,
	client_id: string,
	wolfram_appid: string,
	app_client_id: string,
	app_secret: string,
	secret: string,
}

export default class Bot {
	cfg: Config;
	// a MongoDB database instance
	db_client?: MongoClient;

	constructor(cfg: Config) {
		this.cfg = cfg;
	}

	// I was supposed to render this fn deprecated, but turns out the eventapi has some really stupid limitations,
	// so there we are, still
	async channel_info_loop_fetch(channel_idx: number) {
		const r = await twitch.get_channel(this.cfg.credentials, this.cfg.channels[channel_idx].nickname);
		if (r.status !== 200) { Log.warn(`Getting channel information for ${this.cfg.channels[channel_idx].nickname} failed.`); return }
		const data = r.data!.data;

		if (data.length === 0) {
			// channel is offline
			if (this.cfg.channels[channel_idx].uptime_stats !== null) {
				// channel just went offline
				if (this.db_client) {
					await db.save_stream_stats(this.db_client, this.cfg.channels[channel_idx])
					Log.info(`Saved stream data after ${this.cfg.channels[channel_idx].nickname} ended their stream.`)
				}
			}
			this.cfg.channels[channel_idx].uptime_stats = null;
			return;
		}

		if (this.cfg.channels[channel_idx].uptime_stats === null) {
			// channel just went live
			this.cfg.channels[channel_idx].uptime_stats = {
				messages_sent: 0,
				games_played: [data[0].game_name],
				startup_time: new Date(data[0].started_at),
				user_counts: new Map<number, number>()
			}
		} else {
			// channel has been live for some time

			if (!this.cfg.channels[channel_idx].uptime_stats!.games_played.includes(data[0].game_name))
				this.cfg.channels[channel_idx].uptime_stats!.games_played.push(data[0].game_name);
		}
	}

	async init_channels() {
		for (const [idx, c] of this.cfg.channels.entries()) {
			const res = await twitch.get_channel(this.cfg.credentials, c.nickname);
			if (res.status !== 200) throw new Error(`Failed to get initiate channel ${c.nickname}`);
			const channel = res.data!;

			// if channel is not live
			if (channel.data.length === 0) {
				try {
					const res = await twitch.id_from_nick(this.cfg.credentials, [c.nickname]);
					if (res.status !== 200) throw new Error(`Failed to get initiate channel ${c.nickname}`);
					const channel_id = res.data![0];
					this.cfg.channels[idx] = { ...c, id: channel_id, nickname: c.nickname.toLowerCase() };
				} catch {
					throw new Error(`Channel ${c.nickname} does not exist!`);
				}

				continue;
			}

			// if channel is live
			this.cfg.channels[idx] = {
				...c,
				nickname: c.nickname.toLowerCase(),
				id: parseInt(channel.data[0].user_id),
				uptime_stats: {
					messages_sent: 0,
					games_played: [channel.data[0].game_name],
					startup_time: new Date(channel.data[0].started_at),
					user_counts: new Map<number, number>()
				},
				pyramid_tracker: { count: 0, is_ascending: true },
				has_eventsub: false,
			}
		}
	}

	// -------------------------------------------------------------------------
	// listeners
	// -------------------------------------------------------------------------

	async listen_channel(c: Channel, channel_idx: number) {
		for await (const ircmsg of c) {
			if (this.cfg.disregarded_users.includes(ircmsg.username)) continue;
			switch (ircmsg.command) {
				case "PRIVMSG":
					// if (ircmsg.message === "#test" && ircmsg.username === "pepega00000") {
					// }


					// do all the checks that come after a normal chat message
					this.handle_hooks(c, channel_idx, ircmsg);
					this.handle_pyramid(c, channel_idx, ircmsg);
					this.handle_commands(c, ircmsg);
					this.handle_reminders(c, ircmsg);
					this.handle_lurker(c, ircmsg);
					this.handle_stats(channel_idx, ircmsg);
					continue;
				case "USERNOTICE":
					// do all the checks that come after USERNOTICES (people subscribing and what not)
					this.handle_usernotice(c, channel_idx, ircmsg);
			}
		}
	}

	// -------------------------------------------------------------------------
	// handlers
	// -------------------------------------------------------------------------


	handle_usernotice(c: Channel, channel_idx: number, ircmsg: IrcMessage) {
		const tags = ircmsg.tags as ActualTags;
		if (tags["system-msg"] && tags["system-msg"].includes("subscribed")) {

			// const c = this.cfg.channels.filter(c => c.id === 149355320)[0].client!; // test test testing
			if (tags["system-msg"].includes("They've") && this.cfg.channels[channel_idx].resubscribe_message)
				c.send(this.cfg.channels[channel_idx].resubscribe_message!.replace("{{ NAME }}", ircmsg.tags["display-name"]));
			else if (this.cfg.channels[channel_idx].subscribe_message)
				c.send(this.cfg.channels[channel_idx].subscribe_message!.replace("{{ NAME }}", ircmsg.tags["display-name"]));
		}

	}

	handle_lurker(c: Channel, ircmsg: IrcMessage) {
		const user_id = parseInt(ircmsg.tags["user-id"])!;
		const user_lurker = this.cfg.lurkers.get(user_id);
		if (user_lurker) {
			c.send(`${ircmsg.username} came back from ${user_lurker.message ?? "being AFK"} (${format_duration((new Date()).valueOf() - (new Date(user_lurker.start).valueOf()), false)} ago)`);
			this.cfg.lurkers.delete(user_id);
		}
	}

	handle_reminders(c: Channel, ircmsg: IrcMessage) {
		const user_id = parseInt(ircmsg.tags["user-id"])!;
		const reminders_ref = this.cfg.reminders.get(user_id);
		if (reminders_ref) {
			reminders_ref!.forEach((r, idx) => {
				const rm = {
					from_nick: r.from_nick,
					datetime_sent: new Date(r.datetime_sent),
					datetime_to_arrive: new Date(r.datetime_to_arrive),
					message: r.message,
				} as Reminder;

				if (rm.datetime_to_arrive.valueOf() <= (new Date()).valueOf()) {
					c.send(`@${ircmsg.username} reminder from ${rm.from_nick}: ${rm.message} (${format_duration(rm.datetime_to_arrive.valueOf() - rm.datetime_sent.valueOf(), false)} ago)`);
					if (reminders_ref!.length == 1) this.cfg.reminders.delete(user_id);
					else this.cfg.reminders.set(user_id, [...reminders_ref!.slice(0, idx), ...reminders_ref!.slice(idx + 1, reminders_ref.length)])
				}
			})
		}
	}

	handle_pyramid(c: Channel, channel_idx: number, ircmsg: IrcMessage) {
		const pyr = this.cfg.channels[channel_idx].pyramid_tracker;
		const id = parseInt(ircmsg.tags["user-id"]);
		const msg_split = ircmsg.message.split(" ");
		if (id === pyr.user_id && msg_split.every(s => s === pyr.unit)) {
			if ((msg_split.length === pyr.count + 1) && pyr.is_ascending) {
				this.cfg.channels[channel_idx].pyramid_tracker.count += 1;
			} else if ((msg_split.length === pyr.count - 1) && pyr.is_ascending) {
				this.cfg.channels[channel_idx].pyramid_tracker.is_ascending = false;
				this.cfg.channels[channel_idx].pyramid_tracker.max_count = pyr.count;
				this.cfg.channels[channel_idx].pyramid_tracker.count -= 1;
			} else if ((msg_split.length === pyr.count - 1) && !pyr.is_ascending)
				this.cfg.channels[channel_idx].pyramid_tracker.count -= 1;

			if (pyr.count === 1 && !pyr.is_ascending)
				c.send(`@${ircmsg.username} just finished a ${pyr.max_count}-wide pyramid PagMan 👉  ${pyr.unit}`);
			else return;
		}

		if (ircmsg.message === msg_split[0])
			this.cfg.channels[channel_idx].pyramid_tracker = { count: 1, user_id: id, unit: msg_split[0], is_ascending: true };
		else
			this.cfg.channels[channel_idx].pyramid_tracker = { count: 0, is_ascending: true };
	}

	async handle_commands(c: Channel, ircmsg: IrcMessage) {
		if (ircmsg.message.startsWith(this.cfg.cmd_prefix) &&
			!this.cfg.disregarded_users.includes(ircmsg.username)
		) {
			const ctx = new CommandContext(ircmsg, this.cfg, this.db_client);
			// the meta commands have to have some speacial handling
			// that is why it gets quite ugly here
			switch (ctx.cmd) {
				case "describe":
					if (ctx.args.length === 0)
						c.send(`@${ircmsg.username} no command provided. Use ${this.cfg.cmd_prefix}describe <command>. For list of available commands, do ${this.cfg.cmd_prefix}commands.`);
					else {
						const cmd_being_described = this.cfg.commands.get(ctx.args[0].toLowerCase());

						if (!cmd_being_described)
							c.send(`@${ircmsg.username} command not recognized. Use ${this.cfg.cmd_prefix}commands for list of available commands.`);
						else {
							const desc = cmd_being_described.description();
							c.send(`@${ircmsg.username} ${desc}`);
						}
					}
					break;
				case "usage":
					if (ctx.args.length === 0)
						c.send(`@${ircmsg.username} no command provided. Use ${this.cfg.cmd_prefix}usage <command>. For list of available commands, do ${this.cfg.cmd_prefix}commands.`);
					else {
						const cmd_whichs_usage_is_being_desc = this.cfg.commands.get(ctx.args[0].toLowerCase())

						if (!cmd_whichs_usage_is_being_desc) {
							c.send(`@${ircmsg.username} command not recognized. Use ${this.cfg.cmd_prefix}commands for list of available commands.`);
						} else {
							const desc = cmd_whichs_usage_is_being_desc.usage(this.cfg.cmd_prefix);
							c.send(`@${ircmsg.username} ${desc}`);
						}
					}
					break;
				default: {
					const cmd = this.cfg.commands.get(ctx.cmd);
					if (cmd) {
						const res = await cmd!.execute(ctx);
						if (res.is_success)
							c.send(`@${ctx.caller.nickname} ${res.output}` || "cmd succeded");
						else
							c.send(`@${ctx.caller.nickname} ${res.output}` || "cmd failed");
						if (res.system_commands)
							for (const c of res.system_commands) try { eval(c) } catch (e) { console.log(e) }

						Log.info(`Ran ${ctx.cmd} in ${ircmsg.channel} by ${ircmsg.username}`);
					}
				}
			}
		}
	}

	handle_stats(channel_idx: number, ircmsg: IrcMessage) {
		if (this.cfg.channels[channel_idx].uptime_stats !== null) {
			this.cfg.channels[channel_idx].uptime_stats!.messages_sent += 1;
			const user_id = parseInt(ircmsg.tags["user-id"]);
			// console.log(this.cfg.channels[channel_idx])
			const curr = this.cfg.channels[channel_idx].uptime_stats!.user_counts.get(user_id);

			if (curr)
				this.cfg.channels[channel_idx].uptime_stats!.user_counts.set(user_id, curr + 1);
			else
				this.cfg.channels[channel_idx].uptime_stats!.user_counts.set(user_id, 1);
		}
	}

	async handle_hooks(c: Channel, channel_idx: number, ircmsg: IrcMessage) {
		const hooks = this.cfg.channels[channel_idx].hooks;

		for (const hook of hooks) {
			if (validate_hook(hook, ircmsg)) {
				const cb = await hook.execute();
				if (cb) c.send(cb);
			}
		}
	}

	async handle_db_data_pull() {
		const { uptime_stats, reminders, lurkers } = await db.pull_all(this.db_client!);
		this.cfg.lurkers = lurkers;
		this.cfg.reminders = reminders;

		uptime_stats.forEach(async (s, i) => {
			const idx = this.cfg.get_channel_idx_by_id(i);
			if (idx !== null) {
				const r = await twitch.get_channel(this.cfg.credentials, this.cfg.channels[idx].nickname);
				if (r.data && r.data.data.length >= 0)
					this.cfg.channels[idx].uptime_stats = s;
				else
					await db.save_stream_stats(this.db_client!, this.cfg.channels[idx]);
			}
		})
	}

	// -------------------------------------------------------------------------
	// eventsub
	// -------------------------------------------------------------------------

	async init_eventsub() {
		this.cfg.loopback_address = await this.get_loopback_address();

		const router = new Router();
		router.get("/", (ctx) => {
			ctx.response.body = "Hello :)";
		});

		router.post('/webhooks/:channel_user_id/eventsub', async (ctx) => {
			const body = ctx.request.body();

			if (body.type === "json") {
				const data = await body.value;

				if (data.challenge)
					ctx.response.body = data.challenge;

				if (data.event) {
					const channel_idx = this.cfg.get_channel_idx_by_id(parseInt(ctx.params.channel_user_id))!;
					switch (data.subscription.type) {
						case "channel.update":
							if (this.cfg.channels[channel_idx].uptime_stats)
								if (this.cfg.channels[channel_idx].uptime_stats!.games_played.includes(data.event.category_name))
									this.cfg.channels[channel_idx].uptime_stats!.games_played.push(data.event.category_name);
							break;
						// deno-lint-ignore no-case-declarations
						case "stream.online":
							const r = await twitch.get_channel(this.cfg.credentials, this.cfg.channels[channel_idx].nickname);
							if (r.status !== 200) { Log.warn(`Getting channel information for ${this.cfg.channels[channel_idx].nickname} failed.`); return }

							const notifiers = await db.get_channel_live_notif_subscribers(this.db_client!, this.cfg.channels[channel_idx].id);
							if (notifiers.length > 0 && this.cfg.channels[channel_idx].client && this.cfg.channels[channel_idx].uptime_stats !== null)
								this.cfg.channels[channel_idx].client!.send(`DinkDonk THE STREAM JUST WENT LIVE DinkDonk @${notifiers.map(n => n.nickname).join("@ ")}`)

							this.cfg.channels[channel_idx].uptime_stats = {
								messages_sent: 0,
								games_played: [r.data!.data[0].game_name],
								startup_time: new Date(),
								user_counts: new Map(),
							}

							break;
						case "stream.offline":
							await db.save_stream_stats(this.db_client!, this.cfg.channels[channel_idx]);
							this.cfg.channels[channel_idx].uptime_stats = null;
					}
				}
			}
		});

		const app = new Application();
		app.use(router.routes());
		app.use(router.allowedMethods());

		app.listen({ port: parseInt(Deno.env.get("PORT")!) });

		const access_token = (await twitch.get_eventsub_accesstoken(this.cfg.credentials)).unwrap();
		for (const c of this.cfg.channels.filter(c => c.has_eventsub))
			for (const sub_type of ["channel.update", "stream.online", "stream.offline"])
				await twitch.request_eventsub_subscription(this.cfg.credentials, this.cfg.loopback_address, access_token, c.id, sub_type);
	}

	async get_loopback_address(): Promise<string> {
		if (Deno.env.get("LOCAL")) {
			let loopback: string | null = null;

			const ngrok = await Ngrok.create({
				protocol: "http",
				port: parseInt(Deno.env.get("PORT")!),
			})

			ngrok.addEventListener("ready", (event) => {
				loopback = event.detail;
			});

			while (loopback === null) {
				await sleep(0.1);
			}

			Log.success(`Got ngrok tunnel address`);
			return loopback!;

		} else return "46.101.248.193:443";
	}

	// -------------------------------------------------------------------------
	// cron jobbing
	// -------------------------------------------------------------------------

	start_cronjobs() {
		this.cfg.cron_jobs.forEach((cron) => {
			const channel_idx_refs: number[] = [];
			const period_diff = cron.period[1] - cron.period[0];
			for (const [idx, channel] of this.cfg.channels.entries())
				if (!cron.channel_names || cron.channel_names.includes(channel.nickname))
					channel_idx_refs.push(idx);

			channel_idx_refs.forEach(async (idx) => {
				while (true) {
					await sleep(cron.period[0] + Math.floor(Math.random() * period_diff));
					if (!cron.requires_live || this.cfg.channels[idx].uptime_stats) {
						const out = await cron.execute();
						if (out) this.cfg.channels[idx].client!.send(out);
					}
				}
			})
		});
	}

	// -------------------------------------------------------------------------
	// main
	// -------------------------------------------------------------------------

	async run() {
		Log.success(`Starting up on PID ${Deno.pid} and port ${Deno.env.get("PORT")!}`);
		this.cfg.startup_time = new Date();
		await this.init_channels();
		await this.cfg.client.connect();

		this.cfg.channels.forEach((c, idx) => {
			const channel_client = this.cfg.client.joinChannel(c.nickname);
			this.listen_channel(channel_client, idx);
			Log.success(`Joined channel ${c.nickname}`);
			if (!c.has_eventsub)
				setInterval(() => {
					this.channel_info_loop_fetch(idx);
				}, 2 * 60 * 1000)
			this.cfg.channels[idx].client = channel_client;
		});

		if (this.cfg.database_kind === "mongo") {
			const mongo = new MongoClient();
			await mongo.connect(Deno.env.get("MONGODB_SRV")!)
			Log.success(`Connected to MongoDB database`);
			this.db_client = mongo;
		}

		if (this.cfg.database_kind) {
			setInterval(async () => {
				await db.push_all(this.db_client!, this.cfg.reminders, this.cfg.lurkers, new Map(this.cfg.channels.map((c) => [c.id, c.uptime_stats])));
				Log.info(`Synced local data with database`)
			}, 5 * 60 * 1000);
			await this.handle_db_data_pull();
			Log.success(`Pulled data from database`)
		}

		this.start_cronjobs();
		await this.init_eventsub();
	}
}

