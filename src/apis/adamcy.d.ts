interface Url {
	size: string;
	url: string;
}

export interface SevenTvEmote {
	provider: number;
	code: string;
	urls: Url[];
}