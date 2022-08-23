import { Channel, IrcMessage } from "https://deno.land/x/tmi@v1.0.5/mod.ts";
import { Application, Router } from "https://deno.land/x/oak@v10.6.0/mod.ts";

import * as twitch from "./apis/twitch.ts";
import { CommandContext, ircmsg_is_command_fmt, Command } from "./Command.ts";
import Hook, { validate_hook } from "./Hook.ts";
import Config from "./Config.ts";

import "https://deno.land/x/dotenv@v3.2.0/load.ts";
import "./std_redeclarations.ts";

import { Ngrok } from "https://deno.land/x/ngrok@4.0.1/mod.ts";
import { sleep } from "https://deno.land/x/sleep@v1.2.1/mod.ts";
import { WebSocketClient, StandardWebSocketClient } from "https://deno.land/x/websocket@v0.1.4/mod.ts";

export interface TwitchUserBasicInfo {
	nickname: string,
	id: number,
}

export interface TwitchChannel extends TwitchUserBasicInfo {
	client?: Channel,
	// statistics about a live broadcast that have to be kept all the time
	// null if channel isn't live 
	uptime_stats: {
		messages_sent: number,
		games_played: string[],
		startup_time: Date,
		// map between the user twitch ids and their message counts
		user_counts: Map<number, number>
	} | null,
	hooks: Hook[],
}

export interface TwitchInfo {
	login: string,
	oauth: string,
	client_id: string,
	client_secret: string,
}

export default class Bot {
	cfg: Config;

	constructor(cfg: Config) {
		this.cfg = cfg;
	}

	async channel_info_loop_fetch(channel_idx: number) {
		const r = await twitch.get_channel(this.cfg.twitch_info, this.cfg.channels[channel_idx].nickname);
		console.log(`Fetched info for channel ${this.cfg.channels[channel_idx].nickname}`);

		if (r.data.length === 0) {
			// channel is offline
			if (this.cfg.channels[channel_idx].uptime_stats !== null) {
				// channel just went offline
				await this.cfg.save_stats_to_file(this.cfg.channels[channel_idx]);
			}
			this.cfg.channels[channel_idx].uptime_stats = null;
			return;
		}

		if (this.cfg.channels[channel_idx].uptime_stats === null) {
			// channel just went live
			this.cfg.channels[channel_idx].uptime_stats = {
				messages_sent: 0,
				games_played: [r.data[0].game_name],
				startup_time: new Date(r.data[0].started_at),
				user_counts: new Map<number, number>()
			}
		} else {
			// channel has been live for some time

			if (!this.cfg.channels[channel_idx].uptime_stats!.games_played.includes(r.data[0].game_name))
				this.cfg.channels[channel_idx].uptime_stats!.games_played.push(r.data[0].game_name);
		}
	}

	// -------------------------------------------------------------------------
	// listeners
	// -------------------------------------------------------------------------

	listen_local() {
		const router = new Router();
		router.get("/", (ctx) => {
			ctx.response.body = "Hello :)";
		});

		router.post("/notification", async (ctx) => {
			console.log(ctx.request.body);

			const body = ctx.request.body();

			if (body.type === "json") {
				console.log(await body.value);
				console.log("Sucessfully established EventSub webhooks");
			}


			// if (ctx.request.body.event) {
			// console.log(req)
			// }
		});

		const app = new Application();
		app.use(router.routes());
		app.use(router.allowedMethods());

		app.listen({ port: parseInt(Deno.env.get("PORT")!) });
	}

	async listen_channel(c: Channel, channel_idx: number) {
		for await (const ircmsg of c) {
			switch (ircmsg.command) {
				case "PRIVMSG":
					this.handle_hooks(c, channel_idx, ircmsg);
					this.handle_privmsg(c, channel_idx, ircmsg);
			}
		}
	}

	// -------------------------------------------------------------------------
	// handlers
	// -------------------------------------------------------------------------

	async handle_privmsg(c: Channel, channel_idx: number, ircmsg: IrcMessage) {
		if (ircmsg_is_command_fmt(ircmsg, this.cfg.cmd_prefix) &&
			!this.cfg.disregarded_users.includes(ircmsg.username)
		) {
			const ctx = new CommandContext(ircmsg, this.cfg);
			// the meta commands have to have some speacial handling
			// that is why it gets quite ugly here
			switch (ctx.cmd) {
				case Command.None:
					break;
				case Command.Describe:
					if (ctx.args.length === 0)
						c.send(`@${ircmsg.username} no command provided. Use ${this.cfg.cmd_prefix}describe <command>. For list of available commands, do ${this.cfg.cmd_prefix}commands.`);
					else {
						const cmd_being_described = Command.from_str(ctx.args[0])

						if (cmd_being_described === Command.None)
							c.send(`@${ircmsg.username} command not recognized. Use ${this.cfg.cmd_prefix}commands for list of available commands.`);
						else {
							const cmd = Command.get_module(Command.from_str(ctx.args[0]))!;
							const desc = cmd.description();
							c.send(`@${ircmsg.username} ${desc}`);
						}
					}
					break;
				case Command.Usage:
					if (ctx.args.length === 0)
						c.send(`@${ircmsg.username} no command provided. Use ${this.cfg.cmd_prefix}usage <command>. For list of available commands, do ${this.cfg.cmd_prefix}commands.`);
					else {
						const cmd_whichs_usage_is_being_desc = Command.from_str(ctx.args[0])

						if (cmd_whichs_usage_is_being_desc === Command.None) {
							c.send(`@${ircmsg.username} command not recognized. Use ${this.cfg.cmd_prefix}commands for list of available commands.`);
						} else {
							const cmd = Command.get_module(Command.from_str(ctx.args[0]))!;
							const desc = cmd.usage(this.cfg.cmd_prefix);
							c.send(`@${ircmsg.username} ${desc}`);
						}
					}
					break;
				default: {

					const cmd = Command.get_module(ctx.cmd);
					const res = await cmd!.execute(ctx);
					if (res.is_success)
						c.send(res.output || "cmd succeded");
					else
						c.send(res.output || "cmd failed");
				}
			}
			console.log(`Ran ${ctx.cmd.toString()} in ${ircmsg.channel} by ${ircmsg.username}`);
		}

		if (this.cfg.channels[channel_idx].uptime_stats !== null) {
			this.cfg.channels[channel_idx].uptime_stats!.messages_sent += 1;
			const user_id = parseInt(ircmsg.tags["user-id"]);
			const curr = this.cfg.channels[channel_idx].uptime_stats!.user_counts.get(user_id);

			if (curr)
				this.cfg.channels[channel_idx].uptime_stats!.user_counts.set(user_id, curr + 1);
			else
				this.cfg.channels[channel_idx].uptime_stats!.user_counts.set(user_id, 1);
		}
	}

	handle_hooks(c: Channel, channel_idx: number, ircmsg: IrcMessage) {
		const hooks = this.cfg.channels[channel_idx].hooks;

		for (const hook of hooks) {
			if (validate_hook(hook, ircmsg)) {
				const cb = hook.callback();
				if (cb) c.send(cb);
			}
		}
	}

	// -------------------------------------------------------------------------
	// pubsub & eventsub
	// -------------------------------------------------------------------------

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

			console.log(`Got ngrok tunnel address`);
			return loopback!;

		} else
			return "DEPLOY_URL";
	}

	async init_pubsub() {
		const auth = await twitch.get_eventsub_accesstoken(this.cfg.twitch_info);
		const ws: WebSocketClient = new StandardWebSocketClient("wss://pubsub-edge.twitch.tv");

		ws.on("open", () => {
			console.log(`Opened WebSocket connection with Twitch PubSub`);

			ws.send(JSON.stringify({ type: "PING" }));
			setInterval(() => {
				ws.send(JSON.stringify({ type: "PING" }));
			}, 4 * 60 * 1000);

			const listen_message = {
				"type": "LISTEN",
				"nonce": Deno.env.get("SECRET")!,
				"data": {
					"topics": [`channel-subscribe-events-v1.40295380`],
					"auth_token": auth,
				}
			}
			// console.log(listen_message)

			ws.send(JSON.stringify(listen_message));
		});

		ws.on("message", (msg) => {
			console.log({ msg });
			if (!(JSON.parse(msg.data).type === "PONG")) {
				console.log("xd", JSON.parse(msg.data))
			}
		})
	}

	// -------------------------------------------------------------------------
	// cron jobbing
	// -------------------------------------------------------------------------

	start_cronjobs() {
		this.cfg.cron_jobs.forEach((c) => {
			const client_refs: Channel[] = [];
			for (const [key, val] of this.cfg.client.channels)
				if (!c.channel_names || c.channel_names.includes(key.slice(1)))
					client_refs.push(val);
			const period_diff = c.period[1] - c.period[0];
			(async function foo() {
				while (true) {
					await sleep(c.period[0] + Math.floor(Math.random() * period_diff));
					const out = c.execute();
					if (out)
						client_refs.forEach((ch) => { ch.send(out), console.log(`Ran cronjob ${c.execute} in ${ch.channelName}`) });
				}
			})()
		});
	}

	// -------------------------------------------------------------------------
	// main
	// -------------------------------------------------------------------------

	async run() {
		this.cfg.startup_time = new Date();
		await this.cfg.init_channels();
		await this.cfg.client.connect();
		this.listen_local();

		this.cfg.channels.map((c, idx) => {
			const channel_client = this.cfg.client.joinChannel(c.nickname);
			this.listen_channel(channel_client, idx);
			console.log(`Joined channel ${c.nickname}`);
			setInterval(() => {
				this.channel_info_loop_fetch(idx);
			}, 2 * 60 * 1000)

			return {
				...c,
				client: channel_client
			}
		});

		this.start_cronjobs();
		// this.cfg.loopback_address = await this.get_loopback_address();
		// this.init_pubsub();
		// await twitch.request_eventsub_subscription(this.twitch_info, this.loopback_address!, 40295380);
	}
}

