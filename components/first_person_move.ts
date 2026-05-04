import { quat, vec3 } from "gl-matrix";
import { Component } from "../world/entity";
import type { Updatable } from "../world/world";
import { Engine } from "../main";
import { Location } from "./location";
import { PhysicsBody } from "./physics_body";
import type RAPIER from "@dimforge/rapier3d-compat";


export class FirstPersonMove extends Component implements Updatable {
	// How fast the character can move per second
	public movementSpeed = 4;

	// How many degrees to move per mouse pixel left and right
	public yawSensitivity = 0.5;

	// How many degrees to move per mouse pixel up and down
	// I generally find pitch more sensitive to be nice.
	public pitchSensitivity = 1.0;

	// How quickly should the smoothing complete? 0.5 completes in 2
	// frames. 0.25 in 4. The smaller this number is, the longer 
	// it takes for the yaw or pitch to smooth out. This is necessary
	// on browsers for smoothness, because browsers do integer deltas
	// as of 2026.
	public smoothRotation = 0.4;

	// Initial meters per second moving up when pressing space.
	public jumpSpeed: number = 8.0;

	// From the center, how much higher is the camera. Note that 
	// for a human, the eyes are almost near the top on the head.
	// Thus this lifts the camera to the eye height from the center.
	public eyeHeight: number = 1.0;

	// Terminal velocity, highest fall speed one can go. In real life,
	// this is smaller if the surface area is higher. Think of a parachute,
	// it hits more air molecules as it falls, thus slowing the speed down.
	// Also important to we don't fall through the terrain.
	public maxFallSpeed: number = -20.0;

	// How steep of a hill can a player walk up (in degrees). 90 would be 
	// straight up, completely vertical, 0 is flat.
	public maxSlopeClimbAngle: number = 50.0;

	// The angle of a hill when the player starts sliding down
	public minSlopeSlideAngle: number = 55.0;

	// Whether we should push other objects when moving. 
	// Setting to false is a massive optimization,
	public pushThings: boolean = false;

	private _movement: vec3 = vec3.create();
	private _yaw: number = 180.0;
	private _pitch: number = 0.0;
	private _targetYaw: number = 180.0;
	private _targetPitch: number = 0.0;
	private _location: Location | null = null;
	private _physicsBody: PhysicsBody | null = null;
	private _verticalSpeed: number = 0;
	private _controller: RAPIER.KinematicCharacterController | null = null;

	onStart(): void {
		Engine.world.updatables.add(this);

		// Components which this depends on.
		this._location = this.entity!.lazyGet(Location, () => new Location());
		this._physicsBody = this.entity!.lazyGet(PhysicsBody, () => new PhysicsBody(
			{kind: 'capsule', halfHeight: 1, radius: 0.3},
			'kinematicPosition'
		))

		// Setup physics character controller. This can walk on surfaces, checking its
		// slope. Good for players and NPCs
		this._controller = Engine.physics.world.createCharacterController(0.05);
		this._controller.setSlideEnabled(true);
		this._controller.setMaxSlopeClimbAngle(this.maxSlopeClimbAngle * Math.PI / 180);
		this._controller.setMinSlopeSlideAngle(this.minSlopeSlideAngle * Math.PI / 180);
		this._controller.setUp({ x: 0, y: 1, z: 0 });

		// 
		this._controller.setApplyImpulsesToDynamicBodies(false);		

		Engine.input.lockMouse();
	}

	onEnd(): void {
		Engine.world.updatables.delete(this);
		if (this._controller) {
			Engine.physics.world.removeCharacterController(this._controller);
			this._controller = null;
		}
		Engine.input.unlockMouse();
	}

	onUpdate(): void {
		this._movement[0] =
			(Engine.input.isDown('d') ?  1.0 : 0.0) + // Strafe right
			(Engine.input.isDown('a') ? -1.0 : 0.0);  // Strafe left
		this._movement[1] = 0.0;
		this._movement[2] =
			(Engine.input.isDown('w') ? -1.0 : 0.0) + // Move forward
			(Engine.input.isDown('s') ?  1.0 : 0.0);  // Move Backward

		this._targetYaw -= Engine.input.mouseDeltaX * this.yawSensitivity * Engine.time.GameSpeed;
		this._targetPitch -= Engine.input.mouseDeltaY * this.pitchSensitivity * Engine.time.GameSpeed;

		const maxPitch = 89.0;
		this._targetPitch = Math.max(
			-maxPitch,
			Math.min(maxPitch, this._targetPitch)
		);


		this._yaw += (this._targetYaw - this._yaw) * this.smoothRotation;
		this._pitch += (this._targetPitch - this._pitch) * this.smoothRotation;

		const euler = quat.create();
		quat.fromEuler(euler, 0.0, this._yaw, 0.0);
		vec3.transformQuat(
			this._movement,
			this._movement,
			euler
		);
		vec3.scale(this._movement, this._movement, this.movementSpeed * Engine.time.Delta);

		const pos = this._location!.position;
		const collider = Engine.physics.getColliderForBody(this._physicsBody!.rigidbodyHandle)!;

		// Figure out if we are on the ground. Cast a ray to where we will be next
		// frame below us, with some padding.
		const verticalCheck = {x: 0, y: this._verticalSpeed * Engine.time.Delta - 0.01, z: 0};
		this._controller!.computeColliderMovement(collider, verticalCheck, undefined, undefined, (c) => c.handle !== collider.handle);
		const grounded = this._controller!.computedGrounded();

		if (grounded) {
			this._verticalSpeed = 0;

			// Since we are on the ground... check if space is
			// down, and jump
			if (Engine.input.isDown(' ')) {
				this._verticalSpeed = this.jumpSpeed;
			}
		} else {
			// Otherwise, if we are in the air, fall
			this._verticalSpeed += Engine.physics.gravity[1] * Engine.time.Delta;

			// And ensure we don't go over terminal velocity.
			this._verticalSpeed = Math.max(this._verticalSpeed, this.maxFallSpeed);
		}

		// Where are we going? We will give this to Rapier3D to see if its a valid position
		const desiredMovement = {
			x: this._movement[0],
			y: this._verticalSpeed * Engine.time.Delta,
			z: this._movement[2],
		};

		// Give the movement to the physics engine. So if we run into
		// something, the physics engine will move it, and we can
		// get the corrected movement.
		this._controller!.computeColliderMovement(collider, desiredMovement,
			undefined, undefined, (c) => c.handle !== collider.handle
		);

		const corrected = this._controller!.computedMovement();

		// Apply the physics-corrected movement so _location stays in sync
		// with where the rigidbody actually ends up (no clipping through terrain).
		pos[0] += corrected.x;
		pos[1] += corrected.y;
		pos[2] += corrected.z;

		this._physicsBody!.setNextKinematicTranslation([pos[0], pos[1], pos[2]]);

		vec3.set(Engine.visual.camera.location.position,
			pos[0],
			pos[1] + this.eyeHeight,
			pos[2]
		);
		
		quat.fromEuler(this._location!.rotation, this._pitch, this._yaw, 0.0);
		quat.fromEuler(Engine.visual.camera.location.rotation, this._pitch, this._yaw, 0.0);
	}
}