import { CommandContext, CommandModule, CommandResult } from "./Command.ts";
import { get_7tv_emotes } from "../apis/adamcy.ts";


const Ping: CommandModule = {
	async execute(ctx: CommandContext): Promise<CommandResult> {

		const emotes = await get_7tv_emotes(ctx.channel.nickname);

		const latest = emotes
			.slice(-7)
			.map(e => e.code);

		return {
			is_success: true,
			output: `Recently added 7tv emotes: ${latest.join(" ")}`,
		}
	},

	description(): string {
		return "Get the newest 7tv emotes added to the channel"
	},

	usage(cmd_prefix: string): string {
		return `${cmd_prefix}new7tv`;
	}
}

export default Ping;