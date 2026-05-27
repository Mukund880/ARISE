"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Upload, Sparkles, BrainCircuit, Target, Clock, ArrowRight, ArrowLeft, CheckCircle2, CloudUpload } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { AriseMascot } from "@/components/AriseMascot";
import { useMascot } from "@/context/MascotContext";

export default function NewTopicPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { triggerEmotion } = useMascot();
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  
  const [topic, setTopic] = useState("");
  const [knowledgeLevel, setKnowledgeLevel] = useState("");
  const [goal, setGoal] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const topicParam = params.get("topic");
      const levelParam = params.get("level");
      if (topicParam) setTopic(topicParam);
      if (levelParam) setKnowledgeLevel(levelParam);
    }
  }, []);

  useEffect(() => {
    if (isGenerating) return;
    if (step === 1) triggerEmotion("wave", 2200);
    else if (step === 2) triggerEmotion("thinking", 2200);
    else if (step === 3) triggerEmotion("focused", 2200);
    else if (step === 4) triggerEmotion("happy", 2200);
  }, [step, isGenerating]);

  const handleNext = () => setStep((s) => Math.min(s + 1, totalSteps));
  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFiles(Array.from(e.dataTransfer.files));
    }
  };
  
  const handleGenerate = async () => {
    if (!topic || !user) return;
    setIsGenerating(true);
    triggerEmotion("sleep", 30000);
    
    try {
      const topicId = topic.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      
      // 1. Upload files if any
      if (files.length > 0) {
        for (const file of files) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("userId", user.uid);
          formData.append("topicId", topicId);
          
          await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
        }
      }

      // 2. Generate roadmap
      const res = await fetch("/api/generate-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId,
          topic,
          knowledgeLevel: knowledgeLevel,
          goal: goal || "Master the core concepts"
        })
      });
      
      if (!res.ok) throw new Error("Failed to generate");
      const data = await res.json();
      
      // 3. Save to database
      const topicRef = doc(db, "users", user.uid, "topics", topicId);
      await setDoc(topicRef, {
        id: topicId,
        title: topic,
        level: knowledgeLevel,
        goal,
        progress: 0,
        modules: data.roadmap || data,
        createdAt: new Date()
      });

      router.push(`/dashboard/learning/${topicId}`);
    } catch (error) {
      console.error(error);
      setIsGenerating(false);
    }
  };

  const progress = (step / totalSteps) * 100;

  // Mascot speech guide text for each wizard step
  const getMascotSpeech = () => {
    switch (step) {
      case 1:
        return "Hi! What topic would you like to master today? Try typing anything like 'Quantum Computing' or 'Next.js 15'!";
      case 2:
        return "Awesome! How familiar are you with this? I'll design explanations and quizzes that fit your depth.";
      case 3:
        return "Perfect! What is your primary learning goal? This helps me customize the core focus of your syllabus.";
      case 4:
        return "Almost there! If you have notes, slides, or study documents (PDFs), drop them here. I will reference them during lessons!";
      default:
        return "";
    }
  };

  // Check if current step is valid to proceed
  const isStepValid = () => {
    if (step === 1) return topic.trim().length > 0;
    if (step === 2) return knowledgeLevel.length > 0;
    if (step === 3) return goal.length > 0;
    return true;
  };

  return (
    <div className="max-w-4xl mx-auto py-10 pb-16">
      
      {/* Wizard Header Progress Indicator */}
      <div className="mb-10 text-center max-w-xl mx-auto">
        <h1 className="text-3xl font-black mb-4 tracking-tight text-slate-800">Generate Study Roadmap</h1>
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-550">
            <span>Progress Parameter</span>
            <span className="text-indigo-600">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2 bg-slate-100 border border-slate-200/50 [&>div]:bg-gradient-to-r [&>div]:from-cyan-500 [&>div]:to-indigo-500 rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Helper Mascot Column */}
        <div className="lg:col-span-1 flex flex-col items-center text-center space-y-4">
          <div className="bg-white border border-slate-200/60 p-4 rounded-3xl shadow-sm flex flex-col items-center w-full max-w-[200px] mx-auto">
            <AriseMascot global={true} size={100} />
            <div className="w-full h-px bg-slate-100 my-3" />
            <p className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">ARISE Mascot</p>
          </div>
          
          {/* Conversational Bubble Speech */}
          <div className="relative bg-indigo-50 border border-indigo-100 p-4 rounded-2xl text-xs text-indigo-850 text-left leading-relaxed max-w-[240px] shadow-sm">
            {isGenerating ? (
              <span className="animate-pulse">"Give me a brief moment. I am parsing prerequisites, writing chapters, and creating study modules..."</span>
            ) : (
              getMascotSpeech()
            )}
            {/* Speech bubble arrow */}
            <div className="absolute right-1/2 translate-x-1/2 -bottom-2 w-4 h-4 bg-white border-r border-b border-slate-200/60 rotate-45 hidden lg:block" style={{ bottom: "auto", top: "20px", right: "auto", left: "-9px", transform: "rotate(135deg)" }} />
          </div>
        </div>

        {/* Form Wizard Body */}
        <div className="lg:col-span-3">
          <Card className="glasspanel p-8 min-h-[420px] flex flex-col justify-between relative overflow-hidden rounded-3xl bg-white shadow-sm">
            {/* Glow overlays */}
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />
            
            {isGenerating ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 relative overflow-visible">
                {/* Immersive Mascot sleeping on the progress bar */}
                <div className="relative w-64 mt-8 overflow-visible">
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 pointer-events-none z-20">
                    <AriseMascot size={75} global={true} />
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200/50">
                    <motion.div 
                      className="bg-gradient-to-r from-cyan-400 via-indigo-500 to-pink-500 h-full rounded-full"
                      animate={{ width: ["15%", "85%"] }}
                      transition={{ duration: 8, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-2.5 tracking-wider animate-pulse">
                    Ari is dreaming up your path...
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold animate-pulse text-slate-800">Configuring Syllabus...</h3>
                  <p className="text-xs text-slate-500 max-w-sm font-medium">Generating adaptive roadmap structure powered by Gemini-1.5-Pro.</p>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-cyan-50 border border-cyan-100 rounded-2xl text-cyan-600 shadow-inner">
                        <BrainCircuit className="w-7 h-7" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-850 tracking-tight">What do you want to learn?</h2>
                        <p className="text-xs text-slate-500 font-medium">Enter a specific topic, subject, or skill.</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 pt-4">
                      <Label className="text-sm font-bold text-slate-650">Topic Name</Label>
                      <Input 
                        placeholder="e.g., Quantum Mechanics, React Next.js, Organic Chemistry..." 
                        className="h-14 text-base bg-white border-slate-200 text-slate-850 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 rounded-xl transition-all"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && isStepValid()) handleNext();
                        }}
                      />
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-indigo-55 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-500 shadow-inner">
                        <Target className="w-7 h-7" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-855 tracking-tight">Select your current level</h2>
                        <p className="text-xs text-slate-505 font-medium">This configures the technical depth of the study timeline.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                      {["Beginner", "Intermediate", "Advanced"].map((level) => {
                        const isSelected = knowledgeLevel === level;
                        return (
                          <div 
                            key={level}
                            onClick={() => setKnowledgeLevel(level)}
                            className={`p-6 rounded-2xl border text-center cursor-pointer transition-all duration-300 font-bold ${
                              isSelected 
                                ? "bg-indigo-50 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.1)] text-indigo-700 scale-[1.02]" 
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                          >
                            <h3 className="text-base">{level}</h3>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-pink-50 border border-pink-100 rounded-2xl text-pink-500 shadow-inner">
                        <Clock className="w-7 h-7" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-850 tracking-tight">What is your learning goal?</h2>
                        <p className="text-xs text-slate-500 font-medium">Configure your primary learning motivation.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                      {["Exam Prep", "Deep Understanding", "Interview Preparation", "Build Projects"].map((g) => {
                        const isSelected = goal === g;
                        return (
                          <div 
                            key={g}
                            onClick={() => setGoal(g)}
                            className={`p-5 rounded-2xl border text-left cursor-pointer transition-all duration-300 font-bold ${
                              isSelected 
                                ? "bg-pink-55 bg-pink-50 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.1)] text-pink-700 scale-[1.01]" 
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                          >
                            <h3 className="text-sm">{g}</h3>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-blue-55 bg-blue-50 border border-blue-100 rounded-2xl text-blue-500 shadow-inner">
                        <Upload className="w-7 h-7" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-850 tracking-tight">Upload reference files (Optional)</h2>
                        <p className="text-xs text-slate-500 font-medium">Drop notes, book chapters, or PDFs to base lessons on.</p>
                      </div>
                    </div>

                    <div 
                      onDragEnter={handleDrag} 
                      onDragOver={handleDrag} 
                      onDragLeave={handleDrag} 
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-3xl p-8 text-center bg-[#FAF9F6] hover:bg-slate-50 transition-all cursor-pointer group relative ${
                        dragActive ? "border-indigo-500 bg-indigo-50" : "border-slate-200"
                      }`}
                    >
                      <Label htmlFor="file-upload" className="cursor-pointer block">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200 group-hover:scale-105 group-hover:border-indigo-500/30 transition-transform shadow-inner">
                          <CloudUpload className="w-7 h-7 text-slate-400 group-hover:text-indigo-500" />
                        </div>
                        <p className="text-sm font-bold mb-1 text-slate-700">Click or drag files here</p>
                        <p className="text-[10px] text-slate-450 uppercase tracking-widest font-semibold">Supported formats: PDF, TXT, MD</p>
                        <Input 
                          id="file-upload" 
                          type="file" 
                          multiple 
                          className="hidden" 
                          onChange={(e) => {
                            if (e.target.files) {
                              setFiles(Array.from(e.target.files));
                            }
                          }}
                        />
                      </Label>
                    </div>

                    {files.length > 0 && (
                      <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                        <p className="text-xs font-black text-indigo-600 mb-2 uppercase tracking-wider">Ingested Files:</p>
                        <ul className="text-xs text-slate-650 space-y-1.5 font-semibold">
                          {files.map((f, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                              <span className="truncate max-w-[280px] text-slate-700">{f.name}</span>
                              <span className="text-[9px] text-slate-400">({(f.size / 1024).toFixed(1)} KB)</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {!isGenerating && (
              <div className="flex justify-between items-center border-t border-slate-100 pt-6 mt-8">
                <Button 
                  variant="ghost" 
                  onClick={handleBack} 
                  disabled={step === 1}
                  className="text-slate-500 hover:text-slate-800 rounded-xl transition-colors h-11 text-xs font-bold"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                
                {step < totalSteps ? (
                  <Button 
                    onClick={handleNext} 
                    disabled={!isStepValid()}
                    className="bg-indigo-650 bg-indigo-600 hover:bg-indigo-750 text-white px-6 rounded-xl font-bold h-11 text-xs active:scale-95 transition-transform shadow-md arbuttonchunky"
                  >
                    Next Step
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleGenerate} 
                    disabled={!isStepValid()}
                    className="bg-gradient-to-r from-cyan-500 to-indigo-500 hover:opacity-95 text-white px-7 rounded-xl font-bold h-11 text-xs shadow-md shadow-indigo-500/10 active:scale-95 transition-transform arbuttonchunky"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Syllabus
                  </Button>
                )}
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
}
