"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, Globe, Sparkles, Zap, Award, Target, BookOpen } from "lucide-react";
import Link from "next/link";
import { AriseMascot } from "@/components/AriseMascot";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative">
      {/* Immersive subtle background warm gold glow */}
      <div className="absolute top-[-10%] left-[-15%] w-[60%] h-[50%] bg-primary/5 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[50%] h-[60%] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 md:px-12 py-3 sm:py-5 backdrop-blur-md bg-background/70 border-b border-border">
        <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group">
          <div className="p-2 bg-primary/5 border border-primary/30 rounded-lg transition-transform group-hover:scale-105">
            <Brain className="w-4 sm:w-5 h-4 sm:h-5 text-primary" />
          </div>
          <span className="text-lg sm:text-xl font-bold tracking-widest text-primary uppercase">
            ARISE
          </span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground rounded-md transition-all font-mono text-xs uppercase tracking-wider px-2 sm:px-4">
              Log In
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/95 border border-primary/80 font-mono text-xs uppercase tracking-wider rounded-md px-3 sm:px-5 py-2 sm:py-2.5 transition-all shadow-sm h-9 sm:h-10">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pt-24 sm:pt-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto flex flex-col items-center"
        >
          {/* Animated Badge */}
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 mb-6 sm:mb-8 border border-primary/25 bg-primary/5 rounded-md backdrop-blur-sm">
            <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-primary animate-pulse shrink-0" />
            <span className="text-[9px] sm:text-[10px] font-mono font-bold text-primary uppercase tracking-widest">
              AI Tutor & Gamified Study
            </span>
          </div>
          
          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight mb-4 sm:mb-6 leading-[1.15] text-foreground font-heading">
            Learn inside a <br />
            <span className="text-primary italic">living study ecosystem.</span>
          </h1>

          {/* Interactive Mascot Highlight */}
          <div className="my-6 sm:my-8 relative flex flex-col items-center group">
            <div className="absolute inset-0 bg-primary/5 rounded-lg blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
            <AriseMascot state="wave" size={80} framed={true} />
            <div className="mt-2 sm:mt-4 bg-card border border-border px-3 sm:px-4 py-1 sm:py-1.5 rounded-md text-[9px] sm:text-[10px] font-mono text-primary font-bold shadow-sm">
              "Hi! I'm ARIS, your learning companion!"
            </div>
          </div>
          
          {/* Description */}
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground mb-6 sm:mb-10 max-w-2xl leading-relaxed px-2">
            Upload content or pick a topic. Get custom roadmaps, visual aids, quizzes, and rewards for consistency.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto px-2">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/95 border border-primary/80 h-10 sm:h-12 px-6 sm:px-8 text-xs font-mono uppercase tracking-wider rounded-md group shadow-sm transition-transform active:scale-[0.98]">
                Start Free
                <ArrowRight className="w-3.5 h-3.5 ml-2 group-hover:translate-x-1 transition-transform hidden sm:inline" />
              </Button>
            </Link>
            <Link href="/signup" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-border bg-card/50 hover:bg-secondary/15 h-10 sm:h-12 px-6 sm:px-8 text-xs font-mono uppercase tracking-wider rounded-md backdrop-blur-sm transition-all text-foreground">
                Join Squads
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 mt-16 sm:mt-24 max-w-6xl mx-auto px-2 pb-16 sm:pb-24"
        >
          <FeatureCard 
            icon={<Target className="w-5 h-5 text-primary" />}
            title="Adaptive Roadmaps"
            description="ARIS maps chapters to your knowledge level, generating an interactive schedule built for active recall."
          />
          <FeatureCard 
            icon={<Zap className="w-5 h-5 text-primary" />}
            title="Interactive Arena"
            description="Study sections are parsed into visual blocks. Tap any paragraph to ask AI or trigger interactive visualizers."
          />
          <FeatureCard 
            icon={<Award className="w-5 h-5 text-primary" />}
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
    <div className="p-8 rounded-lg bg-card border border-border hover:border-primary/50 shadow-sm transition-all duration-300 text-left hover:translate-y-[-2px] group">
      <div className="mb-5 p-3 bg-primary/5 border border-primary/20 rounded-lg inline-block group-hover:scale-105 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-md font-bold mb-3 text-foreground group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-muted-foreground text-xs leading-relaxed">{description}</p>
    </div>
  );
}
