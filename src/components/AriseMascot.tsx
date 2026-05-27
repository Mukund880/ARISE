"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { useRive, useStateMachineInput } from "@rive-app/react-canvas";
import { useMascot } from "@/context/MascotContext";

interface AriseMascotProps {
  state?: "idle" | "happy" | "thinking" | "success" | "excited" | "wave" | "proud" | "sleep" | "reflect" | "cheer" | "focused" | "confused";
  
  // Rive Input values (also maps to Framer Motion fallback)
  cheeks?: number; // 0.0 to 1.0 (cheek blush glow)
  energy?: number; // 0.0 to 1.0 (float/breathe speed)
  leaf?: number;   // 0.0 to 1.0 (sprout scale/growth)
  
  // Explicit Triggers to fire animations manually
  triggerWave?: boolean | number;
  triggerCheer?: boolean | number;
  triggerCelebrate?: boolean | number;
  triggerSleep?: boolean | number;

  size?: number;
  interactive?: boolean;
  global?: boolean;
}

export function AriseMascot({
  state: localState = "idle",
  cheeks: localCheeks = 0.6,
  energy: localEnergy = 0.6,
  leaf: localLeaf = 1.0,
  triggerWave,
  triggerCheer,
  triggerCelebrate,
  triggerSleep,
  size = 120,
  interactive = true,
  global = false,
}: AriseMascotProps) {
  let contextState, contextCheeks, contextEnergy, contextLeaf;
  try {
    const context = useMascot();
    contextState = context.state;
    contextCheeks = context.cheeks;
    contextEnergy = context.energy;
    contextLeaf = context.leaf;
  } catch (e) {
    // Fail-safe fallback if used outside MascotProvider
  }

  const state = global && contextState ? contextState : localState;
  const cheeks = global && contextCheeks !== undefined ? contextCheeks : localCheeks;
  const energy = global && contextEnergy !== undefined ? contextEnergy : localEnergy;
  const leaf = global && contextLeaf !== undefined ? contextLeaf : localLeaf;
  const [hasRiveFile, setHasRiveFile] = useState(false);
  const [activeTrigger, setActiveTrigger] = useState<"wave" | "cheer" | "celebrate" | "sleep" | null>(null);
  const [isBlinking, setIsBlinking] = useState(false);
  const triggerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if Rive file exists in the public directory before attempting to mount
  useEffect(() => {
    fetch("/assets/aris.riv", { method: "HEAD" })
      .then((res) => {
        setHasRiveFile(res.ok);
      })
      .catch(() => setHasRiveFile(false));
  }, []);

  // Primary Engine: Rive state machine configuration
  const { rive, RiveComponent } = useRive({
    src: "/assets/aris.riv",
    stateMachines: "ArisStateMachine",
    autoplay: true,
  });

  // State Machine Inputs & Triggers
  const cheeksInput = useStateMachineInput(rive, "ArisStateMachine", "Cheeks");
  const energyInput = useStateMachineInput(rive, "ArisStateMachine", "Energy");
  const leafInput = useStateMachineInput(rive, "ArisStateMachine", "Leaf");

  const waveTrig = useStateMachineInput(rive, "ArisStateMachine", "Wave");
  const cheerTrig = useStateMachineInput(rive, "ArisStateMachine", "Cheer");
  const celebrateTrig = useStateMachineInput(rive, "ArisStateMachine", "Celebrate");
  const sleepTrig = useStateMachineInput(rive, "ArisStateMachine", "Sleep");

  // Sync Input properties to Rive
  useEffect(() => {
    if (cheeksInput && cheeks !== undefined) cheeksInput.value = cheeks;
  }, [cheeks, cheeksInput]);

  useEffect(() => {
    if (energyInput && energy !== undefined) energyInput.value = energy;
  }, [energy, energyInput]);

  useEffect(() => {
    if (leafInput && leaf !== undefined) leafInput.value = leaf;
  }, [leaf, leafInput]);

  // Sync Action Triggers to Rive
  useEffect(() => {
    if (triggerWave && waveTrig) waveTrig.fire();
  }, [triggerWave, waveTrig]);

  useEffect(() => {
    if (triggerCheer && cheerTrig) cheerTrig.fire();
  }, [triggerCheer, cheerTrig]);

  useEffect(() => {
    if (triggerCelebrate && celebrateTrig) celebrateTrig.fire();
  }, [triggerCelebrate, celebrateTrig]);

  useEffect(() => {
    if (triggerSleep && sleepTrig) sleepTrig.fire();
  }, [triggerSleep, sleepTrig]);

  // Map declarative "state" prop to Rive Triggers/Inputs
  useEffect(() => {
    if (!rive) return;
    switch (state) {
      case "wave":
      case "proud":
        if (waveTrig) waveTrig.fire();
        break;
      case "cheer":
        if (cheerTrig) cheerTrig.fire();
        break;
      case "success":
      case "excited":
        if (celebrateTrig) celebrateTrig.fire();
        break;
      case "sleep":
      case "reflect":
        if (sleepTrig) sleepTrig.fire();
        break;
    }
  }, [state, rive, waveTrig, cheerTrig, celebrateTrig, sleepTrig]);

  // --- Fallback Engine: Pixar-Quality 3D Framer Motion System ---
  
  // Set up local trigger simulation for fallback engine
  const fireFallbackTrigger = (type: "wave" | "cheer" | "celebrate" | "sleep") => {
    if (triggerTimeoutRef.current) clearTimeout(triggerTimeoutRef.current);
    setActiveTrigger(type);
    
    // Auto-return to baseline state after action animation duration
    const duration = type === "celebrate" ? 2200 : 1600;
    triggerTimeoutRef.current = setTimeout(() => {
      setActiveTrigger(null);
    }, duration);
  };

  // Sync state triggers for the fallback engine
  useEffect(() => {
    if (state === "wave" || state === "proud") fireFallbackTrigger("wave");
    else if (state === "cheer") fireFallbackTrigger("cheer");
    else if (state === "success" || state === "excited") fireFallbackTrigger("celebrate");
    else if (state === "sleep" || state === "reflect") fireFallbackTrigger("sleep");
  }, [state]);

  // Sync explicit trigger props for the fallback engine
  useEffect(() => {
    if (triggerWave) fireFallbackTrigger("wave");
  }, [triggerWave]);
  useEffect(() => {
    if (triggerCheer) fireFallbackTrigger("cheer");
  }, [triggerCheer]);
  useEffect(() => {
    if (triggerCelebrate) fireFallbackTrigger("celebrate");
  }, [triggerCelebrate]);
  useEffect(() => {
    if (triggerSleep) fireFallbackTrigger("sleep");
  }, [triggerSleep]);

  // Handle local click interaction (winks and waves)
  const handleMascotClick = () => {
    if (interactive && !hasRiveFile) {
      fireFallbackTrigger("wave");
    }
  };

  // Random blink cycle for fallback
  useEffect(() => {
    if (hasRiveFile) return;
    const interval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 140);
    }, 4000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, [hasRiveFile]);

  // Normalization logic for fallback states
  const getFallbackState = () => {
    if (activeTrigger) return activeTrigger;
    if (state === "happy") return "happy";
    if (state === "thinking") return "thinking";
    if (state === "focused") return "focused";
    if (state === "confused") return "confused";
    if (state === "sleep" || state === "reflect") return "sleep";
    return "idle";
  };

  const currentFBState = getFallbackState();

  // Animation constants based on Rive energy input (default: 0.6)
  const baseDuration = 3.5 / (energy || 0.6);

  // Body Squash and Stretch Keyframes
  const bodyFloatVariants = {
    animate: {
      y: currentFBState === "sleep" ? [0, 4, 0] : [0, -8, 2, 0],
      scaleY: currentFBState === "sleep" ? [1, 1.015, 1] : [1, 1.035, 0.96, 1],
      scaleX: currentFBState === "sleep" ? [1, 0.985, 1] : [1, 0.965, 1.035, 1],
      transition: {
        repeat: Infinity,
        duration: currentFBState === "sleep" ? baseDuration * 1.3 : baseDuration,
        ease: "easeInOut" as const,
      },
    },
  };

  // Sprout Secondary Sway Lag
  const sproutSwayVariants = {
    animate: {
      rotate: currentFBState === "sleep" ? [-2, 2, -2] : [-5, 8, -5],
      transition: {
        repeat: Infinity,
        duration: currentFBState === "sleep" ? baseDuration * 1.3 : baseDuration,
        ease: "easeInOut" as const,
        delay: 0.3, // Out-of-phase secondary motion
      },
    },
  };

  // Cape Secondary Flutter Lag
  const capeFlutterVariants = {
    animate: {
      skewY: currentFBState === "sleep" ? [-0.5, 0.5, -0.5] : [-1.5, 2.5, -1.5],
      scaleX: currentFBState === "sleep" ? [1, 1.01, 1] : [1, 1.03, 1],
      transition: {
        repeat: Infinity,
        duration: currentFBState === "sleep" ? baseDuration * 1.3 : baseDuration,
        ease: "easeInOut" as const,
        delay: 0.18, // Out-of-phase follow-through
      },
    },
  };

  const getImageForState = (fbState: string) => {
    switch (fbState) {
      case "thinking":
        return "aris_three_quarter_left.png";
      case "focused":
        return "aris_front.png";
      case "confused":
        return "aris_side_left.png";
      case "celebrate":
      case "cheer":
        return "aris_tpose.png";
      case "wave":
        return "aris_three_quarter_right.png";
      case "sleep":
        return "aris_back.png";
      case "happy":
        return "aris_three_quarter_right.png";
      default:
        return "aris_front.png";
    }
  };

  // If Rive asset exists, load the full Rive runtime
  if (hasRiveFile && RiveComponent) {
    return (
      <div
        className="cursor-pointer active:scale-95 transition-transform"
        style={{ width: size, height: size }}
      >
        <RiveComponent />
      </div>
    );
  }

  // Fallback rendering
  return (
    <div
      className={`relative flex flex-col items-center justify-center select-none ${
        interactive ? "cursor-pointer active:scale-[0.97] transition-all duration-300 hover:brightness-[1.02]" : ""
      }`}
      style={{ width: size, height: size * 1.15 }}
      onClick={handleMascotClick}
    >
      {/* Volumetric shadow halo */}
      <motion.div
        animate={{
          opacity: currentFBState === "sleep" ? [0.12, 0.22, 0.12] : [0.18, 0.32, 0.18],
          scale: currentFBState === "sleep" ? [0.95, 1.03, 0.95] : [1, 1.08, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: currentFBState === "sleep" ? baseDuration * 1.3 : baseDuration,
          ease: "easeInOut",
        }}
        className={`absolute w-[80%] h-[80%] rounded-full blur-[25px] ${
          currentFBState === "sleep" ? "bg-amber-500/15" : "bg-indigo-500/15"
        }`}
        style={{ top: "15%", zIndex: 0 }}
      />

      {/* Main Mascot 3D Image View */}
      <motion.img
        src={`/assets/${getImageForState(currentFBState)}`}
        alt="Aris Mascot"
        variants={bodyFloatVariants}
        animate="animate"
        className="w-full h-full object-contain drop-shadow-[0_8px_18px_rgba(99,102,241,0.22)]"
        style={{ zIndex: 1 }}
      />

      {/* Volumetric Floating Base Shadow */}
      <motion.div
        animate={{
          scale: currentFBState === "sleep" ? [0.85, 0.95, 0.85] : [0.8, 1.05, 0.8],
          opacity: currentFBState === "sleep" ? [0.12, 0.22, 0.12] : [0.18, 0.35, 0.18],
        }}
        transition={{
          repeat: Infinity,
          duration: currentFBState === "sleep" ? baseDuration * 1.3 : baseDuration,
          ease: "easeInOut",
        }}
        className="w-14 h-1.5 bg-slate-900/10 rounded-full blur-[3px] mt-1"
        style={{ zIndex: 0 }}
      />
    </div>
  );
}
