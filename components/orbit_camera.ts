import { quat, vec3 } from "gl-matrix";
import { Component } from "../world/entity";
import type { Updatable } from "../world/world";
import { Engine } from "../main";


export class OrbitCamera extends Component implements Updatable {
	public distance: number = 20.0;
	public lift: number = 4.0;
	public speed: number = 4.0;
	public rotation: number = 0;
	public focalPoint: vec3;

	private _relativePosition: vec3 = vec3.create();
	private _rot: quat = quat.create();

	public constructor(focalPoint: vec3) {
		super();
		this.focalPoint = focalPoint;
	}

	onStart(): void {
		Engine.world.updatables.add(this);
	}

	onEnd(): void {
		Engine.world.updatables.delete(this);
	}

	onUpdate(): void {
		this.positionCamera();
		this.rotation += this.speed * Engine.time.Delta;
	}	

	private positionCamera() {
		// First calculate distance
		this._relativePosition[0] = 0;
		this._relativePosition[1] = this.lift;
		this._relativePosition[2] = this.distance;

		// Next, calculate rotation
		quat.fromEuler(this._rot, 0, this.rotation, 0);

		// Apply this rotation to the relative
		vec3.transformQuat(
			this._relativePosition,
			this._relativePosition,
			this._rot
		);

		// Add to camera
		vec3.add(
			Engine.visual.camera.location.position,
			this._relativePosition,
			this.focalPoint
		);

		quat.fromEuler(
			Engine.visual.camera.location.rotation,
			-Math.atan2(this.lift, this.distance) * (180 / Math.PI),
			this.rotation,
			0
		);
	}
}