interface Url {
	size: string;
	url: string;
}

export interface SevenTvResponse {
	provider: number;
	code: string;
	urls: Url[];
}