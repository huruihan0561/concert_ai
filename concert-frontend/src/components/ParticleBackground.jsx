import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function Particles({ count = 200 }) {
  const mesh = useRef();
  const light = useRef();

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 20;
      const y = (Math.random() - 0.5) * 20;
      const z = (Math.random() - 0.5) * 10;
      const size = Math.random() * 0.05 + 0.02;
      temp.push({ x, y, z, size });
    }
    return temp;
  }, [count]);

  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    particles.forEach((p, i) => {
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
    });
    return positions;
  }, [particles, count]);

  const sizes = useMemo(() => {
    const sizes = new Float32Array(count);
    particles.forEach((p, i) => {
      sizes[i] = p.size;
    });
    return sizes;
  }, [particles, count]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (mesh.current) {
      mesh.current.rotation.y = time * 0.02;
      mesh.current.rotation.x = time * 0.01;
    }
    if (light.current) {
      light.current.position.x = Math.sin(time * 0.5) * 5;
      light.current.position.z = Math.cos(time * 0.5) * 5;
    }
  });

  return (
    <>
      <pointLight ref={light} color="#00e5ff" intensity={2} distance={10} />
      <points ref={mesh}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={count}
            array={sizes}
            itemSize={1}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          color="#00e5ff"
          transparent
          opacity={0.6}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
}

function FloatingLights() {
  const group = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (group.current) {
      group.current.children.forEach((child, i) => {
        child.position.y = Math.sin(time * 0.5 + i) * 0.5;
        child.rotation.x = time * 0.2;
        child.rotation.y = time * 0.3;
      });
    }
  });

  return (
    <group ref={group}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[i * 3 - 3, 0, -5]}>
          <octahedronGeometry args={[0.3, 0]} />
          <meshStandardMaterial
            color={i === 0 ? '#00e5ff' : i === 1 ? '#a855f7' : '#f472b6'}
            emissive={i === 0 ? '#00e5ff' : i === 1 ? '#a855f7' : '#f472b6'}
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

function WaveGrid() {
  const mesh = useRef();
  const count = 50;

  const positions = useMemo(() => {
    const positions = [];
    for (let i = 0; i < count; i++) {
      for (let j = 0; j < count; j++) {
        positions.push((i - count / 2) * 0.3, 0, (j - count / 2) * 0.3);
      }
    }
    return new Float32Array(positions);
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (mesh.current) {
      const positions = mesh.current.geometry.attributes.position.array;
      for (let i = 0; i < count * count; i++) {
        const x = positions[i * 3];
        const z = positions[i * 3 + 2];
        positions[i * 3 + 1] = Math.sin(x * 0.5 + time) * 0.2 + Math.cos(z * 0.5 + time) * 0.2;
      }
      mesh.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={mesh} position={[0, -3, 0]} rotation={[-Math.PI / 4, 0, 0]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count * count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#a855f7"
        transparent
        opacity={0.3}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function ParticleBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.3} />
        <Particles count={150} />
        <FloatingLights />
        <WaveGrid />
      </Canvas>
    </div>
  );
}
