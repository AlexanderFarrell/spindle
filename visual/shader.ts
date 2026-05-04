import { getGL } from "./gl";

// What is this graphics code actually operating on?
export enum ShaderType {
	// "Dots" in geometry
	// ...says this code will run on every vertex
	Vertex, 

	// "Pixels", but we call them fragments to be generic. Maybe
	// we are rendering to a printer, or some generic data...
	//
	// ...says this code will run on every pixel of the mesh.
	Fragment 
}

// The GLSL source code to send to the graphics card.
export class ShaderSource {
	// What does this code operate on?
	public kind: ShaderType;

	// The actual code itself, as a strong.
	public code: string;

	public constructor(kind: ShaderType, code: string) {
		this.kind = kind;
		this.code = code;
	}

	// Takes our nice type and converts it into what 
	// webgl wants.
	public getGLType(): number {
		const gl = getGL();
		switch (this.kind) {
			case ShaderType.Vertex:
				return gl.VERTEX_SHADER;
			case ShaderType.Fragment:
				return gl.FRAGMENT_SHADER;
			default:
				throw new Error("Invalid type")
		}
	}
}

// Represents a program, with a set of stages, for drawing
// computer graphics... or well in recent times, just doing something
// on the graphics card. 
export class Shader {
	// Combines all the source code into a program, of all steps
	private _program: WebGLProgram | null = null;

	// The steps to send to the GPU.
	private _sources: ShaderSource[];

	constructor(...sources: ShaderSource[]) {
		this._sources = sources;
	}

	public setup() {
		const gl = getGL();
		this._program = gl.createProgram();

		// Take each source code step, and load/compile it.
		// If you have errors in your GLSL, this will throw :)
		// and print out nice info in the console so you can fix.
		const shaders = this._sources.map(source => {
			let shader = this.loadShader(source);
			gl.attachShader(this._program!, shader);
			return shader;
		})

		// Links everything together.
		gl.linkProgram(this._program);

		// If we encounter some issue, then print the issue and throw so we can fix.
		if (!gl.getProgramParameter(this._program, gl.LINK_STATUS)) {
			throw new Error("Error linking shader: " + gl.getProgramInfoLog(this._program));
		}

		// So at this point, the GPU programs are compiled (turned into machine code)
		// and the program is linked and ready to go. But we still have... in addition...
		// the non-compiled shaders we had earlier... still taking up GPU memory.
		//
		// We clean those up here :)
		shaders.forEach(shader => {
			gl.detachShader(this._program!, shader);
			gl.deleteShader(shader);
		})
	}

	public getUniformLocation(name: string) {
		// A uniform is "uniform" for all things in a shader execution.
		// Things like... the position of the sun... this should probably
		// be the same for every pixel for example.
		//
		// This function gets where the uniform is in shader
		const gl = getGL();
		let location = gl.getUniformLocation(this._program!, name);
		if (location == null) {
			throw new Error("Failed to get uniform location for " + name);
		}
		return location;
	}

	public getAttributeLocation(name: string) {
		// An attribute is a single vertex property. Like the position of
		// the tip of a character's nose, or the position of their jaw. There's
		// tons and tons of these... attributes for every vertex. 
		//
		// This function gets where an attribute is in the shader.
		const gl = getGL();
		let location = gl.getAttribLocation(this._program!, name);
		if (location === -1) {
			throw new Error("Failed to get attribute location for " + name);
		}
		return location;
	}

	public bind() {
		getGL().useProgram(this._program);
	}

	public destroy() {
		getGL().deleteProgram(this._program);
	}

	private loadShader(source: ShaderSource): WebGLShader {
		// Uploads the source code to the GPU, and compiles it.
		// Or WebGL does something with it... but by the end of this
		// it will be compiled for the GPU
		const gl = getGL();
		const shader = gl.createShader(source.getGLType());
		if (shader == null) {
			throw new Error("Failed to create new shader");
		}

		gl.shaderSource(shader, source.code);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			// We really really want this code :). Reason why:
			// if you make a mistake in your shader code, this will
			// save you with a nice error message so you can fix it.
			// Errors are your friend.
			const errorMessage = gl.getShaderInfoLog(shader);
			gl.deleteShader(shader);
			throw new Error("Error compiling shader: " + errorMessage);
		}
		return shader;
	}

	public isSetup() {
		return this._program != null;
	}
}
