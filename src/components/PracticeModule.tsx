"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, Lightbulb, Code, Type, LayoutGrid, Award, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import { AriseMascot } from "@/components/AriseMascot";
import { useMascot } from "@/context/MascotContext";

interface PracticeModuleProps {
  lessonContent: any;
  onComplete: (stats: { correct: boolean }) => void;
}

export function PracticeModule({ lessonContent, onComplete }: PracticeModuleProps) {
  const { triggerEmotion } = useMascot();
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [fillBlankValue, setFillBlankValue] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [firstTryCorrect, setFirstTryCorrect] = useState(true);

  const checkMcqAnswer = (index: number) => {
    setSelectedAnswer(index);
    const correct = index === lessonContent.correctOptionIndex;
    setIsCorrect(correct);
    if (correct) {
      triggerEmotion("success", 2500);
      setTimeout(() => onComplete({ correct: firstTryCorrect }), 1600);
    } else {
      setFirstTryCorrect(false);
      triggerEmotion("confused", 2500);
    }
  };

  const checkFillBlankAnswer = () => {
    if (!fillBlankValue.trim()) return;
    const isMatch = fillBlankValue.trim().toLowerCase() === (lessonContent.fillBlankAnswer || "").toLowerCase();
    setIsCorrect(isMatch);
    if (isMatch) {
      triggerEmotion("success", 2500);
      setTimeout(() => onComplete({ correct: firstTryCorrect }), 1600);
    } else {
      setFirstTryCorrect(false);
      triggerEmotion("confused", 2500);
    }
  };

  const renderExercise = () => {
    if (lessonContent.exerciseType === "FillInBlank" || lessonContent.fillBlankQuestion) {
      const parts = (lessonContent.fillBlankQuestion || "").split(/_{3,}/);
      
      return (
        <div className="space-y-6 mt-4">
          <div className="bg-[#FAF9F6] border border-slate-200/60 rounded-2xl p-6 text-sm md:text-base leading-relaxed text-slate-700 font-semibold shadow-inner">
            {parts[0]}
            <Input 
              className={`inline-block w-40 mx-2 text-center h-9 bg-white border-slate-200 focus:border-indigo-500 text-slate-800 font-bold rounded-lg transition-all ${
                isCorrect === true ? "border-green-500 text-green-600 focus:border-green-500" : 
                isCorrect === false ? "border-pink-500 text-pink-600 focus:border-pink-500" : ""
              }`}
              value={fillBlankValue}
              onChange={(e) => {
                setFillBlankValue(e.target.value);
                setIsCorrect(null);
              }}
              placeholder="Your answer..."
              onKeyDown={(e) => e.key === "Enter" && checkFillBlankAnswer()}
            />
            {parts[1]}
          </div>

          <Button 
            onClick={checkFillBlankAnswer}
            disabled={!fillBlankValue.trim() || isCorrect === true}
            className={`w-full h-12 rounded-xl font-bold transition-all shadow-md active:scale-95 arbuttonchunky text-xs ${
              isCorrect === true ? "bg-green-50 border border-green-200 text-green-600 cursor-default" : 
              isCorrect === false ? "bg-pink-50 border border-pink-200 text-pink-600" : 
              "bg-indigo-600 text-white hover:bg-indigo-750"
            }`}
          >
            {isCorrect === true ? "Correct! Ingesting XP..." : isCorrect === false ? "Try Again" : "Submit Answer"}
          </Button>
        </div>
      );
    }

    // Default to MCQ
    return (
      <div className="space-y-5 mt-4">
        <div className="flex items-start gap-2.5 bg-indigo-50 border border-indigo-100 p-4 rounded-2xl">
          <HelpCircle className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
          <p className="text-sm font-bold leading-relaxed text-slate-700">{lessonContent.quizQuestion}</p>
        </div>

        <div className="space-y-3">
          {lessonContent.quizOptions?.map((option: string, i: number) => {
            const isSelected = selectedAnswer === i;
            const isCorrectOption = i === lessonContent.correctOptionIndex;
            
            let btnClass = "bg-[#FAF9F6] border-slate-200 text-slate-655 hover:bg-slate-50 hover:border-indigo-500/20 hover:text-slate-800";
            
            if (selectedAnswer !== null) {
              if (isSelected) {
                btnClass = isCorrectOption 
                  ? "bg-green-50 border-green-500 text-green-600 shadow-[0_0_10px_rgba(16,185,129,0.05)] font-bold" 
                  : "bg-pink-50 border-pink-500 text-pink-650 shadow-[0_0_10px_rgba(244,63,94,0.05)] font-bold";
              } else if (isCorrectOption) {
                // Highlight correct option if they failed
                btnClass = "bg-green-50/60 border-green-200 text-green-600 opacity-80 font-bold";
              } else {
                btnClass = "bg-slate-50 border-slate-100 text-slate-400 opacity-40 cursor-default";
              }
            }

            return (
              <Button
                key={i}
                variant="outline"
                className={`w-full justify-between h-auto py-4 px-5 border ${btnClass} transition-all duration-300 whitespace-normal text-left text-xs font-semibold rounded-2xl leading-relaxed flex items-center gap-3 active:scale-95`}
                onClick={() => checkMcqAnswer(i)}
                disabled={selectedAnswer !== null}
              >
                <span>{option}</span>
                {selectedAnswer === i && isCorrectOption && (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-green-500" />
                )}
                {selectedAnswer === i && !isCorrectOption && (
                  <XCircle className="w-4 h-4 shrink-0 text-pink-500" />
                )}
              </Button>
            );
          })}
        </div>

        {isCorrect === false && (
          <Button
            onClick={() => {
              setSelectedAnswer(null);
              setIsCorrect(null);
            }}
            className="w-full h-12 bg-indigo-600 text-white hover:bg-indigo-750 font-bold rounded-xl text-xs shadow-md active:scale-95 arbuttonchunky mt-2"
          >
            Try Again
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="bg-[#FDFBF7] border border-slate-200/60 rounded-3xl p-6 md:p-7 shadow-sm relative overflow-visible">
      {/* Immersive Mascot sitting on the quiz card boundary */}
      <div className="absolute -top-16 -right-6 hidden sm:block pointer-events-auto">
        <AriseMascot size={90} global={true} />
      </div>

      <div className="flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase tracking-wider mb-5 border-b border-slate-100 pb-3">
        <LayoutGrid className="w-4 h-4" />
        <span>Understanding Check</span>
      </div>

      {renderExercise()}

      <div className="mt-6 pt-5 border-t border-slate-100">
        <Button 
          variant="ghost" 
          size="sm"
          className="text-slate-405 text-slate-500 hover:text-amber-600 transition-colors text-xs font-bold rounded-xl h-8 px-3"
          onClick={() => {
            const nextShow = !showHint;
            setShowHint(nextShow);
            if (nextShow) {
              triggerEmotion("thinking", 3000);
            }
          }}
        >
          <Lightbulb className="w-3.5 h-3.5 mr-1.5" />
          {showHint ? "Hide Hint" : "Need a hint?"}
        </Button>
        
        {showHint && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3.5 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 leading-relaxed font-semibold shadow-inner"
          >
            {lessonContent.hint}
          </motion.div>
        )}
      </div>
    </div>
  );
}
