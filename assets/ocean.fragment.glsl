#version 300 es

precision highp float;

uniform vec4 u_ocean_color;

out vec4 fragColor;

void main() {
	fragColor = u_ocean_color;
}