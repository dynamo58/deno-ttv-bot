interface ILog {
	log_file: string | undefined
}

export default class Log {
	private static log_file?: string;

	private static bold = "\x1b[1m";
	private static reset = "\x1b[0m";

	private static red = "\x1b[31m";
	private static green = "\x1b[32m";
	private static blue = "\x1b[34m";
	private static cyan = "\x1b[36m";
	private static orange = "\x1b[38;5;208m";

	static init({ log_file }: ILog) {
		this.log_file = log_file;
	}

	static success<T>(msg: T) {
		Deno.stdout.write(new TextEncoder().encode(`${this.bold}${this.green}[SUCCE]${this.reset} ${this.blue}${new Date().toISOString()}${this.reset} ${msg}\n`));
		if (this.log_file)
			Deno.writeTextFileSync(this.log_file, `[SUCCE] ${new Date().toISOString()} ${msg}`, { append: true });
	}

	static info<T>(msg: T) {
		Deno.stdout.write(new TextEncoder().encode(`${this.bold}${this.cyan}[INFO]${this.reset} ${this.blue}${new Date().toISOString()}${this.reset} ${msg}\n`));
		if (this.log_file)
			Deno.writeTextFileSync(this.log_file, `[INFO] ${new Date().toISOString()} ${msg}`, { append: true });
	}

	static warn<T>(msg: T) {
		Deno.stdout.write(new TextEncoder().encode(`${this.bold}${this.orange}[WARN]${this.reset} ${this.blue}${new Date().toISOString()}${this.reset} ${msg}\n`));
		if (this.log_file)
			Deno.writeTextFileSync(this.log_file, `[WARN] ${new Date().toISOString()} ${msg}`, { append: true });

	}

	static error<T>(msg: T) {
		Deno.stdout.write(new TextEncoder().encode(`${this.bold}${this.red}[ERRO]${this.reset} ${this.blue}${new Date().toISOString()}${this.reset} ${msg}\n`));
		if (this.log_file)
			Deno.writeTextFileSync(this.log_file, `[ERRO] ${new Date().toISOString()} ${msg}`, { append: true });

	}
}
