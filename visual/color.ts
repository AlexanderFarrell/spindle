import type { vec3 } from "gl-matrix";

// Defines a color out of RGBA values
export class Color {

	// How much of each color. Values range between 0 to 1.
	public red: number;
	public green: number;
	public blue: number;

	// How visible something is. 0 = invisible, 0.5 = half transparent, 1 = fully solidly visible
	public alpha: number;

	// Makes a new color, alpha defaults to fully opaque
	constructor(red: number, green: number, blue: number, alpha: number = 1.0) {
		this.red = red;
		this.green = green;
		this.blue = blue;
		this.alpha = alpha;
	}

	// Gets a vec3 of the colors, helpful.
	public get vec3(): vec3 {
		return [this.red, this.green, this.blue]
	}

	// Feel free to add as many as you like/need
	static readonly blue = new Color(0, 0, 1);
}
