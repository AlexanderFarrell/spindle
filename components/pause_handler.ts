import { Engine } from "../main";
import { Component } from "../world/entity";
import type { Updatable } from "../world/world";

export class PauseHandler extends Component implements Updatable {
	private _pauseMenu: HTMLElement | null = null;

	onStart(): void {
		Engine.world.updatables.add(this);	
	}

	onEnd(): void {
		Engine.world.updatables.delete(this);	
		if (this._pauseMenu != null) {
			this._pauseMenu.remove();
		}	
	}

	onUpdate(): void {
		if (Engine.input.isDown('Escape')) {
			if (this._pauseMenu != null) {
				// this.resume();
			} else {
				this.pause();
			}
		}
	}

	private pause() {
		Engine.time.paused = true;
		this._pauseMenu = document.createElement('div');
		this._pauseMenu.id = "pause_menu";
		this._pauseMenu.innerHTML = `
			<h1>Game Paused</h1>
			<button name="resume">Resume</button>
			<button name="settings">Settings</button>
			<button name="quit">Quit</button>
		`

		let resumeButton = this._pauseMenu.querySelector('[name="resume"]')!;
		let quitButton = this._pauseMenu.querySelector('[name="quit"]')!;

		resumeButton.addEventListener('click', () => {
			this.resume();
		})

		quitButton.addEventListener('click', () => {
			Engine.app.requestSwitchTo("Menu");
		})

		Engine.ui.UiContainer.appendChild(this._pauseMenu);
	}

	private resume() {
		Engine.time.paused = false;
		this._pauseMenu?.remove();
		this._pauseMenu = null;
	}
}