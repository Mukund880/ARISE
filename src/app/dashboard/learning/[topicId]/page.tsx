"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Play, CheckCircle2, Lock, Flame, Zap, X, Trophy, Layers } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { SmartTextWrapper } from "@/components/SmartTextWrapper";
import { LearningAids } from "@/components/LearningAids";
import { PracticeModule } from "@/components/PracticeModule";
import { AriseMascot } from "@/components/AriseMascot";
import { useMascot } from "@/context/MascotContext";

export default function AdaptiveLearningPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = params.topicId as string;
  const { user, userProfile } = useAuth();
  const { triggerEmotion, setBaselineState } = useMascot();
  
  const [topicData, setTopicData] = useState<any>(null);

  useEffect(() => {
    setBaselineState("focused");
    return () => setBaselineState("idle");
  }, []);
  const [loading, setLoading] = useState(true);

  // Lesson states
  const [activeModule, setActiveModule] = useState<any>(null);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [lessonContent, setLessonContent] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [claimingXp, setClaimingXp] = useState(false);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    async function fetchTopic() {
      if (!user || !topicId) return;
      try {
        const docRef = doc(db, "users", user.uid, "topics", topicId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTopicData(docSnap.data());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchTopic();
  }, [user, topicId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Brain className="w-12 h-12 animate-pulse text-indigo-500" />
        <p className="text-slate-500 animate-pulse text-xs">Assembling study timeline...</p>
      </div>
    );
  }

  if (!topicData) {
    return (
      <div className="text-center py-20 max-w-md mx-auto space-y-5">
        <p className="text-slate-500 text-sm">Personalized curriculum not found. Let's create one!</p>
        <Button onClick={() => router.push("/dashboard/new-topic")} className="bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl px-6 py-5 ar-button-chunky text-xs font-bold shadow-md">
          Create New Topic
        </Button>
      </div>
    );
  }

  const topicName = topicData.title;
  const completedModules = topicData.completedModules || [];
  
  // Find index of first incomplete module
  const firstIncompleteIdx = (topicData.modules || []).findIndex(
    (m: any) => !completedModules.includes(m.id)
  );

  const modules = (topicData.modules || []).map((m: any, idx: number) => {
    const isCompleted = completedModules.includes(m.id);
    let status = "locked";
    if (isCompleted) {
      status = "completed";
    } else if (idx === firstIncompleteIdx) {
      status = "active";
    }
    return { ...m, status };
  });

  const progress = modules.length > 0 ? Math.round((completedModules.length / modules.length) * 100) : 0;

  const handleStartModule = async (module: any) => {
    if (module.status === "locked") return;
    setActiveModule(module);
    setLoadingLesson(true);
    triggerEmotion("thinking", 20000);
    setSelectedOption(null);
    setQuizAnswered(false);
    setQuizCorrect(false);
    setShowHint(false);
    setClaimed(completedModules.includes(module.id));
    
    try {
      const res = await fetch("/api/generate-module-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicTitle: topicData.title,
          moduleTitle: module.title,
          level: topicData.level || "Beginner",
          goal: topicData.goal || "Master the concepts"
        })
      });
      
      if (!res.ok) throw new Error("Failed to generate content");
      const data = await res.json();
      setLessonContent(data);
    } catch (err) {
      console.error(err);
      setLessonContent({
        error: true,
        explanation: "Sorry, the AI Tutor encountered an error while generating this module. Please try again.",
        quizQuestion: "Error generating content. Please close this module and try again.",
        quizOptions: ["A", "B", "C", "D"],
        correctOptionIndex: 0,
        hint: "Try again."
      });
    } finally {
      setLoadingLesson(false);
    }
  };

  const handleCompleteModule = async () => {
    if (!user || !topicData || !activeModule) return;
    setClaimingXp(true);
    triggerEmotion("excited", 3500);
    try {
      const isAlreadyCompleted = completedModules.includes(activeModule.id);
      if (!isAlreadyCompleted) {
        const newCompleted = [...completedModules, activeModule.id];
        const newProgress = Math.round((newCompleted.length / topicData.modules.length) * 100);
        
        // Update topic doc in Firestore
        const topicRef = doc(db, "users", user.uid, "topics", topicId);
        await updateDoc(topicRef, {
          completedModules: newCompleted,
          progress: newProgress
        });
        
        // Update user profile in Firestore
        const userRef = doc(db, "users", user.uid);
        const currentXp = userProfile?.xp || 0;
        const earnedXp = activeModule.xp || 100;
        const newXp = currentXp + earnedXp;
        const newLevel = Math.floor(newXp / 1000) + 1;
        
        let newRank = "Rookie";
        if (newLevel >= 15) newRank = "Grandmaster";
        else if (newLevel >= 10) newRank = "Master";
        else if (newLevel >= 5) newRank = "Scholar";
        
        await updateDoc(userRef, {
          xp: newXp,
          level: newLevel,
          rank: newRank
        });

        try {
          await fetch("/api/gamification/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || userProfile?.displayName || 'Scholar',
              xp: newXp,
              level: newLevel,
              rank: newRank
            })
          });
        } catch (syncErr) {
          console.error("Failed to sync XP with Prisma database:", syncErr);
        }

        // Update local state
        setTopicData((prev: any) => ({
          ...prev,
          completedModules: newCompleted,
          progress: newProgress
        }));
      }
      setClaimed(true);
    } catch (err) {
      console.error(err);
    } finally {
      setClaimingXp(false);
      setActiveModule(null);
      setLessonContent(null);
    }
  };

  function parseMarkdown(text: string) {
    if (!text) return null;
    return text.split("\n").map((line, i) => {
      if (line.startsWith("### ")) {
        return (
          <h4 key={i} className="text-base font-bold text-cyan-700 mt-5 mb-2.5 flex items-center gap-1.5 border-l-2 border-cyan-500/40 pl-2">
            {line.replace("### ", "")}
          </h4>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h3 key={i} className="text-lg font-black text-indigo-750 mt-7 mb-3.5 flex items-center gap-2">
            {line.replace("## ", "")}
          </h3>
        );
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={i} className="text-slate-700 ml-4 mb-2 list-disc leading-relaxed text-sm font-medium">
            {line.substring(2)}
          </li>
        );
      }
      if (line.trim() === "") return <div key={i} className="h-3" />;
      return <p key={i} className="text-slate-700 leading-relaxed mb-4 text-sm font-medium">{line}</p>;
    });
  }

  return (
    <div className="max-w-5xl mx-auto pb-16">
      
      {/* Header Container */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-indigo-500" />
            <span className="text-indigo-500 font-bold text-xs uppercase tracking-widest">Personalized AI Curriculum</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-3 capitalize text-slate-800">{topicName}</h1>
          <div className="flex items-center gap-3.5 text-xs text-slate-500 font-semibold">
            <span className="flex items-center gap-1 capitalize text-amber-600"><Flame className="w-4 h-4 text-amber-500 fill-amber-500/25" /> {topicData.level || "Beginner"} Level</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-cyan-600"><Zap className="w-4 h-4 text-cyan-500" /> {modules.reduce((acc: number, m: any) => acc + (m.xp || 100), 0)} Total XP</span>
          </div>
        </div>
        
        <div className="w-full md:w-64 text-right space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-500">
            <span>Overall Progress</span>
            <span className="text-cyan-600">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2 bg-slate-100 border border-slate-200/50 [&>div]:bg-cyan-500 mb-4 rounded-full" />
          
          {progress === 100 && (
            <Button 
              onClick={() => router.push(`/dashboard/learning/${topicId}/test`)}
              className="bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold rounded-xl animate-pulse w-full h-11 text-xs ar-button-chunky shadow-md"
            >
              Take Final Test <Trophy className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Study timeline */}
        <div className="lg:col-span-2 relative pl-6">
          {/* Vertical Line indicator */}
          <div className="absolute left-6 top-8 bottom-8 w-1 bg-slate-200/60 rounded-full" />
          <div 
            className="absolute left-6 top-8 w-1 bg-gradient-to-b from-indigo-500 to-cyan-500 rounded-full shadow-sm transition-all duration-700 ease-out" 
            style={{ height: `${progress}%` }}
          />

          <div className="space-y-6 relative z-10 -ml-6">
            {modules.map((mod: any, index: number) => (
              <motion.div 
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                key={mod.id} 
                className="flex items-start gap-6 group"
              >
                {/* Timeline Circle Node */}
                <div 
                  onClick={() => handleStartModule(mod)}
                  className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center border-4 cursor-pointer transition-all duration-300 mt-3.5 ${
                    mod.status === "completed" ? "bg-indigo-50 border-indigo-500 text-indigo-600 hover:scale-105" :
                    mod.status === "active" ? "bg-cyan-50 border-cyan-400 text-cyan-600 shadow-[0_0_15px_rgba(34,211,238,0.15)] hover:scale-105" :
                    "bg-white border-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {mod.status === "completed" ? <CheckCircle2 className="w-6 h-6 text-indigo-500" /> :
                   mod.status === "active" ? <Play className="w-5 h-5 ml-0.5 fill-cyan-500/20 text-cyan-550" /> :
                   <Lock className="w-4 h-4" />}
                </div>

                {/* Module Body Card */}
                <Card 
                  onClick={() => handleStartModule(mod)}
                  className={`flex-1 p-6 transition-all duration-300 cursor-pointer rounded-2xl bg-white shadow-sm border border-slate-200/60 relative ${
                    mod.status === "active" ? "border-cyan-500/30 hover:border-cyan-400/60 bg-cyan-500/5 shadow-md overflow-visible" :
                    mod.status === "completed" ? "opacity-75 hover:opacity-100 hover:border-slate-300 overflow-hidden" :
                    "opacity-40 cursor-not-allowed bg-slate-50/50 overflow-hidden"
                  }`}
                >
                  {mod.status === "active" && (
                    <div className="absolute -top-12 -left-6 pointer-events-none z-20">
                      <AriseMascot size={70} global={true} />
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-2 gap-4">
                    <h3 className={`text-base font-extrabold tracking-tight ${mod.status === "active" ? "text-slate-800 group-hover:text-indigo-650" : "text-slate-700"}`}>
                      {mod.title}
                    </h3>
                    <span className="text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
                      +{mod.xp || 100} XP
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 font-semibold">
                    <span>⏱ {mod.duration || "45m"} Duration</span>
                    {mod.status === "active" && (
                      <span className="text-cyan-600 font-bold">Up Next</span>
                    )}
                    {mod.status === "completed" && (
                      <span className="text-indigo-650 font-bold">Completed ✓</span>
                    )}
                  </div>
                  
                  {mod.status === "active" && (
                    <Button className="mt-4 bg-cyan-500 hover:bg-cyan-600 text-black font-bold rounded-xl px-5 h-9 text-xs active:scale-95 transition-all arbuttonchunky shadow-sm">
                      Start Lesson
                      <Play className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  )}
                  {mod.status === "completed" && (
                    <Button variant="outline" className="mt-4 border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-xl px-5 h-9 text-xs transition-colors">
                      Review Module
                    </Button>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right: AI insights */}
        <div className="space-y-6">
          <Card className="glasspanel p-6 border-slate-200 bg-white rounded-2xl relative overflow-hidden shadow-sm">
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-indigo-500/5 blur-xl" />
            <h3 className="font-extrabold text-sm mb-3 flex items-center gap-2 uppercase tracking-wider text-slate-600 border-b border-slate-100 pb-2">
              <Brain className="w-4 h-4 text-indigo-500" />
              AI Insights
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4 font-semibold">
              Welcome to your study space for <strong>{topicName}</strong>! I have customized these modules for your <strong>{topicData.level || "Beginner"}</strong> level. Tackle each module explanation and pass the understanding quiz to upgrade your stats.
            </p>
          </Card>

          <Card className="glasspanel p-6 border-slate-200 bg-white rounded-2xl shadow-sm">
            <h3 className="font-extrabold text-sm mb-4 uppercase tracking-wider text-slate-600 border-b border-slate-100 pb-2">
              Source Materials
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#FAF9F6] border border-slate-200/50">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 font-black text-[10px]">AI</div>
                <div className="text-[11px] leading-tight">
                  <p className="font-bold text-slate-700">Gemini-1.5-Pro</p>
                  <p className="text-slate-500 mt-0.5">Syllabus & Material Generator</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#FAF9F6] border border-slate-200/50">
                <div className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 font-black text-[10px]">RAG</div>
                <div className="text-[11px] leading-tight">
                  <p className="font-bold text-slate-700">Vector Ingestion Store</p>
                  <p className="text-slate-500 mt-0.5">Reference Source Indexer</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* AI Tutor Lesson Immersive Modal */}
      <AnimatePresence>
        {activeModule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-4xl bg-[#FDFBF7] border border-slate-200/60 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-[#FAF8F5]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm">
                    <Brain className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-800 tracking-tight leading-snug">{activeModule.title}</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold">ARISE Study Arena</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setActiveModule(null); setLessonContent(null); }}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors border border-transparent hover:border-slate-200/40"
                >
                  <X className="w-4 h-4 text-slate-500 hover:text-slate-850" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white/70">
                {loadingLesson ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4 max-w-md mx-auto">
                    <AriseMascot size={110} global={true} />
                    <h3 className="text-base font-bold animate-pulse text-slate-800 mt-2">ARIS is designing study blocks...</h3>
                    <p className="text-xs text-slate-500 text-center leading-relaxed font-semibold">Reviewing semantic context references and crafting multiple choice practice modules.</p>
                  </div>
                ) : (
                  lessonContent && (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 bg-white p-6 rounded-2xl border border-slate-100">
                      {/* Left side: Lesson explanation */}
                      <div className="lg:col-span-3 space-y-5 pr-0 lg:pr-6 border-r-0 lg:border-r border-slate-100">
                        <div className="flex items-center gap-2 text-cyan-600 font-bold text-xs uppercase tracking-wider mb-2">
                          <Layers className="w-4 h-4 text-cyan-600" />
                          <span>Lesson Block</span>
                        </div>
                        <SmartTextWrapper topicTitle={topicName}>
                          <div className="prose prose-slate max-w-none text-slate-700 space-y-4 font-semibold">
                            {parseMarkdown(lessonContent.explanation)}
                          </div>
                        </SmartTextWrapper>
                        
                        <LearningAids topicTitle={topicName} moduleTitle={activeModule?.title || ""} />
                      </div>

                      {/* Right side: Quiz Panel */}
                      <div className="lg:col-span-2 mt-6 lg:mt-0">
                        <PracticeModule 
                          lessonContent={lessonContent} 
                          onComplete={handleCompleteModule} 
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
