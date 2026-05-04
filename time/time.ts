export class Time {
	private _lastTime: number = 0;
	private _delta = 0.0;
	public paused: boolean = false;

	public onStartUpdate(timestamp: number = 0) {
		if (this.paused) {
			this._delta = 0;
		} else {
			this._delta = Math.min((timestamp - this._lastTime) / 1000, 1.0);
		}
		this._lastTime = timestamp;
	}

	public get Delta(): number {
		return this._delta;
	}

	public get GameSpeed(): number {
		return (this.paused) ? 0 : 1;
	}
}