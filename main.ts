import { App } from "./app/app";
import type { Stage } from "./app/stage";
import { UserInput } from "./input/input";
import { Physics } from "./physics/physics";
import { Time } from "./time/time";
import { UI } from "./ui/ui";
import { Visual } from "./visual/visual";
import { World } from "./world/world";

// Contains a game engine with visuals, a world
// manager and input
export class Engine {
	public static app: App;
	public static visual: Visual;
	public static world: World;
	public static input: UserInput;
	public static time: Time;
	public static physics: Physics;
	public static ui: UI;

	// Called to start the game engine, taking a
	// function once set up.
	public static async start(stages: Stage[], startStageName: string) {
		await Physics.initRapier3DLibrary();
		Engine.visual = new Visual();
		Engine.world = new World();
		Engine.input = new UserInput();
		Engine.time = new Time();
		Engine.physics = new Physics();
		Engine.ui = new UI();
		Engine.app = new App(stages, startStageName, () => {Engine.onSwitch()});
		Engine.loop();
	}

	// The main game loop
	private static loop(timestamp: number = 0) {
		this.time.onStartUpdate(timestamp);
		Engine.update();
		Engine.draw();
		this.input.endUpdate();
		this.app.endUpdate();
		// This is called at the monitor refresh rate, unless the game
		// cannot complete frames faster than the monitor refresh rate.
		requestAnimationFrame((timestamp: number) => {
			// We just call the loop function again to repeat!
			Engine.loop(timestamp);
		});
	}

	// Updates the logic and movement in the game.
	private static update() {
		Engine.world.update();
		Engine.physics.update(Engine.time);
	}

	private static onSwitch() {
		Engine.world.reset();
		Engine.time.paused = false;
	}

	// Draws a frame
	private static draw() {
		Engine.visual.draw();
	}
}
