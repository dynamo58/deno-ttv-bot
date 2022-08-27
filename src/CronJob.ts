export interface ICronJobConstructor {
	channel_names?: string[],
	execute: () => string | void | Promise<void> | Promise<string>,
	// bounds of the interval in which the messages should be posted
	period: [number, number],
	requires_live?: boolean,
}

// used to run jobs periodically
export default class CronJob {
	// if `channel_ids` is `undefined`, then that is interpreted as them being
	// ran for every channel
	channel_names: string[] | undefined;
	execute: () => string | void | Promise<void> | Promise<string>;
	period: [number, number];
	requires_live: boolean;

	constructor({ channel_names, execute, period, requires_live }: ICronJobConstructor) {
		this.channel_names = channel_names;
		this.execute = execute;
		this.requires_live = requires_live ? requires_live! : false;
		if (period[0] < period[1]) this.period = period;
		else this.period = [period[1], period[0]];
	}
}
