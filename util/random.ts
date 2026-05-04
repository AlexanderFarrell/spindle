
// Ridiculously basic Random number generator. We will
// expand this later for seeds... very likely.
export class Random {
	static next(min: number, max: number) {
		return (Math.random() * (max - min)) + min;
	}
}
