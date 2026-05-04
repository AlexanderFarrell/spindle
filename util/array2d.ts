// Stores a 2D grid backed by a 1D array.
// A 3x3 grid is laid out as indices 0–8, where y skips by width and x moves by 1.
//
// So for example:
//   0 1 2
//   3 4 5
//   6 7 8
//
// Is really just laid out like: 0 1 2 3 4 5 6 7 8
//
// But using (y * width) + x, we can treat it like its 2 dimensional.
export class Array2D<T> {
	private _data: T[] = [];
	private _width: number;
	private _height: number;

	public constructor(width: number, height: number, start: () => T) {
		this._width = width;
		this._height = height;
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				this._data.push(start());
			}
		}
	}

	public set(t: T, x: number, y: number) {
		this._data[(y * this._width) + x] = t;
	}

	public get(x: number, y: number): T | undefined {
		return this._data[(y * this._width) + x];
	}

	public get width() {
		return this._width;
	}

	public get height() {
		return this._height;
	}

	// Gets a point on this 2d array. If in between points, 
	// it will get the value between then based on how close
	// it is to each, in linear fashion. 
	public bilinear_interpolation(x: number, y: number) {
		const x0 = Math.floor(x);
		const y0 = Math.floor(y);
		const x1 = x0 + 1;
		const y1 = y0 + 1;
		const amoX = x - x0;
		const amoY = y - y0;

		const x0y0 = (this.get(x0, y0) as number) ?? 0;
		const x1y0 = (this.get(x1, y0) as number) ?? 0;
		const x0y1 = (this.get(x0, y1) as number) ?? 0;
		const x1y1 = (this.get(x1, y1) as number) ?? 0;

		const xLow = lerp(x0y0, x0y1, amoY);
		const xHigh = lerp(x1y0, x1y1, amoY);
		return lerp(xLow, xHigh, amoX);
	}
}

export function getData(array: Array2D<number>): Float32Array {
	const data = new Float32Array(array.width * array.height);
	for (let x = 0; x < array.width; x++) {
		for (let y = 0; y < array.height; y++) {
			data[x * array.height + y] = array.get(x, y)!;
		}
	}
	return data;
}

// Gets a value between two numbers, of a certain percent there (amo)
function lerp(a: number, b: number, amo: number) {
	return ((b - a) * amo) + a;
}
