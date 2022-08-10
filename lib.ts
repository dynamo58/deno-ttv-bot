import { TwitchChat, Channel } from "https://deno.land/x/tmi/mod.ts";
import * as twitch from "./twitch/twitch.ts";
import { CommandContext, CommandModule, ircmsg_is_command_fmt } from "./commands/Command.ts";

export interface TwitchUserBasicInfo {
	nickname: string,
	id: number,
}

export interface TwitchChannel {
	login: string,
	id: number,
	client?: Channel,
}

export interface TwitchInfo {
	login: string,
	oauth: string,
	client_id: string,
}

export interface IConfig {
	twitch_info: TwitchInfo,
	client: TwitchChat,
	channels: TwitchChannel[],
	cmd_prefix: string;
	add_channel(channel: string): void,
	join_channels(channels: string[]): void,
}

export class Config implements IConfig {
	client: TwitchChat;
	channels: TwitchChannel[];
	twitch_info: TwitchInfo;
	cmd_prefix: string;

	constructor(twitch_login: string, twitch_oauth: string, twitch_client_id: string, cmd_prefix: string) {
		this.cmd_prefix = cmd_prefix;
		this.client = new TwitchChat(twitch_oauth, twitch_login);
		this.channels = [];
		this.twitch_info = {
			login: twitch_login,
			oauth: twitch_oauth,
			client_id: twitch_client_id,
		}
	}

	async add_channel(channel: string) {
		const channel_id = await twitch.id_from_nick(this.twitch_info, channel)
		this.channels.push({ login: channel, id: channel_id });
	}

	async join_channels(channels: string[]) {
		for (const c of channels)
			await this.add_channel(c);
	}

	async listen_channel(c: Channel) {
		for await (const ircmsg of c) {
			switch (ircmsg.command) {
				case "PRIVMSG":
					if (ircmsg_is_command_fmt(ircmsg, this.cmd_prefix)) {
						const ctx = new CommandContext(ircmsg, this);
						const cmd = await import(ctx.cmd.toString()) as CommandModule;
						const res = cmd.execute(ctx);
						if (res.is_success) {
							c.send(res.output || "cmd succeded")
						} else {
							c.send("cmd failed")
						}
						console.log(`Ran ${ctx.cmd.toString()} in ${ircmsg.channel} by ${ircmsg.username}`);
					}
			}
		}
	}

	async run() {
		Deno.env.set("startup_time", (new Date()).getTime().toString())
		await this.client.connect();

		this.channels.map(c => {
			const channel_client = this.client.joinChannel(c.login);
			this.listen_channel(channel_client);
			console.log(`Joined channel ${c.login}`);

			return {
				...c,
				client: channel_client
			}
		});
	}
}

declare global {
	interface Array<T> {
		random_el(): T;
	}
}

Array.prototype.random_el = function () {
	return this[Math.floor(Math.random() * this.length)];
}
