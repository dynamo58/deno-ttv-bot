declare global {
	interface Array<T> {
		random_el(): T;
		shuffle(): void;
	}

	interface Math {
		clamp(n: number, min: number, max: number): number,
	}
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