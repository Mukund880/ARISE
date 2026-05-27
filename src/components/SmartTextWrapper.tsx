"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Brain, Languages, Lightbulb, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SmartTextWrapperProps {
  children: React.ReactNode;
  topicTitle: string;
}

export function SmartTextWrapper({ children, topicTitle }: SmartTextWrapperProps) {
  const [selectedText, setSelectedText] = useState("");
  const [tooltipPos, setTooltipPos] = useState<{ x: number, y: number } | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const text = selection.toString().trim();
      setSelectedText(text);

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();

      if (containerRect) {
        setTooltipPos({
          x: rect.left - containerRect.left + (rect.width / 2),
          y: rect.top - containerRect.top - 10,
        });
      }
    } else {
      // Don't hide immediately if they are clicking inside the tooltip
      // We will handle closing via the X button or clicking elsewhere
    }
  };

  const closeTooltip = () => {
    setTooltipPos(null);
    setSelectedText("");
    setAiResponse(null);
    window.getSelection()?.removeAllRanges();
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeTooltip();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const askAI = async (action: string) => {
    setIsAsking(true);
    setAiResponse(null);
    try {
      const res = await fetch("/api/smart-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: selectedText,
          action,
          context: topicTitle
        })
      });
      if (!res.ok) throw new Error("Failed to get AI response");
      const data = await res.json();
      setAiResponse(data.result);
    } catch (err) {
      console.error(err);
      setAiResponse("Sorry, the AI could not process this request right now.");
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="relative" ref={containerRef} onMouseUp={handleMouseUp}>
      {children}

      <AnimatePresence>
        {tooltipPos && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ 
              position: 'absolute', 
              left: tooltipPos.x, 
              top: tooltipPos.y, 
              transform: 'translate(-50%, -100%)',
              zIndex: 50
            }}
            className="bg-zinc-900 border border-white/20 shadow-2xl rounded-2xl p-4 w-80 mb-2 pointer-events-auto"
            onMouseUp={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-3 border-b border-white/10 pb-2">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
                <Sparkles className="w-4 h-4" />
                Ask AI about this
              </div>
              <button onClick={closeTooltip} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-xs text-gray-400 italic mb-4 line-clamp-2 border-l-2 border-purple-500 pl-2">
              &quot;{selectedText}&quot;
            </p>

            {isAsking ? (
              <div className="flex flex-col items-center justify-center py-4 gap-2">
                <Brain className="w-6 h-6 text-purple-400 animate-spin" />
                <span className="text-xs text-gray-400">AI is thinking...</span>
              </div>
            ) : aiResponse ? (
              <div className="text-sm text-gray-200 bg-white/5 p-3 rounded-xl max-h-48 overflow-y-auto">
                {aiResponse}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" onClick={() => askAI("Explain Simply")} className="text-xs justify-start h-8 bg-white/5 border-white/10 hover:bg-white/10">
                  <Lightbulb className="w-3 h-3 mr-2" /> Explain Simply
                </Button>
                <Button size="sm" variant="outline" onClick={() => askAI("Explain Deeply")} className="text-xs justify-start h-8 bg-white/5 border-white/10 hover:bg-white/10">
                  <Brain className="w-3 h-3 mr-2 text-purple-400" /> Explain Deeply
                </Button>
                <Button size="sm" variant="outline" onClick={() => askAI("Give Example")} className="text-xs justify-start h-8 bg-white/5 border-white/10 hover:bg-white/10">
                  <Sparkles className="w-3 h-3 mr-2 text-yellow-400" /> Give Example
                </Button>
                <Button size="sm" variant="outline" onClick={() => askAI("Translate to Spanish")} className="text-xs justify-start h-8 bg-white/5 border-white/10 hover:bg-white/10">
                  <Languages className="w-3 h-3 mr-2 text-blue-400" /> Translate
                </Button>
              </div>
            )}
            
            {/* Arrow pointer */}
            <div className="absolute left-1/2 -bottom-2 w-4 h-4 bg-zinc-900 border-b border-r border-white/20 transform -translate-x-1/2 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
