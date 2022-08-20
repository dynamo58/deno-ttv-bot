import { TwitchChat, Channel, IrcMessage } from "https://deno.land/x/tmi@v1.0.5/mod.ts";
import * as twitch from "./apis/twitch.ts";
import { CommandContext, ircmsg_is_command_fmt, Command } from "./commands/Command.ts";
import { Application, Router } from "https://deno.land/x/oak@v10.6.0/mod.ts";
import Hook, { validate_hook } from "./Hook.ts";
// import { Ngrok } from "https://deno.land/x/ngrok@4.0.1/mod.ts";
// import { sleep } from "https://deno.land/x/sleep/mod.ts";
// import { WebSocketClient, StandardWebSocketClient } from "https://deno.land/x/websocket@v0.1.4/mod.ts";

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

interface IConfigConstructor {
	cmd_prefix?: string,
}

export class Config {
	client: TwitchChat;
	twitch_info: TwitchInfo;
	loopback_address: string | null;
	// twitch user IDs of people with the `UserPrivilege.Sudo` status
	sudoers: number[];
	channels: TwitchChannel[];
	cmd_prefix: string;
	disregarded_users: string[];
	startup_time: Date | null;

	constructor(cfg: IConfigConstructor) {
		try {
			const twitch_oauth = Deno.env.get("TWITCH_OAUTH")!;
			const twitch_login = Deno.env.get("TWITCH_LOGIN")!;
			const twitch_client_id = Deno.env.get("TWITCH_CLIENT_ID")!;
			const twitch_client_secret = Deno.env.get("TWITCH_CLIENT_SECRET")!;

			this.cmd_prefix = cfg.cmd_prefix ?? "!";
			this.client = new TwitchChat(twitch_oauth, twitch_login);
			this.channels = [];
			this.disregarded_users = [];
			this.sudoers = []
			this.loopback_address = null;
			this.twitch_info = {
				login: twitch_login,
				oauth: twitch_oauth,
				client_id: twitch_client_id,
				client_secret: twitch_client_secret,
			};
			this.startup_time = null;
		} catch {
			throw new Error("Credentials not in environment!");
		}
	}

	add_sudoers(sudoers: number[]) {
		for (const sudoer_id of sudoers) this.sudoers.push(sudoer_id);
	}

	// async get_loopback_address(): Promise<string> {
	// 	if (Deno.env.get("IS_LOCAL_DEVELOPMENT")) {
	// 		let loopback: string | null = null;

	// 		const ngrok = await Ngrok.create({
	// 			protocol: "http",
	// 			port: parseInt(Deno.env.get("PORT")!),
	// 		})

	// 		ngrok.addEventListener("ready", (event) => {
	// 			loopback = event.detail;
	// 		});

	// 		while (loopback === null) {
	// 			await sleep(0.1);
	// 		}

	// 		console.log(`Got ngrok tunnel address`);
	// 		return loopback!;

	// 	} else {
	// 		return "DEPLOY_URL";
	// 	}
	// }

	async add_channel(channel_name: string) {
		const channel = await twitch.get_channel(this.twitch_info, channel_name);
		// if channel is not live
		if (channel.data.length === 0) {
			const channel_id = await twitch.id_from_nick(this.twitch_info, channel_name);
			this.channels.push({ nickname: channel_name, id: channel_id, uptime_stats: null, hooks: [] });
			return;
		}

		// if channel is live
		this.channels.push({
			nickname: channel.data[0].user_login,
			id: parseInt(channel.data[0].user_id),
			uptime_stats: {
				messages_sent: 0,
				games_played: [channel.data[0].game_name],
				startup_time: new Date(channel.data[0].started_at),
				user_counts: new Map<number, number>()
			},
			hooks: []
		})
	}

	add_hook(channel_name: string, hook: Hook) {
		let channel_idx: undefined | number;


		for (const [idx, c] of this.channels.entries())
			if (c.nickname === channel_name) {
				channel_idx = idx;
				break;
			}

		if (!channel_idx) throw new Error(`Channel ${channel_name} not joined by the bot!`)

		this.channels[channel_idx].hooks.push({
			...hook,
			substring_criterion: hook.substring_criterion?.toLowerCase(),
			nickname_criterion: hook.nickname_criterion?.toLowerCase(),
		});
	}

	async save_stats_to_file(channel: TwitchChannel) {
		try {
			await Deno.writeTextFile(
				`./cache/${(new Date()).toISOString()}.json`,
				JSON.stringify(channel)
			);
			console.log(`Saved stats for ${channel.nickname}.`);
		} catch {
			console.log(`Failed saving stats for ${channel.nickname}.`);
		}

	}

	async channel_info_loop_fetch(channel_idx: number) {
		const r = await twitch.get_channel(this.twitch_info, this.channels[channel_idx].nickname);
		console.log(`Fetched info for channel ${this.channels[channel_idx].nickname}`);

		if (r.data.length === 0) {
			// channel is offline
			if (this.channels[channel_idx].uptime_stats !== null) {
				// channel just went offline
				await this.save_stats_to_file(this.channels[channel_idx]);
			}
			this.channels[channel_idx].uptime_stats = null;
			return;
		}

		if (this.channels[channel_idx].uptime_stats === null) {
			// channel just went live
			this.channels[channel_idx].uptime_stats = {
				messages_sent: 0,
				games_played: [r.data[0].game_name],
				startup_time: new Date(r.data[0].started_at),
				user_counts: new Map<number, number>()
			}
		} else {
			// channel has been live for some time

			if (!this.channels[channel_idx].uptime_stats!.games_played.includes(r.data[0].game_name))
				this.channels[channel_idx].uptime_stats!.games_played.push(r.data[0].game_name);
		}
	}

	async join_channels(channels: string[]) {
		for (const c of channels)
			await this.add_channel(c);
	}

	listen_local() {
		const router = new Router();
		router.get("/", (ctx) => {
			ctx.response.body = "Hello :)";
		});

		// router.post("/notification", async (ctx) => {
		// 	console.log(ctx.request.body);

		// 	const body = ctx.request.body();

		// 	if (body.type === "json") {

		// 		console.log(await body.value);
		// 		console.log("Sucessfully established EventSub webhooks");
		// 	}


		// 	// if (ctx.request.body.event) {
		// 	// console.log(req)
		// 	// }
		// });

		const app = new Application();
		app.use(router.routes());
		app.use(router.allowedMethods());

		app.listen({ port: parseInt(Deno.env.get("PORT")!) });
	}

	handle_hooks(c: Channel, channel_idx: number, ircmsg: IrcMessage) {
		const hooks = this.channels[channel_idx].hooks;

		for (const hook of hooks) {
			if (validate_hook(hook, ircmsg)) {
				const cb = hook.callback();
				if (cb) c.send(cb);
			}
		}
	}


	async listen_channel(c: Channel, channel_idx: number) {
		for await (const ircmsg of c) {
			switch (ircmsg.command) {
				case "PRIVMSG":

					this.handle_hooks(c, channel_idx, ircmsg);
					if (ircmsg.username === "pepega00000" && ircmsg.message === "ApuApustaja test") {
						this.save_stats_to_file(this.channels.filter(c => c.nickname === "gkey")[0]);
					}


					if (ircmsg_is_command_fmt(ircmsg, this.cmd_prefix) &&
						!this.disregarded_users.includes(ircmsg.username)
					) {
						const ctx = new CommandContext(ircmsg, this);
						// the meta commands have to have some speacial handling
						// that is why it gets quite ugly here
						switch (ctx.cmd) {
							case Command.None:
								break;
							case Command.Describe:
								if (ctx.args.length === 0)
									c.send(`@${ircmsg.username} no command provided. Use ${this.cmd_prefix}describe <command>. For list of available commands, do ${this.cmd_prefix}commands.`);
								else {
									const cmd_being_described = Command.from_str(ctx.args[0])

									if (cmd_being_described === Command.None)
										c.send(`@${ircmsg.username} command not recognized. Use ${this.cmd_prefix}commands for list of available commands.`);
									else {
										const cmd = Command.get_module(Command.from_str(ctx.args[0]))!;
										const desc = cmd.description();
										c.send(`@${ircmsg.username} ${desc}`);
									}
								}
								break;
							case Command.Usage:
								if (ctx.args.length === 0)
									c.send(`@${ircmsg.username} no command provided. Use ${this.cmd_prefix}usage <command>. For list of available commands, do ${this.cmd_prefix}commands.`);
								else {
									const cmd_whichs_usage_is_being_desc = Command.from_str(ctx.args[0])

									if (cmd_whichs_usage_is_being_desc === Command.None) {
										c.send(`@${ircmsg.username} command not recognized. Use ${this.cmd_prefix}commands for list of available commands.`);
									} else {
										const cmd = Command.get_module(Command.from_str(ctx.args[0]))!;
										const desc = cmd.usage(this.cmd_prefix);
										c.send(`@${ircmsg.username} ${desc}`);
									}
								}
								break;
							default: {

								const cmd = Command.get_module(ctx.cmd);
								const res = await cmd!.execute(ctx);
								// const cmd = (await import(ctx.cmd.toString())).default as CommandModule;
								// const res = await cmd.execute(ctx);
								if (res.is_success)
									c.send(res.output || "cmd succeded");
								else
									c.send(res.output || "cmd failed");
							}
						}
						console.log(`Ran ${ctx.cmd.toString()} in ${ircmsg.channel} by ${ircmsg.username}`);
					}

					if (this.channels[channel_idx].uptime_stats !== null) {
						this.channels[channel_idx].uptime_stats!.messages_sent += 1;
						const user_id = parseInt(ircmsg.tags["user-id"]);
						const curr = this.channels[channel_idx].uptime_stats!.user_counts.get(user_id);

						if (curr)
							this.channels[channel_idx].uptime_stats!.user_counts.set(user_id, curr + 1);
						else
							this.channels[channel_idx].uptime_stats!.user_counts.set(user_id, 1);
					}
			}
		}
	}

	disregard_users(users: string[]) {
		this.disregarded_users = users;
	}

	// async init_pubsub() {
	// 	try {
	// 		const ws: WebSocketClient = new StandardWebSocketClient("wss://pubsub-edge.twitch.tv");
	// 		const auth = await twitch.get_eventsub_accesstoken(this.twitch_info);
	// 		ws.on("open", () => {
	// 			console.log(`Opened WebSocket connection with Twitch PubSub`);

	// 			setInterval(() => {
	// 				ws.send(JSON.stringify({ type: "PING" }));
	// 			}, 4 * 60 * 1000);

	// 			ws.send(JSON.stringify({
	// 				"type": "LISTEN",
	// 				"nonce": Deno.env.get("SECRET")!,
	// 				"data": {
	// 					"topics": [`channel-subscribe-events-v1.40295380`],
	// 					"auth_token": auth,
	// 				}
	// 			}))
	// 		});

	// 		ws.on("message", (msg) => {
	// 			if (!(JSON.parse(msg.data).type === "PONG")) {
	// 				console.log("xd", JSON.parse(msg.data))
	// 			}
	// 		})
	// 	} catch (e) {
	// 		console.log(e)
	// 	}
	// }

	async run() {
		this.startup_time = new Date();
		await this.client.connect();
		this.listen_local();
		// this.loopback_address = await this.get_loopback_address();

		this.channels.map((c, idx) => {
			const channel_client = this.client.joinChannel(c.nickname);
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

		// await this.init_pubsub();
		// await twitch.request_eventsub_subscription(this.twitch_info, this.loopback_address!, 40295380);
	}
}

declare global {
	interface Array<T> {
		random_el(): T;
		shuffle(): void;
	}

	interface Math {
		clamp(n: number, min: number, max: number): number,
	}
}

Math.clamp = function (n: number, min: number, max: number): number {
	if (n < min) return min;
	if (n > max) return max;
	return n;
}

Array.prototype.random_el = function () {
	return this[Math.floor(Math.random() * this.length)];
}

Array.prototype.shuffle = function () {
	for (let i = this.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const temp = this[i];
		this[i] = this[j];
		this[j] = temp;
	}
}
