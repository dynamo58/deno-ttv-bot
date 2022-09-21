import { CommandContext, CommandModule, CommandResult } from "../Command.ts";
import * as twitch from "../apis/twitch.ts";

const Clip: CommandModule = {
	sufficient_privilege: 0,

	async execute(ctx: CommandContext): Promise<CommandResult> {
		const r = await twitch.create_clip(ctx.credentials, ctx.channel.id);
		// should really be just 500 or 200
		if (r.status !== 200) return new CommandResult(500, EXTERNAL_API_FAIL_MESSAGE);
		const data = r.data!;

		return new CommandResult(200, `https://clips.twitch.tv/${data.data[0].id}`);
	},

	description(): string {
		return "Create a clip"
	},

	usage(cmd_prefix: string): string {
		return `${cmd_prefix}clip`;
	}
}

export default Clip;