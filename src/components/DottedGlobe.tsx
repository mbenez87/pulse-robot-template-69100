import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

function GlobeScene() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 0, 3);
  }, [camera]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 32]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={{
          uColorBg: { value: new THREE.Color("#2f2eea") },
          uDotColor: { value: new THREE.Color("#ffffff") },
          uDotSize: { value: 0.045 },
          uDotSpacing: { value: new THREE.Vector3(0.06, 0.06, 0.0) },
          uTime: { value: 0.0 },
          uLightDir: { value: new THREE.Vector3(0.5, 0.25, 1.0).normalize() },
          uGloss: { value: 0.35 }
        }}
        vertexShader={`
          varying vec2 vUv;
          varying vec3 vNormal;
          void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          precision highp float;
          varying vec2 vUv;
          varying vec3 vNormal;

          uniform vec3 uColorBg;
          uniform vec3 uDotColor;
          uniform vec3 uLightDir;
          uniform float uGloss;
          uniform float uDotSize;
          uniform vec3 uDotSpacing;

          float aastep(float threshold, float value) {
            float afwidth = fwidth(value) * 0.5;
            return smoothstep(threshold - afwidth, threshold + afwidth, value);
          }

          void main() {
            vec2 grid = vec2(
              fract(vUv.x / uDotSpacing.x),
              fract(vUv.y / uDotSpacing.y)
            );

            vec2 cellCenter = vec2(0.5, 0.5);
            float distToCenter = length(grid - cellCenter);
            float dot = 1.0 - aastep(uDotSize * 0.5, distToCenter);

            float ndl = max(dot(normalize(vNormal), normalize(uLightDir)), 0.0);
            float rim = pow(1.0 - max(dot(normalize(vNormal), vec3(0.0,0.0,1.0)), 0.0), 2.0);
            vec3 base = uColorBg * (0.55 + 0.45 * ndl) + rim * uGloss;

            vec3 color = mix(base, uDotColor, dot);
            gl_FragColor = vec4(color, 1.0);
          }
        `}
        transparent={false}
      />
    </mesh>
  );
}

export default function DottedGlobe() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 3], fov: 45 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={0.5} />
        <GlobeScene />
      </Canvas>
    </div>
  );
}