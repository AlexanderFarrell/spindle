import RAPIER from "@dimforge/rapier3d-compat";
import type { vec3 } from "gl-matrix";
import type { Time } from "../time/time";

// How much responsibility should the physics engine have
// over handling this object?
//
// - static - This object only blocks other objects, used for solid
//            objects which never move.
// - dynamic - Full 3D Physics simulation on that object. We give the
//            object velocity or impulses... the physics engine does
//            the rest (gravity, inertia, etc.)
// - kinematicPosition - Half way... only validates the position when
//            we give the object a new position, you handle gravity, etc.
//            
// Typically, you use:
// - static - Solid immovable objects (walls, trees, rocks, etc.)
// - dynamic - Volleyball, debris, vehicles
// - kinematicPosition - Players & NPCs
//
export type BodyType = 'static' | 'dynamic' | 'kinematicPosition';

export interface IDynamicBody {
	onPhysicsUpdate(): void;
	get rigidbodyHandle(): RAPIER.RigidBodyHandle;
}

// Handles physics in our game, really just a small wrapper around
// rapier3d
export class Physics {
	// Rate of acceleration per second applied to all dynamic bodies
	// generally to fall to the ground (could be used in other ways).
	// Public here so that you can use if needed, such as for kinematicPosition.
	public gravity: vec3;

	// The physics simulation itself. This is used for making/destroying
	// rigidbodies and colliders, and updating them. 
	//
	// - Rigidbody: Some object which will move, which you want the physics
	//              simulation work at. Contains colliders which shape it.
	// - Colliders: Define a shape, blocks other objects.
	private _world: RAPIER.World;

	// Anything which wants to use the physics engine can register
	// with this to be called right after, for syncTransform or 
	// setting the kinematic position.
	private _updatableBodies: Map<RAPIER.RigidBodyHandle, IDynamicBody>;

	public static async initRapier3DLibrary() {
		await RAPIER.init();
	}

	// Defaults to earth's gravity if not specified.
	public constructor(gravity: vec3 = [0, -9.81, 0]) {
		this._world = new RAPIER.World({
			x: gravity[0],
			y: gravity[1],
			z: gravity[2]
		});
		this.gravity = gravity;
		this._updatableBodies = new Map();
	}

	// Syncs all the transforms of any dynamic body registered with this.
	public update(time: Time) {
		// Tell the physics world how many milliseconds passed, and then
		// do the update.
		this._world.timestep = time.Delta;
		this._world.step();

		for (const [handle, body] of this._updatableBodies) {
			body.onPhysicsUpdate();
		}
	}

	// Adds to a map of updatable objects
	public register(obj: IDynamicBody) {
		this._updatableBodies.set(obj.rigidbodyHandle, obj);
	}

	// Removes an object so that it is no longer updated.
	public unregister(obj: IDynamicBody) {
		this._updatableBodies.delete(obj.rigidbodyHandle);
	}

	// Helper for getting the first collider in a rigidbody
	// Because rigidbodies could have multiple, or none, so 
	// this is helpful because many rigidbodies will just have one.
	public getColliderForBody(handle: RAPIER.RigidBodyHandle): RAPIER.Collider | undefined {
		const rb = this._world.getRigidBody(handle);
		if (!rb || rb.numColliders() < 1) return undefined;
		return rb.collider(0);
	}

	// World has readonly access.
	public get world(): RAPIER.World {
		return this._world;
	}
}