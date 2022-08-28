import { CommandContext, CommandModule, CommandResult } from "../Command.ts";
import * as twitch from "../apis/twitch.ts";
import { format_duration } from "../std_redeclarations.ts";

const Uptime: CommandModule = {
	sufficient_privilege: 0,

	async execute(ctx: CommandContext): Promise<CommandResult> {
		if (ctx.channel.uptime_stats) {
			const uptime_hrs =
				format_duration((new Date()).valueOf() - (ctx.channel.uptime_stats!.startup_time).valueOf(), false);
			return {
				is_success: true,
				output: `@${ctx.caller} ${ctx.channel} has been live for ${uptime_hrs}.`,
			}
		}

		const res = await twitch.get_channel(ctx.twitch_info, ctx.channel.nickname);
		if (res.status !== 200) return { is_success: false, output: `@${ctx.caller} something messed up ApuApustaja TeaTime` }
		const channel_info = res.data!;

		if (channel_info.data.length === 0)
			return {
				is_success: false,
				output: `${ctx.caller.nickname}, ${ctx.channel.nickname} is not live.`
			};

		const uptime_hrs = format_duration((new Date()).valueOf() - (new Date(channel_info.data[0].started_at)).valueOf(), false);
		return {
			is_success: true,
			output: `@${ctx.caller.nickname} ${ctx.channel} has been live for ${uptime_hrs}.`,
		}
	},

	description(): string {
		return "Get the time a streamer has been live."
	},

	usage(cmd_prefix: string): string {
		return `${cmd_prefix}uptime`;
	}
}

export default Uptime;