"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, Globe, Sparkles, Zap, Award, Target, BookOpen } from "lucide-react";
import Link from "next/link";
import { AriseMascot } from "@/components/AriseMascot";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-800 overflow-hidden relative">
      {/* Immersive background glows */}
      <div className="absolute top-[-10%] left-[-15%] w-[60%] h-[50%] bg-indigo-200/20 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[50%] h-[60%] bg-cyan-200/20 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] bg-pink-200/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Floating particles or shapes */}
      <motion.div
        animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
        transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
        className="absolute top-[25%] left-[10%] w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-500 opacity-10 blur-sm pointer-events-none hidden md:block"
      />
      <motion.div
        animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
        className="absolute bottom-[30%] right-[15%] w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 to-yellow-500 opacity-10 blur-md pointer-events-none hidden md:block"
      />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-5 backdrop-blur-xl bg-white/40 border-b border-slate-200/60">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="p-2 bg-gradient-to-tr from-indigo-500 to-cyan-500 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-transform group-hover:scale-105">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-955 to-indigo-900 uppercase">
            ARISE
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-slate-600 hover:text-slate-900 rounded-xl transition-all font-semibold">
              Log In
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-gradient-to-r from-indigo-500 to-cyan-500 hover:opacity-95 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-[0_4px_15px_rgba(99,102,241,0.2)] hover:shadow-[0_4px_25px_rgba(34,211,238,0.3)] active:scale-95">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pt-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto flex flex-col items-center"
        >
          {/* Animated Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 border rounded-full border-indigo-200/50 bg-indigo-50/50 backdrop-blur-sm shadow-inner">
            <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-widest">
              Study Arena & Gamified AI Tutor
            </span>
          </div>
          
          {/* Headline */}
          <h1 className="text-4xl md:text-7xl font-black tracking-tight mb-6 leading-[1.15] text-slate-800">
            Learn anything inside a <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-indigo-650 to-pink-500">
              living study ecosystem.
            </span>
          </h1>

          {/* Interactive Mascot Highlight */}
          <div className="my-6 relative flex flex-col items-center group">
            <div className="absolute inset-0 bg-cyan-200/20 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
            <AriseMascot state="wave" size={130} />
            <div className="mt-2 bg-white border border-indigo-100 px-4 py-1.5 rounded-full text-xs text-indigo-600 font-bold backdrop-blur shadow-md">
              "Hi! I'm Ari, your adaptive learning companion!"
            </div>
          </div>
          
          {/* Description */}
          <p className="text-base md:text-lg text-slate-600 mb-10 max-w-2xl leading-relaxed">
            Upload your lectures or pick a topic. ARISE designs personalized roadmaps, constructs visual aids, and tests your understanding with micro-quizzes, all while rewarding your consistency.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-cyan-500 hover:opacity-95 text-white h-14 px-8 text-base font-bold rounded-2xl group shadow-lg shadow-indigo-500/10 active:scale-95 transition-transform arbuttonchunky">
                Start Studying Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/signup" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-200 hover:bg-slate-50 h-14 px-8 text-base font-semibold rounded-2xl backdrop-blur-sm transition-colors text-slate-700 bg-white/50">
                Join active squads
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-28 max-w-6xl mx-auto px-4 pb-24"
        >
          <FeatureCard 
            icon={<Target className="w-6 h-6 text-cyan-600" />}
            title="Adaptive Roadmaps"
            description="Ari maps chapters to your knowledge level, generating an interactive schedule built for active recall."
          />
          <FeatureCard 
            icon={<Zap className="w-6 h-6 text-indigo-500" />}
            title="Interactive Arena"
            description="Study sections are parsed into visual blocks. Tap any paragraph to ask AI or trigger interactive visualizers."
          />
          <FeatureCard 
            icon={<Award className="w-6 h-6 text-pink-500" />}
            title="Playful Progression"
            description="Earn XP, climb squad leaderboards, maintain study streaks, and unlock achievements for keeping consistent."
          />
        </motion.div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-3xl bg-white/80 border border-slate-200/60 backdrop-blur-lg hover:border-indigo-200 shadow-sm transition-all duration-300 text-left hover:translate-y-[-4px] group">
      <div className="mb-5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 inline-block group-hover:bg-indigo-50 group-hover:scale-105 transition-all duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-slate-800 group-hover:text-indigo-600 transition-colors">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
