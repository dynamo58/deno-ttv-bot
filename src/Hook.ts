import { IrcMessage } from "https://deno.land/x/tmi@v1.0.5/mod.ts";

// hooks are used to perform an action upon a message in the chat
// 	i.e.: respond with a message
export default interface Hook {
	substring_criterion?: string,
	nickname_criterion?: string,
	callback: () => string | void,
}


export function validate_hook(h: Hook, ircmsg: IrcMessage): boolean {
	if (h.substring_criterion && ircmsg.message.toLowerCase().includes(h.substring_criterion)) {
		if (h.nickname_criterion)
			if (ircmsg.username === h.nickname_criterion)
				return true;
			else
				return false;
		return true;
	}

	if (h.nickname_criterion && ircmsg.username === h.nickname_criterion) {
		if (h.substring_criterion)
			if (ircmsg.message.toLowerCase().includes(h.substring_criterion))
				return true;
			else
				return false;
		return true;
	}

	return false;
}