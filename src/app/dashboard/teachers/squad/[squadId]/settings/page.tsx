"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Settings, Trash2 } from "lucide-react";
import Link from "next/link";

export default function SquadSettingsPage() {
  const { squadId } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [squad, setSquad] = useState<any>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchSquad() {
      try {
        const res = await fetch(`/api/social/squads?ownerId=${user?.uid}`);
        if (!res.ok) throw new Error("Failed to fetch squads");
        const allSquads = await res.json();
        const found = allSquads.find((s: any) => s.id === squadId);
        if (found) {
          setSquad(found);
          setName(found.name);
          setDesc(found.desc);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (user) fetchSquad();
  }, [user, squadId]);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/social/squads/${squadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, desc })
      });
      if (!res.ok) throw new Error("Failed to update");
      alert("Squad settings updated.");
    } catch (err) {
      console.error(err);
      alert("Error updating squad.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you SURE you want to delete this squad? All members will be removed.")) return;
    try {
      const res = await fetch(`/api/social/squads/${squadId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.push("/dashboard/teachers");
    } catch (err) {
      console.error(err);
      alert("Error deleting squad.");
    }
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading...</div>;
  if (!squad) return <div className="p-8 text-center text-destructive">Squad not found or access denied.</div>;

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
            <Settings className="text-primary w-6 h-6" />
            Squad Settings: {squad.name}
          </h1>
        </div>
      </div>

      <Card className="p-8 border-border bg-card rounded-lg shadow-sm">
        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-mono tracking-widest uppercase text-muted-foreground">Classroom Name</label>
            <input 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-secondary/20 border border-border rounded-md px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-mono tracking-widest uppercase text-muted-foreground">Description</label>
            <textarea 
              required
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full bg-secondary/20 border border-border rounded-md px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors min-h-[120px]"
            />
          </div>
          <Button disabled={saving} type="submit" className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/95 font-mono text-xs uppercase tracking-widest">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </Card>

      <Card className="p-8 border-destructive/20 bg-destructive/5 rounded-lg shadow-sm space-y-4">
        <div>
          <h3 className="text-md font-bold text-destructive">Danger Zone</h3>
          <p className="text-xs text-muted-foreground mt-1">Permanently delete this squad. This action cannot be undone.</p>
        </div>
        <Button onClick={handleDelete} variant="destructive" className="h-10 text-xs font-mono uppercase tracking-widest">
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Squad
        </Button>
      </Card>
    </div>
  );
}
