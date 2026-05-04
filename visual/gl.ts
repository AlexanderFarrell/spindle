// The "RenderingContext" which talks to the graphics card for us.
// We don't talk directly, we use a rendering context which is a library
// of a ton of functions and things which does it for us.
let _gl: WebGL2RenderingContext | null = null;

// Stores the context globally for anything to access.
export function setGL(gl: WebGL2RenderingContext) {
	_gl = gl;
}

// Gets the global store. You must initialize the Engine before doing this.
export function getGL(): WebGL2RenderingContext {
	if (_gl == null) throw new Error("WebGL2 context not initialized");
	return _gl;
}
