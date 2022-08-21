import { CommandContext, CommandModule, CommandResult } from "../Command.ts";
import * as twitch from "../apis/twitch.ts";

const Clip: CommandModule = {
	sufficient_privilege: 0,

	async execute(ctx: CommandContext): Promise<CommandResult> {
		const r = await twitch.create_clip(ctx.twitch_info, ctx.channel.id);

		console.log(r);
		return {
			is_success: true,
			output: `https://clips.twitch.tv/${r.data[0].id}`,
		}
	},

	description(): string {
		return "Create a clip"
	},

	usage(cmd_prefix: string): string {
		return `${cmd_prefix}clip`;
	}
}

export default Clip;