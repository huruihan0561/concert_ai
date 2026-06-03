import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box, Cylinder, Text, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';

const Stadium = ({ highlightedSection }) => {
  const groupRef = useRef();
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* 主舞台 */}
      <Box args={[8, 1, 4]} position={[0, 0.5, -8]}>
        <meshStandardMaterial color="#1a1a2e" />
      </Box>
      
      {/* 舞台灯光效果 */}
      <Cylinder args={[0.2, 0.2, 6]} position={[-3, 3, -8]} rotation={[0, 0, 0]}>
        <meshStandardMaterial color="#00f3ff" emissive="#00f3ff" emissiveIntensity={0.5} />
      </Cylinder>
      <Cylinder args={[0.2, 0.2, 6]} position={[3, 3, -8]} rotation={[0, 0, 0]}>
        <meshStandardMaterial color="#00f3ff" emissive="#00f3ff" emissiveIntensity={0.5} />
      </Cylinder>
      
      {/* 内场座位区 */}
      <Box args={[12, 0.5, 8]} position={[0, 0, -2]}>
        <meshStandardMaterial 
          color={highlightedSection === 'inner' ? '#ff00ff' : '#16213e'} 
          emissive={highlightedSection === 'inner' ? '#ff00ff' : '#000000'}
          emissiveIntensity={highlightedSection === 'inner' ? 0.3 : 0}
        />
      </Box>
      
      {/* 看台区 - 左侧 */}
      <Box args={[4, 0.5, 12]} position={[-10, 1, 2]} rotation={[0, 0, -0.2]}>
        <meshStandardMaterial 
          color={highlightedSection === 'left' ? '#00f3ff' : '#0f3460'}
          emissive={highlightedSection === 'left' ? '#00f3ff' : '#000000'}
          emissiveIntensity={highlightedSection === 'left' ? 0.3 : 0}
        />
      </Box>
      
      {/* 看台区 - 右侧 */}
      <Box args={[4, 0.5, 12]} position={[10, 1, 2]} rotation={[0, 0, 0.2]}>
        <meshStandardMaterial 
          color={highlightedSection === 'right' ? '#00f3ff' : '#0f3460'}
          emissive={highlightedSection === 'right' ? '#00f3ff' : '#000000'}
          emissiveIntensity={highlightedSection === 'right' ? 0.3 : 0}
        />
      </Box>
      
      {/* 看台区 - 后侧 */}
      <Box args={[12, 0.5, 4]} position={[0, 1.5, 10]} rotation={[0.2, 0, 0]}>
        <meshStandardMaterial 
          color={highlightedSection === 'back' ? '#bf00ff' : '#533483'}
          emissive={highlightedSection === 'back' ? '#bf00ff' : '#000000'}
          emissiveIntensity={highlightedSection === 'back' ? 0.3 : 0}
        />
      </Box>
      
      {/* 入口标识 */}
      <Text
        position={[0, 0.1, 8]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.8}
        color="#00f3ff"
        anchorX="center"
        anchorY="middle"
      >
        主入口
      </Text>
      
      <Text
        position={[-8, 0.1, 0]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        fontSize={0.6}
        color="#00f3ff"
        anchorX="center"
        anchorY="middle"
      >
        A入口
      </Text>
      
      <Text
        position={[8, 0.1, 0]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        fontSize={0.6}
        color="#00f3ff"
        anchorX="center"
        anchorY="middle"
      >
        B入口
      </Text>
    </group>
  );
};

const Scene = ({ highlightedSection }) => {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#00f3ff" />
      <pointLight position={[-10, 10, -10]} intensity={0.5} color="#ff00ff" />
      <spotLight position={[0, 20, 0]} angle={0.5} penumbra={0.5} intensity={1} />
      
      <Grid
        position={[0, -0.1, 0]}
        args={[50, 50]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#00f3ff"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#ff00ff"
        fadeDistance={25}
        fadeStrength={1}
        infiniteGrid
      />
      
      <Stadium highlightedSection={highlightedSection} />
      
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={10}
        maxDistance={50}
        maxPolarAngle={Math.PI / 2 - 0.1}
      />
    </>
  );
};

const Venue3D = ({ venueName = '奥体中心' }) => {
  const [highlightedSection, setHighlightedSection] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const sections = [
    { id: 'inner', name: '内场VIP区', price: '¥1880', color: '#ff00ff' },
    { id: 'left', name: '看台A区', price: '¥880', color: '#00f3ff' },
    { id: 'right', name: '看台B区', price: '¥880', color: '#00f3ff' },
    { id: 'back', name: '看台C区', price: '¥580', color: '#bf00ff' },
  ];

  return (
    <div className="w-full h-full flex flex-col lg:flex-row">
      <div className="flex-1 relative min-h-[400px] lg:min-h-0">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-dark-900/80 z-10">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-neon-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400">加载3D场馆模型...</p>
            </div>
          </div>
        )}
        <Canvas camera={{ position: [15, 15, 15], fov: 45 }}>
          <Scene highlightedSection={highlightedSection} />
        </Canvas>
        
        <div className="absolute bottom-4 left-4 glass rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">操作说明</p>
          <p className="text-xs text-gray-500">左键旋转 | 右键平移 | 滚轮缩放</p>
        </div>
      </div>
      
      <div className="lg:w-64 p-4 space-y-4">
        <h3 className="text-lg font-bold text-white mb-4">{venueName} 座位图</h3>
        
        <div className="space-y-2">
          {sections.map((section) => (
            <motion.button
              key={section.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setHighlightedSection(highlightedSection === section.id ? null : section.id)}
              className={`w-full p-3 rounded-xl border transition-all ${
                highlightedSection === section.id
                  ? 'bg-white/10 border-neon-blue'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: section.color, boxShadow: `0 0 10px ${section.color}` }}
                  />
                  <span className="text-sm text-white">{section.name}</span>
                </div>
                <span className="text-sm font-medium" style={{ color: section.color }}>{section.price}</span>
              </div>
            </motion.button>
          ))}
        </div>
        
        <div className="pt-4 border-t border-white/10">
          <h4 className="text-sm font-medium text-gray-300 mb-2">场馆信息</h4>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• 容纳人数: 约 60,000 人</li>
            <li>• 停车场: 3,000 个车位</li>
            <li>• 安检口: 8 个</li>
            <li>• 卫生间: 每层 12 处</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Venue3D;
