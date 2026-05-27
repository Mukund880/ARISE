"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Compass, Sparkles, Code, FlaskConical, LineChart, Search, Sparkle } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AriseMascot } from "@/components/AriseMascot";
import { useState } from "react";
import { Input } from "@/components/ui/input";

const categories = [
  {
    title: "Computer Science",
    icon: <Code className="w-5 h-5 text-cyan-600 animate-pulse" />,
    borderColor: "group-hover:border-cyan-500/30",
    bgGlow: "bg-cyan-500/5",
    topics: [
      { name: "Next.js 15 App Router", desc: "Master modern React framework features, server actions, and caching mechanisms.", level: "Intermediate" },
      { name: "Machine Learning Basics", desc: "Learn neural networks, regression algorithms, and training pipelines.", level: "Beginner" },
      { name: "Rust Programming", desc: "Understand memory safety, ownership models, and concurrent coding.", level: "Advanced" }
    ]
  },
  {
    title: "Science & Engineering",
    icon: <FlaskConical className="w-5 h-5 text-indigo-500" />,
    borderColor: "group-hover:border-indigo-500/30",
    bgGlow: "bg-indigo-500/5",
    topics: [
      { name: "Quantum Mechanics", desc: "Study wave-particle duality, Schrödinger equation, and quantum states.", level: "Advanced" },
      { name: "Organic Chemistry Basics", desc: "Learn carbon structures, chemical reaction mechanisms, and bonding.", level: "Beginner" },
      { name: "Astrophysics Theories", desc: "Explore general relativity, black holes, and cosmological metrics.", level: "Intermediate" }
    ]
  },
  {
    title: "Finance & Economics",
    icon: <LineChart className="w-5 h-5 text-pink-500" />,
    borderColor: "group-hover:border-pink-500/30",
    bgGlow: "bg-pink-500/5",
    topics: [
      { name: "Microeconomics", desc: "Study market supply-demand, consumer choice models, and game theory.", level: "Beginner" },
      { name: "Cryptocurrency Protocols", desc: "Understand blockchain mechanics, proof-of-work/stake, and smart contracts.", level: "Intermediate" }
    ]
  }
];

export default function ExplorePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleQuickStart = (topicName: string, level: string) => {
    router.push(`/dashboard/new-topic?topic=${encodeURIComponent(topicName)}&level=${encodeURIComponent(level)}`);
  };

  const filteredCategories = categories.map(cat => {
    const matchedTopics = cat.topics.filter(t => 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.desc.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { ...cat, topics: matchedTopics };
  }).filter(cat => cat.topics.length > 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header and Mascot Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3 tracking-tight text-slate-800">
            <Compass className="text-indigo-500 w-9 h-9" />
            Explore Topics
          </h1>
          <p className="text-slate-500 text-sm mt-1">Discover trending curricula designed by our adaptive AI tutor.</p>
        </div>

        {/* Floating Mascot Tip */}
        <div className="flex items-center gap-3.5 bg-white border border-slate-200/60 px-4 py-2 rounded-2xl max-w-sm shadow-sm relative overflow-hidden backdrop-blur-md">
          <div className="w-10 h-10 shrink-0 flex items-center justify-center -ml-1">
            <AriseMascot size={45} state="wave" interactive={false} />
          </div>
          <div className="text-[11px] text-slate-600 leading-normal">
            <strong className="text-slate-800 block font-bold mb-0.5">Ari's Recommendation</strong>
            "Tap any card to instantly generate a custom roadmap with learning aids and interactive quizzes!"
          </div>
        </div>
      </div>

      {/* Search & Filtering Area */}
      <div className="flex items-center w-full relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-4" />
        <Input 
          type="text"
          placeholder="Search learning topics, subjects, or skills..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 bg-white border-slate-200 text-slate-800 placeholder:text-slate-450 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-2xl h-12 w-full transition-all text-sm"
        />
      </div>

      {/* Main Categories Section */}
      <div className="space-y-12">
        {filteredCategories.length === 0 ? (
          <Card className="playfulcard p-12 border-slate-200 text-center flex flex-col items-center justify-center space-y-4 bg-white">
            <Sparkles className="w-12 h-12 text-slate-300 animate-pulse" />
            <h3 className="text-lg font-bold text-slate-800">No Match Found</h3>
            <p className="text-slate-500 text-xs">Try searching for other subjects or head to the custom setup wizard!</p>
            <Button 
              onClick={() => router.push("/dashboard/new-topic")}
              className="bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl font-bold h-10 text-xs shadow-md ar-button-chunky"
            >
              Configure Custom Topic
            </Button>
          </Card>
        ) : (
          filteredCategories.map((cat, catIdx) => (
            <div key={catIdx} className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-200/60 pb-3">
                <div className="p-2 bg-white border border-slate-100 rounded-xl shadow-inner">
                  {cat.icon}
                </div>
                <h2 className="text-xl font-extrabold text-slate-850 tracking-tight">{cat.title}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cat.topics.map((t, tIdx) => (
                  <motion.div
                    whileHover={{ y: -4 }}
                    key={tIdx}
                    className="group"
                  >
                    <Card className={`glasspanel p-6 border-slate-200/65 h-full flex flex-col justify-between hover:border-indigo-500/20 transition-all duration-300 relative overflow-hidden bg-white shadow-sm`}>
                      {/* Highlight blur background decoration */}
                      <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-indigo-500/5 blur-xl group-hover:bg-indigo-500/10 transition-colors pointer-events-none" />
                      
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {t.level}
                          </span>
                          <Sparkle className="w-4 h-4 text-amber-500 group-hover:rotate-45 transition-transform" />
                        </div>
                        
                        <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-indigo-650 transition-colors capitalize leading-snug">{t.name}</h3>
                        <p className="text-xs text-slate-500 leading-relaxed mb-6 line-clamp-3 font-medium">{t.desc}</p>
                      </div>

                      <Button 
                        onClick={() => handleQuickStart(t.name, t.level)}
                        className="w-full bg-indigo-600 hover:bg-indigo-755 text-white font-bold h-10 rounded-xl transition-all shadow-md active:scale-95 arbuttonchunky text-xs"
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
