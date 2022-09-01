export interface Role {
	id: string
	name: string
	position: number
	color: number
	allowed: number
	denied: number
}

export interface User {
	id: string
	twitch_id: string
	login: string
	display_name: string
	role: Role
	profile_picture_id: string
}


export interface WebSocketMessage {
	bubbles: boolean
	cancelable: boolean
	composed: boolean
	currentTarget: CurrentTarget
	defaultPrevented: boolean
	eventPhase: number
	// deno-lint-ignore no-explicit-any
	srcElement: null | any
	target: Target
	returnValue: boolean
	timeStamp: number
	type: string
	data: string
	lastEventId: string
}

export interface CurrentTarget {
	url: string
	readyState: number
	extensions: string
	protocol: string
	binaryType: string
	bufferedAmount: number
}

export interface Target {
	url: string
	readyState: number
	extensions: string
	protocol: string
	binaryType: string
	bufferedAmount: number
}
