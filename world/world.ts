import { Entity, type Component } from "./entity";

// An interface to something which can be updated, by
// which the world can call "onUpdate()" each game tick.
export interface Updatable {
	// When added to the world, will be called each game tick.
	onUpdate(): void;
}

// Let's us organize a world into "objects" called entities.
// Also maintains updating logic of our world.
export class World {
	public entities: Set<Entity> = new Set();
	public updatables: Set<Updatable> = new Set();

	// Returns a new entity of given components and
	// adds it to the world.
	makeEntity(...components: Component[]): Entity {
		let entity = new Entity(...components);
		this.entities.add(entity);
		return entity;
	}

	// Updates every "Updatable" component.
	update() {
		this.updatables.forEach(updatable => {
			updatable.onUpdate();
		})
	}

	reset() {
		let entities = new Set(this.entities);
		entities.forEach(e => {
			e.clear();
		})
		this.entities.clear();		
	}
}
