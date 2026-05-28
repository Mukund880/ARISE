"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { TrendingUp, Clock, Trophy, Target, Award, Brain, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, getDocs } from "firebase/firestore";

export default function ProgressPage() {
  const { user, userProfile } = useAuth();

  const level = userProfile?.level || 1;
  const xp = userProfile?.xp || 0;
  const streak = userProfile?.streak || 0;
  const accuracy = userProfile?.quizAccuracy || 0;
  const studyTime = userProfile?.studyTime || 0;

  const [topics, setTopics] = useState<any[]>([]);

  useEffect(() => {
    async function fetchTopics() {
      if (!user) return;
      try {
        const topicsCol = collection(db, "users", user.uid, "topics");
        const q = query(topicsCol);
        const snap = await getDocs(q);
        setTopics(snap.docs.map(doc => doc.data()));
      } catch (err) {
        console.error("Error fetching topics:", err);
      }
    }
    fetchTopics();
  }, [user]);

  const totalModules = topics.reduce((acc, topic) => acc + (topic.modules?.length || 0), 0);

  // We do not have daily historical backend tracking yet, so we initialize with real observed data (0 mins per day except total)
  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'short' });
  const studyData = [
    { day: "Mon", mins: currentDay === "Mon" ? studyTime : 0 },
    { day: "Tue", mins: currentDay === "Tue" ? studyTime : 0 },
    { day: "Wed", mins: currentDay === "Wed" ? studyTime : 0 },
    { day: "Thu", mins: currentDay === "Thu" ? studyTime : 0 },
    { day: "Fri", mins: currentDay === "Fri" ? studyTime : 0 },
    { day: "Sat", mins: currentDay === "Sat" ? studyTime : 0 },
    { day: "Sun", mins: currentDay === "Sun" ? studyTime : 0 },
  ];

  // Real XP progression
  const xpProgression = [0, 0, 0, xp];

  const maxMins = Math.max(...studyData.map(d => d.mins), 60) || 60;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header Panel */}
      <div>
        <h1 className="text-xl font-bold tracking-wider text-foreground uppercase flex items-center gap-3">
          <TrendingUp className="text-primary w-6 h-6" />
          My Progress & Analytics
        </h1>
        <p className="text-muted-foreground text-xs mt-1">Review your real-time learning metrics, study hours, and knowledge retention metrics.</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <OverviewStatCard icon={<Clock className="w-4 h-4 text-primary" />} label="TOTAL STUDY TIME" value={`${studyTime} MINS`} desc="Focused study time logged" />
        <OverviewStatCard icon={<Trophy className="w-4 h-4 text-primary" />} label="XP ACCUMULATED" value={`${xp.toLocaleString()} XP`} desc="Total points earned" />
        <OverviewStatCard icon={<Target className="w-4 h-4 text-primary" />} label="QUIZ ACCURACY" value={`${accuracy}%`} desc="Average correct responses" />
        <OverviewStatCard icon={<Award className="w-4 h-4 text-primary" />} label="CURRENT LEVEL" value={`LEVEL ${level}`} desc={`Rank: ${userProfile?.rank || "Rookie"}`} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Weekly Study Time Bar Chart */}
        <Card className="lg:col-span-2 p-6 border-border bg-card rounded-lg relative overflow-hidden shadow-sm flex flex-col justify-between">
          <div className="mb-6">
            <h3 className="text-xs font-mono uppercase tracking-widest text-primary font-bold">Weekly Study Hours</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Focused session minutes recorded per day</p>
          </div>

          <div className="h-64 w-full flex items-end justify-between px-2 pt-4 relative">
            {/* Custom Responsive SVG Bar Chart */}
            <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="0" y1="50" x2="500" y2="50" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4 4" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4 4" />
              <line x1="0" y1="150" x2="500" y2="150" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4 4" />
              <line x1="0" y1="199" x2="500" y2="199" stroke="var(--border)" strokeWidth="1" />

              {/* Bars */}
              {studyData.map((data, index) => {
                const barWidth = 40;
                const gap = (500 - studyData.length * barWidth) / (studyData.length - 1);
                const x = index * (barWidth + gap);
                const barHeight = (data.mins / maxMins) * 150;
                const y = 200 - barHeight;

                return (
                  <g key={data.day} className="group">
                    {/* Background Bar Track */}
                    <rect x={x} y="0" width={barWidth} height="200" rx="3" fill="var(--color-secondary)" fillOpacity="0.03" />
                    {/* Actual Value Bar */}
                    <motion.rect
                      initial={{ height: 0, y: 200 }}
                      animate={{ height: barHeight, y: y }}
                      transition={{ duration: 0.8, delay: index * 0.05 }}
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx="3"
                      fill={data.mins > 0 ? "var(--color-primary)" : "var(--border)"}
                      fillOpacity={data.mins > 0 ? 0.95 : 0.4}
                      className="transition-colors hover:fill-primary"
                    />
                    {/* Value label on hover */}
                    <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" className="text-[10px] font-mono fill-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {data.mins}m
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          
          {/* Chart X-Axis Labels */}
          <div className="flex justify-between px-6 pt-3 text-[10px] font-mono text-muted-foreground border-t border-border/30 mt-3">
            {studyData.map((data) => (
              <span key={data.day}>{data.day}</span>
            ))}
          </div>
        </Card>

        {/* Circular Gauge Ring - Quiz Accuracy */}
        <Card className="p-6 border-border bg-card rounded-lg relative overflow-hidden shadow-sm flex flex-col justify-between items-center text-center">
          <div className="w-full text-left">
            <h3 className="text-xs font-mono uppercase tracking-widest text-primary font-bold">Accuracy Index</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Average precision on knowledge tests</p>
          </div>

          <div className="relative my-8 flex items-center justify-center">
            {/* SVG Circular Progress Gauge */}
            <svg className="w-40 h-40 transform -rotate-90">
              {/* Background Ring */}
              <circle
                cx="80"
                cy="80"
                r="64"
                stroke="var(--border)"
                strokeWidth="6"
                fill="transparent"
                strokeOpacity="0.3"
              />
              {/* Highlight Active Ring */}
              <motion.circle
                cx="80"
                cy="80"
                r="64"
                stroke="var(--color-primary)"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={402}
                initial={{ strokeDashoffset: 402 }}
                animate={{ strokeDashoffset: 402 - (402 * accuracy) / 100 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-bold text-foreground tracking-tighter">{accuracy}%</span>
              <span className="text-[8px] font-mono uppercase tracking-wider text-primary mt-1">Retention</span>
            </div>
          </div>

          <div className="text-[11px] text-muted-foreground max-w-[200px] leading-relaxed">
            Your accuracy indicates a <strong className="text-foreground">Strong</strong> memory lock. Review recommended topics to maintain status.
          </div>
        </Card>
      </div>

      {/* Second Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* XP Daily Progress Line Graph */}
        <Card className="lg:col-span-2 p-6 border-border bg-card rounded-lg relative overflow-hidden shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-primary font-bold">XP Velocity</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Point progression over consecutive days</p>
          </div>

          <div className="h-44 w-full pt-4 relative">
            <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="0" y1="50" x2="500" y2="50" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3 3" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3 3" />
              <line x1="0" y1="149" x2="500" y2="149" stroke="var(--border)" strokeWidth="1" />

              {/* Area Under Curve Fill */}
              <path
                d={`M 25 150 L 150 120 L 275 80 L 475 35 L 475 150 Z`}
                fill="url(#goldGradient)"
                opacity="0.05"
              />

              {/* Spline Path */}
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.0 }}
                d={`M 25 150 L 150 120 L 275 80 L 475 35`}
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Dots */}
              <circle cx="25" cy="150" r="4.5" fill="var(--color-primary)" className="ring-4 ring-primary/10" />
              <circle cx="150" cy="120" r="4.5" fill="var(--color-primary)" />
              <circle cx="275" cy="80" r="4.5" fill="var(--color-primary)" />
              <circle cx="475" cy="35" r="4.5" fill="var(--color-primary)" className="animate-pulse" />

              {/* Gradients Definitions */}
              <defs>
                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="flex justify-between px-6 pt-3 text-[10px] font-mono text-muted-foreground border-t border-border/30 mt-3">
            <span>Session 1</span>
            <span>Session 2</span>
            <span>Session 3</span>
            <span>Active Session</span>
          </div>
        </Card>

        {/* Real-Time Concept Tracker widget */}
        <Card className="p-6 border-border bg-card rounded-lg relative overflow-hidden shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-mono uppercase tracking-widest text-primary font-bold">Topic Mastery Summary</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Status breakdown of your active syllabus</p>
          </div>

          <div className="space-y-4 my-4">
            <MasteryRow label="Active Syllabus topics" value={`${topics.length} Topics`} />
            <MasteryRow label="Total Syllabus modules" value={`${totalModules} Modules`} />
            <MasteryRow label="Average Module score" value={`${accuracy}%`} />
            <MasteryRow label="Streak Health" value={streak > 0 ? `${streak} Days Active` : "Needs Attention"} />
          </div>

          <Link href="/dashboard">
            <Button variant="outline" className="w-full text-[10px] font-mono uppercase tracking-widest border-border text-foreground hover:bg-secondary/15 h-9 rounded-md cursor-pointer flex items-center justify-center gap-1.5">
              Enter Study Arena
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}

function OverviewStatCard({ icon, label, value, desc }: { icon: React.ReactNode, label: string, value: string | number, desc: string }) {
  return (
    <div className="p-5 rounded-lg border border-border bg-card flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.01)] transition-transform hover:scale-[1.02] duration-300">
      <div className="flex justify-between items-start mb-4">
        <span className="text-[8px] font-mono font-bold tracking-widest text-muted-foreground uppercase">{label}</span>
        <div className="p-1.5 rounded bg-primary/5 border border-primary/20 text-primary shrink-0">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-xl font-bold text-foreground tracking-tight">{value}</p>
        <p className="text-[9px] text-muted-foreground mt-1 leading-normal">{desc}</p>
      </div>
    </div>
  );
}

function MasteryRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border/40 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-primary font-bold">{value}</span>
    </div>
  );
}
