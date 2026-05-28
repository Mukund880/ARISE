"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, Clock, Brain, UserCheck, Sparkles, BookOpen, Lock, Crown, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const PAID_TIERS = ["polymath", "guild_master", "guildmaster", "guild master"];

function isPaidUser(subscriptionTier?: string): boolean {
  if (!subscriptionTier) return false;
  return PAID_TIERS.includes(subscriptionTier.toLowerCase().trim());
}

function TeachersPaywall() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 px-4"
    >
      {/* Lock Icon */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-primary/8 border border-primary/20 flex items-center justify-center mx-auto">
          <Lock className="w-9 h-9 text-primary/70" />
        </div>
        {/* Glow */}
        <div className="absolute inset-0 w-20 h-20 rounded-full bg-primary/10 blur-2xl mx-auto pointer-events-none" />
      </div>

      {/* Headline */}
      <div className="space-y-3">
        <span className="text-[10px] font-mono tracking-widest text-primary font-bold uppercase">Premium Feature</span>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Instructor Portal is a<br />Subscription-Only Feature
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
          The Instructor Portal — including classroom management, squad analytics, AI syllabus generation, and student roadmap assignment — is exclusively available to <strong className="text-foreground">Polymath</strong> and <strong className="text-foreground">Guild Master</strong> members.
        </p>
      </div>

      {/* Feature bullets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left max-w-lg">
        {[
          { icon: <Users className="w-3.5 h-3.5" />, label: "Manage class squads & students" },
          { icon: <Brain className="w-3.5 h-3.5" />, label: "Assign custom AI roadmaps" },
          { icon: <Sparkles className="w-3.5 h-3.5" />, label: "AI syllabus generation" },
          { icon: <UserCheck className="w-3.5 h-3.5" />, label: "Real-time student analytics" },
        ].map(({ icon, label }) => (
          <div key={label} className="flex items-center gap-2.5 text-xs text-muted-foreground p-3 rounded-lg border border-border bg-card">
            <span className="text-primary shrink-0">{icon}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* CTA buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <Link href="/dashboard/pricing" className="flex-1">
          <Button className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/95 border border-primary/80 font-mono text-xs uppercase tracking-widest rounded-md cursor-pointer gap-2">
            <Crown className="w-3.5 h-3.5" />
            View Subscription Plans
          </Button>
        </Link>
        <Link href="/dashboard" className="flex-1">
          <Button variant="outline" className="w-full h-11 border-border text-foreground hover:bg-secondary/15 font-mono text-xs uppercase tracking-widest rounded-md cursor-pointer">
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Fine print */}
      <p className="text-[10px] text-muted-foreground font-mono tracking-wider">
        Already subscribed? Your access will be reflected automatically after your plan activates.
      </p>
    </motion.div>
  );
}

export default function TeachersPage() {
  const { userProfile, loading } = useAuth();

  const squadStats = [
    { name: "CS-101 Introduction to AI", students: 18, activeTime: "420 mins/wk", accuracy: "84%", topic: "Machine Learning Basics" },
    { name: "Rust Systems Programming", students: 12, activeTime: "510 mins/wk", accuracy: "89%", topic: "Rust Programming" },
  ];

  // Show loading skeleton while profile is still loading
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        <div className="h-16 rounded-lg bg-card border border-border animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-lg bg-card border border-border animate-pulse" />)}
        </div>
      </div>
    );
  }

  // Block access if user is not on a paid tier
  // TODO: Remove this bypass once ready for production
  // if (!isPaidUser(userProfile?.subscriptionTier)) {
  //   return <TeachersPaywall />;
  // }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-6xl mx-auto space-y-8 pb-12"
    >
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-xl font-bold tracking-wider text-foreground uppercase flex items-center gap-3">
            <GraduationCap className="text-primary w-6 h-6" />
            Instructor Portal &amp; Classrooms
          </h1>
          <p className="text-muted-foreground text-xs mt-1">Create classroom squads and manage students. Students in your classroom will be able to join squads you create.</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/95 border border-primary/80 font-mono text-xs uppercase tracking-wider rounded-md h-11 px-6 cursor-pointer">
          Create Classroom Squad
        </Button>
      </div>

      {/* Classroom Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ClassroomStatCard icon={<Users className="w-4 h-4 text-primary" />} label="ACTIVE STUDENTS" value="30 Scholars" desc="Across 2 managed squads" />
        <ClassroomStatCard icon={<Clock className="w-4 h-4 text-primary" />} label="AVERAGE STUDY VELOCITY" value="465 MINS/WK" desc="Class study session aggregates" />
        <ClassroomStatCard icon={<UserCheck className="w-4 h-4 text-primary" />} label="SQUAD ACCURACY INDEX" value="86.5%" desc="Average quiz accuracy index" />
      </div>

      {/* Classroom Lists */}
      <div className="space-y-6 pt-4">
        <h2 className="text-sm font-mono uppercase tracking-widest text-primary font-bold">Active Managed Squads</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {squadStats.map((squad) => (
            <Card key={squad.name} className="p-6 border border-border bg-card rounded-lg relative overflow-hidden shadow-sm flex flex-col justify-between">
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/5 blur-xl pointer-events-none" />

              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-md font-bold text-foreground capitalize truncate">{squad.name}</h3>
                    <p className="text-[9px] text-muted-foreground tracking-wider uppercase font-semibold mt-1">ACTIVE TOPIC: {squad.topic}</p>
                  </div>
                  <span className="text-[9px] font-mono tracking-wider font-bold text-primary px-2.5 py-0.5 rounded border border-primary/20 bg-primary/5 uppercase">
                    {squad.students} MEMBERS
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 py-4 border-y border-border/40 text-center">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">ACTIVE TIME</p>
                    <p className="text-xs font-bold text-foreground mt-1">{squad.activeTime}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">ACCURACY</p>
                    <p className="text-xs font-bold text-foreground mt-1">{squad.accuracy}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">RETENTION</p>
                    <p className="text-xs font-bold text-green-600 mt-1">Strong</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button variant="outline" className="flex-1 border-border text-foreground hover:bg-secondary/15 h-10 text-xs font-mono uppercase tracking-widest cursor-pointer">
                  Manage Students
                </Button>
                <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/95 border border-primary/80 h-10 text-xs font-mono uppercase tracking-widest cursor-pointer">
                  Squad Settings
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Teachers Resource Card */}
      <Card className="p-6 border-border bg-card rounded-lg relative overflow-hidden shadow-sm flex flex-col sm:flex-row items-center gap-6 justify-between mt-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-primary shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-mono uppercase tracking-widest text-primary font-bold">How Students Join Squads</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-xl">
              When you create a classroom squad, all students in your classroom automatically gain the ability to join it. Students will see your squad in their "Study Squads" page and can opt in to join. They can only join squads created by their teachers.
            </p>
          </div>
        </div>
      </Card>

      {/* Classroom syllabus generation Card */}
      <Card className="p-6 border-border bg-card rounded-lg relative overflow-hidden shadow-sm flex flex-col sm:flex-row items-center gap-6 justify-between">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-primary shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-mono uppercase tracking-widest text-primary font-bold">Classroom syllabus generation</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-xl">
              Construct high-fidelity learning roadmaps using Google Gemini. Upload your textbook or custom curriculum slide decks to automatically populate study sessions for all students in your squad.
            </p>
          </div>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/95 border border-primary/80 font-mono text-xs uppercase tracking-widest rounded-md h-11 px-6 cursor-pointer shrink-0">
          Upload Class Material
        </Button>
      </Card>
    </motion.div>
  );
}

function ClassroomStatCard({ icon, label, value, desc }: { icon: React.ReactNode, label: string, value: string, desc: string }) {
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
