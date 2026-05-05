import { mat4, quat, vec3 } from "gl-matrix";
import { TexturedFragmentGLSL, TexturedVertexGLSL } from "../assets/asset_map";
import { Engine } from "../main";
import { Material, UniformMat4, UniformTexture } from "../visual/material";
import { Mesh, VertexAttribute } from "../visual/mesh";
import { Shader, ShaderSource, ShaderType } from "../visual/shader";
import type { Texture } from "../visual/texture";
import { type Drawable } from "../visual/visual";
import { Component } from "../world/entity";
import { Location } from "./location";

// A picture drawn at a fixed offset from the camera, useful for suns/moons.
export class Satellite extends Component implements Drawable {
	private _texture: Texture;
	private _material: Material | null = null;
	private _location: Location | null = null;
	private _worldPosition: vec3 = vec3.create();
	private _worldRotation: quat = quat.create();
	private _modelMatrix: mat4 = mat4.create();
	private _mvpMatrix: mat4 = mat4.create();

	public constructor(texture: Texture) {
		super();
		this._texture = texture;
	}

	onStart(): void {
		let location = this.entity!.get(Location);
		if (location == null) {
			location = this.entity!.add(new Location());
		}
		this._location = location;
		Engine.visual.register(this);
	}

	onEnd(): void {
		Engine.visual.unregister(this);
	}

	setup(): void {
		if (!mesh.isBuffered()) {
			mesh.buffer();
			shader.setup();
		}

		if (!this._texture.isBuffered()) {
			this._texture.buffer();
		}

		this._material = new Material(shader,
			new UniformMat4("u_camera", Engine.visual.camera.matrix),
			new UniformTexture("u_texture", this._texture)
		);
	}

	breakdown(): void {}

	draw(): void {
		const cameraPosition = Engine.visual.camera.location.position;
		const cameraRotation = Engine.visual.camera.location.rotation;
		const offset = this._location!.position;

		vec3.add(this._worldPosition, cameraPosition, offset);
		quat.mul(this._worldRotation, cameraRotation, this._location!.rotation);
		mat4.fromRotationTranslationScale(
			this._modelMatrix,
			this._worldRotation,
			this._worldPosition,
			this._location!.scale
		);

		mat4.mul(this._mvpMatrix, Engine.visual.camera.matrix, this._modelMatrix);
		(this._material!.uniforms[0] as UniformMat4).mat4 = this._mvpMatrix;
		this._material!.bind();
		mesh.draw();
	}
}

const mesh = new Mesh(
	new VertexAttribute(3,
		0, 0, 0,
		1, 0, 0,
		1, 1, 0,
		0, 1, 0
	),
	new VertexAttribute(2,
		0, 1,
		1, 1,
		1, 0,
		0, 0
	)
);
mesh.indices = [0, 1, 2, 0, 2, 3];

const shader = new Shader(
	new ShaderSource(ShaderType.Vertex, TexturedVertexGLSL),
	new ShaderSource(ShaderType.Fragment, TexturedFragmentGLSL)
);
