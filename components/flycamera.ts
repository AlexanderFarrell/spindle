import { quat, vec3 } from "gl-matrix";
import { Engine } from "../main";
import { Component } from "../world/entity";
import type { Updatable } from "../world/world";


// Takes control of the camera, and let's us fly with 
// WASD, GH (up and down), and QE (turn left and turn right)
export class FlyCamera extends Component implements Updatable {
	public movementSpeed = 4/60.0;
	private _movement: vec3 = vec3.create();

	onStart(): void {
		Engine.world.updatables.add(this);
	}

	onEnd(): void {
		Engine.world.updatables.delete(this);
	}

	onUpdate(): void {
		this._movement[0] =
			(Engine.input.isDown('d') ?  1.0 : 0.0) + // Strafe right
			(Engine.input.isDown('a') ? -1.0 : 0.0);  // Strafe left
		this._movement[1] =
			(Engine.input.isDown('g') ?  1.0 : 0.0) + // Move Up
			(Engine.input.isDown('h') ? -1.0 : 0.0);  // Move Down
		this._movement[2] =
			(Engine.input.isDown('w') ? -1.0 : 0.0) + // Move Forward
			(Engine.input.isDown('s') ?  1.0 : 0.0);  // Move Backward

		// Multiply by the speed we should go
		vec3.scale(this._movement, this._movement, this.movementSpeed);

		// Have the movement go in the direction of the camera
		vec3.transformQuat(
			this._movement,
			this._movement,
			Engine.visual.camera.location.rotation
		);
		vec3.add(
			Engine.visual.camera.location.position,
			Engine.visual.camera.location.position,
			this._movement
		);

		const rot = Engine.visual.camera.location.rotation;
		const euler = quat.create();

		if (Engine.input.isDown('q')) {
			quat.fromEuler(euler, 0.0, 20.0 * this.movementSpeed, 0.0);
			quat.mul(rot, rot, euler);
		}
		if (Engine.input.isDown('e')) {
			quat.fromEuler(euler, 0.0, -20.0 * this.movementSpeed, 0.0);
			quat.mul(rot, rot, euler);
		}
	}
}
