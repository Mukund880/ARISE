"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Sparkles, BookOpen } from "lucide-react";
import Link from "next/link";

export default function UploadMaterialPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [squads, setSquads] = useState<any[]>([]);
  const [selectedSquad, setSelectedSquad] = useState("");
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("Intermediate");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    async function fetchSquads() {
      try {
        const res = await fetch(`/api/social/squads?ownerId=${user?.uid}`);
        if (!res.ok) throw new Error("Failed to fetch squads");
        const allSquads = await res.json();
        setSquads(allSquads);
        if (allSquads.length > 0) setSelectedSquad(allSquads[0].id);
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    }
    if (user) fetchSquads();
  }, [user]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSquad || !topic || !goal) return;
    setLoading(true);
    try {
      const res = await fetch("/api/generate-squad-syllabus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ squadId: selectedSquad, topicTitle: topic, level, goal })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      alert(data.message || "Syllabus successfully distributed!");
      router.push("/dashboard/teachers");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error generating syllabus.");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4 border-b border-border/40 pb-6">
        <Link href="/dashboard/teachers">
          <Button variant="ghost" size="icon" className="shrink-0 h-10 w-10 border border-border">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-wider text-foreground uppercase flex items-center gap-3">
            <Sparkles className="text-primary w-6 h-6" />
            AI Syllabus Generation
          </h1>
          <p className="text-muted-foreground text-xs mt-1">Generate and distribute an AI roadmap to an entire classroom.</p>
        </div>
      </div>

      {squads.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground font-mono text-xs uppercase tracking-widest bg-card border-border shadow-sm">
          You must create a Classroom Squad first.
        </Card>
      ) : (
        <Card className="p-8 border-border bg-card rounded-lg shadow-sm relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 blur-2xl pointer-events-none" />
          
          <form onSubmit={handleGenerate} className="space-y-6 relative z-10">
            <div className="space-y-2">
              <label className="text-xs font-mono tracking-widest uppercase text-muted-foreground">Target Classroom</label>
              <select 
                value={selectedSquad}
                onChange={(e) => setSelectedSquad(e.target.value)}
                className="w-full bg-secondary/20 border border-border rounded-md px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors cursor-pointer"
              >
                {squads.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s._count?.members || 0} students)</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono tracking-widest uppercase text-muted-foreground">Topic / Curriculum</label>
              <input 
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-secondary/20 border border-border rounded-md px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="e.g. Introduction to Quantum Mechanics"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-mono tracking-widest uppercase text-muted-foreground">Knowledge Level</label>
                <select 
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full bg-secondary/20 border border-border rounded-md px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors cursor-pointer"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono tracking-widest uppercase text-muted-foreground">Learning Goal</label>
                <input 
                  required
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full bg-secondary/20 border border-border rounded-md px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                  placeholder="e.g. Pass final exam"
                />
              </div>
            </div>

            <Button disabled={loading} type="submit" className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/95 font-mono text-xs uppercase tracking-widest">
              {loading ? "Generating & Distributing Syllabus..." : "Generate Syllabus"}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
