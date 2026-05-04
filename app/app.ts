import type { Stage } from "./stage";

// Handles transitions between stages of our game.
// such as Editor, Menus, and Gameplay
export class App {
	// Stages such as editor, menu or gameplay
	private _stages: Stage[];

	// Whatever stage the game is currently in.
	private _currentStage: Stage | null = null;

	// Holds whatever stage to switch to at the end
	// of the frame. We switch at the end so there
	// aren't interruptions in gameplay logic.
	private _futureStage: Stage | null = null;

	private _onSwitch: () => void;

	// Makes a new app and runs the first stage.
	public constructor(stages: Stage[], startStageName: string, onSwitch: () => void) {
		this._stages = stages;
		this._onSwitch = onSwitch;
		this.requestSwitchTo(startStageName);
		// this.performSwitch();
	}

	// Changes to the given stage at the end of the
	// frame. Throws if the stage name is not found.
	public requestSwitchTo(stageName: string) {
		let stage = this.getStage(stageName);
		if (stage === undefined) {
			throw new Error(`Cannot switch to stage: ${stageName} - No such stage found.`);
		}
		this._futureStage = stage;
	}

	// Called to perform switching of stages if requested.
	public endUpdate() {
		if (this._futureStage != null) {
			this.performSwitch();
		}
	}

	// Finds a stage by name or returns undefined.
	private getStage(stageName: string): Stage | undefined {
		return this._stages.find((stage) => {
			return (stage.name() === stageName);
		})
	}

	public get platform(): string {
		const api = (window as any).electronAPI;
		if (api?.isElectron) {
			return api.platform;
		}
		return 'web';
	}

	public quit(): void {
		(window as any).electronAPI?.quit();
	}

	// Actually performs the switch, calling the previous stages's
	// on_end() function for cleanup, and the new stages on_start()
	// for setup.
	private performSwitch() {
		console.log(`Switching from ${this._currentStage?.name()} to ${this._futureStage?.name()}`);
		this._currentStage?.on_end();
		this._currentStage = this._futureStage;
		this._onSwitch();
		this._currentStage?.on_start();
		this._futureStage = null;
	}
}