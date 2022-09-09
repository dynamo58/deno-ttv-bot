import { CommandContext, CommandModule, CommandResult } from "../Command.ts";
import { query_wolframalpha } from "../apis/wolframalpha.ts";

const Wolfram: CommandModule = {
	sufficient_privilege: 0,

	async execute(ctx: CommandContext): Promise<CommandResult> {
		const kwargs = ctx.kwargs();

		let query_str: string | undefined;

		if (kwargs.get("query")) query_str = kwargs.get("query");
		else if (ctx.args.length > 0) query_str = ctx.args.join(" ");

		if (query_str === undefined) return {
			is_success: false,
			output: `Please provide an expression.`
		}

		const query = await query_wolframalpha(ctx.credentials, query_str);

		if (query.status != 200) return { is_success: false, output: "something went wrong (check your query). OK" }

		let output: string | undefined;
		if (query.data!.queryresult.pods && query.data!.queryresult.pods.length > 0) {
			const main_pods = query.data!.queryresult.pods.filter(p => p.primary);
			if (main_pods.length > 0)
				if (main_pods[0].subpods.length > 0)
					output = main_pods[0].subpods[0].plaintext
		}

		return {
			is_success: true,
			output: output ?? "no result found FeelsDankMan TeaTime",
		}
	},

	description(): string {
		return "Ask WolframAlpha something."
	},

	usage(cmd_prefix: string): string {
		return `${cmd_prefix}wolfram <expression> || ${cmd_prefix}wolfram query={...}`;
	}
}

export default Wolfram;