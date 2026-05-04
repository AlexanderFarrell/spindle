import { mat4 } from "gl-matrix";
import { OceanFragmentGLSL, OceanVertexGLSL } from "../assets/asset_map";
import { Engine } from "../main";
import { Material, UniformMat4 } from "../visual/material";
import { Mesh, VertexAttribute } from "../visual/mesh";
import { Shader, ShaderSource, ShaderType } from "../visual/shader";
import type { Drawable } from "../visual/visual";
import { Component } from "../world/entity";
import { Location } from "./location";

export class Ocean extends Component implements Drawable {
	public level: number;
	private _location: Location | null = null;
	private _mvpMatrix: mat4 = mat4.create();

	public constructor(level: number = 0) {
		super();
		this.level = level;
	}

	onStart(): void {
		this._location = this.entity!.lazyGet(Location, () => new Location());
		Engine.visual.register(this);
	}

	onEnd(): void {
		Engine.visual.unregister(this);
	}

	setup(): void {
		if (!mesh.isBuffered()) {
			mesh.buffer();
			shader.setup();
			material = new Material(shader,
				new UniformMat4("u_camera", Engine.visual.camera.matrix)
			);
		}
	}

	breakdown(): void {
		// We can just leave it buffered for the
		// rest of the game.
	}

	draw(): void {
		this._location!.Y = this.level;
		
		// Actually draw
		this._location!.refresh();
		mat4.mul(this._mvpMatrix, Engine.visual.camera.matrix, this._location!.matrix);
		(material!.uniforms[0] as UniformMat4).mat4 = this._mvpMatrix;
		material!.bind();
		mesh.draw();		
	}
}

const oceanSize = 10000;

const mesh = new Mesh(
	new VertexAttribute(
		3,
		-oceanSize, 0, -oceanSize,
		oceanSize, 0, -oceanSize,
		oceanSize, 0, oceanSize,
		-oceanSize, 0, oceanSize
	)
)
mesh.indices = [0, 1, 2, 0, 2, 3];

const shader = new Shader(
	new ShaderSource(ShaderType.Vertex, OceanVertexGLSL),
	new ShaderSource(ShaderType.Fragment, OceanFragmentGLSL)
);

let material: Material | null = null;