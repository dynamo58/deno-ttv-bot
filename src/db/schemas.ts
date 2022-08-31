export interface StreamStats {
	channel_id: number,
	channel_name: string,
	messages_sent: number,
	games_played: string[],
	duration_hours: number,
	startup_time: Date,
}
