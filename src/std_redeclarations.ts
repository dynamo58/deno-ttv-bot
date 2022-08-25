declare global {
	interface Array<T> {
		random_el(): T;
		shuffle(): void;
	}

	interface Math {
		clamp(n: number, min: number, max: number): number,
	}

	function format_duration(millis: number, long_format: boolean): string;
}

Math.clamp = function (n: number, min: number, max: number): number {
	if (n < min) return min;
	if (n > max) return max;
	return n;
}

Array.prototype.random_el = function () {
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

const SECONDS_IN_YEAR = 31556952.0;
const SECONDS_IN_DAY = 86400.0;
const SECONDS_IN_HOUR = 3600.0;
const SECONDS_IN_MINUTE = 60.0;
export function format_duration(millis: number, long_format: boolean): string {
	const num_sec = millis / 1000;
	if (num_sec == 0.0) {
		return "just now";
	}

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
