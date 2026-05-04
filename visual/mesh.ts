import { getGL } from "./gl";

// Tells us what kind of data we have
export enum DataType {
	Integer,
	Float
}

// A single "attribute" list of a vertex. Some examples are:
//  - A list of positions of every dot (vertex) making up a model
//  - A list of colors for each dot
//  - A list of coordinates for what part of a texture should
//    be mapped where (UV)
//  - A list of arrows telling us about the shape (normals) so
//    we can calculate lightning and other effects
//
// The data is layed out in a list for all dots (vertices), so positions
// are like this: xyzxyzxyzxyz for 4 vertices, with each vertex taking
// 3 numbers (for 12 numbers in total in the list).
export class VertexAttribute {
	public data: number[];
	public vertexBuffer: WebGLBuffer | null;

	// How many numbers each vertex takes up. So for example, positions 
	// need an x, y and z, so for position this would be 3. The data is layed
	// out like xyzxyzxyzxyz, and so forth.
	public elementsPerVertex: number;
	public elementType: DataType = DataType.Float;

	public constructor(elementsPerVertex: number, ...data: number[]) {
		this.data = data;
		this.elementsPerVertex = elementsPerVertex;
		this.vertexBuffer = null;
	}

	// Actually stores the data on the graphics card, so its
	// closer and way faster to draw.
	public buffer() {
		const gl = getGL();
		gl.deleteBuffer(this.vertexBuffer);

		// Make a new buffer
		this.vertexBuffer = gl.createBuffer();

		// Tell the GPU that "ARRAY_BUFFER" now is our buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

		// On "ARRAY_BUFFER", copy over its data.
		gl.bufferData(gl.ARRAY_BUFFER,
			new Float32Array(this.data),
			gl.STATIC_DRAW // I'm lazy, no reason to use others for now.
		);
	}

	// Prepares the buffer to be used.
	public bind(location: number) {
		const gl = getGL();
		gl.enableVertexAttribArray(location);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.vertexAttribPointer(
			location,
			this.elementsPerVertex,
			this.elementTypeToGLEnum(this.elementType),
			false,
			0,
			0
		);
	}

	// Converts our nice DataType into what WebGL wants, some
	// GLenum.
	private elementTypeToGLEnum(type: DataType) {
		const gl = getGL();
		switch (type) {
			case DataType.Integer:
				return gl.INT
			case DataType.Float:
				return gl.FLOAT
			default:
				throw new Error("Unknown type")
		}
	}
}


// Describes the 3D geometry of something. It's made up of dots (called vertices)
// and we make triangles out of these dots (mapped by indices)
//
// Each dot (vertex) can have things like a position, texture mapping, direction 
// for lighting (normal), a color, etc.
//
// We form triangles with indices. Each 3 indices makes up a triangle
// So if I had the following indices:
//    
//   0, 1, 2, 1, 2, 3
// 
// Then I have two triangles. First takes up the 0, 1, and 2 vertex, and the second
// the 1, 2 and 3 vertex.
// 
// Remember that two triangles can make up a square, and triangles can be used to form
// practically anything. We can even use lots of triangles to sort of "fake" a circle.
export class Mesh {
	// Keeps a copy of vertices in CPU memory, and can buffer on the GPU.
	public vertexAttrs: VertexAttribute[];

	// Defines what triangles we have.
	public indices: number[] = [];

	// A nice powerful object which just tells WebGL "I've got
	// these multiple arrays of vertex data all together" and 
	// we can then just give WebGL this object at draw time. Nice
	// and convenient. It also means we have to talk less to the GPU
	// during draws, speeding things up.
	public vao: WebGLVertexArrayObject = 0

	// Stores our indices on the graphics card
	private _indexBuffer: WebGLBuffer | null = null;

	public constructor(...attributes: VertexAttribute[]) {
		this.vertexAttrs = attributes;
	}

	// Buffers... or refreshes... the memory on the GPU. What's nice
	// about the way we did this is you can actually make edits to the 
	// vertexAttrs and indices... and then call this again to update the GPU.
	// Really nice if you want to modify the geometry later.
	public buffer() {
		this.bufferVertices();
		this.bufferIndices();
	}

	// Helper to send vertex info to the graphics card.
	private bufferVertices() {
		const gl = getGL();
		this.vertexAttrs.forEach(attribute => {
			attribute.buffer();
		});

		this.vao = gl.createVertexArray();
		gl.bindVertexArray(this.vao);

		this.vertexAttrs.forEach((attribute, index) => {
			attribute.bind(index);
		})
	}

	// Helper to send index info to the graphics card
	private bufferIndices() {
		const gl = getGL();
		this._indexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
		gl.bufferData(
			gl.ELEMENT_ARRAY_BUFFER,
			new Uint32Array(this.indices),
			gl.STATIC_DRAW
		);
	}

	// Actually draws the mesh. You should bind your material before you
	// do this.
	public draw() {
		const gl = getGL();
		// Gets our nice VAO object, this knows all the vertex arrays we have!
		gl.bindVertexArray(this.vao);

		// Tells the graphics card this is what triangles we want.
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);

		// Actually draws. We just use TRIANGLES here but there are others. And 
		// we just draw the whole mesh. But you can do fancy things here, like
		// baking geometry into even bigger lists and drawing only parts of it.
		// Maybe there's even some cool effects you can come up for this.
		gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_INT, 0);
	}

	public isBuffered(): boolean {
		return this._indexBuffer != null;
	}
}
