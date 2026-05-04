import { getGL } from "./gl";
import type { mat4 } from "gl-matrix";
import type { Shader } from "./shader";
import type { Texture } from "./texture";

// Represents how something looks. It contains a "shader" which is
// a set of code which calculates the appearance of something. Then it
// contains "uniforms" which are variables controlling how something looks.
export class Material {
	// Code which is run on the graphics card to compute
	// the appearance of something. We use a language called
	// GLSL to do this, it's been around for ages.
	private _shader: Shader;

	// Variables which effect how something is drawn. For example, a light
	// source, a texture applied to the object, the orientation of the camera, etc.
	public uniforms: Uniform[];

	constructor(shader: Shader, ...uniforms: Uniform[]) {
		this.uniforms = uniforms;
		this._shader = shader;
	}

	// Initializes the material on the graphics card.
	bind() {
		this._shader.bind();
		this.uniforms.forEach(uniform => {
			if (!uniform.isReady()) uniform.prepare(this._shader);
			uniform.bind(this._shader);
		})
	}
}

// Represents a single variable on the graphics card describing how
// something looks, such as a light. There are many different types
// and so this class is an abstract "base" class for other kinds
// of uniforms.
export abstract class Uniform {
	public name: string;
	protected location: WebGLUniformLocation | null = null;

	public constructor(name: string) {
		this.name = name;
	}

	// Gets where the uniform is located in the code.
	prepare(shader: Shader) {
		this.location = shader.getUniformLocation(this.name);
	}

	// Determines if the uniform is ready to draw.
	isReady(): boolean {
		return this.location !== null;
	}

	// Sets the variable when drawing.
	abstract bind(shader: Shader): void;
}

// Holds a texture, but also sets its "sampler" which tells the 
// graphics card which texture to use.
export class UniformTexture extends Uniform {
	public texture: Texture;

	public constructor(name: string, texture: Texture) {
		super(name);
		this.texture = texture;
	}

	bind(_shader: Shader): void {
		this.texture.bind();
		getGL().uniform1i(this.location, 0);
	}
}

// Holds a 4x4 matrix of numbers.
export class UniformMat4 extends Uniform {
	public mat4: mat4;

	public constructor(name: string, mat4: mat4) {
		super(name);
		this.mat4 = mat4;
	}

	bind(_shader: Shader): void {
		getGL().uniformMatrix4fv(this.location, false, this.mat4)
	}
}

// Holds a single number.
export class UniformFloat extends Uniform {
	public value: number;

	public constructor(name: string, value: number) {
		super(name);
		this.value = value;
	}

	bind(_shader: Shader): void {
		getGL().uniform1f(this.location, this.value);
	}
}

// Holds 3 numbers, like XYZ, or red, green and blue.
export class UniformVec3 extends Uniform {
	public value: [number, number, number];

	public constructor(name: string, x: number, y: number, z: number) {
		super(name);
		this.value = [x, y, z];
	}

	bind(_shader: Shader): void {
		getGL().uniform3fv(this.location, this.value);
	}
}
