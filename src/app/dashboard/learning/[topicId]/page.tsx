"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Play, CheckCircle2, Lock, Flame, Zap, X, Trophy, Layers, Download, FileText, Code2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { SmartTextWrapper } from "@/components/SmartTextWrapper";
import { LearningAids } from "@/components/LearningAids";
import { PracticeModule } from "@/components/PracticeModule";
import { CodeCompiler } from "@/components/CodeCompiler";
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

  // Gamification Success & Alert states
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [completedXp, setCompletedXp] = useState(100);
  const [completedTitle, setCompletedTitle] = useState("");
  const [successMascot, setSuccessMascot] = useState<any>("great_job");
  const [showLevelUpModal, setShowLevelUpModal] = useState<number | null>(null);

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
  const [startTime, setStartTime] = useState<number | null>(null);

  // Notes, compiler, and focused test states
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [notesText, setNotesText] = useState("");
  const [hasNotesChanged, setHasNotesChanged] = useState(false);
  const [nextModule, setNextModule] = useState<any>(null);
  const [showCompilerModal, setShowCompilerModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);

  // Debounced auto-save for notes
  useEffect(() => {
    if (!activeModule || !user || !hasNotesChanged) return;
    const delay = setTimeout(() => {
      saveModuleNotes(notesText);
      setHasNotesChanged(false);
    }, 1500);
    return () => clearTimeout(delay);
  }, [notesText, hasNotesChanged]);

  const saveModuleNotes = async (text: string) => {
    if (!user || !activeModule) return;
    try {
      const moduleContentRef = doc(db, "users", user.uid, "topics", topicId, "modules", String(activeModule.id));
      await updateDoc(moduleContentRef, {
        studentNotes: text
      });
    } catch (e) {
      console.warn("Failed to auto-save notes:", e);
    }
  };

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

  const prefetchNextModules = async (currentModuleId: any) => {
    if (!user || !topicData || !modules) return;
    const currentIdx = modules.findIndex((m: any) => String(m.id) === String(currentModuleId));
    if (currentIdx === -1) return;

    const nextModulesToPrefetch = [];
    for (let i = 1; i <= 2; i++) {
      const nextMod = modules[currentIdx + i];
      if (nextMod) {
        nextModulesToPrefetch.push(nextMod);
      }
    }

    for (const mod of nextModulesToPrefetch) {
      try {
        const moduleContentRef = doc(db, "users", user.uid, "topics", topicId, "modules", String(mod.id));
        const moduleContentSnap = await getDoc(moduleContentRef);
        
        if (!moduleContentSnap.exists()) {
          console.log(`[Background Prefetch] Generating module: ${mod.title}`);
          const res = await fetch("/api/generate-module-content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              topicTitle: topicData.title,
              moduleTitle: mod.title,
              level: topicData.level || "Beginner",
              goal: topicData.goal || "Master the concepts"
            })
          });
          if (res.ok) {
            const data = await res.json();
            await setDoc(moduleContentRef, data);
            console.log(`[Background Prefetch] Saved module content: ${mod.title}`);
          }
        }
      } catch (err) {
        console.warn(`[Background Prefetch] Failed for module: ${mod.title}`, err);
      }
    }
  };

  const prefetchLearningAids = async (topicTitle: string, moduleTitle: string, moduleId: any) => {
    if (!user) return;
    const aids = ["Cheat Sheet", "Summary Table", "Concept Map"];
    for (const aidType of aids) {
      try {
        const aidDocId = aidType.replace(/\s+/g, "_").toLowerCase();
        const aidRef = doc(db, "users", user.uid, "topics", topicId, "modules", String(moduleId), "aids", aidDocId);
        const aidSnap = await getDoc(aidRef);
        
        if (!aidSnap.exists()) {
          console.log(`[Background Prefetch] Generating aid ${aidType} for module: ${moduleTitle}`);
          const res = await fetch("/api/learning-aids", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ topicTitle, moduleTitle, aidType })
          });
          if (res.ok) {
            const data = await res.json();
            await setDoc(aidRef, { content: data.content });
            console.log(`[Background Prefetch] Saved aid ${aidType} for module: ${moduleTitle}`);
          }
        }
      } catch (err) {
        console.warn(`[Background Prefetch] Failed for aid ${aidType}:`, err);
      }
    }
  };

  const handleStartModule = async (module: any) => {
    const freshModule = modules.find((m: any) => m.id === module.id);
    if (!freshModule || freshModule.status === "locked") return;
    setActiveModule(freshModule);
    setLoadingLesson(true);
    triggerEmotion("thinking", 20000);
    setSelectedOption(null);
    setQuizAnswered(false);
    setQuizCorrect(false);
    setShowHint(false);
    setClaimed(completedModules.includes(freshModule.id));
    setStartTime(Date.now());
    
    try {
      if (!user) throw new Error("Not authenticated");
      const moduleContentRef = doc(db, "users", user.uid, "topics", topicId, "modules", String(freshModule.id));
      const moduleContentSnap = await getDoc(moduleContentRef);
      
      let data;
      if (moduleContentSnap.exists()) {
        data = moduleContentSnap.data();
        setLessonContent(data);
      } else {
        const res = await fetch("/api/generate-module-content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topicTitle: topicData.title,
            moduleTitle: freshModule.title,
            level: topicData.level || "Beginner",
            goal: topicData.goal || "Master the concepts"
          })
        });
        
        if (!res.ok) throw new Error("Failed to generate content");
        data = await res.json();
        
        await setDoc(moduleContentRef, data);
        setLessonContent(data);
      }
      setNotesText(data?.studentNotes || "");
      setHasNotesChanged(false);

      if (data && !data.error) {
        prefetchNextModules(freshModule.id);
        prefetchLearningAids(topicData.title, freshModule.title, freshModule.id);
      }
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
      setNotesText("");
      setHasNotesChanged(false);
    } finally {
      setLoadingLesson(false);
    }
  };

  const handleCompleteModule = async (stats?: { correct: boolean }) => {
    if (!user || !topicData || !activeModule) return;
    setClaimingXp(true);
    triggerEmotion("excited", 3500);
    try {
      if (hasNotesChanged) {
        await saveModuleNotes(notesText);
        setHasNotesChanged(false);
      }

      const isAlreadyCompleted = completedModules.includes(activeModule.id);
      const earnedXp = activeModule.xp || 100;
      setCompletedXp(earnedXp);
      setCompletedTitle(activeModule.title);
      
      const currentIdx = modules.findIndex((m: any) => m.id === activeModule.id);
      if (currentIdx !== -1 && currentIdx < modules.length - 1) {
        setNextModule(modules[currentIdx + 1]);
      } else {
        setNextModule(null);
      }
      
      const mascotStates = ["great_job", "celebrating", "cheering", "high_five", "success"];
      const randomState = mascotStates[Math.floor(Math.random() * mascotStates.length)];
      setSuccessMascot(randomState);
      
      // Calculate active study minutes
      const elapsedSeconds = startTime ? (Date.now() - startTime) / 1000 : 0;
      const elapsedMins = Math.max(1, Math.round(elapsedSeconds / 60));

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
        const currentXp = Number(userProfile?.xp) || 0;
        const earnedXp = activeModule.xp || 100;
        const newXp = currentXp + earnedXp;
        const newLevel = Math.floor(newXp / 1000) + 1;
        const currentLevel = Math.floor(currentXp / 1000) + 1;

        if (newLevel > currentLevel) {
          setShowLevelUpModal(newLevel);
        }
        
        let newRank = "Rookie";
        if (newLevel >= 15) newRank = "Grandmaster";
        else if (newLevel >= 10) newRank = "Master";
        else if (newLevel >= 5) newRank = "Scholar";
        
        // Update studyTime & quiz metrics
        const currentStudyTime = Number(userProfile?.studyTime) || 0;
        const newStudyTime = currentStudyTime + elapsedMins;
        
        const isCorrect = stats ? stats.correct : true;
        const currentAnswered = Number(userProfile?.quizQuestionsAnswered) || 0;
        const currentCorrect = Number(userProfile?.quizQuestionsCorrect) || 0;
        const newAnswered = currentAnswered + 1;
        const newCorrect = currentCorrect + (isCorrect ? 1 : 0);
        const newAccuracy = Math.round((newCorrect / newAnswered) * 100);

        await updateDoc(userRef, {
          xp: newXp,
          level: newLevel,
          rank: newRank,
          studyTime: newStudyTime,
          quizQuestionsAnswered: newAnswered,
          quizQuestionsCorrect: newCorrect,
          quizAccuracy: newAccuracy,
          updatedAt: new Date().toISOString()
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
          console.error("Failed to sync XP with Firestore database:", syncErr);
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
      setStartTime(null);
      setShowSuccessModal(true);
    }
  };

  function parseMarkdown(text: string) {
    if (!text) return null;
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeLanguage = "";
    
    let inTable = false;
    let tableRows: string[][] = [];

    // Helper to format inline markdown formatting (**bold**, *italic*, `code`)
    const formatInline = (str: string) => {
      const parts = [];
      let currentIdx = 0;
      
      const regex = /(\*\*|`|\*)(.*?)\1/g;
      let match;
      
      while ((match = regex.exec(str)) !== null) {
        const matchIdx = match.index;
        if (matchIdx > currentIdx) {
          parts.push(str.substring(currentIdx, matchIdx));
        }
        
        const type = match[1];
        const content = match[2];
        
        if (type === "**") {
          parts.push(<strong key={matchIdx} className="font-extrabold text-slate-900">{content}</strong>);
        } else if (type === "*") {
          parts.push(<em key={matchIdx} className="italic text-slate-800">{content}</em>);
        } else if (type === "`") {
          parts.push(<code key={matchIdx} className="px-1.5 py-0.5 bg-slate-100 text-pink-600 rounded font-mono text-[11px] font-bold">{content}</code>);
        }
        
        currentIdx = regex.lastIndex;
      }
      
      if (currentIdx < str.length) {
        parts.push(str.substring(currentIdx));
      }
      
      return parts.length > 0 ? parts : str;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Handle Code Block
      if (line.trim().startsWith("```")) {
        if (inCodeBlock) {
          const codeString = codeBlockContent.join("\n");
          const currentLang = codeLanguage;
          elements.push(
            <div key={`code-${i}`} className="relative border border-slate-200 bg-[#1E1E1E] text-[#D4D4D4] rounded-xl overflow-hidden font-mono text-[11px] my-4 shadow-md">
              <div className="flex justify-between items-center px-4 py-2 bg-[#2D2D2D] border-b border-border/20 text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                <span>{currentLang || "code"}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(codeString);
                    setCopiedId(`code-${i}`);
                    setTimeout(() => setCopiedId(null), 2000);
                  }}
                  className="px-2.5 py-1 hover:bg-[#3E3E3E] hover:text-foreground rounded transition-colors text-[9px] uppercase font-mono font-bold cursor-pointer"
                >
                  {copiedId === `code-${i}` ? "Copied! ✓" : "Copy"}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto leading-relaxed">{codeString}</pre>
            </div>
          );
          codeBlockContent = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
          codeLanguage = line.replace("```", "").trim();
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      // Handle Markdown Tables
      if (line.trim().startsWith("|")) {
        if (!inTable) {
          inTable = true;
          tableRows = [];
        }
        
        if (line.includes("-") && !line.match(/[a-zA-Z0-9]/)) {
          continue;
        }

        const cells = line.split("|").map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        tableRows.push(cells);
        continue;
      } else {
        if (inTable) {
          const header = tableRows[0] || [];
          const body = tableRows.slice(1);
          elements.push(
            <div key={`table-${i}`} className="overflow-x-auto my-5 border border-slate-200 rounded-xl shadow-sm bg-[#FAF8F5]">
              <table className="min-w-full text-[12px] border-collapse">
                <thead>
                  <tr className="bg-indigo-50/50 border-b border-slate-200">
                    {header.map((cell, idx) => (
                      <th key={idx} className="px-4 py-2.5 text-left font-black text-slate-800 uppercase tracking-wider">
                        {formatInline(cell)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {body.map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-slate-50/50 transition-colors">
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} className="px-4 py-2 text-slate-700 font-medium">
                          {formatInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          inTable = false;
          tableRows = [];
        }
      }

      // Regular line handling
      if (line.startsWith("### ")) {
        elements.push(
          <h4 key={i} className="text-base font-bold text-cyan-700 mt-5 mb-2.5 flex items-center gap-1.5 border-l-2 border-cyan-500/40 pl-2">
            {formatInline(line.replace("### ", ""))}
          </h4>
        );
      } else if (line.startsWith("## ")) {
        elements.push(
          <h3 key={i} className="text-lg font-black text-indigo-750 mt-7 mb-3.5 flex items-center gap-2">
            {formatInline(line.replace("## ", ""))}
          </h3>
        );
      } else if (line.startsWith("- ") || line.startsWith("* ")) {
        elements.push(
          <li key={i} className="text-slate-700 ml-4 mb-2 list-disc leading-relaxed text-sm font-medium">
            {formatInline(line.substring(2))}
          </li>
        );
      } else if (line.trim() !== "") {
        elements.push(
          <p key={i} className="text-slate-700 leading-relaxed mb-4 text-sm font-semibold">
            {formatInline(line)}
          </p>
        );
      } else {
        elements.push(<div key={i} className="h-2" />);
      }
    }

    if (inTable && tableRows.length > 0) {
      const header = tableRows[0] || [];
      const body = tableRows.slice(1);
      elements.push(
        <div key="table-end" className="overflow-x-auto my-5 border border-slate-200 rounded-xl shadow-sm bg-[#FAF8F5]">
          <table className="min-w-full text-[12px] border-collapse">
            <thead>
              <tr className="bg-indigo-50/50 border-b border-slate-200">
                {header.map((cell, idx) => (
                  <th key={idx} className="px-4 py-2.5 text-left font-black text-slate-800 uppercase tracking-wider">
                    {formatInline(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {body.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-slate-50/50 transition-colors">
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} className="px-4 py-2 text-slate-700 font-medium">
                      {formatInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return elements;
  }

  if (activeModule) {
    return (
      <div className="max-w-5xl mx-auto pb-16 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="w-full bg-[#FDFBF7] border border-slate-200/60 rounded-3xl overflow-hidden shadow-lg flex flex-col min-h-[85vh]">
          {/* Window Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-[#FAF8F5] flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm">
                <Brain className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-800 tracking-tight leading-snug">{activeModule.title}</h3>
                <p className="text-[11px] text-slate-500 uppercase tracking-widest font-extrabold mt-0.5">ARISE Study Arena</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowNotesDrawer(true)}
                className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-indigo-650 font-bold text-xs transition-colors shadow-sm flex items-center gap-2 cursor-pointer animate-pulse"
              >
                <FileText className="w-4 h-4 text-indigo-500" /> Notes
              </button>
              <button 
                onClick={() => setShowCompilerModal(true)}
                className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-cyan-600 font-bold text-xs transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Code2 className="w-4 h-4 text-cyan-500" /> Compiler
              </button>
              <button 
                onClick={async () => {
                  if (hasNotesChanged) {
                    await saveModuleNotes(notesText);
                    setHasNotesChanged(false);
                  }
                  setActiveModule(null); 
                  setLessonContent(null); 
                }}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 font-bold text-xs transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <X className="w-4 h-4" /> Close Lesson
              </button>
            </div>
          </div>

          {/* Window Body */}
          <div className="flex-1 p-6 md:p-8 bg-white/70">
            {loadingLesson ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4 max-w-md mx-auto">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border border-indigo-100 shadow-inner flex items-center justify-center bg-white">
                  <video 
                    src="/working.mp4" 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    className="w-full h-full object-cover scale-110"
                  />
                  {/* Pulsing halo */}
                  <div className="absolute inset-0 rounded-full border border-indigo-500/15 animate-ping pointer-events-none" style={{ animationDuration: '3s' }} />
                </div>
                <h3 className="text-lg font-bold animate-pulse text-slate-800 mt-4">ARIS is designing study blocks...</h3>
                <p className="text-sm text-slate-500 text-center leading-relaxed font-semibold">Reviewing semantic context references and crafting multiple choice practice modules.</p>
              </div>
            ) : (
              lessonContent && (
                <div className="w-full space-y-6 bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2 text-cyan-600 font-bold text-sm uppercase tracking-wider mb-2">
                    <Layers className="w-5 h-5 text-cyan-600" />
                    <span>Lesson Block</span>
                  </div>
                  <SmartTextWrapper topicTitle={topicName}>
                    <div className="prose prose-slate max-w-none text-slate-700 space-y-4 font-semibold">
                      {parseMarkdown(lessonContent.explanation)}
                    </div>
                  </SmartTextWrapper>

                  {/* Visual Concept SVG Chart */}
                  {lessonContent.chartData && (
                    <div className="mt-8 border border-slate-200/60 rounded-2xl p-5 bg-[#FAF8F5] space-y-4 shadow-sm">
                      <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                        <Layers className="w-4 h-4 text-indigo-700" />
                        <span>{lessonContent.chartData.title || "Visual Concept Comparison"}</span>
                      </div>
                      <div className="w-full overflow-hidden flex justify-center py-2">
                        <svg className="w-full max-w-lg h-56" viewBox="0 0 500 240">
                          <line x1="60" y1="20" x2="480" y2="20" stroke="#E2E8F0" strokeDasharray="3,3" strokeWidth="1" />
                          <line x1="60" y1="80" x2="480" y2="80" stroke="#E2E8F0" strokeDasharray="3,3" strokeWidth="1" />
                          <line x1="60" y1="140" x2="480" y2="140" stroke="#E2E8F0" strokeDasharray="3,3" strokeWidth="1" />
                          <line x1="60" y1="200" x2="480" y2="200" stroke="#CBD5E1" strokeWidth="1.5" />
                          
                          <text x="45" y="25" className="fill-slate-400 font-mono text-[10px] font-bold" textAnchor="end">100%</text>
                          <text x="45" y="85" className="fill-slate-400 font-mono text-[10px] font-bold" textAnchor="end">50%</text>
                          <text x="45" y="145" className="fill-slate-400 font-mono text-[10px] font-bold" textAnchor="end">25%</text>
                          <text x="45" y="205" className="fill-slate-400 font-mono text-[10px] font-bold" textAnchor="end">0%</text>

                          {lessonContent.chartData.labels?.map((label: string, idx: number) => {
                            const value = lessonContent.chartData.values?.[idx] || 0;
                            const barWidth = 40;
                            const numLabels = lessonContent.chartData.labels.length;
                            const gap = (400 - (numLabels * barWidth)) / (numLabels + 1);
                            const x = 60 + gap + idx * (barWidth + gap);
                            const height = (value / 100) * 180;
                            const y = 200 - height;
                            
                            return (
                              <g key={idx} className="group cursor-pointer">
                                <rect
                                  x={x}
                                  y={y}
                                  width={barWidth}
                                  height={height}
                                  rx="4"
                                  className="fill-cyan-500 hover:fill-indigo-500 transition-colors duration-300"
                                />
                                <text
                                  x={x + barWidth / 2}
                                  y={y - 8}
                                  className="fill-slate-700 font-black text-[10px]"
                                  textAnchor="middle"
                                >
                                  {value}%
                                </text>
                                <text
                                  x={x + barWidth / 2}
                                  y="222"
                                  className="fill-slate-500 font-mono text-[9px] font-bold uppercase tracking-wider"
                                  textAnchor="middle"
                                >
                                  {label}
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Downloadable Source Materials */}
                  {lessonContent.downloadableFiles && lessonContent.downloadableFiles.length > 0 && (
                    <div className="mt-6 border border-slate-200/60 rounded-2xl p-5 bg-white space-y-4 shadow-sm">
                      <div className="flex items-center gap-2 text-cyan-600 font-bold text-xs uppercase tracking-wider">
                        <Download className="w-4 h-4 text-cyan-600" />
                        <span>Downloadable Lesson Materials</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        {lessonContent.downloadableFiles.map((file: any, idx: number) => {
                          const handleDownload = () => {
                            const blob = new Blob([file.content], { type: "text/plain" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = file.name;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          };
                          return (
                            <div key={idx} className="flex items-center justify-between p-3.5 border border-slate-100 rounded-xl bg-[#FAF8F5] hover:bg-slate-50/50 transition-colors">
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate">{file.name}</p>
                                <p className="text-[9px] text-slate-400 font-mono mt-0.5">SOURCE CODE FILE</p>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleDownload}
                                className="h-8 px-3 text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5 border-slate-200 bg-white hover:bg-slate-50 shadow-sm"
                              >
                                <Download className="w-3 h-3" />
                                <span>Download</span>
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  <LearningAids topicTitle={topicName} moduleTitle={activeModule?.title || ""} topicId={topicId} moduleId={activeModule?.id || ""} />

                  {/* Take Test Call to Action */}
                  <div className="mt-10 border border-slate-200/60 rounded-3xl p-8 bg-gradient-to-br from-indigo-50 to-cyan-50/50 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                    <div className="space-y-1.5 text-center md:text-left">
                      <h4 className="text-base font-black text-slate-800 uppercase tracking-tight">Ready to verify your understanding?</h4>
                      <p className="text-xs text-slate-600 font-semibold">Take a short quiz to test your comprehension and claim your XP reward.</p>
                    </div>
                    <Button
                      onClick={() => setShowQuizModal(true)}
                      className="bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold rounded-xl h-11 px-8 text-xs shadow-md active:scale-95 transition-transform cursor-pointer arbuttonchunky shrink-0"
                    >
                      Take Practice Test
                    </Button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Collapsible Study Notes Drawer */}
        <AnimatePresence>
          {showNotesDrawer && (
            <>
              <div 
                className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs" 
                onClick={async () => {
                  if (hasNotesChanged) {
                    await saveModuleNotes(notesText);
                    setHasNotesChanged(false);
                  }
                  setShowNotesDrawer(false);
                }}
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#FDFBF7] border-l border-slate-200 shadow-2xl flex flex-col h-full"
              >
                <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-[#FAF8F5]">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-550" />
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Module Study Notes</h3>
                      <p className="text-[10px] text-slate-450 font-mono">Auto-saving in background</p>
                    </div>
                  </div>
                  <button 
                    onClick={async () => {
                      if (hasNotesChanged) {
                        await saveModuleNotes(notesText);
                        setHasNotesChanged(false);
                      }
                      setShowNotesDrawer(false);
                    }}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-655 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-grow p-5 flex flex-col">
                  <textarea
                    value={notesText}
                    onChange={(e) => {
                      setNotesText(e.target.value);
                      setHasNotesChanged(true);
                    }}
                    placeholder="Type notes for this module here..."
                    className="flex-grow w-full p-4 border border-slate-200 rounded-2xl bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-sans resize-none leading-relaxed min-h-[300px]"
                  />
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[10px] text-slate-455 font-mono">
                  <span>Notes are linked to this module.</span>
                  {hasNotesChanged ? (
                    <span className="text-amber-500 animate-pulse">Unsaved changes...</span>
                  ) : (
                    <span className="text-emerald-600">Synced to cloud ✓</span>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Code Compiler Modal */}
        <AnimatePresence>
          {showCompilerModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-5xl bg-[#18181B] border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col h-[90vh]"
              >
                <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider">Interactive Code Sandbox</h3>
                      <p className="text-[10px] text-slate-400 font-mono">Select languages and run code client-side</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowCompilerModal(false)}
                    className="p-1.5 hover:bg-zinc-800 rounded-lg text-slate-405 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto py-5">
                  <CodeCompiler />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Quiz Modal Overlay */}
        <AnimatePresence>
          {showQuizModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-indigo-500" />
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Module Comprehension Test</h3>
                      <p className="text-[10px] text-slate-450 font-mono">Pass to claim module completion</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowQuizModal(false)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-655 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto py-5">
                  <PracticeModule 
                    lessonContent={lessonContent} 
                    onComplete={async (stats) => {
                      await handleCompleteModule(stats);
                      setShowQuizModal(false);
                    }} 
                  />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
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
              Take Grand Test <Trophy className="w-4 h-4 ml-2" />
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
                    <div className="absolute -top-16 -left-8 pointer-events-none z-20">
                      <AriseMascot size={100} global={true} />
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
                  <p className="font-bold text-slate-700">ARIS AI Engine</p>
                  <p className="text-slate-500 mt-0.5">Syllabus & Material Generator</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#FAF9F6] border border-slate-200/50">
                <div className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 font-black text-[10px]">DOCS</div>
                <div className="text-[11px] leading-tight">
                  <p className="font-bold text-slate-700">Reference Library</p>
                  <p className="text-slate-500 mt-0.5">Uploaded Source Indexer</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Gamification Success Celebration Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-sm bg-[#FDFBF7] border border-slate-200 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-center flex flex-col items-center"
            >
              {/* Confetti-style background glow */}
              <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20 bg-indigo-500" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20 bg-cyan-500" />

              {/* Mascot section */}
              <div className="mb-4 mt-2">
                <AriseMascot size={130} state={successMascot} interactive={false} />
              </div>

              {/* Title & Message */}
              <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2 leading-snug">
                {successMascot === "great_job" ? "Great Job! 🏆" :
                 successMascot === "celebrating" ? "Phenomenal! 🎉" :
                 successMascot === "cheering" ? "Sensational! 🌟" :
                 successMascot === "high_five" ? "High Five! ✋" : "Success! ⚡"}
              </h3>
              <p className="text-xs text-slate-650 leading-relaxed font-bold mb-4 px-2">
                You successfully mastered <strong className="text-slate-800 capitalize font-extrabold">"{completedTitle}"</strong> and earned:
              </p>

              {/* Gained points badge */}
              <div className="bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-2xl mb-6 inline-flex items-center gap-2 shadow-inner">
                <span className="text-lg">🔥</span>
                <span className="text-sm font-black text-amber-700">+{completedXp} XP Reward Claimed</span>
              </div>

              {/* Action buttons */}
              <Button 
                onClick={() => {
                  setShowSuccessModal(false);
                  if (nextModule) {
                    handleStartModule(nextModule);
                  }
                }}
                className="bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-bold rounded-xl h-11 px-8 text-xs w-full shadow-md active:scale-95 transition-transform cursor-pointer arbuttonchunky"
              >
                {nextModule ? `Start Next: ${nextModule.title}` : "Continue Curriculum"}
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Level Up Congratulations Modal */}
      <AnimatePresence>
        {showLevelUpModal !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              className="w-full max-w-md bg-gradient-to-b from-[#1E1B4B] to-[#311042] border border-indigo-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center flex flex-col items-center text-white"
            >
              {/* Confetti & Particle Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 right-10 w-48 h-48 rounded-full bg-pink-500/25 blur-3xl pointer-events-none" />

              {/* Sparkles/Stars shapes */}
              <div className="absolute top-10 left-10 text-yellow-400 text-2xl animate-pulse">✦</div>
              <div className="absolute top-24 right-12 text-pink-400 text-xl animate-bounce" style={{ animationDuration: '3s' }}>✨</div>
              <div className="absolute bottom-20 left-12 text-cyan-450 text-xl animate-pulse">✦</div>

              {/* Mascot section with big mascot */}
              <div className="mb-6 relative z-10">
                <div className="absolute -inset-4 bg-indigo-500/10 rounded-full blur-xl animate-pulse" />
                <AriseMascot size={150} state="celebrating" interactive={false} />
              </div>

              {/* Animated level up text */}
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: [0.8, 1.1, 1] }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative z-10"
              >
                <span className="bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-400 bg-clip-text text-transparent text-xs font-black uppercase tracking-widest block mb-1.5">
                  New Level Unlocked!
                </span>
                <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-yellow-300 to-amber-500 bg-clip-text text-transparent drop-shadow-sm mb-4 leading-none font-heading">
                  Level {showLevelUpModal}
                </h2>
              </motion.div>

              <p className="text-xs text-indigo-255 text-indigo-200 leading-relaxed font-semibold max-w-xs mb-6 relative z-10">
                Incredible progress! You've ascended to a new level. Your learning capabilities are arising higher every day! Keep it up!
              </p>

              {/* Rank visual representation */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 w-full mb-6 relative z-10 backdrop-blur-sm">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Current Student Rank</p>
                <p className="text-base font-black text-amber-300">
                  {showLevelUpModal >= 15 ? "🏆 Grandmaster" :
                   showLevelUpModal >= 10 ? "🌟 Master" :
                   showLevelUpModal >= 5 ? "🎓 Scholar" : "⭐ Rookie"}
                </p>
              </div>

              {/* Action buttons */}
              <Button 
                onClick={() => setShowLevelUpModal(null)}
                className="bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black font-extrabold rounded-xl h-12 px-8 text-xs w-full shadow-lg active:scale-95 transition-transform cursor-pointer arbuttonchunky border-t border-white/20"
              >
                Awesome! Continue 🚀
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Collapsible Study Notes Drawer */}
      <AnimatePresence>
        {showNotesDrawer && (
          <>
            <div 
              className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs" 
              onClick={async () => {
                if (hasNotesChanged) {
                  await saveModuleNotes(notesText);
                  setHasNotesChanged(false);
                }
                setShowNotesDrawer(false);
              }}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#FDFBF7] border-l border-slate-200 shadow-2xl flex flex-col h-full"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-[#FAF8F5]">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-550" />
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Module Study Notes</h3>
                    <p className="text-[10px] text-slate-450 font-mono">Auto-saving in background</p>
                  </div>
                </div>
                <button 
                  onClick={async () => {
                    if (hasNotesChanged) {
                      await saveModuleNotes(notesText);
                      setHasNotesChanged(false);
                    }
                    setShowNotesDrawer(false);
                  }}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-655 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-grow p-5 flex flex-col">
                <textarea
                  value={notesText}
                  onChange={(e) => {
                    setNotesText(e.target.value);
                    setHasNotesChanged(true);
                  }}
                  placeholder="Type notes for this module here..."
                  className="flex-grow w-full p-4 border border-slate-200 rounded-2xl bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-sans resize-none leading-relaxed min-h-[300px]"
                />
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[10px] text-slate-455 font-mono">
                <span>Notes are linked to this module.</span>
                {hasNotesChanged ? (
                  <span className="text-amber-500 animate-pulse">Unsaved changes...</span>
                ) : (
                  <span className="text-emerald-600">Synced to cloud ✓</span>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Code Compiler Modal */}
      <AnimatePresence>
        {showCompilerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-5xl bg-[#18181B] border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col h-[90vh]"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider">Interactive Code Sandbox</h3>
                    <p className="text-[10px] text-slate-400 font-mono">Select languages and run code client-side</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowCompilerModal(false)}
                  className="p-1.5 hover:bg-zinc-800 rounded-lg text-slate-405 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-5">
                <CodeCompiler />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quiz Modal Overlay */}
      <AnimatePresence>
        {showQuizModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-500" />
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Module Comprehension Test</h3>
                    <p className="text-[10px] text-slate-450 font-mono">Pass to claim module completion</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowQuizModal(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-655 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-5">
                <PracticeModule 
                  lessonContent={lessonContent} 
                  onComplete={async (stats) => {
                    await handleCompleteModule(stats);
                    setShowQuizModal(false);
                  }} 
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
