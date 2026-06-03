import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshTransmissionMaterial, Environment } from '@react-three/drei';
import * as THREE from 'three';

// 发光圆环
const NeonRing = ({ radius = 8, tube = 0.04, color, rotationSpeed = 0.3, phase = 0 }) => {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = state.clock.elapsedTime * rotationSpeed + phase;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, tube, 16, 120]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={3}
        toneMapped={false}
      />
    </mesh>
  );
};

// 舞台底座
const Stage = () => {
  return (
    <group position={[0, -3, 0]}>
      {/* 主舞台 */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[14, 16, 0.5, 64]} />
        <meshStandardMaterial color="#0a0a1a" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* 发光边缘 */}
      <mesh position={[0, 0.26, 0]}>
        <torusGeometry args={[14, 0.08, 8, 120]} />
        <meshStandardMaterial
          color="#00f3ff"
          emissive="#00f3ff"
          emissiveIntensity={5}
          toneMapped={false}
        />
      </mesh>
      {/* 舞台格栅 */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[Math.cos((i / 8) * Math.PI * 2) * 12, 0.1, Math.sin((i / 8) * Math.PI * 2) * 12]}>
          <cylinderGeometry args={[1.5, 1.5, 0.15, 32]} />
          <meshStandardMaterial
            color="#00f3ff"
            emissive="#00f3ff"
            emissiveIntensity={2}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
};

// 浮动光柱
const LightBeam = ({ position, color, delay = 0 }) => {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime + delay;
      meshRef.current.material.opacity = 0.08 + Math.sin(t * 0.8) * 0.04;
    }
  });

  return (
    <mesh ref={meshRef} position={position} scale={[1, 1, 1]}>
      <cylinderGeometry args={[0.3, 0.3, 30, 8]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.1}
        emissive={color}
        emissiveIntensity={2}
        depthWrite={false}
      />
    </mesh>
  );
};

// 声波圆环
const SoundWave = ({ radius = 0.5 }) => {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime;
      groupRef.current.children.forEach((mesh, i) => {
        const phase = (t * 0.8 + i * 0.4) % 3;
        const scale = 0.5 + phase * 1.5;
        mesh.scale.setScalar(scale);
        mesh.material.opacity = Math.max(0, 1 - phase / 3);
      });
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius, radius + 0.03, 64]} />
          <meshStandardMaterial
            color="#00f3ff"
            emissive="#00f3ff"
            emissiveIntensity={3}
            transparent
            opacity={0.5}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
};

// 漂浮音符几何体
const FloatingNote = ({ position, color, speed }) => {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.005 * speed;
      meshRef.current.rotation.y += 0.008 * speed;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5 * speed + position[0]) * 0.5;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <octahedronGeometry args={[0.15]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={4}
        toneMapped={false}
      />
    </mesh>
  );
};

// 主场景内容
const SceneContent = () => {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  const floatingNotes = useMemo(() => {
    const notes = [];
    const colors = ['#00f3ff', '#ff00ff', '#bf00ff', '#00ff9f', '#ff6b6b'];
    for (let i = 0; i < 12; i++) {
      notes.push({
        position: [
          (Math.random() - 0.5) * 16,
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 10,
        ],
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: 0.5 + Math.random() * 1.5,
      });
    }
    return notes;
  }, []);

  const beams = useMemo(() => [
    { position: [6, 5, -2], color: '#00f3ff', delay: 0 },
    { position: [-6, 5, -2], color: '#ff00ff', delay: 1 },
    { position: [0, 5, -5], color: '#bf00ff', delay: 2 },
    { position: [4, 5, 2], color: '#00ff9f', delay: 0.5 },
    { position: [-4, 5, 2], color: '#ff6b6b', delay: 1.5 },
  ], []);

  return (
    <>
      {/* 舞台 */}
      <Stage />

      {/* 舞台中心声波 */}
      <group position={[0, 0.3, -2]}>
        <SoundWave />
      </group>

      {/* 同心圆环 */}
      <group ref={groupRef} position={[0, 0.5, -2]}>
        <NeonRing radius={3} color="#00f3ff" rotationSpeed={0.2} phase={0} />
        <NeonRing radius={5} color="#ff00ff" rotationSpeed={-0.15} phase={1} />
        <NeonRing radius={7} color="#bf00ff" rotationSpeed={0.1} phase={2} />
        <NeonRing radius={9.5} color="#00ff9f" rotationSpeed={-0.08} phase={0.5} />
      </group>

      {/* 光柱 */}
      {beams.map((b, i) => (
        <LightBeam key={i} {...b} />
      ))}

      {/* 漂浮音符 */}
      {floatingNotes.map((n, i) => (
        <FloatingNote key={i} {...n} />
      ))}

      {/* 环境光 */}
      <ambientLight intensity={0.15} />
      {/* 舞台聚光灯 */}
      <spotLight position={[0, 15, 5]} angle={0.4} penumbra={0.8} intensity={80} color="#ffffff" castShadow />
      <spotLight position={[-8, 12, 0]} angle={0.5} penumbra={1} intensity={40} color="#00f3ff" />
      <spotLight position={[8, 12, 0]} angle={0.5} penumbra={1} intensity={40} color="#ff00ff" />
      <pointLight position={[0, 3, 0]} intensity={5} color="#00f3ff" distance={20} />
      {/* 舞台后方填充 */}
      <pointLight position={[0, 5, -8]} intensity={3} color="#bf00ff" distance={15} />
    </>
  );
};

// 3D 舞台场景
const ConcertScene3D = ({ className = '' }) => {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 4, 18], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <fog attach="fog" args={['#020208', 25, 50]} />
        <SceneContent />
      </Canvas>
    </div>
  );
};

export default ConcertScene3D;
