#version 300 es
in vec3 a_position;

uniform mat4 u_camera;

void main() {
	gl_Position = u_camera * vec4(a_position.xyz, 1.0);
}
