"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage } from "@react-three/drei";
import { ArisModel3D } from "./ArisModel3D";
import { Suspense, useState, useEffect } from "react";
import { Brain } from "lucide-react";

interface ArisMascotCanvasProps {
  state?: "idle" | "happy" | "thinking" | "success" | "excited" | "wave" | "proud" | "sleep" | "reflect" | "cheer" | "focused" | "confused" | "celebrate";
  cheeks?: number;
  energy?: number;
  leaf?: number;
  size?: number;
  interactive?: boolean;
}

export function ArisMascotCanvas({
  state = "idle",
  cheeks = 0.6,
  energy = 0.6,
  leaf = 1.0,
  size = 120,
  interactive = true,
}: ArisMascotCanvasProps) {
  const [mounted, setMounted] = useState(false);

  // Avoid SSR hydration issues with WebGL canvas
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div 
        style={{ width: size, height: size * 1.15 }} 
        className="flex items-center justify-center bg-transparent"
      >
        <Brain className="w-8 h-8 animate-pulse text-indigo-400" />
      </div>
    );
  }

  return (
    <div style={{ width: size, height: size * 1.15 }} className="relative bg-transparent select-none outline-none">
      <Canvas
        shadows
        camera={{ position: [0, 0.2, 3.4], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
        className="bg-transparent outline-none select-none"
      >
        {/* Soft Ambient Light for base fill */}
        <ambientLight intensity={1.2} />

        {/* Dynamic Studio Key Light for high-quality shadows */}
        <directionalLight
          castShadow
          position={[2, 4, 3]}
          intensity={2.2}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={0.5}
          shadow-camera-far={10}
          shadow-camera-left={-2}
          shadow-camera-right={2}
          shadow-camera-top={2}
          shadow-camera-bottom={-2}
          shadow-bias={-0.0005}
        />

        {/* Back Light / Rim Light for silhouette separation */}
        <directionalLight position={[-2, 1, -3]} intensity={1.8} color="#e0e7ff" />

        {/* Subtle ground bounce fill light */}
        <directionalLight position={[0, -3, 0]} intensity={0.4} color="#fef08a" />

        {/* Glowing Face Visor Emissive Point Light */}
        {state !== "sleep" && (
          <pointLight position={[0, 0.4, 1.2]} intensity={0.8} distance={2.5} color="#00ffff" />
        )}

        {/* 3D Character Mesh */}
        <Suspense fallback={null}>
          <ArisModel3D state={state} cheeks={cheeks} energy={energy} leaf={leaf} />
        </Suspense>

        {/* Soft Shadow Catcher Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.68, 0]} receiveShadow>
          <planeGeometry args={[10, 10]} />
          <shadowMaterial opacity={0.16} />
        </mesh>

        {/* Interactive Orbit Camera Controls */}
        {interactive && (
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            maxPolarAngle={Math.PI / 2 + 0.15} // Limit vertical rotation
            minPolarAngle={Math.PI / 3}
            maxAzimuthAngle={Math.PI / 4}     // Limit horizontal rotation
            minAzimuthAngle={-Math.PI / 4}
            dampingFactor={0.05}
            enableDamping
          />
        )}
      </Canvas>
    </div>
  );
}
