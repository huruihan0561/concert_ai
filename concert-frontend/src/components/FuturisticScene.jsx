import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Icosahedron, MeshDistortMaterial, OrbitControls, Points, PointMaterial, Stars } from '@react-three/drei';
import * as THREE from 'three';

function CoreOrb() {
  return (
    <Float speed={2.2} rotationIntensity={1.2} floatIntensity={2.2}>
      <mesh>
        <icosahedronGeometry args={[1.35, 8]} />
        <MeshDistortMaterial
          color="#7c3aed"
          emissive="#22d3ee"
          emissiveIntensity={1.2}
          metalness={0.35}
          roughness={0.08}
          distort={0.38}
          speed={2.8}
          transparent
          opacity={0.92}
        />
      </mesh>
    </Float>
  );
}

function EnergyRings() {
  const groupRef = useRef(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.z += delta * 0.12;
      groupRef.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <group ref={groupRef} rotation={[Math.PI / 3.4, 0, 0]}>
      {[1.9, 2.35, 2.8].map((radius, index) => (
        <mesh key={radius} rotation={[0, index * 0.35, index * 0.6]}>
          <torusGeometry args={[radius, 0.026, 16, 120]} />
          <meshBasicMaterial
            color={index === 1 ? '#22d3ee' : '#a855f7'}
            transparent
            opacity={0.35 - index * 0.07}
          />
        </mesh>
      ))}
    </group>
  );
}

function ParticleField() {
  const positions = useMemo(() => {
    const points = new Float32Array(1800 * 3);
    for (let i = 0; i < 1800; i += 1) {
      const r = 8 + Math.random() * 18;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      points[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      points[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      points[i * 3 + 2] = r * Math.cos(phi);
    }
    return points;
  }, []);

  return (
    <Points positions={positions} stride={3} frustumCulled>
      <PointMaterial
        transparent
        color="#67e8f9"
        size={0.045}
        sizeAttenuation
        depthWrite={false}
        opacity={0.8}
      />
    </Points>
  );
}

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.7} color="#6d28d9" />
      <directionalLight position={[5, 6, 4]} intensity={2.4} color="#22d3ee" />
      <pointLight position={[-6, -3, -5]} intensity={2.2} color="#a855f7" />
      <pointLight position={[0, 0, 0]} intensity={1.6} color="#ffffff" />
    </>
  );
}

const FuturisticScene = ({ className = '' }) => {
  return (
    <div className={`absolute inset-0 ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 7.5], fov: 48 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#040511']} />
        <fog attach="fog" args={['#040511', 8, 24]} />
        <SceneLights />
        <Stars radius={90} depth={50} count={3000} factor={4} saturation={0} fade speed={0.7} />
        <ParticleField />
        <CoreOrb />
        <EnergyRings />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.8}
        />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.12),transparent_35%),radial-gradient(circle_at_30%_20%,rgba(168,85,247,0.16),transparent_28%),linear-gradient(180deg,rgba(4,5,17,0)_0%,rgba(4,5,17,0.88)_100%)]" />
    </div>
  );
};

export default FuturisticScene;
