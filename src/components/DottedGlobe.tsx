import React, { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { DottedGlobeMaterial } from '@/graphics/DottedGlobeMaterial';

function GlobeScene() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<DottedGlobeMaterial>(null);
  const { camera } = useThree();

  const [geometry, material] = useMemo(() => {
    const geom = new THREE.SphereGeometry(1, 64, 32);
    const mat = new DottedGlobeMaterial();
    return [geom, mat];
  }, []);

  useEffect(() => {
    camera.position.set(0, 0, 3);
  }, [camera]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
    if (material && 'uniforms' in material) {
      (material as any).uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} />
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