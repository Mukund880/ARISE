"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { useMascot } from "@/context/MascotContext";

export type MascotState =
  | "idle" | "waving" | "loading" | "searching" | "thinking" | "idea" | "excited" | "happy"
  | "confused" | "sad" | "sleepy" | "surprised" | "focused" | "working" | "reading" | "scanning"
  | "success" | "error" | "warning" | "processing" | "uploading" | "downloading" | "celebrating" | "thumbs_up"
  | "pointing" | "presenting" | "teaching" | "cheering" | "love" | "motivated" | "relaxed" | "good_night"
  | "waiting" | "bored" | "overwhelmed" | "determined" | "great_job" | "acknowledged" | "high_five" | "bye_bye"
  | "sleep" | "reflect" | "cheer" | "proud" | "wave" | "celebrate";

interface AriseMascotProps {
  state?: MascotState;
  size?: number;
  interactive?: boolean;
  global?: boolean;
  framed?: boolean;
}

// Custom component to key out solid white backgrounds in standard .mp4 video files
function TransparentVideo({ src, size }: { src: string; size: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let animationFrameId: number;
    const ctx = canvas.getContext("2d");

    const renderFrame = () => {
      if (video.paused || video.ended) {
        animationFrameId = requestAnimationFrame(renderFrame);
        return;
      }

      const width = canvas.width;
      const height = canvas.height;

      if (ctx) {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(video, 0, 0, width, height);

        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // Chroma-key background: remove solid white pixels (R > 240, G > 240, B > 240)
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          if (r > 240 && g > 240 && b > 240) {
            data[i + 3] = 0; // Alpha = 0
          }
        }

        ctx.putImageData(imgData, 0, 0);
      }

      animationFrameId = requestAnimationFrame(renderFrame);
    };

    const handlePlay = () => {
      if (video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      renderFrame();
    };

    video.addEventListener("play", handlePlay);

    // Set video attributes and start playback
    video.src = src;
    video.load();
    video.play().catch((err) => {
      console.warn("Video playback block prevention:", err);
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
      video.removeEventListener("play", handlePlay);
    };
  }, [src]);

  return (
    <>
      <video
        ref={videoRef}
        loop
        muted
        playsInline
        className="hidden"
        crossOrigin="anonymous"
      />
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="w-full h-full object-contain"
      />
    </>
  );
}

export function AriseMascot({
  state: localState = "idle",
  size = 120,
  interactive = true,
  global = false,
  framed = false,
}: AriseMascotProps) {
  let contextState;
  try {
    const context = useMascot();
    contextState = context.state;
  } catch (e) {
    // Fail-safe fallback if used outside MascotProvider
  }

  const state = global && contextState ? contextState : localState;
  const [activeTrigger, setActiveTrigger] = useState<MascotState | null>(null);
  const triggerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set up local trigger simulation for interactions
  const fireTrigger = (type: MascotState) => {
    if (triggerTimeoutRef.current) clearTimeout(triggerTimeoutRef.current);
    setActiveTrigger(type);
    
    // Auto-return to baseline state after action animation duration
    triggerTimeoutRef.current = setTimeout(() => {
      setActiveTrigger(null);
    }, 2500);
  };

  // Sync state triggers
  useEffect(() => {
    if (state === "wave" || state === "proud" || state === "cheer" || state === "celebrate") {
      fireTrigger(state);
    }
  }, [state]);

  // Handle click interaction
  const handleMascotClick = () => {
    if (interactive) {
      fireTrigger("waving");
    }
  };

  const getActiveState = () => {
    if (activeTrigger) return activeTrigger;
    return state;
  };

  const currentMascotState = getActiveState();

  // Map state to MP4 videos if available
  const getVideoForState = (currentState: MascotState) => {
    const map: Record<string, string> = {
      loading: "loading.mp4",
      searching: "loading.mp4",
      thinking: "loading.mp4",
      processing: "loading.mp4",
      uploading: "loading.mp4",
      downloading: "loading.mp4",
      
      presenting: "presenting.mp4",
      pointing: "presenting.mp4",
      
      teaching: "teaching.mp4",
      focused: "teaching.mp4",
      working: "teaching.mp4",
      reading: "teaching.mp4",
      scanning: "teaching.mp4",
      
      waving: "waving.mp4",
      bye_bye: "waving.mp4",
      wave: "waving.mp4"
    };
    return map[currentState] || null;
  };

  // Maps design-system states to the 40 cropped image filenames
  const getImageForState = (currentState: MascotState) => {
    const map: Record<string, string> = {
      idle: "aris_idle.png",
      waving: "aris_waving.png",
      loading: "aris_loading.png",
      searching: "aris_searching.png",
      thinking: "aris_thinking.png",
      idea: "aris_idea.png",
      excited: "aris_excited.png",
      happy: "aris_happy.png",
      confused: "aris_confused.png",
      sad: "aris_sad.png",
      sleepy: "aris_sleepy.png",
      surprised: "aris_surprised.png",
      focused: "aris_focused.png",
      working: "aris_working.png",
      reading: "aris_reading.png",
      scanning: "aris_scanning.png",
      success: "aris_success.png",
      error: "aris_error.png",
      warning: "aris_warning.png",
      processing: "aris_processing.png",
      uploading: "aris_uploading.png",
      downloading: "aris_downloading.png",
      celebrating: "aris_celebrating.png",
      thumbs_up: "aris_thumbs_up.png",
      pointing: "aris_pointing.png",
      presenting: "aris_presenting.png",
      teaching: "aris_teaching.png",
      cheering: "aris_cheering.png",
      love: "aris_love.png",
      motivated: "aris_motivated.png",
      relaxed: "aris_relaxed.png",
      good_night: "aris_good_night.png",
      waiting: "aris_waiting.png",
      bored: "aris_bored.png",
      overwhelmed: "aris_overwhelmed.png",
      determined: "aris_determined.png",
      great_job: "aris_great_job.png",
      acknowledged: "aris_acknowledged.png",
      high_five: "aris_high_five.png",
      bye_bye: "aris_bye_bye.png",

      // Legacy fallback mappings
      sleep: "aris_sleepy.png",
      reflect: "aris_relaxed.png",
      cheer: "aris_cheering.png",
      proud: "aris_great_job.png",
      wave: "aris_waving.png",
      celebrate: "aris_celebrating.png",
    };

    return map[currentState] || "aris_idle.png";
  };

  const isLowEnergy = currentMascotState === "sleepy" || currentMascotState === "good_night" || currentMascotState === "sleep";
  const videoFile = getVideoForState(currentMascotState);

  const mascotContent = (
    <div
      className="relative flex flex-col items-center justify-center"
      style={{ width: size, height: size * 1.15 }}
    >
      {/* Volumetric shadow halo */}
      <motion.div
        animate={{
          opacity: isLowEnergy ? [0.10, 0.18, 0.10] : [0.16, 0.28, 0.16],
          scale: isLowEnergy ? [0.95, 1.02, 0.95] : [1.0, 1.06, 1.0],
        }}
        transition={{
          repeat: Infinity,
          duration: 3.5,
          ease: "easeInOut",
        }}
        className={`absolute w-[80%] h-[80%] rounded-full blur-[25px] ${
          isLowEnergy ? "bg-amber-500/10" : "bg-[rgba(197,168,128,0.15)]"
        }`}
        style={{ top: "15%", zIndex: 0 }}
      />

      {/* Main Mascot Content View with Organic Float, Sway & Wiggle */}
      <motion.div
        animate={{
          // Float (y-translation) of exactly 1.5px up and down
          y: isLowEnergy ? [-0.8, 0.8, -0.8] : [-1.5, 1.5, -1.5],
          // Sway and wiggle
          rotate: isLowEnergy 
            ? [0, -0.6, 0.6, -0.6, 0] 
            : [0, -1.5, 1.5, -1.5, 0, 0, -3.5, 3.5, -3.5, 3.5, -2, 2, -1, 0, 0, 1.5, -1.5, 0]
        }}
        transition={{
          y: {
            repeat: Infinity,
            duration: isLowEnergy ? 5.0 : 4.0,
            ease: "easeInOut"
          },
          rotate: {
            repeat: Infinity,
            duration: isLowEnergy ? 10.0 : 12.0,
            ease: "easeInOut",
            times: isLowEnergy 
              ? [0, 0.25, 0.5, 0.75, 1]
              : [
                  0, 
                  1.5 / 12, 
                  3.0 / 12, 
                  4.5 / 12, 
                  6.0 / 12, 
                  8.0 / 12, 
                  8.1 / 12, 
                  8.2 / 12, 
                  8.3 / 12, 
                  8.4 / 12, 
                  8.5 / 12, 
                  8.6 / 12, 
                  8.7 / 12, 
                  8.8 / 12, 
                  9.2 / 12, 
                  10.2 / 12, 
                  11.1 / 12, 
                  1.0
                ]
          }
        }}
        className="w-full h-full flex items-center justify-center drop-shadow-[0_8px_18px_rgba(197,168,128,0.2)]"
        style={{ zIndex: 1 }}
      >
        {videoFile ? (
          <TransparentVideo src={`/assets/${videoFile}`} size={size} />
        ) : (
          <img
            src={`/assets/${getImageForState(currentMascotState)}`}
            alt="Aris Mascot"
            className="w-full h-full object-contain"
          />
        )}
      </motion.div>

      {/* Volumetric Floating Base Shadow */}
      <motion.div
        animate={{
          scale: isLowEnergy ? [0.90, 0.96, 0.90] : [0.85, 1.02, 0.85],
          opacity: isLowEnergy ? [0.10, 0.16, 0.10] : [0.14, 0.28, 0.14],
        }}
        transition={{
          repeat: Infinity,
          duration: isLowEnergy ? 5.0 : 4.0,
          ease: "easeInOut",
        }}
        className="w-14 h-1.5 bg-neutral-950/15 rounded-full blur-[3px] mt-1"
        style={{ zIndex: 0 }}
      />
    </div>
  );

  if (framed) {
    return (
      <div
        onClick={handleMascotClick}
        className={`relative p-5 border border-border bg-card/65 backdrop-blur-md rounded-lg flex flex-col items-center justify-center gap-3 transition-all duration-350 shadow-sm ${
          interactive ? "cursor-pointer active:scale-[0.98] hover:border-primary/50 hover:brightness-[1.02]" : ""
        }`}
        style={{ width: size + 40 }}
      >
        {/* Corner Ornaments */}
        <div className="absolute top-2 left-2 w-2.5 h-2.5 border-t border-l border-primary/55 pointer-events-none" />
        <div className="absolute top-2 right-2 w-2.5 h-2.5 border-t border-r border-primary/55 pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-2.5 h-2.5 border-b border-l border-primary/55 pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-2.5 h-2.5 border-b border-r border-primary/55 pointer-events-none" />

        {/* Mascot Element */}
        {mascotContent}

        {/* Status Label */}
        <div className="text-[8px] font-mono tracking-[0.25em] text-primary font-bold uppercase select-none border-t border-border/40 pt-2 w-full text-center">
          ARIS // {currentMascotState}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col items-center justify-center select-none ${
        interactive ? "cursor-pointer active:scale-[0.97] transition-all duration-300 hover:brightness-[1.02]" : ""
      }`}
      style={{ width: size, height: size * 1.15 }}
      onClick={handleMascotClick}
    >
      {mascotContent}
    </div>
  );
}
