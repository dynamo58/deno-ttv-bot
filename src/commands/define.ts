import { CommandContext, CommandModule, CommandResult } from "../Command.ts";

export type Res = Root2[]

export interface Root2 {
	word: string
	phonetic: string
	phonetics: Phonetic[]
	meanings: Meaning[]
	license: License2
	sourceUrls: string[]
}

export interface Phonetic {
	text: string
	audio: string
	sourceUrl?: string
	license?: License
}

export interface License {
	name: string
	url: string
}

export interface Meaning {
	partOfSpeech: string
	definitions: Definition[]
	synonyms: string[]
	antonyms: any[]
}

export interface Definition {
	definition: string
	synonyms: any[]
	antonyms: any[]
}

export interface License2 {
	name: string
	url: string
}


const Ping: CommandModule = {
	sufficient_privilege: 0,

	async execute(ctx: CommandContext): Promise<CommandResult> {
		let word: string | undefined;
		const kwargs = ctx.kwargs();
		if (kwargs.get("word")) word = kwargs.get("word")!;
		else if (ctx.args.length > 0) word = ctx.args[0];

		if (!word) return {
			is_success: false,
			output: `please provide a word!`
		}

		try {
			const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en_US/${word}`);
			const json = (await res.json()) as Res;

			if (json.length === 0) return {
				is_success: false,
				output: `Word not found or recognized`
			}

			const phonetic = json[0].phonetics.at(0)?.text ?? "";
			const category = json[0].meanings[0].partOfSpeech;
			const definition = json[0].meanings[0].definitions[0].definition;

			return {
				is_success: true,
				output: `${word} ${phonetic} (${category}) - ${definition}`
			}
		} catch {
			return {
				is_success: false,
				output: `something bricked itself, please try again later.`
			}
		}
	},

	description(): string {
		return "Get the definition and phonetics of a specified word"
	},

	usage(cmd_prefix: string): string {
		return `${cmd_prefix}define <word> or ${cmd_prefix}define word={something}`;
	}
}

export default Ping;