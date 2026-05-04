// TODO: Make for the canvas, not document.body.
export class UserInput {
	public keysDown: Set<string> = new Set<string>();

	public mouseDeltaX = 0;
	public mouseDeltaY = 0;

	// Called from the app if it wants to control the
	// screen. We need to wait for the user to interact.
	public wantsPointerLock = false;

	// For security, browsers wait for the user to interact
	// before allowing things like pointer lock or full screen
	// This tracks if the pointer is actually locked.
	private isPointerLocked = false;

	constructor() {
		document.body.addEventListener('keydown', (event) => {
			this.keysDown.add(event.key);
		})

		document.body.addEventListener('keyup', (event) => {
			this.keysDown.delete(event.key);
		})

		document.body.addEventListener('click', (event) => {
			if (this.wantsPointerLock && !this.isPointerLocked) {
				document.body.requestPointerLock();
			}
		})

		document.addEventListener('pointerlockchange', () => {
			this.isPointerLocked = 
				document.pointerLockElement === document.body;
		})

		document.body.addEventListener('mousemove', (event) => {
			if (this.wantsPointerLock && this.isPointerLocked) {
				this.mouseDeltaX = event.movementX;
				this.mouseDeltaY = event.movementY;
			} else {
				this.mouseDeltaX = 0;
				this.mouseDeltaY = 0;
			}
		})
	}

	isDown(key: string) {
		return this.keysDown.has(key);
	}

	lockMouse() {
		this.wantsPointerLock = true;
	}

	unlockMouse() {
		this.wantsPointerLock = false;

		if (this.isPointerLocked) {
			document.exitPointerLock()
		}
	}

	endUpdate() {
		this.mouseDeltaX = 0;
		this.mouseDeltaY = 0;
	}
}
