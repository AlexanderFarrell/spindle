#version 300 es

precision highp float;

in highp vec2 v_uv;

uniform sampler2D u_texture;

out vec4 fragColor;

void main() {
    
    fragColor = texture(u_texture, v_uv);
    if (fragColor.a <= 0.6) {
        discard;
    }
}
