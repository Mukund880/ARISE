"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";

export type MascotState = 
  | "idle" 
  | "happy" 
  | "thinking" 
  | "success" 
  | "excited" 
  | "wave" 
  | "proud" 
  | "sleep" 
  | "reflect" 
  | "cheer" 
  | "focused" 
  | "confused";

interface MascotContextType {
  state: MascotState;
  cheeks: number;
  energy: number;
  leaf: number;
  setBaselineState: (state: MascotState) => void;
  triggerEmotion: (emotion: MascotState, duration?: number) => void;
  setCheeks: (val: number) => void;
  setEnergy: (val: number) => void;
  setLeaf: (val: number) => void;
  resetToBaseline: () => void;
}

const MascotContext = createContext<MascotContextType | undefined>(undefined);

export function MascotProvider({ children }: { children: React.ReactNode }) {
  const [baselineState, setBaselineStateInternal] = useState<MascotState>("idle");
  const [activeState, setActiveState] = useState<MascotState | null>(null);
  const [cheeks, setCheeks] = useState(0.6);
  const [energy, setEnergy] = useState(0.6);
  const [leaf, setLeaf] = useState(1.0);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityRef = useRef<NodeJS.Timeout | null>(null);

  const setBaselineState = (state: MascotState) => {
    setBaselineStateInternal(state);
    resetInactivityTimer();
  };

  const triggerEmotion = (emotion: MascotState, duration: number = 2200) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveState(emotion);
    resetInactivityTimer();
    
    timeoutRef.current = setTimeout(() => {
      setActiveState(null);
    }, duration);
  };

  const resetToBaseline = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveState(null);
    resetInactivityTimer();
  };

  // User Inactivity Timer (Sleep mode after 45s of silence)
  const resetInactivityTimer = () => {
    if (inactivityRef.current) clearTimeout(inactivityRef.current);
    
    // Resume to normal if currently sleeping
    if (baselineState === "sleep" || activeState === "sleep") {
      setBaselineStateInternal("idle");
      setActiveState("wave"); // friendly wave back
      setTimeout(() => setActiveState(null), 1500);
    }

    inactivityRef.current = setTimeout(() => {
      // Inactivity triggered -> put mascot to sleep
      setBaselineStateInternal("sleep");
    }, 45000); // 45 seconds
  };

  // Global listeners for activity
  useEffect(() => {
    const handleActivity = () => {
      resetInactivityTimer();
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("click", handleActivity);
    window.addEventListener("scroll", handleActivity);

    // Initial timer setup
    resetInactivityTimer();

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      if (inactivityRef.current) clearTimeout(inactivityRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [baselineState, activeState]);

  const currentState = activeState || baselineState;

  return (
    <MascotContext.Provider
      value={{
        state: currentState,
        cheeks,
        energy,
        leaf,
        setBaselineState,
        triggerEmotion,
        setCheeks,
        setEnergy,
        setLeaf,
        resetToBaseline
      }}
    >
      {children}
    </MascotContext.Provider>
  );
}

export function useMascot() {
  const context = useContext(MascotContext);
  if (context === undefined) {
    throw new Error("useMascot must be used within a MascotProvider");
  }
  return context;
}
