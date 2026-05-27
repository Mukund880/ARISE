"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Users2, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { AriseMascot } from "@/components/AriseMascot";

export default function SquadsPage() {
  const { user, userProfile } = useAuth();
  const [squads, setSquads] = useState<any[]>([]);
  const [joinedSquadId, setJoinedSquadId] = useState<string | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile && userProfile.squadId) {
      setJoinedSquadId(userProfile.squadId);
    }
  }, [userProfile]);

  useEffect(() => {
    async function fetchSquads() {
      try {
        const res = await fetch("/api/social/squads");
        if (!res.ok) throw new Error("Failed to fetch squads");
        const fetchedSquads = await res.json();
        setSquads(fetchedSquads);
      } catch (err) {
        console.error("Error fetching squads:", err);
      } finally {
        setLoading(false);
      }
    }
    if (user) {
      fetchSquads();
    }
  }, [user]);

  const handleJoinSquad = async (squadId: string) => {
    if (!user) return;
    setJoiningId(squadId);
    try {
      // 1. Join in Prisma database
      const response = await fetch("/api/social/squads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, squadId })
      });
      if (!response.ok) throw new Error("Failed to update squad membership in backend");

      // 2. Sync to Firestore user doc
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        squadId: squadId
      });

      setJoinedSquadId(squadId);
      
      // Update local squad member counts
      setSquads(prev => prev.map(s => {
        if (s.id === squadId) {
          const currentMembers = s._count?.members ?? 0;
          return {
            ...s,
            _count: { members: currentMembers + 1 },
            totalXp: s.totalXp + (userProfile?.xp || 0)
          };
        }
        if (s.id === joinedSquadId) {
          const currentMembers = s._count?.members ?? 0;
          return {
            ...s,
            _count: { members: Math.max(0, currentMembers - 1) },
            totalXp: Math.max(0, s.totalXp - (userProfile?.xp || 0))
          };
        }
        return s;
      }));
    } catch (err) {
      console.error("Failed to join squad:", err);
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      
      {/* Header and Mascot Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3 tracking-tight text-slate-800">
            <Users className="text-indigo-500 w-9 h-9" />
            Study Squads
          </h1>
          <p className="text-slate-505 text-slate-500 text-sm mt-1">Join a squad to participate in community goals, chat, and leagues.</p>
        </div>

        {/* Mascot Speech Bubble */}
        <div className="flex items-center gap-3.5 bg-white border border-slate-200/60 px-4 py-2 rounded-2xl max-w-sm shadow-sm relative overflow-hidden backdrop-blur-md">
          <div className="w-10 h-10 shrink-0 flex items-center justify-center -ml-1">
            <AriseMascot size={45} state="wave" interactive={false} />
          </div>
          <div className="text-[11px] text-slate-600 leading-normal">
            <strong className="text-slate-800 block font-bold mb-0.5">Ari's Squad Advice</strong>
            "Team up with others! Joining a study cohort pools your daily XP and helps dominate squad challenges!"
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-1 md:col-span-3 text-center text-slate-500 py-16 animate-pulse text-xs">
            Assembling squad lists...
          </div>
        ) : squads.length === 0 ? (
          <div className="col-span-1 md:col-span-3 text-center text-slate-500 py-16 border border-slate-200/60 rounded-2xl bg-white text-xs">
            No study squads configured in the system.
          </div>
        ) : squads.map((squad) => {
          const isJoined = joinedSquadId === squad.id;
          const memberCount = squad._count?.members ?? 0;
          return (
            <motion.div
              whileHover={{ y: -4 }}
              key={squad.id}
              className="group"
            >
              <Card className={`glasspanel p-6 border-slate-200/60 h-full flex flex-col justify-between hover:border-indigo-505 hover:border-indigo-500/25 transition-all duration-300 relative overflow-hidden bg-white shadow-sm ${
                isJoined ? "border-indigo-500 bg-indigo-500/5 shadow-[0_0_20px_rgba(99,102,241,0.05)]" : ""
              }`}>
                {/* Joined Tag */}
                {isJoined && (
                  <div className="absolute top-4 right-4 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 text-[9px] text-indigo-600 font-extrabold tracking-wider uppercase">
                    <CheckCircle2 className="w-3 h-3 text-indigo-500" />
                    Member
                  </div>
                )}
                
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#FAF9F6] border border-slate-200 flex items-center justify-center mb-4 group-hover:scale-105 group-hover:border-indigo-500/30 transition-all shadow-inner">
                    <Users2 className="w-6 h-6 text-indigo-500" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 mb-2 group-hover:text-indigo-650 transition-colors leading-snug">{squad.name}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-6 line-clamp-3 font-semibold">{squad.desc}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-100 pt-4">
                    <span>Members: <strong className="text-slate-700 font-extrabold">{memberCount}</strong></span>
                    <span>Squad XP: <strong className="text-cyan-600 font-extrabold">{squad.totalXp.toLocaleString()}</strong></span>
                  </div>

                  <Button 
                    onClick={() => handleJoinSquad(squad.id)}
                    disabled={isJoined || joiningId !== null}
                    className={`w-full h-10 rounded-xl font-bold text-xs transition-all active:scale-[0.97] arbuttonchunky ${
                      isJoined 
                        ? "bg-indigo-50 border border-indigo-200 text-indigo-600 cursor-default" 
                        : "bg-indigo-600 hover:bg-indigo-750 text-white font-bold"
                    }`}
                  >
                    {isJoined ? "Joined Squad" : joiningId === squad.id ? "Joining..." : "Join Squad"}
                  </Button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

    </div>
  );
}
