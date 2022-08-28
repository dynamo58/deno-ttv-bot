export enum APICallStatus {
	Successfull = 200,
	UserError = 400,
	APIError = 500,
}

export class APICallResult<T> {
	status: APICallStatus;
	// undefined if status !== 200
	data?: T;

	constructor(s: APICallStatus, d?: T) {
		this.status = s;
		this.data = d
	}

	// tread carefully
	unwrap(): T {
		if (this.status !== 200) throw new Error("unwrapped error lol");
		return this.data!;
	}
}
