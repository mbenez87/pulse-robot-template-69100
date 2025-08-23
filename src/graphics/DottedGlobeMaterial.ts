import * as THREE from "three";
import { ShaderMaterial, Vector3, Color } from "three";

export class DottedGlobeMaterial extends ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        uColorBg: { value: new Color("#2f2eea") }, // sphere base (deep blue)
        uDotColor: { value: new Color("#ffffff") }, // dots
        uDotSize: { value: 0.045 },                 // dot diameter (UV space)
        uDotSpacing: { value: new Vector3(0.06, 0.06, 0.0) }, // lon/lat spacing
        uTime: { value: 0.0 },
        uLightDir: { value: new Vector3(0.5, 0.25, 1.0).normalize() },
        uGloss: { value: 0.35 }                     // subtle rim/specular
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          vUv = uv;                // (u = longitude, v = latitude)
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        varying vec3 vNormal;

        uniform vec3 uColorBg;
        uniform vec3 uDotColor;
        uniform vec3 uLightDir;
        uniform float uGloss;
        uniform float uDotSize;
        uniform vec3 uDotSpacing;

        // Anti-aliased step
        float aastep(float threshold, float value) {
          float afwidth = fwidth(value) * 0.5;
          return smoothstep(threshold - afwidth, threshold + afwidth, value);
        }

        void main() {
          // Convert UV to a repeated grid for dots
          // u repeats horizontally (longitude), v vertically (latitude)
          vec2 grid = vec2(
            fract(vUv.x / uDotSpacing.x),
            fract(vUv.y / uDotSpacing.y)
          );

          // Center of each cell
          vec2 cellCenter = vec2(0.5, 0.5);
          float distToCenter = length(grid - cellCenter);

          // Dot mask (soft edges)
          float dot = 1.0 - aastep(uDotSize * 0.5, distToCenter);

          // Base sphere color with subtle lighting
          float ndl = max(dot(normalize(vNormal), normalize(uLightDir)), 0.0);
          float rim = pow(1.0 - max(dot(normalize(vNormal), vec3(0.0,0.0,1.0)), 0.0), 2.0);
          vec3 base = uColorBg * (0.55 + 0.45 * ndl) + rim * uGloss;

          // Composite dots over base
          vec3 color = mix(base, uDotColor, dot);

          gl_FragColor = vec4(color, 1.0);
        }
      `,
      transparent: false
    });
  }
}