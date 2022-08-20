export interface HelixUsersData {
	id: string;
	login: string;
	display_name: string;
	type: string;
	broadcaster_type: string;
	description: string;
	profile_image_url: string;
	offline_image_url: string;
	view_count: number;
	email: string;
	created_at: Date;
}

export interface HelixUsers {
	data: HelixUsersData[];
}

export interface HelixChannelData {
	id: string;
	user_id: string;
	user_login: string;
	user_name: string;
	game_id: string;
	game_name: string;
	type: string;
	title: string;
	viewer_count: number;
	started_at: Date;
	language: string;
	thumbnail_url: string;
	tag_ids: string[];
	is_mature: boolean;
}

export interface Pagination {
	cursor: string;
}

export interface HelixChannel {
	data: HelixChannelData[];
	pagination: Pagination;
}

export interface TmiChatters {
	_links: Links
	chatter_count: number
	chatters: Chatters
}

// deno-lint-ignore no-empty-interface
export interface Links { }

export interface Chatters {
	broadcaster: string[]
	vips: string[]
	moderators: string[]
	staff: string[]
	admins: string[]
	global_mods: string[]
	viewers: string[]
}

