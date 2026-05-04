#version 300 es
in vec3 a_position;
in vec3 a_normal;
in vec3 a_color;

uniform mat4 u_camera;
uniform vec3 u_light_direction;

out lowp vec3 v_color;
out highp vec3 v_normal;

void main() {
    gl_Position = u_camera * vec4(a_position.xyz, 1.0);
    v_color = a_color;
    v_normal = a_normal;
}