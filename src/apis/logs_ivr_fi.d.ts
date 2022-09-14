export type RandLogResponse = string;
export interface AllChannelsResponse {
	channels: Channel[]
}
interface Channel {
	userID: string,
	name: string
}

export type AvailableLogsResponse = string | AvailableLogs;
export interface AvailableLogs {
	availableLogs: AvailableLog[]
}

export interface AvailableLog {
	year: string
	month: string
}
