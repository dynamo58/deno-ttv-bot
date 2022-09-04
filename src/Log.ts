export default class Log {
	private static bold = "\x1b[1m";
	private static reset = "\x1b[0m";

	private static red = "\x1b[31m";
	private static green = "\x1b[32m";
	private static blue = "\x1b[34m";
	private static cyan = "\x1b[36m";
	private static orange = "\x1b[38;5;208m";

	static success<T>(msg: T) {
		Deno.stdout.write(new TextEncoder().encode(`${this.bold}${this.green}[ SUCC]${this.reset} ${this.blue}${new Date().toISOString()}${this.reset} ${msg}\n`));
	}

	static info<T>(msg: T) {
		Deno.stdout.write(new TextEncoder().encode(`${this.bold}${this.cyan}[ INFO]${this.reset} ${this.blue}${new Date().toISOString()}${this.reset} ${msg}\n`));
	}

	static warn<T>(msg: T) {
		Deno.stdout.write(new TextEncoder().encode(`${this.bold}${this.orange}[ WARN]${this.reset} ${this.blue}${new Date().toISOString()}${this.reset} ${msg}\n`));
	}

	static error<T>(msg: T) {
		Deno.stdout.write(new TextEncoder().encode(`${this.bold}${this.red}[ERROR]${this.reset} ${this.blue}${new Date().toISOString()}${this.reset} ${msg}\n`));
	}
}
