import { CommandContext, CommandModule, CommandResult } from "../Command.ts";
import { DOMParser, Element } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

const UpcomingMatch: CommandModule = {
	sufficient_privilege: 0,

	async execute(ctx: CommandContext): Promise<CommandResult> {
		const r = await fetch(`https://int.soccerway.com/teams/england/luton-town-fc/712/`);

		try {
			const document = new DOMParser().parseFromString(await r.text(), "text/html")!;
			const matches = document.querySelectorAll(".match")!;
			const test = document.querySelector(".match")!;

			for (let i = 0; i < matches.length; i++) {
				const el = matches[i] as Element;
				if (el.querySelector(".result-loss")) continue;
				if (el.querySelector(".result-win")) continue;
				if (el.querySelector(".result-draw")) continue;

				const date = el.querySelector(".full-date")!.textContent;
				const time = el.querySelector(".score-time")!.children[0].textContent.trim().replaceAll(" ", "")
				const host_team = el.querySelector(".team-a")!.textContent;
				const guest_team = el.querySelector(".team-b")!.textContent;

				return { is_success: true, output: `LUTONFC ${host_team} vs ${guest_team} at ${date} ${time}.` }
			}

			return { is_success: false, output: `LUTONFC no match found.` }

		} catch (e) {
			console.log(e)
			return {
				is_success: false,
				output: "something went wrong, please try again later"
			}
		}
	},

	description(): string {
		return "Get a \"pong!\" response with the bot's uptime."
	},

	usage(cmd_prefix: string): string {
		return `${cmd_prefix}ping`;
	}
}

export default UpcomingMatch;