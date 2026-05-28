"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Brain, ArrowRight, Sparkles, Calendar, Target, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AriseMascot } from "@/components/AriseMascot";
import { Input } from "@/components/ui/input";

export default function MyLearningPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchTopics();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <BookOpen className="w-12 h-12 animate-pulse text-indigo-400" />
        <p className="text-slate-400 animate-pulse text-xs">Assembling your custom roadmaps...</p>
      </div>
    );
  }

  const filteredTopics = topics.filter((topic) =>
    topic.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.goal?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3 tracking-tight">
            <BookOpen className="text-indigo-400 w-9 h-9" />
            My Learning Roadmaps
          </h1>
          <p className="text-slate-400 text-sm mt-1">Review and resume your customized learning roadmaps.</p>
        </div>
        <Link href="/dashboard/new-topic">
          <Button className="bg-white text-black hover:bg-slate-200 font-bold px-5 h-11 rounded-xl shadow-md active:scale-95 ar-button-chunky text-xs">
            Start New Topic
          </Button>
        </Link>
      </div>

      {/* Main Roadmap Container */}
      {topics.length === 0 ? (
        <Card className="playfulcard p-12 text-center flex flex-col items-center justify-center space-y-5 border-white/5 bg-slate-900/40">
          <div className="w-20 h-20 bg-slate-950 rounded-full border border-white/5 flex items-center justify-center shadow-lg">
            <AriseMascot size={70} state="sleep" interactive={false} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">Your Curriculum is Empty</h3>
            <p className="text-slate-400 text-xs max-w-sm mx-auto">Use our adaptive AI tutor to design your first custom learning timeline in seconds.</p>
          </div>
          <Link href="/dashboard/new-topic">
            <Button className="bg-gradient-to-r from-indigo-500 to-cyan-500 text-white hover:opacity-95 rounded-xl px-6 h-11 text-xs font-bold shadow-md ar-button-chunky">
              Generate First Roadmap
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Search & Filtering Area */}
          <div className="flex items-center w-full relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4" />
            <Input 
              type="text"
              placeholder="Search your learning roadmaps or goals..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-2xl h-12 w-full transition-all text-sm"
            />
          </div>

          {filteredTopics.length === 0 ? (
            <Card className="p-12 text-center border-slate-200 bg-slate-900/10 rounded-2xl">
              <p className="text-slate-500 text-sm">No roadmaps match your search query.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredTopics.map((topic, index) => {
                const completedCount = (topic.completedModules || []).length;
                const totalCount = (topic.modules || []).length;
                const dateStr = topic.createdAt 
                  ? new Date(topic.createdAt.seconds * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) 
                  : new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={topic.id}
                    onClick={() => router.push(`/dashboard/learning/${topic.id}`)}
                    className="group cursor-pointer"
                  >
                    <Card className="glasspanel p-6 border-slate-200/60 hover:border-indigo-500/25 transition-all duration-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden bg-slate-900/20">
                      {/* Subtle hover glow accent */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-xl group-hover:bg-indigo-500/10 pointer-events-none transition-all duration-300" />
                      
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="text-lg font-bold text-white capitalize group-hover:text-cyan-300 transition-colors">
                            {topic.title}
                          </h3>
                          <span className="text-[9px] font-extrabold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {topic.level || "Beginner"}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400">
                          <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5 text-indigo-400" /> Goal: {topic.goal || "Master Core Concepts"}</span>
                          <span className="hidden sm:inline text-slate-600">•</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-pink-400" /> Created: {dateStr}</span>
                        </div>
                        
                        <div className="flex items-center gap-4 pt-2 max-w-md">
                          <div className="flex-1 space-y-1">
                            <Progress value={topic.progress || 0} className="h-1.5 bg-slate-950 border border-white/5 rounded-full [&>div]:bg-gradient-to-r [&>div]:from-cyan-400 [&>div]:to-indigo-500" />
                          </div>
                          <span className="text-xs font-bold text-slate-300 shrink-0">
                            {topic.progress || 0}% ({completedCount}/{totalCount} Modules)
                          </span>
                        </div>
                      </div>

                      <Button 
                        className="bg-white text-black hover:bg-slate-200 rounded-xl px-5 h-10 text-xs font-bold flex items-center gap-1.5 self-end md:self-auto shadow-sm active:scale-95 transition-all arbuttonchunky"
                      >
                        Resume Roadmap
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
