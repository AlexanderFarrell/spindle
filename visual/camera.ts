import { mat4, vec3 } from "gl-matrix";
import { Location } from "../components/location";
import type { Drawable } from "./visual";

// Allows us to define an "eye" in the 3D world.
// It's goal is to position objects correctly on 
// our screen.
export abstract class Camera implements Drawable {
	// To find the camera position of objects, we use 2 major
	// stages:
	// 
	// 1. ViewMatrix - Moves objects as if the camera was the 
	//                center of the universe. 
	// 2. ProjectionMatrix - Distorts objects as if the camera
	//                had a lens. For example, "perspective" makes
	//                things smaller as they are further away. 

	// Moves objects as if the camera was the center of the universe.
	private _viewMatrix: mat4;

	// Gives the camera a "lens", such as perspective.
	protected _projectionMatrix: mat4;

	// Represents the position & rotation of the camera. Scale is ignored.
	public location: Location;

	// Combines the View & Projection Matrices into one matrix for
	// efficient operation
	private _matrix: mat4;

	// These 3 here help the refreshView() function, just so we don't
	// allocate new memory each frame.

	private _target: vec3 = [0, 0, 0];
	private _forward: vec3 = [0, 0, 1];
	private _up: vec3 = [0, 1, 0];

	protected constructor() {
		this._viewMatrix = mat4.create();
		this._projectionMatrix = mat4.create();
		this._matrix = mat4.create();
		this.location = new Location();
	}

	setup(): void {}
	breakdown(): void {}

	draw(): void {
		this.refreshView();
		this.refreshProjection();
		mat4.mul(this._matrix, this._projectionMatrix, this._viewMatrix);
	}

	abstract refreshProjection(): void;

	private refreshView() {
		// Used to figure out where the camera should look at.
		this._forward[0] = 0;
		this._forward[1] = 0;
		this._forward[2] = -1;

		// Rotates this vector depending on where the camera is facing.
		vec3.transformQuat(this._forward, this._forward, this.location.rotation);
		// Moves this direction relative to where the camera is.
		vec3.add(this._target, this.location.position, this._forward);

		// Calculates the view matrix via a "look at" algorithm. This takes in
		// where the camera should be located, what point it should be facing 
		// (_target) and what point is "up" in its world (_up). Then it outputs
		// this to the _viewMatrix memory.
		mat4.lookAt(this._viewMatrix, this.location.position, this._target, this._up);
	}

	public get matrix() {
		return this._matrix;
	}
}

// A type of projection called "perspective" where objects are smaller
// if they are further away. It's job is to simulate this "perspective"
// on a computer monitor, so many of its fields are properties about the
// monitor/view.
export class PerspectiveCamera extends Camera {
	// Width / height in pixels of the monitor/canvas.
	public aspectRatio: number;

	// The "Field of View", meaning how many degrees left and right
	// can you see. This needs to be slightly around half the human eye
	// because humans have 2 eyes, expanding their fov. Some animals with
	// eyes more spread out like deer have a larger fov, whereas cats have
	// a smaller fov because their eyes are closer
	//
	// Normally humans are seated away from the monitor, so fov should be 
	// about half or less. 80-100 degrees is probably good normally, but you 
	// can play around with this. Higher field of view is used by pro gamers
	// because they can see more things... but it also can make people motion
	// sick. Increasing the fov makes it seem like you're more zoomed out and
	// decreasing it makes it feel like your honing in on something.
	public fov: number;

	// The closest distance something is drawn. This sounds silly, why not just
	// draw things right in front of me? Well... it has to do with the depth 
	// algorithm. Larger numbers here, like 1, allow the depth algorithm to be
	// more accurate, whereas smaller numbers make it more difficult. I generally
	// like 0.5 to 1.0. It's actually nice generally to let players not have some
	// object in their face.
	public nearPlane: number = 1.0;

	// The furthest distance by which objects are visible. If you increase this, you
	// may need to increase the nearPlane as well.
	public farPlane: number = 200.0;

	public constructor(aspectRatio: number, fov: number = 85.0) {
		super();
		this.aspectRatio = aspectRatio;
		this.fov = fov;
	}

	refreshProjection(): void {
		// Creates a matrix which can take objects which are further away,
		// and make them appear as if they are smaller.
		mat4.perspective(
			this._projectionMatrix,
			this.fov * (Math.PI / 180),
			this.aspectRatio,
			this.nearPlane,
			this.farPlane
		);
	}
}
