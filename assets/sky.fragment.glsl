#version 300 es

precision highp float;

in highp vec2 v_uv;

uniform sampler2D u_astronomy_texture;
uniform vec3 u_atmosphere_color;
uniform float u_atmosphere_thickness;

out vec4 fragColor;

void main() {
    vec4 astronomyColor = texture(u_astronomy_texture, v_uv);
    vec4 atmosphereColor = vec4(u_atmosphere_color, 1.0);
    float thickness = clamp(u_atmosphere_thickness, 0.0, 1.0);
    fragColor = mix(astronomyColor, atmosphereColor, thickness);
}
