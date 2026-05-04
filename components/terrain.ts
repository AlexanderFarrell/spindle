import { vec3 } from "gl-matrix";
import { Array2D, getData } from "../util/array2d";
import { Material, UniformFloat, UniformMat4, UniformVec3 } from "../visual/material";
import { Mesh, VertexAttribute } from "../visual/mesh";
import type { Drawable } from "../visual/visual";
import { Component } from "../world/entity";
import { Color } from "../visual/color";
import { Shader, ShaderSource, ShaderType } from "../visual/shader";
import { ColorLitFragmentGLSL, ColorLitVertexGLSL } from "../assets/asset_map";
import { Engine } from "../main";
import RAPIER from "@dimforge/rapier3d-compat";

// Represents a landscape, and builds a geometry of triangles 
// into a landscape
export class Terrain extends Component implements Drawable {
	// A 2D grid of how high the terrain is at each point.
	public heightMap: Array2D<number>;

	public colorMap: Array2D<Color>;

	// How big is each cell in the grid? 
	public cellSize: number = 1;

	// The geometry if made
	private _mesh: Mesh | null = null;
	private _material: Material | null = null;
	private _colliderHandle: RAPIER.ColliderHandle | null = null;

	// This is for storage later, by storing normals during the mesh
	// creation, we actually speed up calculating normals by 4x, because
	// we don't have to repeat ourselves.
	private _normalMap: Array2D<vec3>;

	public constructor(width: number, height: number) {
		super();
		this.heightMap = new Array2D(width, height, () => 1);
		this._normalMap = new Array2D(width, height, () => [0, 1, 0] as vec3);
		// Default to a green color
		this.colorMap = new Array2D(width, height, () => new Color(0.3, 0.8, 0.4))
	}

	onStart(): void {
		Engine.visual.register(this);
	}

	onEnd(): void {
		Engine.visual.unregister(this);
		if (this._colliderHandle != null) {
			this.breakdownPhysics();
		}
	}

	setup(): void {
		if (!terrainShader.isSetup()) {
			terrainShader.setup();
		}

		this._material = new Material(terrainShader,
			// Orientation of the camera
			new UniformMat4("u_camera", Engine.visual.camera.matrix),
			// Where is the light coming from. This can be greatly improved in later videos.
			new UniformVec3("u_light_direction", 1, 2, 1),
			// The minimum light applied to everything.
			new UniformFloat("u_ambient", 0.3)
		);
	}

	breakdown(): void {}

	draw(): void {
		(this._material!.uniforms[0] as UniformMat4).mat4 = Engine.visual.camera.matrix;
		this._material!.bind();
		this._mesh!.draw();
	}

	// Terrain functions

	private getNormalAt(x: number, y: number): vec3 {
		const h = this.heightMap;

		// We just average the adjacent spots around the point...
		// Some of these checks are just making sure we aren't on
		// an edge, so we don't step out of bounds.
		const l = h.get(x > 0            ? x - 1 : x, y)!;
		const r = h.get(x < h.width  - 1 ? x + 1 : x, y)!;
		const d = h.get(x, y > 0            ? y - 1 : y)!;
		const u = h.get(x, y < h.height - 1 ? y + 1 : y)!;

		// Brings them together.
		const n = vec3.fromValues(l - r, 2.0, d - u);
		vec3.normalize(n, n);
		return n;
	}

	// Actually builds (or refreshes) the terrain geometry and sends it to the graphics
	// card
	updateMesh() {
		// If this is the first time, allocate memory for everything. Otherwise, we recycle this.
		if (this._mesh == null) {
			let counts = 3 * 4 * (this.heightMap.width - 1) * (this.heightMap.height - 1);

			this._mesh = new Mesh(
				new VertexAttribute(3), // Positions
				new VertexAttribute(3), // Normals
				new VertexAttribute(3)  // Colors
			);
			for (let i = 0; i < counts; i++) {
				this._mesh.vertexAttrs[0]?.data.push(0)
				this._mesh.vertexAttrs[1]?.data.push(0)
				this._mesh.vertexAttrs[2]?.data.push(0)
			}
			this._mesh.indices = new Array<number>(6 * (this.heightMap.width - 1) * (this.heightMap.height - 1)).fill(0);
		}

		// Get each list of attributes
		let positions = this._mesh.vertexAttrs[0];
		let normals = this._mesh.vertexAttrs[1];
		let colors = this._mesh.vertexAttrs[2];
		let indices = this._mesh.indices;

		let vertexOffset = 0;
		let indexOffset = 0;

		// Really nice helper functions, this becomes even longer without these.
		let setXYZ = (array: Array<number>, offset: number, x: number, y: number, z: number) => {
			array[offset + 0] = x;
			array[offset + 1] = y;
			array[offset + 2] = z;
		}
		let setXYZArray = (array: Array<number>, offset: number, value: vec3) => {
			array[offset + 0] = value[0];
			array[offset + 1] = value[1];
			array[offset + 2] = value[2];
		}

		let color = new Color(0.3, 0.8, 0.4);

		// You'll find in this code that we do (+ 0) multiple times...
		// ...isn't this a waste?
		//
		// Well, its for readability, and the V8 engine and other engines
		// are great at optimizing it out, so it doesn't matter. Code is for
		// humans more, rather than for machines. The zeros will also
		// help us make less mistakes when putting everything in.
		for (let y = 0; y < this.heightMap.height - 1; y++) {
			for (let x = 0; x < this.heightMap.width - 1; x++) {
				// Okay so for each cell, we want to make 4 dots (vertices)
				// and then make 2 triangles out of them. 

				// Find normals first
				this._normalMap.set(this.getNormalAt(x + 0, y + 0), x + 0, y + 0);
				this._normalMap.set(this.getNormalAt(x + 1, y + 0), x + 1, y + 0);
				this._normalMap.set(this.getNormalAt(x + 0, y + 1), x + 0, y + 1);
				this._normalMap.set(this.getNormalAt(x + 1, y + 1), x + 1, y + 1);

				// Positions
				// x0y0
				setXYZ(positions!.data, vertexOffset + 0,
					(x + 0) * this.cellSize,
					this.heightMap.get(x + 0, y + 0)!,
					(y + 0) * this.cellSize
				);
				//x1y0
				setXYZ(positions!.data, vertexOffset + 3,
					(x + 1) * this.cellSize,
					this.heightMap.get(x + 1, y + 0)!,
					(y + 0) * this.cellSize
				);
				//x0y1
				setXYZ(positions!.data, vertexOffset + 6,
					(x + 0) * this.cellSize,
					this.heightMap.get(x + 0, y + 1)!,
					(y + 1) * this.cellSize
				);
				//x1y1
				setXYZ(positions!.data, vertexOffset + 9,
					(x + 1) * this.cellSize,
					this.heightMap.get(x + 1, y + 1)!,
					(y + 1) * this.cellSize
				)

				// Normals
				setXYZArray(normals!.data, vertexOffset + 0, this._normalMap.get(x + 0, y + 0)!);
				setXYZArray(normals!.data, vertexOffset + 3, this._normalMap.get(x + 1, y + 0)!);
				setXYZArray(normals!.data, vertexOffset + 6, this._normalMap.get(x + 0, y + 1)!);
				setXYZArray(normals!.data, vertexOffset + 9, this._normalMap.get(x + 1, y + 1)!);

				// Colors
				setXYZArray(colors!.data, vertexOffset + 0, this.colorMap.get(x + 0, y + 0)!.vec3);
				setXYZArray(colors!.data, vertexOffset + 3, this.colorMap.get(x + 1, y + 0)!.vec3);
				setXYZArray(colors!.data, vertexOffset + 6, this.colorMap.get(x + 0, y + 1)!.vec3);
				setXYZArray(colors!.data, vertexOffset + 9, this.colorMap.get(x + 1, y + 1)!.vec3);

				// Indices
				indices[indexOffset + 0] = vertexOffset/3 + 0;
				indices[indexOffset + 1] = vertexOffset/3 + 1;
				indices[indexOffset + 2] = vertexOffset/3 + 2;
				indices[indexOffset + 3] = vertexOffset/3 + 1;
				indices[indexOffset + 4] = vertexOffset/3 + 2;
				indices[indexOffset + 5] = vertexOffset/3 + 3;

				vertexOffset += 12;
				indexOffset += 6;
			}
		}

		this._mesh!.buffer();
		this.updatePhysics();
	}

	updatePhysics() {
		if (this._colliderHandle != null) {
			this.breakdownPhysics();
		}
		const w = this.heightMap.width;
		const h = this.heightMap.height;
		const data = getData(this.heightMap);
		const scale = {
			x: (w - 1) * this.cellSize,
			y: 1,
			z: (h - 1) * this.cellSize,
		};
		const desc = RAPIER.ColliderDesc.heightfield(
			w - 1,
			h - 1,
			data,
			scale
		);

		// Our terrain starts at 0,0,0, but rapier's height field
		// starts in the middle. Adjust this		
		desc.setTranslation(
			((w - 1) * this.cellSize) / 2,
			0,
			((h - 1) * this.cellSize) / 2
		);

		const collider = Engine.physics.world.createCollider(desc);
		this._colliderHandle = collider.handle;
	}

	breakdownPhysics() {
		if (this._colliderHandle == null) return;
		const collider = Engine.physics.world.getCollider(this._colliderHandle);
		if (collider) Engine.physics.world.removeCollider(collider, false);
		this._colliderHandle = null;
	}

	public get_height_bilinear(x: number, y: number): number {
		return this.heightMap.bilinear_interpolation(
			x / this.cellSize,
			y / this.cellSize
		);
	}
}

const terrainShader = new Shader(
	new ShaderSource(ShaderType.Vertex, ColorLitVertexGLSL),
	new ShaderSource(ShaderType.Fragment, ColorLitFragmentGLSL)
);
