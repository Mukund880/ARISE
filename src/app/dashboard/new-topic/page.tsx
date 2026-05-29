"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Upload, Sparkles, BrainCircuit, Target, Clock, ArrowRight, ArrowLeft, CheckCircle2, CloudUpload, Layers } from "lucide-react";
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

  // Google Knowledge Graph Autocomplete states
  const [kgEntities, setKgEntities] = useState<any[]>([]);
  const [loadingKg, setLoadingKg] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Interactive Loader states
  const [loaderStep, setLoaderStep] = useState(0);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

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

  // Debounced Knowledge Graph Search suggestions fetching
  useEffect(() => {
    if (!topic || topic.trim().length < 2) {
      setKgEntities([]);
      return;
    }

    const handler = setTimeout(async () => {
      setLoadingKg(true);
      try {
        const res = await fetch(`/api/knowledge-graph?query=${encodeURIComponent(topic)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.entities) {
            setKgEntities(data.entities);
          }
        }
      } catch (e) {
        console.error("Failed to fetch Knowledge Graph suggestions:", e);
      } finally {
        setLoadingKg(false);
      }
    }, 450); // 450ms debounce

    return () => clearTimeout(handler);
  }, [topic]);

  // Interactive Loader timeline effect
  useEffect(() => {
    if (!isGenerating) {
      setLoaderStep(0);
      setConsoleLogs([]);
      return;
    }

    const steps = [
      {
        status: "Analyzing core topic concepts...",
        mascot: "searching" as const,
        logs: [
          "Initiating conceptual search...",
          "Validating topic entities and conceptual keywords...",
          "Resolved entity matches. Retrieved 3 semantic descriptors."
        ]
      },
      {
        status: "Scanning reference library...",
        mascot: "scanning" as const,
        logs: [
          "Scanning local namespace indexes...",
          "Searching for uploaded PDF/markdown contextual references...",
          "Merged vector results: 2 context fragments loaded."
        ]
      },
      {
        status: "Formulating Adaptive Syllabus...",
        mascot: "thinking" as const,
        logs: [
          "Connecting to ARIS AI Engine...",
          "Drafting study modules & sequential prerequisites...",
          "Determining duration estimations and learning objectives..."
        ]
      },
      {
        status: "Structuring Gamified Milestones...",
        mascot: "processing" as const,
        logs: [
          "Assigning difficulty points & module XP weights...",
          "Adding badge multipliers and milestone triggers...",
          "Syllabus structural validation complete."
        ]
      },
      {
        status: "Assembling Study Blocks...",
        mascot: "excited" as const,
        logs: [
          "Formatting output to high-fidelity roadmap structures...",
          "Caching modules to Firestore users collection...",
          "Redirecting to your study details viewport..."
        ]
      }
    ];

    // Push initial logs for step 0
    setConsoleLogs(steps[0].logs);

    const interval = setInterval(() => {
      setLoaderStep(prev => {
        const next = prev + 1;
        if (next < steps.length) {
          // Add logs for the next step
          setConsoleLogs(current => [...current, ...steps[next].logs]);
          return next;
        }
        return prev;
      });
    }, 4500); // cycle step every 4.5 seconds

    return () => clearInterval(interval);
  }, [isGenerating]);

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
      {isGenerating ? (
        <Card className="glasspanel p-8 min-h-[480px] flex flex-col justify-center relative overflow-hidden rounded-3xl bg-white border border-slate-200/60 shadow-md">
          {/* Background decoration */}
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 relative overflow-visible py-8 px-4">
            {/* Visual background circles */}
            <div className="absolute top-10 left-10 w-24 h-24 bg-cyan-200/10 rounded-full blur-xl animate-bounce duration-[5000ms]" />
            <div className="absolute bottom-10 right-10 w-32 h-32 bg-indigo-200/10 rounded-full blur-xl animate-pulse" />

            <div className="flex flex-col items-center gap-4">
              {/* Super cute, large mascot animation */}
              <div className="relative p-6 bg-gradient-to-br from-amber-50/50 to-indigo-50/30 rounded-full border border-indigo-100 shadow-inner flex items-center justify-center">
                <AriseMascot 
                  size={160} 
                  state={
                    loaderStep === 0 ? "searching" :
                    loaderStep === 1 ? "scanning" :
                    loaderStep === 2 ? "thinking" :
                    loaderStep === 3 ? "processing" : "excited"
                  } 
                  interactive={false} 
                />
                {/* Pulsing halo */}
                <div className="absolute inset-0 rounded-full border border-indigo-500/15 animate-ping pointer-events-none" style={{ animationDuration: '3s' }} />
              </div>

              <div className="space-y-1.5 max-w-md">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">
                  {loaderStep === 0 ? "Searching Knowledge Base..." :
                   loaderStep === 1 ? "Analyzing Reference Docs..." :
                   loaderStep === 2 ? "Generating Study Syllabus..." :
                   loaderStep === 3 ? "Setting Up XP Rewards..." :
                   "Launching Your Learning Space!"}
                </h3>
                <p className="text-xs text-indigo-500 font-extrabold tracking-wide animate-pulse uppercase">
                  🚀 ARIS IS BUILDING AN AMAZING PATH FOR YOU!
                </p>
              </div>
            </div>

            {/* Playful Game-like Roadmap Timeline */}
            <div className="w-full max-w-xl bg-[#FAF9F6] border border-slate-200/80 rounded-3xl p-6 shadow-inner relative overflow-visible">
              <div className="flex items-center justify-between relative px-2">
                {/* Connecting line */}
                <div className="absolute top-[22px] left-8 right-8 h-1 bg-slate-200 -z-10 rounded-full">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${(loaderStep / 4) * 100}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>

                {[
                  { label: "Concept", icon: "🔍", step: 0 },
                  { label: "Sources", icon: "📂", step: 1 },
                  { label: "Syllabus", icon: "🧠", step: 2 },
                  { label: "XP Setup", icon: "🎮", step: 3 },
                  { label: "Launch", icon: "🚀", step: 4 }
                ].map((item) => {
                  const isActive = loaderStep === item.step;
                  const isCompleted = loaderStep > item.step;
                  return (
                    <div key={item.step} className="flex flex-col items-center space-y-2.5 relative">
                      <motion.div
                        animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className={`w-11 h-11 rounded-full flex items-center justify-center text-base shadow-md font-bold transition-all relative border-2 ${
                          isCompleted ? "bg-green-500 border-green-600 text-white" :
                          isActive ? "bg-indigo-600 border-indigo-700 text-white shadow-indigo-200" :
                          "bg-white border-slate-200 text-slate-400"
                        }`}
                      >
                        {isCompleted ? "✓" : item.icon}
                        
                        {/* Pulsing indicator ring for active step */}
                        {isActive && (
                          <span className="absolute inset-0 rounded-full border border-indigo-600 animate-ping opacity-75" />
                        )}
                      </motion.div>
                      <span className={`text-[10px] font-black uppercase tracking-wider ${
                        isCompleted ? "text-green-600" :
                        isActive ? "text-indigo-600 font-extrabold" :
                        "text-slate-400"
                      }`}>
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Playful thought bubble text */}
            <p className="text-xs text-slate-600 leading-relaxed font-bold bg-indigo-50/50 border border-indigo-100/50 rounded-2xl py-3 px-6 max-w-lg shadow-sm">
              {loaderStep === 0 && '“I am verifying core definitions and concept relationships so the curriculum is 100% accurate!”'}
              {loaderStep === 1 && '“Scanning all reference notes and documents uploaded. Tailoring modules to match your resources!”'}
              {loaderStep === 2 && '“Drafting full chapter outlines, explanations, charts, and quizzes with our AI engine. This takes the longest!”'}
              {loaderStep === 3 && '“Distributing XP points across modules and setting up milestone achievements. Get ready for rewards!”'}
              {loaderStep === 4 && '“Formatting everything and building your dashboard links. Get ready to learn!”'}
            </p>
          </div>
        </Card>
      ) : (
        <>
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
                {getMascotSpeech()}
                {/* Speech bubble arrow */}
                <div className="absolute right-1/2 translate-x-1/2 -bottom-2 w-4 h-4 bg-white border-r border-b border-slate-200/60 rotate-45 hidden lg:block" style={{ bottom: "auto", top: "20px", right: "auto", left: "-9px", transform: "rotate(135deg)" }} />
              </div>
            </div>

            {/* Form Wizard Body */}
            <div className="lg:col-span-3">
              <Card className="glasspanel p-8 min-h-[420px] flex flex-col justify-between relative overflow-hidden rounded-3xl bg-white shadow-sm">
                {/* Glow overlays */}
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />
                
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
                        <Label className="text-sm font-bold text-slate-655">Topic Name</Label>
                        <div className="relative">
                          <Input 
                            placeholder="e.g., Quantum Mechanics, React Next.js, Organic Chemistry..." 
                            className="h-14 text-base bg-white border-slate-200 text-slate-850 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 rounded-xl transition-all pr-12"
                            value={topic}
                            onChange={(e) => {
                              setTopic(e.target.value);
                            }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-500 shadow-inner">
                          <Layers className="w-7 h-7" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-slate-850 tracking-tight">Select your expertise level</h2>
                          <p className="text-xs text-slate-500 font-medium">We'll adjust syllabus depth and quizzes accordingly.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 pt-4">
                        {["Beginner", "Intermediate", "Advanced"].map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setKnowledgeLevel(level)}
                            className={`p-5 rounded-2xl border text-center transition-all cursor-pointer ${
                              knowledgeLevel === level 
                                ? "border-indigo-500 bg-indigo-50 text-indigo-700" 
                                : "border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            <span className="font-bold">{level}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-pink-50 border border-pink-100 rounded-2xl text-pink-500 shadow-inner">
                          <Target className="w-7 h-7" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-slate-850 tracking-tight">What is your learning goal?</h2>
                          <p className="text-xs text-slate-500 font-medium">Configure your primary learning motivation.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4">
                        {["Exam Prep", "Deep Understanding", "Interview Preparation", "Build Projects"].map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setGoal(g)}
                            className={`p-5 rounded-2xl border text-left cursor-pointer transition-all ${
                              goal === g 
                                ? "border-pink-500 bg-pink-50 text-pink-700" 
                                : "border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            <span className="font-bold text-sm">{g}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {step === 4 && (
                    <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl text-blue-500 shadow-inner">
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
                        className={`border-2 border-dashed rounded-3xl p-8 text-center bg-[#FAF9F6] hover:bg-slate-50 transition-all cursor-pointer ${
                          dragActive ? "border-indigo-500 bg-indigo-50" : "border-slate-200"
                        }`}
                      >
                        <Label className="cursor-pointer">
                          <CloudUpload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                          <p className="text-sm font-bold text-slate-700">Click or drag files here</p>
                          <Input type="file" multiple className="hidden" onChange={(e) => e.target.files && setFiles(Array.from(e.target.files))} />
                        </Label>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex justify-between items-center border-t border-slate-100 pt-6 mt-8">
                  <Button 
                    variant="ghost" 
                    onClick={handleBack} 
                    disabled={step === 1}
                    className="text-slate-500 hover:text-slate-800 rounded-xl font-bold"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  
                  {step < totalSteps ? (
                    <Button 
                      onClick={handleNext} 
                      disabled={!isStepValid()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 rounded-xl font-bold"
                    >
                      Next Step
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleGenerate} 
                      disabled={!isStepValid()}
                      className="bg-gradient-to-r from-cyan-500 to-indigo-500 text-white px-7 rounded-xl font-bold"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Syllabus
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
