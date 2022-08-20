// hooks are used to perform an action upon a message in the chat

import { IrcMessage } from "https://deno.land/x/tmi@v1.0.5/mod.ts";

// 	i.e.: respond with a message
export default interface Hook {
	substring_criterion?: string,
	nickname_criterion?: string,
	callback: () => string | void,
}


export function validate_hook(h: Hook, ircmsg: IrcMessage): boolean {
	if (
		h.substring_criterion && ircmsg.message.toLowerCase().includes(h.substring_criterion) ||
		h.nickname_criterion && ircmsg.username === h.nickname_criterion.toLowerCase()
	) { return true; }

	return false;
}