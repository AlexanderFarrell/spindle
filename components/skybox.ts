import { mat4 } from "gl-matrix";
import { SkyFragmentGLSL, SkyVertexGLSL, TexturedFragmentGLSL, TexturedVertexGLSL } from "../assets/asset_map";
import { Engine } from "../main";
import { Random } from "../util/random";
import { Color } from "../visual/color";
import { Material, Uniform, UniformFloat, UniformMat4, UniformTexture, UniformVec3 } from "../visual/material";
import { Mesh, VertexAttribute } from "../visual/mesh";
import { Shader, ShaderSource, ShaderType } from "../visual/shader";
import { Texture } from "../visual/texture";
import type { Drawable } from "../visual/visual";
import { Component } from "../world/entity";
import { Location } from "./location";

const skyDistance = 450;
const starDensity = 0.004;
const textureWidth = 1024;

export class Skybox extends Component implements Drawable {
    private _material: Material | null = null;
    public atmosphereColor: Color = new Color(0.3, 0.5, 0.9);
    public atmosphereThickness: number = 0;
    private _location: Location | null = null;
    private _mvpMatrix: mat4 = mat4.create();

    onStart(): void {
        Engine.visual.register(this);
        this._location = this.entity!.lazyGet(Location, () => new Location());
    }

    onEnd(): void {
        Engine.visual.unregister(this);
    }

    makeTexture(): Texture {
        let texture = new Texture(textureWidth, textureWidth);
        texture.data.iterate_set((x: number, y: number) => {
            if (Random.next(0, 1) < starDensity) {
                let brightness = Random.next(0, 1);
                return new Color(brightness, brightness, brightness);
            } else {
                return new Color(0, 0, 0);
            }
        })
        texture.buffer();
        return texture;
    } 

    setup(): void {
        if (!mesh.isBuffered()) {
            mesh.buffer();
            shader.setup();
            texture = this.makeTexture();
        }

        this._material = new Material(shader,
            new UniformMat4("u_camera", Engine.visual.camera.matrix),
            new UniformTexture("u_astronomy_texture", texture!),
            new UniformVec3("u_atmosphere_color", this.atmosphereColor.red, 
                this.atmosphereColor.green, this.atmosphereColor.blue),
            new UniformFloat("u_atmosphere_thickness", this.atmosphereThickness)
        );
    }

    breakdown(): void {
    }

    draw(): void {
        this._location!.position = Engine.visual.camera.location.position;
        this._location!.refresh();
        mat4.mul(this._mvpMatrix, Engine.visual.camera.matrix, this._location!.matrix);
                (this._material!.uniforms[0] as UniformMat4).mat4 = this._mvpMatrix;
        this._material!.bind();
        mesh.draw();
    }
}

const mesh = new Mesh(
    new VertexAttribute(3,
        // Front
        -skyDistance, -skyDistance, skyDistance,
        skyDistance, -skyDistance, skyDistance,
        skyDistance, skyDistance, skyDistance,
        -skyDistance, skyDistance, skyDistance,
        // Back
        skyDistance, -skyDistance, -skyDistance,
        -skyDistance, -skyDistance, -skyDistance,
        -skyDistance, skyDistance, -skyDistance,
        skyDistance, skyDistance, -skyDistance,
        // Left
        -skyDistance, -skyDistance, -skyDistance,
        -skyDistance, -skyDistance, skyDistance,
        -skyDistance, skyDistance, skyDistance,
        -skyDistance, skyDistance, -skyDistance,
        // Right
        skyDistance, -skyDistance, skyDistance,
        skyDistance, -skyDistance, -skyDistance,
        skyDistance, skyDistance, -skyDistance,
        skyDistance, skyDistance, skyDistance,
        // Top
        -skyDistance, skyDistance, skyDistance,
        skyDistance, skyDistance, skyDistance,
        skyDistance, skyDistance, -skyDistance,
        -skyDistance, skyDistance, -skyDistance,
        // Bottom
        -skyDistance, -skyDistance, -skyDistance,
        skyDistance, -skyDistance, -skyDistance,
        skyDistance, -skyDistance, skyDistance,
        -skyDistance, -skyDistance, skyDistance
    ),
    new VertexAttribute(2,
        0, 1,
        1, 1,
        1, 0,
        0, 0,

        0, 1,
        1, 1,
        1, 0,
        0, 0,

        0, 1,
        1, 1,
        1, 0,
        0, 0,

        0, 1,
        1, 1,
        1, 0,
        0, 0,

        0, 1,
        1, 1,
        1, 0,
        0, 0,

        0, 1,
        1, 1,
        1, 0,
        0, 0
    )
);
mesh.indices = [
    0, 1, 2, 0, 2, 3,
    4, 5, 6, 4, 6, 7,
    8, 9, 10, 8, 10, 11,
    12, 13, 14, 12, 14, 15,
    16, 17, 18, 16, 18, 19,
    20, 21, 22, 20, 22, 23,
];

const shader = new Shader(
    new ShaderSource(ShaderType.Vertex, SkyVertexGLSL),
    new ShaderSource(ShaderType.Fragment, SkyFragmentGLSL)
);

let texture: Texture | null = null;