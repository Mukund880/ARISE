import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ArisModel3DProps {
  state?: "idle" | "happy" | "thinking" | "success" | "excited" | "wave" | "proud" | "sleep" | "reflect" | "cheer" | "focused" | "confused" | "celebrate";
  cheeks?: number;
  energy?: number;
  leaf?: number;
}

export function ArisModel3D({
  state = "idle",
  cheeks = 0.6,
  energy = 0.6,
  leaf = 1.0,
}: ArisModel3DProps) {
  const characterRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const sproutRef = useRef<THREE.Group>(null);

  // Soft target for head look-at tracking
  const targetRotation = useRef({ x: 0, y: 0 });

  // Floating animation duration adjusted by energy
  const floatSpeed = 1.8 * energy;
  const floatHeight = 0.12;

  useFrame((threeState) => {
    const elapsed = threeState.clock.getElapsedTime();

    // 1. Float and Breathe Animation (squash/stretch)
    if (characterRef.current) {
      // Y Floating
      const yFloat = Math.sin(elapsed * floatSpeed) * floatHeight;
      characterRef.current.position.y = state === "sleep" ? yFloat * 0.4 - 0.2 : yFloat;

      // Subtle breathing scale
      const breathScale = 1.0 + Math.sin(elapsed * floatSpeed * 1.1) * 0.015;
      characterRef.current.scale.set(
        breathScale,
        1.0 + Math.sin(elapsed * floatSpeed) * 0.01,
        breathScale
      );
    }

    // 2. Head Tracking (follow mouse pointer)
    if (headRef.current) {
      if (state === "sleep") {
        // Sleep state: Head tilted down, no cursor tracking
        targetRotation.current = { x: 0.35, y: 0 };
      } else if (state === "thinking") {
        // Thinking: Head tilted to the side and slightly up
        targetRotation.current = { x: -0.1, y: -0.25 };
      } else if (state === "confused") {
        // Confused: Head tilted sideways
        targetRotation.current = { x: 0.05, y: 0.3 };
      } else {
        // Normal states: Track pointer with clamping
        const px = threeState.pointer.x; // [-1, 1]
        const py = threeState.pointer.y; // [-1, 1]
        targetRotation.current = {
          x: -py * 0.3, // Pitch
          y: px * 0.45,  // Yaw
        };
      }

      // Smooth interpolation (lerp)
      headRef.current.rotation.x = THREE.MathUtils.lerp(
        headRef.current.rotation.x,
        targetRotation.current.x,
        0.08
      );
      headRef.current.rotation.y = THREE.MathUtils.lerp(
        headRef.current.rotation.y,
        targetRotation.current.y,
        0.08
      );
    }

    // 3. Sprout Wind Sway (Secondary Lag Motion)
    if (sproutRef.current) {
      const swaySpeed = state === "sleep" ? 1.0 : 3.0;
      const swayAmount = state === "sleep" ? 0.02 : 0.08;
      sproutRef.current.rotation.z = Math.sin(elapsed * swaySpeed) * swayAmount;
      sproutRef.current.rotation.x = Math.cos(elapsed * swaySpeed * 0.8) * (swayAmount * 0.5);
    }

    // 4. Wave Animation (Interactive arm wave)
    if (leftArmRef.current && rightArmRef.current) {
      if (state === "wave" || state === "excited" || state === "cheer" || state === "celebrate") {
        // Animate right arm waving
        rightArmRef.current.rotation.z = -Math.PI / 3 + Math.sin(elapsed * 10) * 0.4;
        rightArmRef.current.rotation.x = -Math.PI / 6;
        leftArmRef.current.rotation.z = Math.PI / 4; // default down
      } else if (state === "sleep") {
        // Sleep state: arms tucked in close
        leftArmRef.current.rotation.z = Math.PI / 6;
        rightArmRef.current.rotation.z = -Math.PI / 6;
        leftArmRef.current.rotation.x = 0.2;
        rightArmRef.current.rotation.x = 0.2;
      } else {
        // Default rest positions
        leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, Math.PI / 5, 0.1);
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, -Math.PI / 5, 0.1);
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, 0, 0.1);
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, 0, 0.1);
      }
    }
  });

  return (
    <group ref={characterRef} position={[0, -0.4, 0]}>
      {/* 1. HEAD & HELMET */}
      <group ref={headRef} position={[0, 0.6, 0]}>
        {/* Helmet Sphere */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[1.15, 64, 64]} />
          <meshStandardMaterial
            color="#FAF9F6"
            roughness={0.12}
            metalness={0.05}
          />
        </mesh>

        {/* Visor Screen */}
        <mesh position={[0, 0.05, 0.35]} rotation={[0.08, 0, 0]} castShadow>
          <sphereGeometry args={[0.92, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
          <meshStandardMaterial
            color="#090a0f"
            roughness={0.06}
            metalness={0.9}
          />
        </mesh>

        {/* EYES (DYNAMIC BY STATE) */}
        <group position={[0, 0.12, 1.15]} scale={[0.85, 0.85, 0.85]}>
          {/* Left Eye */}
          <group position={[-0.38, 0, -0.32]}>
            {state === "sleep" ? (
              // Sleeping: Horizontal thin lines
              <mesh ref={leftEyeRef}>
                <boxGeometry args={[0.22, 0.03, 0.02]} />
                <meshBasicMaterial color="#00ffff" />
              </mesh>
            ) : state === "happy" || state === "excited" || state === "cheer" || state === "success" || state === "celebrate" ? (
              // Happy: Arched ring segments (happy eyes)
              <mesh ref={leftEyeRef} rotation={[0, 0, Math.PI]}>
                <torusGeometry args={[0.1, 0.025, 8, 24, Math.PI]} />
                <meshBasicMaterial color="#00ffff" />
              </mesh>
            ) : state === "thinking" || state === "confused" ? (
              // Thinking: Oval looking down/sideways
              <mesh ref={leftEyeRef} scale={[0.85, 1.25, 0.85]}>
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshBasicMaterial color="#00ffff" />
              </mesh>
            ) : (
              // Default/Idle: Big rounded cyan eyes
              <mesh ref={leftEyeRef}>
                <sphereGeometry args={[0.1, 16, 16]} />
                <meshBasicMaterial color="#00ffff" />
              </mesh>
            )}
          </group>

          {/* Right Eye */}
          <group position={[0.38, 0, -0.32]}>
            {state === "sleep" ? (
              <mesh ref={rightEyeRef}>
                <boxGeometry args={[0.22, 0.03, 0.02]} />
                <meshBasicMaterial color="#00ffff" />
              </mesh>
            ) : state === "happy" || state === "excited" || state === "cheer" || state === "success" || state === "celebrate" ? (
              <mesh ref={rightEyeRef} rotation={[0, 0, Math.PI]}>
                <torusGeometry args={[0.1, 0.025, 8, 24, Math.PI]} />
                <meshBasicMaterial color="#00ffff" />
              </mesh>
            ) : state === "thinking" || state === "confused" ? (
              <mesh ref={rightEyeRef} scale={[0.85, 1.25, 0.85]}>
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshBasicMaterial color="#00ffff" />
              </mesh>
            ) : (
              <mesh ref={rightEyeRef}>
                <sphereGeometry args={[0.1, 16, 16]} />
                <meshBasicMaterial color="#00ffff" />
              </mesh>
            )}
          </group>

          {/* Smiling Mouth */}
          {state !== "sleep" && (
            <mesh position={[0, -0.16, -0.26]} rotation={[0, 0, Math.PI]}>
              <torusGeometry args={[0.07, 0.02, 8, 16, Math.PI]} />
              <meshBasicMaterial color="#00ffff" />
            </mesh>
          )}

          {/* Cheeks Blush Glow */}
          {cheeks > 0 && (
            <group scale={[cheeks, cheeks, cheeks]}>
              <mesh position={[-0.52, -0.15, -0.38]}>
                <sphereGeometry args={[0.06, 8, 8]} />
                <meshBasicMaterial color="#ff007f" transparent opacity={0.6} />
              </mesh>
              <mesh position={[0.52, -0.15, -0.38]}>
                <sphereGeometry args={[0.06, 8, 8]} />
                <meshBasicMaterial color="#ff007f" transparent opacity={0.6} />
              </mesh>
            </group>
          )}
        </group>

        {/* HEADPHONES (LEFT & RIGHT) */}
        <group>
          {/* Headband */}
          <mesh rotation={[0, 0, 0]} position={[0, 0.2, 0]}>
            <torusGeometry args={[1.15, 0.04, 8, 48, Math.PI]} />
            <meshStandardMaterial color="#4f46e5" roughness={0.3} />
          </mesh>

          {/* Left Earcup */}
          <group position={[-1.15, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.26, 0.28, 0.15, 32]} />
              <meshStandardMaterial color="#4f46e5" roughness={0.2} />
            </mesh>
            {/* Glowing Accent */}
            <mesh position={[0, 0.08, 0]}>
              <cylinderGeometry args={[0.18, 0.18, 0.02, 16]} />
              <meshBasicMaterial color="#00ffff" />
            </mesh>
          </group>

          {/* Right Earcup */}
          <group position={[1.15, 0.1, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.26, 0.28, 0.15, 32]} />
              <meshStandardMaterial color="#4f46e5" roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.08, 0]}>
              <cylinderGeometry args={[0.18, 0.18, 0.02, 16]} />
              <meshBasicMaterial color="#00ffff" />
            </mesh>
          </group>
        </group>

        {/* LEAF SPROUT ON TOP */}
        <group ref={sproutRef} position={[0, 1.15, 0]} scale={[leaf, leaf, leaf]}>
          {/* Stem */}
          <mesh castShadow>
            <cylinderGeometry args={[0.02, 0.03, 0.25, 8]} />
            <meshStandardMaterial color="#22c55e" roughness={0.5} />
          </mesh>
          
          {/* Left Leaf */}
          <mesh position={[-0.1, 0.16, 0]} rotation={[0.4, 0, 0.6]} castShadow>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color="#22c55e" roughness={0.4} />
          </mesh>

          {/* Right Leaf */}
          <mesh position={[0.1, 0.16, 0]} rotation={[0.4, 0, -0.6]} castShadow>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color="#22c55e" roughness={0.4} />
          </mesh>
        </group>
      </group>

      {/* 2. BODY & HOODIE */}
      <group position={[0, -0.62, 0]}>
        {/* Hoodie Base */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.76, 32, 32]} />
          <meshStandardMaterial color="#FAF9F6" roughness={0.8} />
        </mesh>
        
        {/* Lower Hoodie Trim */}
        <mesh position={[0, -0.4, 0]} castShadow>
          <cylinderGeometry args={[0.55, 0.58, 0.35, 32]} />
          <meshStandardMaterial color="#FAF9F6" roughness={0.8} />
        </mesh>

        {/* 'A' Logo on Chest */}
        <group position={[0, -0.06, 0.7]} scale={[0.12, 0.12, 0.05]} rotation={[-0.1, 0, 0]}>
          {/* Left Leg of A */}
          <mesh position={[-0.4, 0, 0]} rotation={[0, 0, -0.25]}>
            <boxGeometry args={[0.3, 1.4, 1.0]} />
            <meshStandardMaterial color="#4f46e5" roughness={0.2} />
          </mesh>
          {/* Right Leg of A */}
          <mesh position={[0.4, 0, 0]} rotation={[0, 0, 0.25]}>
            <boxGeometry args={[0.3, 1.4, 1.0]} />
            <meshStandardMaterial color="#4f46e5" roughness={0.2} />
          </mesh>
          {/* Crossbar */}
          <mesh position={[0, -0.1, 0]}>
            <boxGeometry args={[0.6, 0.26, 1.0]} />
            <meshStandardMaterial color="#4f46e5" roughness={0.2} />
          </mesh>
        </group>

        {/* Blue and Yellow Drawstrings */}
        <mesh position={[-0.16, -0.22, 0.65]} rotation={[0.1, 0, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.32, 8]} />
          <meshStandardMaterial color="#06b6d4" roughness={0.6} />
        </mesh>
        <mesh position={[0.16, -0.22, 0.65]} rotation={[0.1, 0, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.32, 8]} />
          <meshStandardMaterial color="#eab308" roughness={0.6} />
        </mesh>
      </group>

      {/* 3. CAPE */}
      <group position={[0, -0.58, -0.15]}>
        {/* Cape Collar Roll */}
        <mesh position={[0, 0.25, 0.05]} rotation={[0, 0, 0]} castShadow>
          <torusGeometry args={[0.62, 0.15, 12, 36]} />
          <meshStandardMaterial color="#4338ca" roughness={0.7} />
        </mesh>

        {/* Cape Drape */}
        <mesh position={[0, -0.4, -0.42]} rotation={[-0.16, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.7, 1.15, 1.0, 32, 1, true, -Math.PI * 0.72, Math.PI * 1.44]} />
          <meshStandardMaterial color="#4338ca" roughness={0.85} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* 4. LIMBS */}
      
      {/* Left Arm */}
      <group ref={leftArmRef} position={[-0.8, -0.52, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#FAF9F6" roughness={0.8} />
        </mesh>
        <mesh position={[-0.1, -0.16, 0]} rotation={[0, 0, 0.3]} castShadow>
          <cylinderGeometry args={[0.14, 0.12, 0.32, 16]} />
          <meshStandardMaterial color="#FAF9F6" roughness={0.8} />
        </mesh>
        {/* Hand */}
        <mesh position={[-0.16, -0.36, 0]} castShadow>
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshStandardMaterial color="#FAF9F6" roughness={0.8} />
        </mesh>
      </group>

      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.8, -0.52, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#FAF9F6" roughness={0.8} />
        </mesh>
        <mesh position={[0.1, -0.16, 0]} rotation={[0, 0, -0.3]} castShadow>
          <cylinderGeometry args={[0.14, 0.12, 0.32, 16]} />
          <meshStandardMaterial color="#FAF9F6" roughness={0.8} />
        </mesh>
        {/* Hand */}
        <mesh position={[0.16, -0.36, 0]} castShadow>
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshStandardMaterial color="#FAF9F6" roughness={0.8} />
        </mesh>
      </group>

      {/* Left Leg */}
      <group position={[-0.32, -1.2, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.18, 0.16, 0.45, 16]} />
          <meshStandardMaterial color="#FAF9F6" roughness={0.8} />
        </mesh>
        {/* Foot */}
        <mesh position={[0, -0.22, 0.06]} scale={[1, 0.8, 1.3]} castShadow>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#FAF9F6" roughness={0.8} />
        </mesh>
      </group>

      {/* Right Leg */}
      <group position={[0.32, -1.2, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.18, 0.16, 0.45, 16]} />
          <meshStandardMaterial color="#FAF9F6" roughness={0.8} />
        </mesh>
        {/* Foot */}
        <mesh position={[0, -0.22, 0.06]} scale={[1, 0.8, 1.3]} castShadow>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#FAF9F6" roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}
