import { CommandContext, CommandModule, CommandResult } from "../Command.ts";
import { DOMParser, Element } from "https://deno.land/x/deno_dom@v0.1.35-alpha/deno-dom-wasm.ts";

const UpcomingMatch: CommandModule = {
	sufficient_privilege: 0,

	async execute(_ctx: CommandContext): Promise<CommandResult> {
		try {
			const r = await fetch(`https://int.soccerway.com/teams/england/luton-town-fc/712/`);
			const document = new DOMParser().parseFromString(await r.text(), "text/html")!;
			const matches = document.querySelectorAll(".match")!;

			for (let i = 0; i < matches.length; i++) {
				const el = matches[i] as Element;
				if (el.querySelector(".result-loss")) continue;
				if (el.querySelector(".result-win")) continue;
				if (el.querySelector(".result-draw")) continue;

				const date = el.querySelector(".full-date")!.textContent;
				const time = el.querySelector(".score-time")!.children[0].textContent.trim().replaceAll(" ", "")
				const host_team = el.querySelector(".team-a")!.textContent;
				const guest_team = el.querySelector(".team-b")!.textContent;

				return new CommandResult(200, `LUTONFC ${host_team} vs ${guest_team} at ${date} ${time}.`);
			}

			return new CommandResult(503, `LUTONFC no match found.`);

		} catch { return new CommandResult(500, UNKNOWN_ERROR_MESSAGE) }
	},

	description(): string {
		return "Get the soonest Luton FC game"
	},

	usage(cmd_prefix: string): string {
		return `${cmd_prefix}lutonfc`;
	}
}

export default UpcomingMatch;