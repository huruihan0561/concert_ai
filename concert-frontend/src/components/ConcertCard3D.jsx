import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, Html } from '@react-three/drei';
import * as THREE from 'three';

function Card3D({ concert, position, onClick }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      // 悬浮动画
      meshRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * 0.5) * 0.1;

      // 鼠标悬停时的旋转效果
      if (hovered) {
        meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, 0.2, 0.1);
        meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, -0.1, 0.1);
      } else {
        meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, 0, 0.05);
        meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, 0, 0.05);
      }
    }
  });

  return (
    <group
      ref={meshRef}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={onClick}
    >
      {/* 卡片主体 */}
      <mesh>
        <boxGeometry args={[2.5, 3.5, 0.1]} />
        <meshStandardMaterial
          color="#1a1a2e"
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>

      {/* 发光边框 */}
      <mesh scale={[2.55, 3.55, 0.08]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color={hovered ? '#00e5ff' : '#a855f7'}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* 海报区域 */}
      <Html
        transform
        occlude
        position={[0, 0.3, 0.06]}
        style={{
          width: '220px',
          height: '280px',
          pointerEvents: 'none',
        }}
      >
        <div
          className="w-full h-full rounded-lg overflow-hidden"
          style={{
            background: concert.imageUrl
              ? `url(${concert.imageUrl}) center/cover`
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          {!concert.imageUrl && (
            <div className="w-full h-full flex items-center justify-center text-white/50 text-4xl font-bold">
              {concert.singer?.[0]}
            </div>
          )}
        </div>
      </Html>

      {/* 歌手名字 */}
      <Html
        transform
        position={[0, -1.3, 0.06]}
        style={{
          width: '220px',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <div className="text-white font-bold text-lg drop-shadow-lg">
          {concert.singer}
        </div>
      </Html>

      {/* 城市信息 */}
      <Html
        transform
        position={[0, -1.6, 0.06]}
        style={{
          width: '220px',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <div className="text-white/70 text-sm">
          {concert.city} · {concert.venue}
        </div>
      </Html>
    </group>
  );
}

export default function ConcertCard3D({ concerts, onCardClick }) {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      // 整体缓慢旋转
      groupRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.1) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {concerts.slice(0, 3).map((concert, index) => (
        <Card3D
          key={concert.id}
          concert={concert}
          position={[(index - 1) * 3.5, 0, 0]}
          onClick={() => onCardClick?.(concert)}
        />
      ))}
    </group>
  );
}
