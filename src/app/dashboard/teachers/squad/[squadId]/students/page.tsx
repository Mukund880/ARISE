"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Users, UserMinus } from "lucide-react";
import Link from "next/link";

import { useArisPopup } from "@/context/ArisPopupContext";

export default function ManageStudentsPage() {
  const { squadId } = useParams();
  const { user } = useAuth();
  const { showConfirm } = useArisPopup();
  const [squad, setSquad] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSquad() {
      try {
        // Find squad from list of all owned squads (for simplicity, we refetch)
        const res = await fetch(`/api/social/squads?ownerId=${user?.uid}`);
        if (!res.ok) throw new Error("Failed to fetch squads");
        const allSquads = await res.json();
        const found = allSquads.find((s: any) => s.id === squadId);
        setSquad(found);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (user) fetchSquad();
  }, [user, squadId]);

  function handleRemove(studentId: string) {
    showConfirm(
      "Remove Student",
      "Are you sure you want to remove this student from the squad?",
      async () => {
        try {
          const res = await fetch(`/api/social/squads/${squadId}/members?userId=${studentId}`, {
            method: "DELETE"
          });
          if (!res.ok) throw new Error("Failed to remove student");
          setSquad((prev: any) => ({
            ...prev,
            members: prev.members.filter((m: any) => m.id !== studentId)
          }));
        } catch (err) {
          console.error(err);
          alert("Error removing student.");
        }
      },
      "Remove"
    );
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading...</div>;
  if (!squad) return <div className="p-8 text-center text-destructive">Squad not found or access denied.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4 border-b border-border/40 pb-6">
        <Link href="/dashboard/teachers">
          <Button variant="ghost" size="icon" className="shrink-0 h-10 w-10 border border-border">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-wider text-foreground uppercase flex items-center gap-3">
            <Users className="text-primary w-6 h-6" />
            Manage Students: {squad.name}
          </h1>
        </div>
      </div>

      <Card className="p-0 border-border bg-card rounded-lg shadow-sm overflow-hidden">
        {squad.members?.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground font-mono text-xs uppercase tracking-widest">
            No students have joined this squad yet.
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {squad.members.map((member: any) => (
              <div key={member.id} className="flex items-center justify-between p-4 hover:bg-secondary/10 transition-colors">
                <div>
                  <p className="font-bold text-sm text-foreground">{member.displayName || "Unknown Scholar"}</p>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-0.5">
                    Lvl {member.level} • {member.rank} • {member.xp} XP
                  </p>
                </div>
                <Button 
                  onClick={() => handleRemove(member.id)}
                  variant="ghost" 
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-3 text-xs"
                >
                  <UserMinus className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
