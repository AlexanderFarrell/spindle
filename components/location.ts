import { mat4, quat, vec3 } from "gl-matrix";
import { Component } from "../world/entity";

// In 3D the most common way to represent orientation is through:
//  - Position
//  - Rotation
//  - Scale
//
// We call these transforms. There's many more actually... but these
// 3 get us very far. 
export class Location extends Component {
	public position: vec3;
	public rotation: quat;
	public scale: vec3;

	private _matrix: mat4;

	public constructor(
		position: vec3 = [0, 0, 0],
		rotation: quat = quat.create(),
		scale: vec3 = [1, 1, 1],
	) {
		super();
		this.position = position;
		this.rotation = rotation;
		this.scale = scale;
		this._matrix = mat4.identity(mat4.create());
	}

	public get matrix() {
		return this._matrix;
	}

	public refresh() {
		mat4.identity(this._matrix);
		mat4.fromRotationTranslationScale(this._matrix, this.rotation, this.position, this.scale);
	}

	// Helper to get the horizontal coordinate. +X is right. -X is left.
	public get X() {
		return this.position[0];
	}

	// Helper to get the vertical coordinate. +Y is up, -Z is down.
	public get Y() {
		return this.position[1];
	}

	// Helper to get the forward coordinate. -Z is forward, +Z is backward
	public get Z() {
		return this.position[2];
	}

	public set X(x: number) {
		this.position[0] = x;
	}

	public set Y(y: number) {
		this.position[1] = y
	}

	public set Z(z: number) {
		this.position[2] = z;
	}
}
