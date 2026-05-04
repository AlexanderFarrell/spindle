

export class UI {
	private _uiContainer: HTMLElement;

	public constructor() {
		this._uiContainer = document.querySelector("#ui_container")!;
	}

	public get UiContainer(): HTMLElement {
		return this._uiContainer;
	}

	public clear() {
		this._uiContainer.innerHTML = "";
	}
}