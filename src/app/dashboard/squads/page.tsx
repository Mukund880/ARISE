"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Users2, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { AriseMascot } from "@/components/AriseMascot";

export default function SquadsPage() {
  const { user, userProfile } = useAuth();
  const [squads, setSquads] = useState<any[]>([]);
  const [joinedSquadId, setJoinedSquadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [selectedJoinSquadId, setSelectedJoinSquadId] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile?.squadId) setJoinedSquadId(userProfile.squadId);
  }, [userProfile]);

  useEffect(() => {
    async function fetchSquads() {
      if (!user) return;
      try {
        // Only fetch squads the user is a member of
        const res = await fetch(`/api/social/squads?userId=${user.uid}`);
        if (!res.ok) throw new Error("Failed to fetch squads");
        const allSquads = await res.json();
        // Show all squads
        setSquads(allSquads);
      } catch (err) {
        console.error("Error fetching squads:", err);
      } finally {
        setLoading(false);
      }
    }
    if (user) fetchSquads();
  }, [user, joinedSquadId]);

  async function handleJoin(e: React.FormEvent, squadId: string) {
    e.preventDefault();
    if (!user || !inviteCode) return;
    setJoining(true);
    try {
      const res = await fetch("/api/social/squads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, inviteCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to join squad");
      
      alert("Successfully joined classroom squad!");
      setJoinedSquadId(squadId);
      setInviteCode("");
      setSelectedJoinSquadId(null);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Invalid invite code.");
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">

      {/* Header and Mascot Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 tracking-wider text-foreground uppercase">
            <Users className="text-primary w-7 h-7" />
            Study Squads
          </h1>
          <p className="text-muted-foreground text-xs mt-1">Your classroom squads created by teachers. Ask your instructor to add you to a squad.</p>
        </div>

        {/* Mascot tip */}
        <div className="flex items-center gap-3.5 bg-card border border-border px-4 py-2.5 rounded-lg max-w-sm shadow-sm relative overflow-hidden">
          <div className="absolute -left-6 -top-6 w-16 h-16 bg-primary/5 rounded-full blur-xl pointer-events-none" />
          <div className="w-10 h-10 shrink-0 flex items-center justify-center -ml-1">
            <AriseMascot size={45} state="wave" interactive={false} />
          </div>
          <div className="text-[11px] text-muted-foreground leading-normal">
            <strong className="text-foreground block font-bold mb-0.5">ARIS's Squad Advice</strong>
            "Team up with others! Joining a study cohort pools your daily XP and helps dominate squad challenges!"
          </div>
        </div>
      </div>



      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 text-center text-muted-foreground py-16 animate-pulse text-xs font-mono uppercase tracking-widest">
            Assembling squad lists...
          </div>
        ) : squads.length === 0 ? (
          <div className="col-span-3 text-center text-muted-foreground py-16 border border-border rounded-lg bg-card text-xs">
            <div className="space-y-2">
              <p>You haven't been added to any study squads yet.</p>
              <p className="text-[11px] text-muted-foreground/60">Ask your teacher to create a classroom squad and add you to it.</p>
            </div>
          </div>
        ) : (
          squads.map((squad) => {
            const memberCount = squad._count?.members ?? 0;
            return (
              <motion.div whileHover={{ y: -3 }} key={squad.id} className="group">
                <Card
                  className={`p-5 border-border h-full flex flex-col justify-between hover:border-primary/40 transition-all duration-300 relative overflow-hidden bg-primary/5 shadow-sm rounded-lg border-primary/50 shadow-[0_0_20px_rgba(197,168,128,0.06)]`}
                >
                  {/* Gold glow on hover */}
                  <div className="absolute -top-10 -right-10 w-20 h-20 rounded-full bg-primary/5 blur-xl group-hover:bg-primary/10 transition-colors pointer-events-none" />

                  <div className="relative z-10">
                    <div className="w-10 h-10 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-center mb-4 group-hover:scale-105 group-hover:border-primary/40 transition-all shadow-inner">
                      <Users2 className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground mb-2 group-hover:text-primary transition-colors leading-snug">{squad.name}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-5 line-clamp-3">{squad.desc}</p>
                  </div>

                  <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-center text-xs text-muted-foreground border-t border-border/50 pt-3">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-primary/60" />
                        <strong className="text-foreground font-bold">{memberCount}</strong> Members
                      </span>
                      <span className="flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-primary/60" />
                        <strong className="text-primary font-bold">{squad.totalXp.toLocaleString()}</strong> XP
                      </span>
                    </div>

                    {joinedSquadId === squad.id ? (
                      <Button
                        disabled={true}
                        className={`w-full h-10 rounded-md font-mono text-xs uppercase tracking-wider transition-all cursor-default bg-primary/10 border border-primary/30 text-primary`}
                      >
                        ✓ Your Squad
                      </Button>
                    ) : selectedJoinSquadId === squad.id ? (
                      <form onSubmit={(e) => handleJoin(e, squad.id)} className="flex gap-2">
                        <input 
                          required
                          value={inviteCode}
                          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                          placeholder="CODE"
                          className="w-full bg-secondary/20 border border-border rounded-md px-3 py-2 text-xs font-mono focus:outline-none focus:border-primary/50 transition-colors uppercase"
                        />
                        <Button disabled={joining} type="submit" className="h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/95 font-mono text-xs uppercase tracking-widest shrink-0">
                          {joining ? "..." : "Join"}
                        </Button>
                      </form>
                    ) : (
                      <Button
                        onClick={() => setSelectedJoinSquadId(squad.id)}
                        variant="outline"
                        disabled={!!joinedSquadId}
                        className={`w-full h-10 rounded-md font-mono text-xs uppercase tracking-wider transition-all border-border text-foreground hover:bg-secondary/15`}
                      >
                        {joinedSquadId ? "Already in a Squad" : "Join Squad"}
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
