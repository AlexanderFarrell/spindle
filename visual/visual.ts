import { PerspectiveCamera, type Camera } from "./camera";
import { Color } from "./color";
import { getGL, setGL } from "./gl";

// Represents something which is visible, or otherwise
// in the drawing process. Add to visual via Register and 
// cleanup via Unregister()
export interface Drawable {
	setup(): void;
	breakdown(): void;
	draw(): void;
}

// Draws things to the screen. Nice abstraction so our code isn't 
// littered with WebGL code all over.
export class Visual {
	// The part of the web page to draw into.
	public canvas: HTMLCanvasElement;

	// Each frame, we throw a massive paint can on the whole frame so we start
	// fresh, that way we don't have parts of the previous image. If you turn clear
	// color off, it can make some cool effects, but can also be obnoxious for most
	// situations.
	public clearColor: Color;

	// Where should objects be seen from?
	public camera: Camera;

	// All the visible objects in the scene, or objects which have logic toward
	// drawing things.
	private _drawables: Set<Drawable> = new Set();

	public constructor() {
		this.canvas = document.querySelector("canvas")!;

		// Start off with a nice blue color, feel free to modify, its rgb
		this.clearColor = new Color(0.2, 0.6, 0.9);

		let gl = this.canvas.getContext("webgl2");
		if (gl == null) {
			// If this fails, webgl2 is very likely not supported. See
			// https://webglreport.com/?v=2
			let message = "Error: WebGL2 failed to start. It may not be supported on this device."
			this.canvas.innerHTML = message;
			throw new Error(message);
		}

		setGL(gl);

		// This allows for transparent objects in our scene. If we want to optimize
		// we might toggle this for some objects. Some renderers optimize in fancy ways.
		// But for now.. just leave these on.
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		// Turn on depth sorting, to find which objects are in front of others.
		// WebGL itself brings everything into a cube, -1 to 1, on all sides. Sounds weird,
		// but it's nice because it doesn't care what size monitor anyone has. Anyway, we set
		// this here to say the furthest objects are (after they've been projected into this box)
		// is 1.0
		gl.clearDepth(1.0);

		// Turn on depth sorting.
		gl.enable(gl.DEPTH_TEST);

		// This function is cool, it lets you tell WebGL how objects should be sorted. 
		// So we are saying here "if an object is less than or equal to the distance of what
		// we already drew, then draw over whatever it was".
		//
		// The equal part is nice because we can draw over things for maybe paths... but 
		// in practice "z-fighting" can still very much occur.  
		gl.depthFunc(gl.LEQUAL);

		this.camera = new PerspectiveCamera(
			gl.canvas.width / gl.canvas.height
		);
		this.register(this.camera);
		this.onResize();
		window.addEventListener('resize', () => {
			this.onResize();
		})
	}

	private onResize() {
		// Anytime the canvas resizes... properties about our perspective
		// need to be adjusted. Perspective needs to know the orientation of the monitor
		// to calculate right... so we update it if it's changed.
		let gl = getGL();
		this.canvas.setAttribute("width", String(window.innerWidth));
		this.canvas.setAttribute("height", String(window.innerHeight));

		// Without this... WebGL has no idea how big the canvas is... things might get really small...
		gl.viewport(0, 0, window.innerWidth, window.innerHeight);
		(this.camera as PerspectiveCamera).aspectRatio = window.innerWidth / window.innerHeight;
		this.camera.refreshProjection();
	}

	public draw() {
		let gl = getGL();
		gl.clearColor(
			this.clearColor.red,
			this.clearColor.green,
			this.clearColor.blue,
			this.clearColor.alpha
		);

		// Tell WebGL that we want to clear out:
		//  - Color 
		//  - Any previous depth info
		// It takes "bits" (1s and 0s) to know which buffers
		// it should clear out. So we set color bit to 1, and
		// depth bit to 1, everything else 0. There are other buffers,
		// like stencil, but we don't need them (now)
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		// Actually draw everything
		this._drawables.forEach(drawable => {
			drawable.draw();
		})
	}

	// Tell the visual "hey draw me please"
	public register(drawable: Drawable) {
		this._drawables.add(drawable);
		drawable.setup();
	}

	// Tell the visual "stop drawing me"
	public unregister(drawable: Drawable) {
		drawable.breakdown();
		this._drawables.delete(drawable);
	}
}
