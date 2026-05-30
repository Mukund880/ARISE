"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Brain, CheckCircle2, Trophy, ArrowLeft, ArrowRight, Check, FileText, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { AriseMascot } from "@/components/AriseMascot";

export default function TopicTestPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = params.topicId as string;
  const { user } = useAuth();

  const [topicData, setTopicData] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [gated, setGated] = useState(false);

  useEffect(() => {
    async function initTest() {
      if (!user || !topicId) return;
      try {
        const docRef = doc(db, "users", user.uid, "topics", topicId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const tData = docSnap.data();

          // Gate check: all modules must be completed
          const completedCount = (tData.completedModules || []).length;
          const totalCount = (tData.modules || []).length;
          if (completedCount < totalCount && totalCount > 0) {
            setGated(true);
            setLoading(false);
            return;
          }

          setTopicData(tData);

          // Retrieve cached test questions from Firestore if they exist
          if (tData.testQuestions && Array.isArray(tData.testQuestions) && tData.testQuestions.length > 0) {
            setQuestions(tData.testQuestions);
          } else {
            const res = await fetch("/api/generate-test", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ topicTitle: tData.title, level: tData.level })
            });
            const data = await res.json();
            if (data.questions) {
              setQuestions(data.questions);
              // Save to Firestore so subsequent loads read it directly from the database
              await updateDoc(docRef, {
                testQuestions: data.questions
              });
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    initTest();
  }, [user, topicId, router]);

  const handleFinish = async () => {
    if (!user) return;
    setSubmitting(true);
    let correctCount = 0;
    
    questions.forEach((q, idx) => {
      const userAns = answers[idx];
      if (q.type === "MCQ") {
        if (userAns === q.correctIndex) correctCount++;
      } else {
        if (userAns && userAns.toLowerCase() === (q.answer || "").toLowerCase()) {
          correctCount++;
        }
      }
    });

    const finalScore = Math.round((correctCount / questions.length) * 100);
    setScore(finalScore);

    // Record assessment performance
    await fetch("/api/record-assessment", {
      method: "POST",
      body: JSON.stringify({ userId: user.uid, topicId, score: finalScore })
    }).catch(e => console.error(e));

    // Clear test questions in Firestore so that any retake generates a fresh test
    const topicDocRef = doc(db, "users", user.uid, "topics", topicId);
    await updateDoc(topicDocRef, {
      testQuestions: null
    }).catch(e => console.error("Failed to clear test questions cache:", e));

    // Award bonus XP for finishing test
    if (finalScore >= 60) {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const u = docSnap.data();
        const newXp = (u.xp || 0) + 500;
        const newLevel = Math.floor(newXp / 1000) + 1;
        
        let newRank = "Rookie";
        if (newLevel >= 15) newRank = "Grandmaster";
        else if (newLevel >= 10) newRank = "Master";
        else if (newLevel >= 5) newRank = "Scholar";

        await updateDoc(docRef, {
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
              displayName: user.displayName || u.displayName || 'Scholar',
              xp: newXp,
              level: newLevel,
              rank: newRank
            })
          });
        } catch (syncErr) {
          console.error("Failed to sync XP with Firestore database:", syncErr);
        }
      }
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 max-w-sm mx-auto text-center">
        <div className="relative w-28 h-28 rounded-full overflow-hidden border border-indigo-100 shadow-inner flex items-center justify-center bg-white">
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
        <h3 className="text-base font-bold animate-pulse text-slate-800 mt-2">Assembling Grand Test...</h3>
        <p className="text-xs text-slate-500 leading-relaxed font-semibold">Retrieving curriculum context metrics and generating challenge questions.</p>
      </div>
    );
  }

  if (gated) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-6 flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="relative inline-block"
        >
          <AriseMascot size={150} state="warning" interactive={false} />
        </motion.div>

        <div className="space-y-3 px-4">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Grand Test Locked! 🔒</h1>
          <p className="text-xs text-slate-500 leading-relaxed font-semibold">
            Wait! You need to complete all modules of <strong className="text-slate-700 capitalize">{topicData?.title || 'this topic'}</strong> before you can unlock and attempt the Grand Test.
          </p>
        </div>

        <div className="pt-2">
          <Button 
            onClick={() => router.push(`/dashboard/learning/${topicId}`)} 
            className="bg-indigo-650 bg-indigo-600 hover:bg-indigo-750 text-white font-bold px-8 h-11 text-xs rounded-xl active:scale-95 transition-all arbuttonchunky shadow-md cursor-pointer"
          >
            Resume Learning
          </Button>
        </div>
      </div>
    );
  }

  if (score !== null) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="relative inline-block"
        >
          <div className="absolute inset-0 bg-yellow-500/10 rounded-full blur-3xl" />
          <Trophy className={`w-28 h-28 mx-auto relative z-10 ${score >= 80 ? "text-amber-500 drop-shadow-[0_0_20px_rgba(234,179,8,0.15)]" : score >= 60 ? "text-slate-400" : "text-amber-800"}`} />
        </motion.div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-850 tracking-tight">Grand Test Complete! 🏆</h1>
          <p className="text-sm text-slate-550 font-semibold">Personalized evaluation roadmap for <strong className="text-slate-800 capitalize">{topicData?.title}</strong></p>
        </div>

        <Card className="glasspanel p-6 max-w-sm mx-auto border-slate-200 bg-white rounded-2xl shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-black">Performance score</p>
          <p className="text-5xl font-black text-slate-800 mt-2 tracking-tight">{score}%</p>
        </Card>
        
        {score >= 60 ? (
          <div className="max-w-md mx-auto p-4 bg-green-50 border border-green-200 text-green-600 text-xs font-bold rounded-2xl flex items-center justify-center gap-2 shadow-inner">
            <Award className="w-5 h-5" />
            Excellent understanding! Ingested +500 XP Grand Test bonus.
          </div>
        ) : (
          <div className="max-w-md mx-auto p-4 bg-amber-50 border border-amber-200 text-amber-600 text-xs font-bold rounded-2xl flex items-center justify-center gap-2 shadow-inner">
            Good try! Feel free to review the modules and try the Grand Test again.
          </div>
        )}

        <div className="pt-4">
          <Button onClick={() => router.push(`/dashboard`)} className="bg-indigo-650 bg-indigo-600 hover:bg-indigo-750 text-white font-bold px-8 h-12 rounded-xl active:scale-95 transition-all arbuttonchunky">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const q = questions[currentIdx];
  if (!q) return null;

  return (
    <div className="max-w-3xl mx-auto py-10 pb-16 space-y-6 px-4">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.push(`/dashboard/learning/${topicId}`)} className="text-slate-500 hover:text-slate-800 rounded-xl text-xs font-bold h-9">
        <ArrowLeft className="w-4 h-4 mr-2" /> Resume Curriculum
      </Button>

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-200 pb-4 gap-4">
        <div>
          <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">Topic Grand Test</span>
          <h1 className="text-2xl font-black text-slate-800 capitalize tracking-tight mt-0.5">{topicData?.title}</h1>
        </div>
        <div className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-full shrink-0 shadow-inner">
          Question {currentIdx + 1} of {questions.length}
        </div>
      </div>

      {/* Question Pills Navigation */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100 border border-slate-200/50 p-3 rounded-2xl">
        {questions.map((_, idx) => {
          const isCurrent = idx === currentIdx;
          const isAnswered = answers[idx] !== undefined && answers[idx] !== "";
          
          return (
            <button
              key={idx}
              onClick={() => setCurrentIdx(idx)}
              className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${
                isCurrent 
                  ? "bg-indigo-600 border border-indigo-500 text-white shadow-md" 
                  : isAnswered 
                    ? "bg-indigo-50 border border-indigo-200 text-indigo-600" 
                    : "bg-white border border-slate-200 text-slate-500 hover:text-slate-800 shadow-sm"
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Main Question Card */}
      <Card className="p-8 border-slate-250 border-slate-200 glasspanel min-h-[320px] flex flex-col justify-between rounded-3xl bg-white shadow-sm relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="flex-1 flex flex-col justify-center">
          <h2 className="text-lg md:text-xl font-bold leading-relaxed text-slate-800 mb-8">
            {q.type === "FillInBlank" ? (
              <span className="flex flex-wrap items-center leading-loose">
                {q.question.split(/_{3,}/)[0]}
                <Input 
                  className="inline-block w-40 mx-2 text-center h-9 bg-[#FAF9F6] border-slate-200 focus:border-indigo-500 text-slate-800 rounded-lg focus:ring-1 focus:ring-indigo-500/20 font-bold shadow-inner"
                  value={answers[currentIdx] || ""}
                  onChange={(e) => setAnswers({ ...answers, [currentIdx]: e.target.value })}
                  placeholder="Type answer..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && currentIdx < questions.length - 1) {
                      setCurrentIdx(c => c + 1);
                    }
                  }}
                />
                {q.question.split(/_{3,}/)[1]}
              </span>
            ) : (
              q.question
            )}
          </h2>

          {q.type === "MCQ" && (
            <div className="grid grid-cols-1 gap-3.5 max-w-xl">
              {q.options.map((opt: string, i: number) => {
                const isSelected = answers[currentIdx] === i;
                return (
                  <Button
                    key={i}
                    variant="outline"
                    className={`w-full justify-between h-auto py-4 px-5 border transition-all duration-300 whitespace-normal text-left text-xs font-semibold rounded-2xl leading-relaxed flex items-center gap-3 active:scale-95 ${
                      isSelected 
                        ? "bg-indigo-50 border-indigo-500 text-indigo-650 shadow-[0_0_15px_rgba(99,102,241,0.05)] font-bold" 
                        : "bg-[#FAF9F6] border-slate-200 hover:bg-slate-50 hover:border-indigo-500/20 text-slate-600 hover:text-slate-850"
                    }`}
                    onClick={() => setAnswers({ ...answers, [currentIdx]: i })}
                  >
                    <span>{opt}</span>
                    {isSelected && (
                      <Check className="w-4 h-4 shrink-0 text-indigo-500" />
                    )}
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Navigator Footer */}
      <div className="flex justify-between items-center pt-2">
        <Button 
          variant="ghost" 
          onClick={() => setCurrentIdx(c => Math.max(0, c - 1))}
          disabled={currentIdx === 0}
          className="text-slate-550 hover:text-slate-800 rounded-xl text-xs font-bold h-11 px-5"
        >
          Previous Question
        </Button>

        {currentIdx === questions.length - 1 ? (
          <Button 
            onClick={handleFinish} 
            disabled={submitting}
            className="bg-gradient-to-r from-cyan-500 to-indigo-500 font-bold px-8 h-11 text-xs text-white rounded-xl shadow-md active:scale-95 transition-all arbuttonchunky"
          >
            {submitting ? "Finishing..." : "Submit Grand Test"}
          </Button>
        ) : (
          <Button 
            onClick={() => setCurrentIdx(c => c + 1)} 
            className="bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 font-bold px-8 h-11 text-xs rounded-xl active:scale-95 transition-all arbuttonchunky shadow-sm"
          >
            Next Question <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
