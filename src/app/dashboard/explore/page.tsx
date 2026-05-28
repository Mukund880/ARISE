"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Compass, Sparkles, Code, FlaskConical, LineChart, Search, Sparkle, BrainCircuit } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AriseMascot } from "@/components/AriseMascot";
import { useState } from "react";
import { Input } from "@/components/ui/input";

const categories = [
  {
    title: "Computer Science",
    icon: <Code className="w-5 h-5 text-primary" />,
    topics: [
      { name: "Next.js 15 App Router", desc: "Master modern React framework features, server actions, and caching mechanisms.", level: "Intermediate" },
      { name: "Machine Learning Basics", desc: "Learn neural networks, regression algorithms, and training pipelines.", level: "Beginner" },
      { name: "Rust Programming", desc: "Understand memory safety, ownership models, and concurrent coding.", level: "Advanced" },
    ],
  },
  {
    title: "Science & Engineering",
    icon: <FlaskConical className="w-5 h-5 text-primary" />,
    topics: [
      { name: "Quantum Mechanics", desc: "Study wave-particle duality, Schrödinger equation, and quantum states.", level: "Advanced" },
      { name: "Organic Chemistry Basics", desc: "Learn carbon structures, chemical reaction mechanisms, and bonding.", level: "Beginner" },
      { name: "Astrophysics Theories", desc: "Explore general relativity, black holes, and cosmological metrics.", level: "Intermediate" },
    ],
  },
  {
    title: "Finance & Economics",
    icon: <LineChart className="w-5 h-5 text-primary" />,
    topics: [
      { name: "Microeconomics", desc: "Study market supply-demand, consumer choice models, and game theory.", level: "Beginner" },
      { name: "Cryptocurrency Protocols", desc: "Understand blockchain mechanics, proof-of-work/stake, and smart contracts.", level: "Intermediate" },
    ],
  },
];

export default function ExplorePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleQuickStart = (topicName: string, level: string) => {
    router.push(`/dashboard/new-topic?topic=${encodeURIComponent(topicName)}&level=${encodeURIComponent(level)}`);
  };

  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      topics: cat.topics.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.desc.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((cat) => cat.topics.length > 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">

      {/* Header and Mascot Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 tracking-wider text-foreground uppercase">
            <Compass className="text-primary w-7 h-7" />
            Explore Topics
          </h1>
          <p className="text-muted-foreground text-xs mt-1">Discover trending curricula designed by our adaptive AI tutor.</p>
        </div>

        {/* Mascot tip */}
        <div className="flex items-center gap-3.5 bg-card border border-border px-4 py-2.5 rounded-lg max-w-sm shadow-sm relative overflow-hidden">
          <div className="absolute -left-6 -top-6 w-16 h-16 bg-primary/5 rounded-full blur-xl pointer-events-none" />
          <div className="w-10 h-10 shrink-0 flex items-center justify-center -ml-1">
            <AriseMascot size={45} state="wave" interactive={false} />
          </div>
          <div className="text-[11px] text-muted-foreground leading-normal">
            <strong className="text-foreground block font-bold mb-0.5">ARIS's Recommendation</strong>
            "Tap any card to instantly generate a custom roadmap with learning aids and interactive quizzes!"
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center w-full relative">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3.5" />
        <Input
          type="text"
          placeholder="Search learning topics, subjects, or skills..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-secondary/35 border-border text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/30 focus-visible:border-primary rounded-md h-10 w-full transition-all text-xs"
        />
      </div>

      {/* Categories */}
      <div className="space-y-10">
        {filteredCategories.length === 0 ? (
          <Card className="p-12 border-border text-center flex flex-col items-center justify-center space-y-4 bg-card rounded-lg shadow-sm">
            <Sparkles className="w-10 h-10 text-primary/30 animate-pulse" />
            <h3 className="text-base font-bold text-foreground">No Match Found</h3>
            <p className="text-muted-foreground text-xs">Try searching for other subjects or head to the custom setup wizard!</p>
            <Button
              onClick={() => router.push("/dashboard/new-topic")}
              className="bg-primary text-primary-foreground hover:bg-primary/95 border border-primary/80 rounded-md font-mono text-xs uppercase tracking-wider h-10 px-6 cursor-pointer"
            >
              Configure Custom Topic
            </Button>
          </Card>
        ) : (
          filteredCategories.map((cat, catIdx) => (
            <div key={catIdx} className="space-y-5">
              <div className="flex items-center gap-3 border-b border-border/50 pb-3">
                <div className="p-2 bg-primary/5 border border-primary/20 rounded-lg">
                  {cat.icon}
                </div>
                <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">{cat.title}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {cat.topics.map((t, tIdx) => (
                  <motion.div whileHover={{ y: -3 }} key={tIdx} className="group">
                    <Card className="p-5 border-border h-full flex flex-col justify-between hover:border-primary/40 transition-all duration-300 relative overflow-hidden bg-card shadow-sm rounded-lg">
                      <div className="absolute -top-10 -right-10 w-20 h-20 rounded-full bg-primary/5 blur-xl group-hover:bg-primary/10 transition-colors pointer-events-none" />

                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[9px] font-bold text-primary bg-primary/8 border border-primary/20 px-2 py-0.5 rounded uppercase tracking-wider">
                            {t.level}
                          </span>
                          <Sparkle className="w-3.5 h-3.5 text-primary/50 group-hover:rotate-45 group-hover:text-primary transition-all duration-300" />
                        </div>

                        <h3 className="text-sm font-bold text-foreground mb-2 group-hover:text-primary transition-colors capitalize leading-snug">{t.name}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-5 line-clamp-3">{t.desc}</p>
                      </div>

                      <Button
                        onClick={() => handleQuickStart(t.name, t.level)}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/95 border border-primary/80 font-mono text-xs uppercase tracking-wider h-10 rounded-md transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                      >
                        Generate Roadmap
                      </Button>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
