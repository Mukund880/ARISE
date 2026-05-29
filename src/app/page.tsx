"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, Globe, Sparkles, Zap, Award, Target, BookOpen, ChevronRight, Activity, Smile } from "lucide-react";
import Link from "next/link";
import { AriseMascot } from "@/components/AriseMascot";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#070A13] text-[#F8FAFC] overflow-hidden relative font-sans">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Decorative Radial Glowing Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[60%] bg-indigo-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[60%] h-[70%] bg-amber-500/5 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] bg-cyan-500/10 blur-[140px] rounded-full pointer-events-none" />

      {/* Glassmorphic Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-12 py-4 backdrop-blur-lg bg-[#070A13]/85 border-b border-slate-800/40">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="p-2 bg-gradient-to-br from-indigo-500/10 to-amber-500/10 border border-slate-700/60 rounded-xl transition-transform group-hover:scale-105 shadow-inner">
            <Brain className="w-5 h-5 text-indigo-400" />
          </div>
          <span className="text-xl font-black tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-amber-300 uppercase font-mono">
            ARISE
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-slate-400 hover:text-[#F8FAFC] hover:bg-slate-800/20 rounded-lg transition-all font-mono text-xs uppercase tracking-wider px-4">
              Log In
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-gradient-to-r from-indigo-500 to-amber-500 hover:from-indigo-600 hover:to-amber-600 text-[#F8FAFC] border-none font-mono text-xs uppercase tracking-wider rounded-lg px-5 py-2.5 transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] h-10">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pt-32 text-center pb-12">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto flex flex-col items-center"
        >
          {/* Animated Glow Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 border border-indigo-500/30 bg-indigo-500/5 rounded-full backdrop-blur-md shadow-lg animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-[10px] font-mono font-bold text-indigo-300 uppercase tracking-widest">
              AI-Powered Gamified Syllabus Ecosystem
            </span>
          </div>
          
          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1] text-foreground font-heading">
            Learn inside a <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-amber-300 to-cyan-300">
              living study universe.
            </span>
          </h1>

          {/* Description */}
          <p className="text-slate-400 text-sm sm:text-base md:text-lg mb-8 max-w-2xl leading-relaxed px-4">
            Upload study files or select any topic. Experience adaptive syllabi, interactive visual aids, active recall exercises, and high-octane gamified XP progression.
          </p>

          {/* Interactive Mascot Highlight Box */}
          <div className="my-8 relative flex flex-col items-center group p-6 rounded-2xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-sm max-w-md shadow-2xl transition-all hover:border-indigo-500/30">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-amber-500/5 rounded-2xl pointer-events-none" />
            <div className="relative z-10 flex items-center gap-4">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center shrink-0">
                <AriseMascot state="wave" size={80} interactive={true} />
              </div>
              <div className="text-left space-y-1">
                <p className="text-xs font-bold text-indigo-400 font-mono uppercase tracking-widest flex items-center gap-1.5">
                  <Smile className="w-3.5 h-3.5 text-amber-400" /> ARIS Companion
                </p>
                <p className="text-slate-300 text-xs leading-relaxed italic">
                  "Hi! I am ARIS. Let's design a custom roadmap and lock in your study streak today!"
                </p>
              </div>
            </div>
          </div>
          
          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto px-4 mt-2">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-amber-500 hover:from-indigo-600 hover:to-amber-600 text-white h-12 px-8 text-xs font-mono uppercase tracking-wider rounded-lg group shadow-lg transition-all active:scale-[0.98] cursor-pointer">
                Enter Dashboard
                <ArrowRight className="w-3.5 h-3.5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/signup" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-700/60 bg-slate-900/40 hover:bg-slate-800/30 h-12 px-8 text-xs font-mono uppercase tracking-wider rounded-lg backdrop-blur-md transition-all text-slate-300 hover:text-white cursor-pointer">
                Collaborate in Squads
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Feature Grid with Hover Glow */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-24 max-w-6xl mx-auto px-4 pb-20 w-full"
        >
          <FeatureCard 
            icon={<Target className="w-6 h-6 text-indigo-400" />}
            title="Adaptive Roadmaps"
            description="Our advanced AI maps chapters to your experience level, building a custom path with sequential milestones."
          />
          <FeatureCard 
            icon={<Zap className="w-6 h-6 text-amber-400" />}
            title="Interactive Arena"
            description="Study modules load as dynamic text. Trigger interactive visualizers or consult the AI tutor in real-time."
          />
          <FeatureCard 
            icon={<Award className="w-6 h-6 text-cyan-400" />}
            title="Squad Progression"
            description="Earn XP, maintain daily check-in streaks, compete on global leaderboards, and conduct tests in squad portals."
          />
        </motion.div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-2xl bg-slate-900/20 border border-slate-800/60 hover:border-indigo-500/20 shadow-xl transition-all duration-300 text-left hover:translate-y-[-4px] group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/2 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="mb-6 p-3.5 bg-slate-900 border border-slate-800 rounded-xl inline-block group-hover:scale-105 transition-transform duration-300 group-hover:border-indigo-500/30">
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-3 text-slate-100 group-hover:text-indigo-300 transition-colors">{title}</h3>
      <p className="text-slate-400 text-xs leading-relaxed">{description}</p>
    </div>
  );
}
