"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookOpen, BrainCircuit, ArrowRight, Sparkles, Calendar, Target, Search } from "lucide-react";
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
        setTopics(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
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
        <BrainCircuit className="w-10 h-10 animate-pulse text-primary" />
        <p className="text-muted-foreground animate-pulse text-xs font-mono uppercase tracking-widest">Assembling your roadmaps...</p>
      </div>
    );
  }

  const filteredTopics = topics.filter(
    (topic) =>
      topic.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.goal?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 tracking-wider text-foreground uppercase">
            <BookOpen className="text-primary w-7 h-7" />
            My Learning Roadmaps
          </h1>
          <p className="text-muted-foreground text-xs mt-1">Review and resume your customized AI-generated learning roadmaps.</p>
        </div>
        <Link href="/dashboard/new-topic">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/95 border border-primary/80 font-mono text-xs uppercase tracking-wider px-6 h-10 rounded-md cursor-pointer">
            Start New Topic
          </Button>
        </Link>
      </div>

      {/* Empty state */}
      {topics.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center space-y-5 border-border bg-card rounded-lg shadow-sm">
          <div className="w-20 h-20 bg-primary/5 rounded-full border border-primary/20 flex items-center justify-center shadow-inner">
            <AriseMascot size={70} state="sleep" interactive={false} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">Your Curriculum is Empty</h3>
            <p className="text-muted-foreground text-xs max-w-sm mx-auto">Use our adaptive AI tutor to design your first custom learning timeline in seconds.</p>
          </div>
          <Link href="/dashboard/new-topic">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/95 border border-primary/80 font-mono text-xs uppercase tracking-wider px-6 h-10 rounded-md cursor-pointer">
              Generate First Roadmap
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-5">
          {/* Search */}
          <div className="flex items-center w-full relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5" />
            <Input
              type="text"
              placeholder="Search your learning roadmaps or goals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary/35 border-border text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/30 focus-visible:border-primary rounded-md h-10 w-full transition-all text-xs"
            />
          </div>

          {filteredTopics.length === 0 ? (
            <Card className="p-12 text-center border-border bg-card rounded-lg shadow-sm">
              <p className="text-muted-foreground text-xs">No roadmaps match your search query.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-5">
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
                    <Card className="p-6 border-border hover:border-primary/40 transition-all duration-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden bg-card shadow-sm rounded-lg">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-2xl group-hover:bg-primary/8 pointer-events-none transition-all duration-300" />

                      <div className="space-y-3 flex-1 relative z-10">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="text-sm font-bold text-foreground capitalize group-hover:text-primary transition-colors">
                            {topic.title}
                          </h3>
                          <span className="text-[9px] font-bold text-primary bg-primary/8 border border-primary/20 px-2 py-0.5 rounded uppercase tracking-wider">
                            {topic.level || "Beginner"}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Target className="w-3.5 h-3.5 text-primary/70" />
                            Goal: {topic.goal || "Master Core Concepts"}
                          </span>
                          <span className="hidden sm:inline text-border">•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-primary/70" />
                            Created: {dateStr}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 pt-1 max-w-md">
                          <div className="flex-1 space-y-1">
                            <div className="w-full bg-secondary/50 rounded-full h-1.5 overflow-hidden border border-border/50">
                              <div
                                className="h-full bg-primary rounded-full transition-all duration-500"
                                style={{ width: `${topic.progress || 0}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs font-bold text-primary shrink-0 font-mono">
                            {topic.progress || 0}% ({completedCount}/{totalCount})
                          </span>
                        </div>
                      </div>

                      <Button className="bg-primary text-primary-foreground hover:bg-primary/95 border border-primary/80 rounded-md px-5 h-10 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 self-end md:self-auto shadow-sm active:scale-[0.98] transition-all cursor-pointer relative z-10">
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
