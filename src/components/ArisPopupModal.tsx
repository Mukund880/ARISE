"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AriseMascot, MascotState } from "@/components/AriseMascot";

interface ArisPopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: "info" | "warning" | "success" | "confirm";
  title: string;
  message: string;
  mascotState?: MascotState;
  confirmLabel?: string;
  onConfirm?: () => void;
}

export function ArisPopupModal({
  isOpen,
  onClose,
  type = "info",
  title,
  message,
  mascotState,
  confirmLabel = "Confirm",
  onConfirm,
}: ArisPopupModalProps) {
  // Select default mascot state if not provided
  const getMascotState = (): MascotState => {
    if (mascotState) return mascotState;
    switch (type) {
      case "warning": return "warning";
      case "success": return "success";
      case "confirm": return "confused";
      default: return "happy";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-sm bg-[#FDFBF7] border border-slate-200 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-center flex flex-col items-center"
          >
            {/* Background glow */}
            <div className={`absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20 ${
              type === "success" ? "bg-green-500" :
              type === "warning" ? "bg-rose-500" :
              type === "confirm" ? "bg-amber-500" : "bg-indigo-500"
            }`} />

            {/* Mascot section */}
            <div className="mb-4 mt-2">
              <AriseMascot size={110} state={getMascotState()} interactive={false} />
            </div>

            {/* Title & Message */}
            <h3 className="text-lg font-black text-slate-800 tracking-tight mb-2 leading-snug">{title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold mb-6 px-2">{message}</p>

            {/* Action buttons */}
            <div className="flex w-full gap-3 justify-center">
              {type === "confirm" && onConfirm ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={onClose}
                    className="border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl h-10 px-5 text-xs flex-1 cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                    className={`font-bold rounded-xl h-10 px-5 text-xs flex-1 text-white shadow-sm active:scale-95 transition-transform cursor-pointer ${
                      mascotState === "warning" ? "bg-rose-600 hover:bg-rose-700" : "bg-indigo-600 hover:bg-indigo-750"
                    }`}
                  >
                    {confirmLabel}
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={onClose}
                  className="bg-indigo-600 hover:bg-indigo-750 text-white font-bold rounded-xl h-11 px-8 text-xs w-full shadow-sm active:scale-95 transition-transform cursor-pointer"
                >
                  Okay
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
