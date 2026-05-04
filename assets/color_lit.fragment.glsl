#version 300 es

precision highp float;

in lowp vec3 v_color;
in highp vec3 v_normal;

uniform highp vec3 u_light_direction;
uniform lowp float u_ambient;

out vec4 fragColor;

void main() {
    lowp float diffuse = max(dot(normalize(v_normal), normalize(u_light_direction)), 0.0);
    lowp float intensity = u_ambient + (1.0 - u_ambient) * diffuse;
    fragColor = vec4(v_color.xyz * intensity, 1.0);
}