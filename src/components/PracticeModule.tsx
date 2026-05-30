"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Lightbulb, HelpCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { AriseMascot } from "@/components/AriseMascot";
import { useMascot } from "@/context/MascotContext";

interface PracticeModuleProps {
  lessonContent: any;
  onComplete: (stats: { correct: boolean }) => void;
}

export function PracticeModule({ lessonContent, onComplete }: PracticeModuleProps) {
  const { triggerEmotion } = useMascot();

  // Extract questions supporting both single legacy question and new quizQuestions array
  const questions = lessonContent.quizQuestions && Array.isArray(lessonContent.quizQuestions)
    ? lessonContent.quizQuestions
    : [
        {
          question: lessonContent.quizQuestion || "Check your understanding",
          options: lessonContent.quizOptions || ["Understand", "Review", "Reflect", "Complete"],
          correctOptionIndex: lessonContent.correctOptionIndex !== undefined ? lessonContent.correctOptionIndex : 0,
          hint: lessonContent.hint || "Review the lesson material above."
        }
      ];

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [firstTryCorrect, setFirstTryCorrect] = useState(true);

  const currentQ = questions[currentQuestionIdx] || questions[0];

  const checkMcqAnswer = (index: number) => {
    setSelectedAnswer(index);
    const correct = index === currentQ.correctOptionIndex;
    setIsCorrect(correct);
    if (correct) {
      triggerEmotion("success", 2500);
    } else {
      setFirstTryCorrect(false);
      triggerEmotion("confused", 2500);
    }
  };

  const handleNext = () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setShowHint(false);
    } else {
      onComplete({ correct: firstTryCorrect });
    }
  };

  const renderExercise = () => {
    return (
      <div className="space-y-5 mt-4">
        {/* Navigation Indicator / Header */}
        <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200/50 px-3 py-1.5 rounded-lg font-bold">
          <span>QUESTION {currentQuestionIdx + 1} OF {questions.length}</span>
          {selectedAnswer !== null && (
            <span className={isCorrect ? "text-green-600 uppercase font-black" : "text-rose-600 uppercase font-black"}>
              {isCorrect ? "CORRECT ✓" : "INCORRECT ❌"}
            </span>
          )}
        </div>

        <div className="flex items-start gap-2.5 bg-indigo-50 border border-indigo-100 p-4 rounded-2xl">
          <HelpCircle className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
          <p className="text-sm font-bold leading-relaxed text-slate-700">{currentQ.question}</p>
        </div>

        <div className="space-y-3">
          {currentQ.options?.map((option: string, i: number) => {
            const isSelected = selectedAnswer === i;
            const isCorrectOption = i === currentQ.correctOptionIndex;
            
            let btnClass = "bg-[#FAF9F6] border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-indigo-500/20 hover:text-slate-800";
            
            if (selectedAnswer !== null) {
              if (isSelected) {
                btnClass = isCorrectOption 
                  ? "bg-green-50 border-green-500 text-green-600 shadow-[0_0_10px_rgba(16,185,129,0.05)] font-bold" 
                  : "bg-pink-50 border-pink-500 text-pink-650 shadow-[0_0_10px_rgba(244,63,94,0.05)] font-bold";
              } else if (isCorrectOption) {
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
                {selectedAnswer !== null && isCorrectOption && (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-green-500" />
                )}
                {selectedAnswer === i && !isCorrectOption && (
                  <XCircle className="w-4 h-4 shrink-0 text-pink-500" />
                )}
              </Button>
            );
          })}
        </div>

        {selectedAnswer !== null && (
          <div className="space-y-4">
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-xs text-slate-700 leading-relaxed font-semibold shadow-inner mt-2">
              <span className="block text-[10px] font-mono tracking-wider text-indigo-500 uppercase font-black mb-1.5">Explanation</span>
              <p>{currentQ.hint}</p>
            </div>

            <Button
              onClick={handleNext}
              className="w-full h-12 bg-indigo-650 bg-indigo-600 hover:bg-indigo-750 text-white font-bold rounded-xl text-xs shadow-md active:scale-95 arbuttonchunky mt-2 flex items-center justify-center gap-1.5"
            >
              {currentQuestionIdx < questions.length - 1 ? (
                <>
                  <span>Next Question</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <span>Complete Module</span>
              )}
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-[#FDFBF7] border border-slate-200/60 rounded-3xl p-6 md:p-7 shadow-sm relative overflow-visible">
      {/* Immersive Mascot sitting on the quiz card boundary */}
      <div className="absolute -top-20 -right-6 hidden sm:block pointer-events-auto">
        <AriseMascot size={120} global={true} />
      </div>

      <div className="flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase tracking-wider mb-5 border-b border-slate-100 pb-3">
        <span>Understanding Check</span>
      </div>

      {renderExercise()}

      <div className="mt-6 pt-5 border-t border-slate-100">
        <Button 
          variant="ghost" 
          size="sm"
          className="text-slate-500 hover:text-amber-600 transition-colors text-xs font-bold rounded-xl h-8 px-3"
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
            {currentQ.hint}
          </motion.div>
        )}
      </div>
    </div>
  );
}
