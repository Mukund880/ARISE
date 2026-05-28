"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Flame, Target, Trophy, Clock, BrainCircuit, Play, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { AriseMascot } from "@/components/AriseMascot";
import { useMascot } from "@/context/MascotContext";

export default function DashboardPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const { triggerEmotion } = useMascot();
  const firstName = user?.displayName?.split(" ")[0] || "Scholar";

  useEffect(() => {
    // Wave greeting on dashboard load
    triggerEmotion("wave", 2500);
  }, []);

  const [topics, setTopics] = useState<any[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Fetch user's topics
  useEffect(() => {
    async function fetchTopics() {
      if (!user) return;
      try {
        const topicsCol = collection(db, "users", user.uid, "topics");
        const q = query(topicsCol, orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setTopics(list);
      } catch (err) {
        console.error("Error fetching topics:", err);
      } finally {
        setLoadingTopics(false);
      }
    }
    fetchTopics();
  }, [user]);

  // Sync user profile state (XP, Level, Rank) to Prisma SQLite DB on load/change
  useEffect(() => {
    async function syncProfile() {
      if (!user || !userProfile) return;
      try {
        await fetch("/api/gamification/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || userProfile.displayName,
            xp: userProfile.xp,
            level: userProfile.level,
            rank: userProfile.rank
          })
        });
      } catch (err) {
        console.error("Failed to sync profile with Prisma:", err);
      }
    }
    syncProfile();
  }, [user, userProfile]);

  // Fetch real-time leaderboard from Prisma SQLite DB
  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch("/api/gamification/leaderboard");
        if (!res.ok) throw new Error("Failed to fetch leaderboard from Prisma");
        const list = await res.json();
        
        // Map backend 'id' field to 'uid' expected by frontend UI
        const mappedList = list.map((item: any) => ({
          ...item,
          uid: item.id
        }));

        setLeaderboard(mappedList.slice(0, 5));
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
        setLeaderboard([]);
      }
    }

    if (user) {
      fetchLeaderboard();
    }
  }, [user, userProfile]);

  // Get most recent topic for the Active Roadmap view
  const activeTopic = topics.length > 0 ? topics[0] : null;

  // Process status for active topic modules
  const activeCompletedModules = activeTopic ? (activeTopic.completedModules || []) : [];
  const firstIncompleteIdx = activeTopic
    ? (activeTopic.modules || []).findIndex((m: any) => !activeCompletedModules.includes(m.id))
    : -1;

  const activeModules = activeTopic ? (activeTopic.modules || []).map((m: any, idx: number) => {
    const isCompleted = activeCompletedModules.includes(m.id);
    let status = "locked";
    if (isCompleted) {
      status = "completed";
    } else if (idx === firstIncompleteIdx) {
      status = "active";
    }
    return { ...m, status };
  }) : [];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      
      {/* Welcome Banner Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-850 p-8 flex flex-col md:flex-row items-center justify-between shadow-md text-white"
      >
        {/* Soft background light, clipped inside card */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none z-0">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-cyan-400/20 blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-purple-400/10 blur-[80px]" />
        </div>

        {/* Immersive Mascot sitting on the card's border */}
        <div className="absolute right-[240px] -top-16 hidden md:block z-20 pointer-events-auto">
          <AriseMascot size={100} global={true} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left mb-6 md:mb-0">
          {/* Active streak flame badge */}
          <div className="w-16 h-16 shrink-0 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 p-2 shadow-inner">
            <Flame className="w-8 h-8 text-yellow-300" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">Welcome back, {firstName}! 👋</h1>
            <p className="text-indigo-100 text-sm max-w-lg leading-relaxed">
              You are currently on a <strong className="text-yellow-300 font-extrabold">{userProfile?.streak || 1}-day streak</strong>. 
              Let's complete a study session today to lock in your daily XP!
            </p>
          </div>
        </div>

        <div className="relative z-10">
          <Link href="/dashboard/new-topic">
            <Button className="bg-white text-indigo-700 hover:bg-indigo-50 rounded-full px-8 py-6 font-bold shadow-lg arbuttonchunky">
              Start New Topic
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* AI Tutor Motivation Tip */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-start gap-4 relative overflow-hidden text-indigo-900"
      >
        <div className="absolute -left-12 -top-12 w-28 h-28 rounded-full bg-indigo-500/5 blur-xl" />
        <div className="p-2 bg-indigo-100 rounded-xl text-indigo-650 shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="text-xs text-indigo-805 leading-relaxed">
          <strong className="text-indigo-950 font-bold block mb-0.5">Ari's Daily Tip</strong>
          "Studying is all about consistency, not cramming. Choose a roadmap below, learn just one bite-sized module, and claim your rewards!"
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Learning roadmaps & timeline */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-2">
              <BrainCircuit className="w-6 h-6 text-indigo-500" />
              Your Learning Roadmaps
            </h2>
          </div>

          {loadingTopics ? (
            <div className="flex justify-center py-16">
              <BrainCircuit className="w-10 h-10 animate-pulse text-indigo-500" />
            </div>
          ) : topics.length === 0 ? (
            <Card className="playfulcard p-10 border-slate-200/60 text-center flex flex-col items-center justify-center space-y-5 bg-white">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 border border-indigo-100">
                <BrainCircuit className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-800">No Learning Roadmaps Yet</h3>
                <p className="text-slate-500 text-sm max-w-sm mx-auto">Generate a personalized syllabus powered by Google Gemini to start learning and earning badges.</p>
              </div>
              <Link href="/dashboard/new-topic">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 arbuttonchunky font-bold">
                  Generate AI Roadmap
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {topics.map((topic, idx) => (
                <LearningCard 
                  key={topic.id}
                  title={topic.title}
                  level={topic.level}
                  progress={topic.progress || 0}
                  topicId={topic.id}
                  index={idx}
                />
              ))}
            </div>
          )}
          
          {activeTopic && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center pt-2">
                <h2 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-2">
                  <Clock className="w-6 h-6 text-cyan-600" />
                  Timeline: {activeTopic.title}
                </h2>
                <Link href={`/dashboard/learning/${activeTopic.id}`}>
                  <Button variant="link" className="text-indigo-600 hover:text-indigo-700 text-sm flex items-center gap-1 font-bold">
                    Enter Study Arena <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <Card className="playfulcard p-6 border-slate-200/60 bg-white">
                <div className="space-y-6">
                  {activeModules.slice(0, 5).map((mod: any) => (
                    <RoadmapStep 
                      key={mod.id}
                      completed={mod.status === "completed"} 
                      active={mod.status === "active"}
                      title={mod.title} 
                    />
                  ))}
                  {activeModules.length > 5 && (
                    <p className="text-xs text-slate-400 text-center pt-2 font-medium">
                      + {activeModules.length - 5} more modules. Enter the study arena to see all.
                    </p>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Right Column: Stats & Leaderboard */}
        <div className="space-y-8">
          <h2 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            Your Stats
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <StatCard icon={<Flame className="w-5 h-5 text-orange-500" />} label="Streak" value={`${userProfile?.streak || 1} Days`} theme="orange" />
            <StatCard icon={<Trophy className="w-5 h-5 text-amber-500" />} label="XP" value={userProfile?.xp || 0} theme="yellow" />
            <StatCard icon={<Clock className="w-5 h-5 text-cyan-600" />} label="Level" value={userProfile?.level || 1} theme="cyan" />
            <StatCard icon={<Target className="w-5 h-5 text-indigo-500" />} label="Rank" value={userProfile?.rank || 'Rookie'} theme="purple" />
          </div>

          <div className="flex justify-between items-center pt-2">
            <h2 className="text-2xl font-black tracking-tight text-slate-800">Global Standings</h2>
            <Link href="/dashboard/leaderboard" className="text-xs text-indigo-650 hover:underline font-bold">View All</Link>
          </div>
          
          <Card className="playfulcard p-5 border-slate-200/60 bg-white space-y-4">
            {leaderboard.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Compiling standings...</p>
            ) : (
              leaderboard.map((row, idx) => (
                <LeaderboardRow 
                  key={row.uid || idx}
                  rank={idx + 1} 
                  name={row.displayName || "Scholar"} 
                  xp={row.xp?.toLocaleString() || "0"} 
                  isCurrentUser={row.uid === user?.uid} 
                />
              ))
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function LearningCard({ title, level, progress, topicId, index }: any) {
  const router = useRouter();
  
  const gradients = [
    { from: "from-cyan-500/20 to-indigo-500/20", border: "hover:border-cyan-500/30", text: "text-cyan-600", bg: "bg-cyan-50" },
    { from: "from-pink-500/20 to-rose-500/20", border: "hover:border-pink-500/30", text: "text-pink-600", bg: "bg-pink-50" },
    { from: "from-amber-500/20 to-coral-500/20", border: "hover:border-amber-500/30", text: "text-amber-600", bg: "bg-amber-50" }
  ];
  const style = gradients[index % gradients.length];

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      onClick={() => router.push(`/dashboard/learning/${topicId}`)}
      className={`p-6 rounded-3xl border border-slate-200/60 bg-white relative overflow-hidden group cursor-pointer transition-all duration-300 ${style.border} shadow-sm`}
    >
      <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl ${style.bg} transition-all group-hover:scale-150`} />
      
      <div className="relative z-10 space-y-4">
        <div className="flex justify-between items-start">
          <div className={`w-11 h-11 rounded-2xl ${style.bg} border border-slate-100 flex items-center justify-center`}>
            <BrainCircuit className={style.text} />
          </div>
          <span className="text-[10px] uppercase font-black text-slate-500 px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-100">
            {level}
          </span>
        </div>

        <div>
          <h3 className="text-lg font-black text-slate-800 group-hover:text-indigo-650 capitalize truncate mb-1">{title}</h3>
          <p className="text-[10px] text-slate-400 tracking-wider uppercase font-bold">Active Syllabus</p>
        </div>
        
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex justify-between text-xs font-bold text-slate-500">
            <span>Progress</span>
            <span className={style.text}>{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200/50">
            <div 
              className={`h-full bg-gradient-to-r ${style.from} rounded-full transition-all duration-500`}
              style={{ width: `${progress}%`, backgroundImage: "linear-gradient(to right, var(--color-cyan-500), var(--color-indigo-500))" }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ icon, label, value, theme }: any) {
  const themeColors = {
    orange: "border-orange-200 text-orange-600 bg-orange-50/50",
    yellow: "border-yellow-200 text-yellow-600 bg-yellow-50/50",
    cyan: "border-cyan-200 text-cyan-600 bg-cyan-50/50",
    purple: "border-indigo-200 text-indigo-600 bg-indigo-50/50"
  }[theme as "orange" | "yellow" | "cyan" | "purple"] || "border-indigo-200 text-indigo-600 bg-indigo-50/50";

  return (
    <div className={`p-4 rounded-3xl border ${themeColors} flex flex-col items-center justify-center text-center shadow-sm transition-transform hover:scale-105 duration-300`}>
      <div className="mb-2 p-2.5 rounded-2xl bg-white border border-slate-100 shadow-inner">
        {icon}
      </div>
      <p className="text-2xl font-black text-slate-800 tracking-tight">{value}</p>
      <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">{label}</p>
    </div>
  );
}

function LeaderboardRow({ rank, name, xp, isCurrentUser }: any) {
  return (
    <div className={`flex items-center justify-between p-3.5 rounded-2xl transition-all ${
      isCurrentUser 
        ? "bg-indigo-50 border border-indigo-250 shadow-[0_0_15px_rgba(99,102,241,0.05)]" 
        : "hover:bg-slate-50"
    }`}>
      <div className="flex items-center gap-4">
        <span className={`font-black w-4 text-center text-sm ${
          rank === 1 ? "text-amber-500" : rank === 2 ? "text-slate-400" : rank === 3 ? "text-amber-700" : "text-slate-500"
        }`}>
          {rank}
        </span>
        <div className="w-8 h-8 rounded-full border border-slate-100 bg-[#FAF9F6] overflow-hidden shrink-0">
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`} alt={name} className="w-full h-full object-cover" />
        </div>
        <span className={`text-sm font-bold truncate max-w-[100px] ${isCurrentUser ? "text-indigo-600" : "text-slate-700"}`}>{name}</span>
      </div>
      <span className="text-xs font-black text-cyan-600">{xp} XP</span>
    </div>
  );
}

function RoadmapStep({ completed, active, title }: any) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
          completed ? "bg-indigo-500 border-indigo-500 text-white shadow-sm" : 
          active ? "border-cyan-500 bg-cyan-50 text-cyan-600 shadow-[0_0_15px_rgba(34,211,238,0.15)]" : 
          "border-slate-200 text-slate-300"
        }`}>
          {completed ? "✓" : active ? "!" : "•"}
        </div>
        <div className={`w-0.5 h-10 mt-2 ${completed ? "bg-indigo-500" : "bg-slate-100"}`} />
      </div>
      <div className="pt-1">
        <p className={`font-bold text-sm ${completed ? "text-slate-400 line-through opacity-70" : active ? "text-slate-800 text-base" : "text-slate-500"}`}>{title}</p>
        {active && <p className="text-[10px] text-cyan-600 font-extrabold tracking-wider uppercase mt-0.5">Active Module</p>}
      </div>
    </div>
  );
}
