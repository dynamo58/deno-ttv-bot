import { CommandContext, CommandModule, CommandResult } from "../Command.ts";
import { get_weather_str } from "../apis/wttr_in.ts";

const Weather: CommandModule = {
	sufficient_privilege: 0,

	async execute(ctx: CommandContext): Promise<CommandResult> {
		const loc = ctx.kwargs().get("location");
		if (!loc)
			return new CommandResult(400, `no location provided`);
		const res = await get_weather_str(loc);
		if (res.status !== 200) return new CommandResult(500, UNKNOWN_ERROR_MESSAGE);
		const weather = res.data!;

		return new CommandResult(200, weather);
	},

	description(): string {
		return "Get a brief weather report of a certain area."
	},

	usage(cmd_prefix: string): string {
		return `${cmd_prefix}weather location={some place}`;
	}
}

export default Weather;