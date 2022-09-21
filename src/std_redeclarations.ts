declare global {
	interface Array<T> {
		random(): T;
		shuffle(): void;
		sum(): number,
	}

	enum Result {
		Success = 200,
		UserError = 400,
		ServerError = 500,
		ExternalServiceError = 503,
	}

	interface Math {
		clamp(n: number, min: number, max: number): number,
	}

	interface String {
		parse_to_date(): Date | null;
		split_at_every_char_to_map(c: string): Map<string, string>;
	}

	const EXTERNAL_API_FAIL_MESSAGE = "external services have failed, please try again later.";
	const UNKNOWN_ERROR_MESSAGE = "an unknown error has occured.";
	const USER_DOESNT_EXIST_MESSAGE = "that user doesn't exist.";
	const FEATURE_NOT_AVAILABLE_MESSAGE = "this feature is currently not available, sorry.";
	const CHANNEL_NOT_LIVE_MESSAGE = "channel is currently not live.";
	const MVB_PRIVILEGE_NOT_REACHED_MESSAGE = "you must be either least mod, broadcaster or a VIP to use this feature."
}

// example according to intended use:
// "15h16m1s"   =>  h -> 15, m -> 16, s -> 1
String.prototype.split_at_every_char_to_map = function (c: string): Map<string, string> {
	const out = new Map<string, string>();
	let idx = 0;
	const chars = c.split("");

	let curr_str = "";
	while (idx < this.length) {
		if (chars.includes(this[idx])) {
			out.set(this[idx], curr_str);
			curr_str = "";
			idx += 1;
			continue
		}

		curr_str += this[idx];
		idx += 1;
	}

	return out;
}

// null signifies bad input
String.prototype.parse_to_date = function (): Date | null {
	const base_date = new Date();
	const split = this.split_at_every_char_to_map("yMdhms");

	try {
		if (split.get("y")) { const count = parseInt(split.get("y")!); if (!count) throw ""; base_date.setFullYear(base_date.getFullYear() + parseInt(split.get("y")!)) }
		if (split.get("M")) { const count = parseInt(split.get("M")!); if (!count) throw ""; base_date.setMonth(base_date.getMonth() + parseInt(split.get("M")!)) }
		if (split.get("d")) { const count = parseInt(split.get("d")!); if (!count) throw ""; base_date.setDate(base_date.getDate() + parseInt(split.get("d")!)) }
		if (split.get("h")) { const count = parseInt(split.get("h")!); if (!count) throw ""; base_date.setHours(base_date.getHours() + parseInt(split.get("h")!)) }
		if (split.get("m")) { const count = parseInt(split.get("m")!); if (!count) throw ""; base_date.setMinutes(base_date.getMinutes() + parseInt(split.get("m")!)) }
		if (split.get("s")) { const count = parseInt(split.get("s")!); if (!count) throw ""; base_date.setSeconds(base_date.getSeconds() + parseInt(split.get("s")!)) }

		return base_date;
	} catch { return null }
}

Math.clamp = function (n: number, min: number, max: number): number {
	if (n < min) return min;
	if (n > max) return max;
	return n;
}

Array.prototype.random = function () {
	return this[Math.floor(Math.random() * this.length)];
}

Array.prototype.shuffle = function () {
	for (let i = this.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const temp = this[i];
		this[i] = this[j];
		this[j] = temp;
	}
}

Array<number>.prototype.sum = function () {
	let s = 0;
	this.forEach(e => s += e);
	return s;
}

const SECONDS_IN_YEAR = 31556952.0;
const SECONDS_IN_DAY = 86400.0;
const SECONDS_IN_HOUR = 3600.0;
const SECONDS_IN_MINUTE = 60.0;
export function format_duration(millis: number, long_format: boolean): string {
	const num_sec = millis / 1000;
	if (num_sec == 0.0) return "just now";

	const yrs = Math.floor(num_sec / SECONDS_IN_YEAR);
	const dys = Math.floor((num_sec - (yrs * SECONDS_IN_YEAR)) / SECONDS_IN_DAY);
	const hrs = Math.floor((num_sec - (yrs * SECONDS_IN_YEAR) - (dys * SECONDS_IN_DAY)) / SECONDS_IN_HOUR);
	const mns = Math.floor((num_sec - (yrs * SECONDS_IN_YEAR) - (dys * SECONDS_IN_DAY) - (hrs * SECONDS_IN_HOUR)) / SECONDS_IN_MINUTE);
	const scs = Math.floor(num_sec % 60);

	const SECONDS = long_format ? " seconds" : "s";
	const MINUTES = long_format ? " minutes" : "m";
	const HOURS = long_format ? " hours" : "h";
	const DAYS = long_format ? " days" : "d";
	const YEARS = long_format ? " years" : "y";
	let out = ""
	let out_len = 0;

	if (yrs > 0.0) {
		out += `${yrs}${YEARS}, `;
		out_len += 1;
	}

	if (dys > 0.0) {
		out += `${dys}${DAYS}, `;
		out_len += 1;
	}

	if ((hrs > 0.0) && (out_len <= 2)) {
		out += `${hrs}${HOURS}, `;
		out_len += 1;
	}

	if ((mns > 0.0) && (out_len <= 2)) {
		out += `${mns}${MINUTES}, `;
		out_len += 1;
	}

	if ((scs > 0) && (out_len <= 2)) {
		out += `${scs}${SECONDS}, `;
	}

	return out.slice(0, -2);
}
