"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Flame, Target, Trophy, Clock, BrainCircuit, Play, Sparkles, ArrowRight, Award } from "lucide-react";
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

  // ARIS dynamic tips state
  const [dailyTip, setDailyTip] = useState("");

  // Daily Challenge states
  const [dailyTaskCompleted, setDailyTaskCompleted] = useState(false);
  const [dailyQuestionIdx, setDailyQuestionIdx] = useState(0);
  const [dailyTaskFeedback, setDailyTaskFeedback] = useState<{ status: "correct" | "incorrect" | "idle", text: string }>({ status: "idle", text: "" });
  const [selectedDailyOption, setSelectedDailyOption] = useState<number | null>(null);

  const DAILY_QUESTIONS = [
    {
      q: "What is the time complexity of searching a value in a balanced Binary Search Tree (BST)?",
      options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
      correctIdx: 1,
      hint: "Think about how we divide the search space by half at each node."
    },
    {
      q: "Which of the following data structures operates on a Last In First Out (LIFO) basis?",
      options: ["Queue", "Stack", "Linked List", "Binary Tree"],
      correctIdx: 1,
      hint: "Think about a stack of plates: you add to the top and remove from the top."
    },
    {
      q: "In HTTP protocols, what does a status code in the 400 range represent?",
      options: ["Successful request", "Server error", "Client error", "Redirection"],
      correctIdx: 2,
      hint: "Think about 404 Not Found or 400 Bad Request."
    },
    {
      q: "What is the purpose of an index in a relational database?",
      options: ["To encrypt database content", "To speed up data retrieval operations", "To establish foreign keys", "To compress the tables"],
      correctIdx: 1,
      hint: "Indexes help find matching records without scanning the entire table."
    },
    {
      q: "Which protocol is primarily used to securely transfer files over a network?",
      options: ["HTTP", "SFTP", "SMTP", "UDP"],
      correctIdx: 1,
      hint: "Look for the file transfer protocol with security ('S')."
    }
  ];

  useEffect(() => {
    // Wave greeting on dashboard load
    triggerEmotion("wave", 2500);

    // Pick random ARIS tip
    const tips = [
      "Studying is all about consistency, not cramming. Choose a roadmap below, learn just one bite-sized module, and claim your rewards!",
      "XP multipliers are active! Complete a quiz with 100% accuracy to earn bonus experience points and level up faster.",
      "Did you know? Reviewing a module's core concepts within 24 hours of first reading it improves retention by up to 80%!",
      "Take advantage of the Reference Library! Upload slides, notes, or research papers in your squad to study exactly what you need.",
      "Feeling stuck? Use the ARIS AI Chat Companion on any module page. I can break down complex ideas into simple analogies!",
      "Maintain your learning streak! Log in daily, complete a quick check-in task, and watch your rank soar from Rookie to Master.",
      "Learning in a Squad boosts motivation! Check out the Squads tab to collaborate with classmates and share study resources.",
      "Need to test your limits? Unlock the Grand Test at the end of any syllabus roadmap to prove your mastery of the subject.",
      "A good study session is followed by a short break. Try the Pomodoro method: study for 25 minutes, then rest for 5 minutes!",
      "ARIS says: Focus on understanding, not just passing. Try summarizing a module in your own words before taking the quiz!"
    ];
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    setDailyTip(randomTip);

    // Establish daily task question index based on date
    const idx = new Date().getDate() % DAILY_QUESTIONS.length;
    setDailyQuestionIdx(idx);
  }, []);

  useEffect(() => {
    if (userProfile) {
      const todayStr = new Date().toISOString().split('T')[0];
      setDailyTaskCompleted(userProfile.dailyTaskLastCompleted === todayStr);
    }
  }, [userProfile]);

  const handleAnswerDailyTask = async (selectedIdx: number) => {
    if (!user || !userProfile || dailyTaskCompleted) return;

    const question = DAILY_QUESTIONS[dailyQuestionIdx];
    if (selectedIdx === question.correctIdx) {
      setDailyTaskFeedback({ status: "correct", text: "Great job! 50 XP earned and streak updated!" });
      setDailyTaskCompleted(true);
      triggerEmotion("excited", 3500);

      const todayStr = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak = Number(userProfile.streak) || 1;
      if (userProfile.dailyTaskLastCompleted === yesterdayStr) {
        newStreak += 1;
      } else if (userProfile.dailyTaskLastCompleted !== todayStr) {
        newStreak = 1;
      }

      try {
        const { updateDoc, doc, increment } = await import("firebase/firestore");
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          xp: increment(50),
          streak: newStreak,
          dailyTaskLastCompleted: todayStr,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error("Error updating daily task stats:", err);
      }
    } else {
      setDailyTaskFeedback({ status: "incorrect", text: "That is incorrect. Review your choice and try again!" });
      triggerEmotion("thinking", 2000);
    }
  };

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

  // Sync user profile state (XP, Level, Rank) to Firebase DB on load/change
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
        console.error("Failed to sync profile with Firebase:", err);
      }
    }
    syncProfile();
  }, [user, userProfile]);

  // Fetch real-time leaderboard from Firebase DB
  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch("/api/gamification/leaderboard");
        if (!res.ok) throw new Error("Failed to fetch leaderboard from Firebase");
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
          {/* Active streak mascot companion - showing full body, larger size */}
          <div className="w-28 h-28 shrink-0 bg-primary/5 rounded-2xl border border-primary/20 shadow-inner overflow-visible relative flex items-center justify-center z-10 p-2">
            <AriseMascot size={90} global={true} interactive={true} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-2 text-foreground font-heading">Welcome back, {firstName}! 👋</h1>
            <p className="text-muted-foreground text-sm max-w-lg leading-relaxed">
              You are currently on a <strong className="text-primary font-bold">{userProfile?.streak || 0}-day streak</strong>. 
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
          <strong className="text-foreground font-mono uppercase tracking-widest text-[9px] font-bold block mb-0.5">ARIS's Daily Tip</strong>
          {dailyTip || "Studying is all about consistency, not cramming. Choose a roadmap below, learn just one bite-sized module, and claim your rewards!"}
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
                <p className="text-muted-foreground text-xs max-w-sm mx-auto">Generate a personalized syllabus powered by advanced AI to start learning and earning badges.</p>
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

        {/* Right Column: Stats & Challenges */}
        <div className="space-y-8">
          
          {/* Daily Task Card */}
          <Card className="p-6 border-border bg-card rounded-lg shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/55 pb-3">
              <h3 className="text-xs font-mono uppercase tracking-widest text-primary font-bold flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500/25" /> ARIS Daily Challenge
              </h3>
              {dailyTaskCompleted && (
                <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded">
                  Completed
                </span>
              )}
            </div>

            {dailyTaskCompleted ? (
              <div className="text-center py-4 space-y-2">
                <p className="text-sm font-bold text-foreground">Awesome! You've locked in your streak today.</p>
                <p className="text-xs text-muted-foreground">Come back tomorrow for a new ARIS challenge! Streak: {userProfile?.streak || 1} Days 🔥</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs font-bold text-foreground leading-relaxed">{DAILY_QUESTIONS[dailyQuestionIdx]?.q}</p>
                <div className="space-y-2">
                  {DAILY_QUESTIONS[dailyQuestionIdx]?.options.map((opt, oIdx) => (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={() => setSelectedDailyOption(oIdx)}
                      className={`w-full text-left p-3 text-xs rounded-lg border transition-all ${
                        selectedDailyOption === oIdx
                          ? "border-primary bg-primary/5 text-primary font-semibold"
                          : "border-border/60 hover:border-primary/50 text-foreground"
                      }`}
                    >
                      {String.fromCharCode(65 + oIdx)}. {opt}
                    </button>
                  ))}
                </div>

                {dailyTaskFeedback.status !== "idle" && (
                  <p className={`text-[11px] font-bold ${dailyTaskFeedback.status === "correct" ? "text-emerald-500" : "text-destructive"}`}>
                    {dailyTaskFeedback.text}
                  </p>
                )}

                <Button
                  onClick={() => handleAnswerDailyTask(selectedDailyOption ?? -1)}
                  disabled={selectedDailyOption === null}
                  className="w-full h-10 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest disabled:opacity-50"
                >
                  Submit Answer
                </Button>
              </div>
            )}
          </Card>

          <h2 className="text-lg font-bold tracking-wider text-foreground uppercase flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Your Stats
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <StatCard icon={<Flame className="w-4 h-4 text-primary" />} label="Streak" value={`${userProfile?.streak || 0} Days`} />
            <StatCard icon={<Trophy className="w-4 h-4 text-primary" />} label="XP" value={userProfile?.xp || 0} />
            <StatCard icon={<Clock className="w-4 h-4 text-primary" />} label="Level" value={Math.floor((userProfile?.xp || 0) / 1000) + 1} />
            <StatCard icon={<Target className="w-4 h-4 text-primary" />} label="Rank" value={(Math.floor((userProfile?.xp || 0) / 1000) + 1) >= 15 ? "Grandmaster" : (Math.floor((userProfile?.xp || 0) / 1000) + 1) >= 10 ? "Master" : (Math.floor((userProfile?.xp || 0) / 1000) + 1) >= 5 ? "Scholar" : "Rookie"} />
            <StatCard icon={<Target className="w-4 h-4 text-primary" />} label="Accuracy" value={`${userProfile?.quizAccuracy || 0}%`} />
            <StatCard icon={<Clock className="w-4 h-4 text-primary" />} label="Study Time" value={`${userProfile?.studyTime || 0} Mins`} />
          </div>

          {/* Leaderboard Section */}
          <div className="pt-6 space-y-4">
            <h2 className="text-lg font-bold tracking-wider text-foreground uppercase flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Global Leaderboard
            </h2>
            <Card className="p-0 border-border bg-card rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
              {leaderboard.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground font-mono uppercase tracking-widest flex flex-col items-center justify-center gap-3">
                  <Award className="w-6 h-6 text-muted-foreground/30" />
                  Loading rankings...
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {leaderboard.map((player, idx) => (
                    <div key={player.uid} className={`flex items-center gap-3 p-4 transition-colors ${player.uid === user?.uid ? 'bg-primary/5' : 'hover:bg-secondary/20'}`}>
                      <div className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold shrink-0 ${idx === 0 ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : idx === 1 ? 'bg-slate-300/20 text-slate-400 border border-slate-300/30' : idx === 2 ? 'bg-amber-700/20 text-amber-700 border border-amber-700/30' : 'bg-secondary text-muted-foreground'}`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${player.uid === user?.uid ? 'text-primary' : 'text-foreground'}`}>
                          {player.displayName}
                        </p>
                        <p className="text-[9px] font-mono uppercase text-muted-foreground tracking-widest mt-0.5">
                          Lvl {Math.floor((player.xp || 0) / 1000) + 1} • { (Math.floor((player.xp || 0) / 1000) + 1) >= 15 ? "Grandmaster" : (Math.floor((player.xp || 0) / 1000) + 1) >= 10 ? "Master" : (Math.floor((player.xp || 0) / 1000) + 1) >= 5 ? "Scholar" : "Rookie" }
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-primary">{player.xp} XP</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
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
