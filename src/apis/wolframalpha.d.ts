export interface WolframAlphaResponse {
	queryresult: Queryresult
}

export interface Queryresult {
	success: boolean
	error: boolean
	numpods: number
	datatypes: string
	timedout: string
	timedoutpods: string
	timing: number
	parsetiming: number
	parsetimedout: boolean
	recalculate: string
	id: string
	host: string
	server: string
	related: string
	version: string
	inputstring: string
	pods: Pod[]
	assumptions: Assumptions
}

export interface Pod {
	title: string
	scanner: string
	id: string
	position: number
	error: boolean
	numsubpods: number
	subpods: Subpod[]
	expressiontypes: any
	primary?: boolean
	states?: State[]
	infos: any
}

export interface Subpod {
	title: string
	img: Img
	plaintext: string
}

export interface Img {
	src: string
	alt: string
	title: string
	width: number
	height: number
	type: string
	themes: string
	colorinvertable: boolean
	contenttype: string
}

export interface State {
	name: string
	input: string
}

export interface Assumptions {
	type: string
	word: string
	template: string
	count: number
	values: Value[]
}

export interface Value {
	name: string
	desc: string
	input: string
}
