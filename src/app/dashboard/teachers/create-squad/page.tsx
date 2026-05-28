"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { GraduationCap, ArrowLeft, Users } from "lucide-react";
import Link from "next/link";

export default function CreateSquadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !name || !desc) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/social/squads/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId: user.uid, name, desc })
      });
      if (!res.ok) throw new Error("Failed to create squad");
      router.push("/dashboard/teachers");
    } catch (err) {
      console.error(err);
      alert("Error creating squad.");
      setLoading(false);
    }
  }

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
            <Users className="text-primary w-6 h-6" />
            Create Classroom Squad
          </h1>
        </div>
      </div>

      <Card className="p-8 border-border bg-card rounded-lg shadow-sm">
        <form onSubmit={handleCreate} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-mono tracking-widest uppercase text-muted-foreground">Classroom Name</label>
            <input 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-secondary/20 border border-border rounded-md px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors"
              placeholder="e.g. CS101 Fall 2024"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-mono tracking-widest uppercase text-muted-foreground">Description</label>
            <textarea 
              required
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full bg-secondary/20 border border-border rounded-md px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors min-h-[120px]"
              placeholder="What will this class focus on?"
            />
          </div>
          <Button disabled={loading} type="submit" className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/95 font-mono text-xs uppercase tracking-widest">
            {loading ? "Creating..." : "Create Squad"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
