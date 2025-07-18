import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';

// Enhanced Animated Vault with better visuals
function AnimatedVault({ position, color, delay = 0 }: { position: [number, number, number], color: string, delay?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      meshRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.3) * 0.05;
    }
    
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.02;
      particlesRef.current.rotation.x += 0.005;
    }

    if (glowRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      glowRef.current.scale.setScalar(scale);
    }
  });

  useEffect(() => {
    if (meshRef.current) {
      gsap.fromTo(meshRef.current.scale, 
        { x: 0, y: 0, z: 0 },
        { 
          x: 1, 
          y: 1, 
          z: 1, 
          duration: 1.5, 
          delay,
          ease: "elastic.out(1, 0.5)"
        }
      );
    }
  }, [delay]);

  return (
    <group position={position}>
      {/* Main Vault Cube */}
      <mesh ref={meshRef}>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={0.3}
          transparent
          opacity={0.9}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>

      {/* Glowing Outline */}
      <mesh ref={glowRef}>
        <boxGeometry args={[1.3, 1.3, 1.3]} />
        <meshBasicMaterial 
          color={color}
          transparent
          opacity={0.2}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Enhanced Floating Particles */}
      <group ref={particlesRef}>
        {Array.from({ length: 30 }).map((_, i) => {
          const radius = 2.5 + Math.sin(i) * 0.5;
          return (
            <mesh key={i} position={[
              Math.cos(i * 0.314) * radius,
              Math.sin(i * 0.314) * radius,
              Math.sin(i * 0.628) * 1.5
            ]}>
              <sphereGeometry args={[0.03]} />
              <meshBasicMaterial 
                color={color} 
                transparent
                opacity={0.8}
              />
            </mesh>
          );
        })}
      </group>

      {/* Data Streams */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh 
          key={`stream-${i}`}
          position={[
            Math.cos(i * Math.PI / 4) * 1.8,
            0,
            Math.sin(i * Math.PI / 4) * 1.8
          ]}
          rotation={[0, i * Math.PI / 4, 0]}
        >
          <cylinderGeometry args={[0.02, 0.02, 3]} />
          <meshBasicMaterial 
            color={color}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}

// Enhanced Liquidity Vortex with more dynamic effects
function LiquidityVortex() {
  const vortexRef = useRef<THREE.Group>(null);
  const energyCoreRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (vortexRef.current) {
      vortexRef.current.rotation.y += 0.008;
      vortexRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
    }

    if (energyCoreRef.current) {
      energyCoreRef.current.rotation.x += 0.02;
      energyCoreRef.current.rotation.y += 0.03;
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
      energyCoreRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group ref={vortexRef}>
      {/* Central Energy Core */}
      <mesh ref={energyCoreRef}>
        <icosahedronGeometry args={[0.5, 2]} />
        <meshStandardMaterial 
          color="#00f5d4" 
          emissive="#00f5d4"
          emissiveIntensity={0.8}
          transparent
          opacity={0.9}
          roughness={0}
          metalness={1}
        />
      </mesh>

      {/* Orbiting Rings */}
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh 
          key={i} 
          position={[0, i * 0.4 - 0.6, 0]}
          rotation={[Math.PI / 2, 0, i * Math.PI / 4]}
        >
          <torusGeometry args={[2.5 + i * 0.3, 0.08, 16, 100]} />
          <meshStandardMaterial 
            color={i % 2 === 0 ? "#00f5d4" : "#9b5de5"} 
            emissive={i % 2 === 0 ? "#00f5d4" : "#9b5de5"}
            emissiveIntensity={0.4}
            transparent
            opacity={0.7 - i * 0.1}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
      ))}

      {/* Connecting Energy Lines */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh 
          key={`line-${i}`}
          position={[
            Math.cos(i * Math.PI / 6) * 3,
            Math.sin(i * 0.5) * 2,
            Math.sin(i * Math.PI / 6) * 3
          ]}
          rotation={[i * 0.3, i * 0.5, 0]}
        >
          <cylinderGeometry args={[0.01, 0.01, 4]} />
          <meshBasicMaterial 
            color="#00f5d4"
            transparent
            opacity={0.4}
          />
        </mesh>
      ))}
    </group>
  );
}

// Background Grid Effect
function BackgroundGrid() {
  const gridRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (gridRef.current) {
      gridRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <group ref={gridRef} position={[0, 0, -5]}>
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh 
          key={`grid-${i}`}
          position={[(i - 10) * 2, 0, 0]}
        >
          <cylinderGeometry args={[0.005, 0.005, 20]} />
          <meshBasicMaterial 
            color="#00f5d4"
            transparent
            opacity={0.1}
          />
        </mesh>
      ))}
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh 
          key={`grid-v-${i}`}
          position={[0, (i - 10) * 2, 0]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.005, 0.005, 20]} />
          <meshBasicMaterial 
            color="#9b5de5"
            transparent
            opacity={0.1}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function Hero3D() {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // GSAP scene entrance animation
    if (canvasRef.current) {
      gsap.fromTo(canvasRef.current, 
        { opacity: 0, scale: 0.9 },
        { 
          opacity: 1, 
          scale: 1, 
          duration: 2.5, 
          ease: "power3.out" 
        }
      );
    }
  }, []);

  return (
    <div ref={canvasRef} className="w-full h-[700px] relative">
      <Canvas
        camera={{ position: [0, 2, 10], fov: 60 }}
        style={{ background: 'transparent' }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={2} color="#00f5d4" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#9b5de5" />
        <spotLight 
          position={[0, 20, 0]} 
          intensity={1} 
          color="#ff206e"
          angle={Math.PI / 6}
          penumbra={0.5}
        />
        
        {/* Background Grid */}
        <BackgroundGrid />
        
        {/* Central Liquidity Vortex */}
        <LiquidityVortex />
        
        {/* Enhanced Floating Vaults */}
        <AnimatedVault 
          position={[-4, 2, 1]} 
          color="#00f5d4" 
          delay={0.5} 
        />
        <AnimatedVault 
          position={[4, -1, 2]} 
          color="#9b5de5" 
          delay={1} 
        />
        <AnimatedVault 
          position={[0, 3, -1]} 
          color="#ff206e" 
          delay={1.5} 
        />
        <AnimatedVault 
          position={[-2, -2, 3]} 
          color="#00f5d4" 
          delay={2} 
        />
      </Canvas>
    </div>
  );
}