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
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-lg border border-border bg-card p-8 flex flex-col md:flex-row items-center justify-between shadow-sm overflow-visible text-foreground"
      >
        {/* Soft background warm gold light, clipped inside card */}
        <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none z-0">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-primary/5 blur-[90px]" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left mb-6 md:mb-0">
          {/* Active streak mascot companion - replacing flame icon, showing half body */}
          <div className="w-16 h-16 shrink-0 bg-primary/5 rounded-lg border border-primary/20 shadow-inner overflow-hidden relative flex items-end justify-center z-10">
            <div className="absolute -bottom-3">
              <AriseMascot size={64} global={true} interactive={true} />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-2 text-foreground font-heading">Welcome back, {firstName}! 👋</h1>
            <p className="text-muted-foreground text-sm max-w-lg leading-relaxed">
              You are currently on a <strong className="text-primary font-bold">{userProfile?.streak || 1}-day streak</strong>. 
              Let's complete a study session today to lock in your daily XP!
            </p>
          </div>
        </div>

        <div className="relative z-10">
          <Link href="/dashboard/new-topic">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/95 border border-primary/80 rounded-md px-8 py-6 font-mono text-xs uppercase tracking-wider transition-all duration-300 shadow-[0_2px_10px_rgba(197,168,128,0.12)] cursor-pointer">
              Start New Topic
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* AI Tutor Motivation Tip */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="p-4 rounded-lg bg-secondary/25 border border-border flex items-start gap-4 relative overflow-hidden text-foreground"
      >
        <div className="absolute -left-12 -top-12 w-28 h-28 rounded-full bg-primary/5 blur-xl" />
        <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground font-mono uppercase tracking-widest text-[9px] font-bold block mb-0.5">Ari's Daily Tip</strong>
          "Studying is all about consistency, not cramming. Choose a roadmap below, learn just one bite-sized module, and claim your rewards!"
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Learning roadmaps & timeline */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-wider text-foreground uppercase flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-primary" />
              Your Learning Roadmaps
            </h2>
          </div>

          {loadingTopics ? (
            <div className="flex justify-center py-16">
              <BrainCircuit className="w-8 h-8 animate-pulse text-primary" />
            </div>
          ) : topics.length === 0 ? (
            <Card className="p-10 border-border text-center flex flex-col items-center justify-center space-y-5 bg-card rounded-lg shadow-sm">
              <div className="w-14 h-14 bg-primary/5 rounded-lg flex items-center justify-center text-primary border border-primary/20">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-md font-bold text-foreground">No Learning Roadmaps Yet</h3>
                <p className="text-muted-foreground text-xs max-w-sm mx-auto">Generate a personalized syllabus powered by Google Gemini to start learning and earning badges.</p>
              </div>
              <Link href="/dashboard/new-topic">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/95 border border-primary/80 rounded-md px-6 font-mono text-xs uppercase tracking-wider">
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
                <h2 className="text-lg font-bold tracking-wider text-foreground uppercase flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Timeline: {activeTopic.title}
                </h2>
                <Link href={`/dashboard/learning/${activeTopic.id}`}>
                  <Button variant="link" className="text-primary hover:text-primary/85 text-xs flex items-center gap-1 font-bold uppercase tracking-wider font-mono">
                    Enter Study Arena <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
              <Card className="p-6 border-border bg-card rounded-lg shadow-sm">
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
                    <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest text-center pt-2">
                      + {activeModules.length - 5} more modules. Enter the study arena to see all.
                    </p>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Right Column: Stats Only */}
        <div className="space-y-8">
          <h2 className="text-lg font-bold tracking-wider text-foreground uppercase flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Your Stats
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <StatCard icon={<Flame className="w-4 h-4 text-primary" />} label="Streak" value={`${userProfile?.streak || 1} Days`} />
            <StatCard icon={<Trophy className="w-4 h-4 text-primary" />} label="XP" value={userProfile?.xp || 0} />
            <StatCard icon={<Clock className="w-4 h-4 text-primary" />} label="Level" value={userProfile?.level || 1} />
            <StatCard icon={<Target className="w-4 h-4 text-primary" />} label="Rank" value={userProfile?.rank || 'Rookie'} />
            <StatCard icon={<Target className="w-4 h-4 text-primary" />} label="Accuracy" value={`${userProfile?.quizAccuracy || 88}%`} />
            <StatCard icon={<Clock className="w-4 h-4 text-primary" />} label="Study Time" value={`${userProfile?.studyTime || 40} Mins`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function LearningCard({ title, level, progress, topicId }: any) {
  const router = useRouter();

  return (
    <motion.div 
      whileHover={{ y: -2 }}
      onClick={() => router.push(`/dashboard/learning/${topicId}`)}
      className="p-6 rounded-lg border border-border bg-card relative overflow-hidden group cursor-pointer transition-all duration-300 hover:border-primary/55 shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
    >
      {/* Subtle top-right golden glow on hover */}
      <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10 space-y-4">
        <div className="flex justify-between items-start">
          <div className="w-10 h-10 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-center">
            <BrainCircuit className="w-4 h-4 text-primary" />
          </div>
          <span className="text-[9px] font-mono tracking-wider font-bold text-primary px-2.5 py-0.5 rounded border border-primary/20 bg-primary/5 uppercase">
            {level}
          </span>
        </div>

        <div>
          <h3 className="text-md font-bold text-foreground group-hover:text-primary capitalize truncate mb-1">{title}</h3>
          <p className="text-[9px] text-muted-foreground tracking-wider uppercase font-semibold">Active Syllabus</p>
        </div>
        
        <div className="space-y-2 pt-2 border-t border-border/50">
          <div className="flex justify-between text-[10px] font-mono font-bold text-muted-foreground">
            <span>COMPLETION</span>
            <span className="text-primary">{progress}%</span>
          </div>
          <div className="w-full bg-secondary/50 rounded-full h-1 overflow-hidden border border-border/50">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ icon, label, value }: any) {
  return (
    <div className="p-5 rounded-lg border border-border bg-card flex flex-col items-center justify-center text-center shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-transform hover:scale-[1.03] duration-300">
      <div className="mb-2.5 p-2 rounded-lg bg-primary/5 border border-primary/20 text-primary">
        {icon}
      </div>
      <p className="text-xl font-bold text-foreground tracking-tight">{value}</p>
      <p className="text-[9px] text-muted-foreground font-mono uppercase mt-1 tracking-widest">{label}</p>
    </div>
  );
}


function RoadmapStep({ completed, active, title }: any) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
          completed ? "bg-primary border-primary text-primary-foreground font-bold shadow-sm" : 
          active ? "border-primary bg-primary/10 text-primary shadow-[0_0_12px_rgba(197,168,128,0.2)]" : 
          "border-border text-muted-foreground/40"
        }`}>
          {completed ? "✓" : active ? "!" : "•"}
        </div>
        <div className={`w-0.5 h-10 mt-2 ${completed ? "bg-primary" : "bg-border"}`} />
      </div>
      <div className="pt-1">
        <p className={`text-sm font-semibold transition-all duration-300 ${
          completed ? "text-muted-foreground line-through opacity-70" : 
          active ? "text-foreground text-md font-bold" : 
          "text-muted-foreground"
        }`}>{title}</p>
        {active && <p className="text-[9px] text-primary font-mono tracking-wider uppercase mt-1">Active Module</p>}
      </div>
    </div>
  );
}
