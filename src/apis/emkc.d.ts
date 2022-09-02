interface GoodResponse {
	ran: boolean
	language: string
	version: string
	output: string
	stdout: string
	stderr: string
}

export type EmkcResponse = GoodResponse;