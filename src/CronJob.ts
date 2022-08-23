// used to run jobs periodically

interface ICronJobConstructor {
	channel_names?: string[],
	execute: () => string | void,
	// bounds of the interval in which the messages should be posted
	period: [number, number],
}

export default class CronJob {
	// if `channel_ids` is `undefined`, then that is interpreted as them being
	// ran for every channel
	channel_names: string[] | undefined;
	execute: () => string | void;
	period: [number, number];

	constructor({ channel_names, execute, period }: ICronJobConstructor) {
		this.channel_names = channel_names;
		this.execute = execute;
		if (period[0] < period[1])
			this.period = period;
		else
			this.period = [period[1], period[0]];
	}
}
