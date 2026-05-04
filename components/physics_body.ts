import RAPIER from "@dimforge/rapier3d-compat";
import { Component } from "../world/entity";
import { Physics, type BodyType, type IDynamicBody } from "../physics/physics";
import { Location } from "./location";
import { Engine } from "../main";
import { vec3 } from "gl-matrix";

// Generic solid object which has a specific shape
// for physics. Makes it easy to just add some kind
// of physics to an entity.
export class PhysicsBody extends Component implements IDynamicBody {
	// Is it a box, sphere, cylinder...?
	public readonly shape: PhysicsShape;

	// How does the physics sim use it? 
	public readonly bodyType: BodyType;

	// Handle to the rigidbody if initialized.
	private _rapierHandle: RAPIER.RigidBodyHandle | null = null;

	// Store our location on the entity for reference.
	private _location: Location | null = null;

	public constructor(shape: PhysicsShape, bodyType: BodyType = 'dynamic') {
		super();
		this.shape = shape;
		this.bodyType = bodyType;
	}

	onStart(): void {
		this._location = this.entity!.lazyGet(Location, () => new Location());

		// Init Physics

		// The parameters to make a new rigidbody
		let descriptor: RAPIER.RigidBodyDesc
		switch (this.bodyType) {
			case 'dynamic':
				descriptor = RAPIER.RigidBodyDesc.dynamic();
				break;
			case 'static':
				descriptor = RAPIER.RigidBodyDesc.fixed();
				break;
			case 'kinematicPosition':
				descriptor = RAPIER.RigidBodyDesc.kinematicPositionBased();
				break;
			default:
				throw new Error("Unsupported body type " + this.bodyType)
		}
		descriptor.setTranslation(
			this._location.X,
			this._location.Y,
			this._location.Z
		);

		// Actually make the rigidbody, set its shape with the collider
		// and then if its non-static, set it to be updated.
		const rigidbody = Engine.physics.world.createRigidBody(descriptor);
		Engine.physics.world.createCollider(shapeToColliderDesc(this.shape), rigidbody);
		this._rapierHandle = rigidbody.handle;
		if (this.bodyType === 'dynamic' || this.bodyType === 'kinematicPosition') {
			Engine.physics.register(this);
		}
	}

	onEnd(): void {
		const rigidbody = Engine.physics.world.getRigidBody(this._rapierHandle!);
		if (rigidbody) {
			Engine.physics.world.removeRigidBody(rigidbody);
		}
		if (this.bodyType === 'dynamic' || this.bodyType === 'kinematicPosition') {
			Engine.physics.unregister(this);
		}
		this._rapierHandle = null;
	}

	// "Translation" means how will we move its position.
	// This is only used if kinematicPosition is enabled, where
	// we set the position and have the physics sim validate
	// it right as we set it
	public setNextKinematicTranslation(translation: vec3) {
		if (this._rapierHandle == null) return;
		const rb = Engine.physics.world.getRigidBody(this._rapierHandle);
		rb?.setNextKinematicTranslation({
			x: translation[0],
			y: translation[1],
			z: translation[2]
		})
	}

	// Called after the physics engine ran, to sync the transform.
	onPhysicsUpdate(): void {
		const rigidbody = Engine.physics.world.getRigidBody(this._rapierHandle!);
		if (!rigidbody) return;
		const translation = rigidbody.translation();
		const rotation = rigidbody.rotation();
		this._location!.position[0] = translation.x;
		this._location!.position[1] = translation.y;
		this._location!.position[2] = translation.z;
		this._location!.rotation[0] = rotation.x;
		this._location!.rotation[1] = rotation.y;
		this._location!.rotation[2] = rotation.z;
		this._location!.rotation[3] = rotation.w;
		this._location!.refresh();
	}

	get rigidbodyHandle(): number {
		return this._rapierHandle!;
	}
}

// A ball shape
// https://en.wikipedia.org/wiki/Sphere
export interface SphereShape {
	kind: 'sphere',
	// Distance from edge of sphere to center.
	radius: number
}

// Circular for X and Z, to a certain length on the Y coord.
// https://en.wikipedia.org/wiki/Cylinder
export interface CylinderShape {
	kind: 'cylinder',

	// Half of the height of the cylinder.
	// If the cylinder is 5m tall, set this
	// to 2.5m
	halfHeight: number,

	// Distance from edge to center
	radius: number,
}

// 6 Sided box shape of various lengths on each
// 3 dimensions:
// https://en.wikipedia.org/wiki/Rectangular_cuboid 
export interface BoxShape {
	kind: 'box',

	// Half of X length of box. 
	halfWidth: number,

	// Half of Y length of box.
	halfHeight: number,

	// Half of Z length of box.
	halfDepth: number,
}

// "Pill shape"
// https://en.wikipedia.org/wiki/Capsule_(geometry)
export interface CapsuleShape {
	kind: 'capsule',

	// Half of the height of the capsule.
	// If the cylinder is 5m tall, set this
	// to 2.5m 
	halfHeight: number,
	radius: number,
}

export type PhysicsShape = SphereShape | CylinderShape | BoxShape | CapsuleShape;

// Our interfaces allow for serialization of these shapes later,
// but we can then take this and convert to Rapier types so that
// the physics engine can use them.
export function shapeToColliderDesc(shape: PhysicsShape): RAPIER.ColliderDesc {
	switch (shape.kind) {
		case 'sphere': 
			return RAPIER.ColliderDesc.ball(shape.radius);
		case 'cylinder':
			return RAPIER.ColliderDesc.cylinder(shape.halfHeight, shape.radius)
		case 'box':
			return RAPIER.ColliderDesc.cuboid(shape.halfWidth, shape.halfHeight, shape.halfDepth)
		case 'capsule':
			return RAPIER.ColliderDesc.capsule(shape.halfHeight, shape.radius)
		default:
			throw new Error("Unsupported shape, cannot get collider desc")
	}
}