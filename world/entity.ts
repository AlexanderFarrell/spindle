// This file lets us organize our objects in the world into "entities"
// Entities have attributes about them we call "components".

// A part of some entity, such as it's location.
export class Component {
	entity: Entity | null = null;
	onStart(): void {}
	onEnd(): void {}
}

// When you say "class Orange" in JavaScript/TypeScript, "Orange" is the
// class name. This "Orange" class name has a constructor, which you can call
// by saying "new Orange()"
//
// So this type here says "whatever is passed in must be able to call new and return it"
// ...so "Orange" would satisfy this, because we can do "new Orange()" and get an Orange back.
type ComponentConstructor<T extends Component> = new (...args: any[]) => T;

// Represents a single "thing" or "object" in the world, with various
// sub-parts called "components"
export class Entity {
	private _components = new Map<ComponentConstructor<any>, Component>();

	constructor(...components: Component[]) {
		// Add them first, then call onStart.
		components.forEach(component => {
			this.add(component, false);
		})

		components.forEach(component => {
			component.onStart();
		})
	}

	// Adds a new entity, calling its onStart() (unless you want to ignore)
	add<T extends Component>(component: T, setup: boolean = true): T {
		// Instances of a class know their own constructor, we get it.
		const kind = component.constructor as ComponentConstructor<T>;

		if (this.has(kind)) {
			throw new Error(`Entity already has a ${kind.name}`);
		}

		component.entity = this;
		this._components.set(kind, component);

		if (setup) {
			component.onStart();
		}
		return component;
	}

	// Removes an entity of a given type, calling its onEnd() function.
	remove<T extends Component>(kind: ComponentConstructor<T>): void {
		const component = this.get(kind);
		if (!component) return;

		component.onEnd();
		component.entity = null;
		this._components.delete(kind);
	}

	// Returns whether this object has a component of a given type.
	has<T extends Component>(kind: ComponentConstructor<T>): boolean {
		return this._components.has(kind);
	}

	// Gets a component of a given type, returns undefined if it doesn't have it.
	get<T extends Component>(kind: ComponentConstructor<T>): T | undefined {
		return this._components.get(kind) as T;
	}

	// Always get the component of a given type. Makes a new "default" one if
	// it doesn't exist, and returns. Useful if a component depends on another component,
	// like a physics component needing the location component.
	lazyGet<T extends Component>(kind: ComponentConstructor<T>, defaultFactory: () => T): T {
		if (!this.has(kind)) {
			this.add(defaultFactory())
		}
		return this.get(kind)!
	}

	// Removes all components, calling each onEnd() function
	clear(): void {
		this._components.forEach(component => {
			component.onEnd();
			component.entity = null;
		})
		this._components.clear();
	}
}
