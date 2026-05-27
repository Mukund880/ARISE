"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Trophy, Award, Medal, Flame } from "lucide-react";
import { motion } from "framer-motion";

export default function LeaderboardPage() {
  const { user, userProfile } = useAuth();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch("/api/gamification/leaderboard");
        if (!res.ok) throw new Error("Failed to fetch leaderboard from Prisma");
        const list = await res.json();
        
        // Map backend 'id' field to 'uid' expected by frontend UI
        const mappedList = list.map((item: any) => ({
          ...item,
          uid: item.id
        }));

        setLeaderboard(mappedList);
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchLeaderboard();
    }
  }, [user, userProfile]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Trophy className="w-12 h-12 animate-pulse text-indigo-500" />
        <p className="text-slate-500 animate-pulse text-xs">Compiling standings...</p>
      </div>
    );
  }

  // Split top 3 from rest
  const top3 = leaderboard.slice(0, 3);
  const remainder = leaderboard.slice(3);

  // Reorder top 3 for podium layout: [2nd, 1st, 3rd]
  const podiumOrder = [];
  if (top3[1]) podiumOrder.push({ ...top3[1], rank: 2 });
  if (top3[0]) podiumOrder.push({ ...top3[0], rank: 1 });
  if (top3[2]) podiumOrder.push({ ...top3[2], rank: 3 });

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black flex items-center gap-3 tracking-tight text-slate-800">
          <Trophy className="text-amber-500 w-9 h-9" />
          Global Leaderboard
        </h1>
        <p className="text-slate-500 text-sm mt-1">Compete with scholars worldwide and level up your ranking.</p>
      </div>

      {/* Podium Showcase */}
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-4 items-end max-w-2xl mx-auto pt-6 pb-2">
          {podiumOrder.map((row) => {
            const isFirst = row.rank === 1;
            const isSecond = row.rank === 2;
            const isThird = row.rank === 3;
            const isCurrentUser = row.uid === user?.uid;

            return (
              <motion.div
                key={row.uid}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 15, delay: row.rank * 0.1 }}
                className="flex flex-col items-center"
              >
                {/* Avatar Display */}
                <div className="relative mb-3 group">
                  <div className={`rounded-full overflow-hidden border-4 p-0.5 shadow-md bg-white transition-transform group-hover:scale-105 ${
                    isFirst ? "w-20 h-20 md:w-24 md:h-24 border-yellow-400" :
                    isSecond ? "w-16 h-16 md:w-20 md:h-20 border-slate-300" :
                    "w-14 h-14 md:w-18 md:h-18 border-orange-400"
                  }`}>
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${row.displayName}`} 
                      alt={row.displayName} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  {/* Badge Medal */}
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full p-1 bg-white border border-slate-200 shadow-md">
                    {isFirst ? <Trophy className="w-4 h-4 text-amber-500 fill-amber-500/25" /> :
                     isSecond ? <Award className="w-4 h-4 text-slate-400" /> :
                     <Medal className="w-4 h-4 text-orange-500" />}
                  </div>
                </div>

                {/* Info Text */}
                <div className="text-center mb-2">
                  <p className={`text-xs font-bold truncate max-w-[90px] ${isCurrentUser ? "text-indigo-600" : "text-slate-800"}`}>
                    {row.displayName || "Scholar"}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">Level {row.level || 1}</p>
                </div>

                {/* Podium Column Element */}
                <div className={`w-full rounded-t-3xl border border-b-0 border-slate-200 flex flex-col justify-end items-center p-4 relative overflow-hidden ${
                  isFirst ? "h-32 md:h-40 bg-gradient-to-t from-yellow-500/20 to-yellow-500/5" :
                  isSecond ? "h-24 md:h-32 bg-gradient-to-t from-slate-500/20 to-slate-500/5" :
                  "h-20 md:h-26 bg-gradient-to-t from-orange-500/20 to-orange-500/5"
                } ${isCurrentUser ? "border-indigo-500/40 bg-indigo-500/5" : "bg-white"}`}>
                  <span className={`text-2xl md:text-3xl font-black ${
                    isFirst ? "text-yellow-600" :
                    isSecond ? "text-slate-450 text-slate-500" :
                    "text-orange-600"
                  }`}>
                    {row.rank}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 mt-1">{(row.xp || 0).toLocaleString()} XP</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Standings List Container */}
      <Card className="glasspanel p-6 border-slate-200/60 bg-white rounded-3xl shadow-sm">
        <div className="space-y-3">
          {remainder.length === 0 && top3.length === 0 && (
            <p className="text-center text-xs text-slate-400 py-6">No users listed on the scoreboard yet.</p>
          )}

          {remainder.map((row, idx) => {
            const rank = idx + 4;
            const isCurrentUser = row.uid === user?.uid;

            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                key={row.uid || idx}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                  isCurrentUser 
                    ? "bg-indigo-50 border-indigo-250 shadow-[0_0_15px_rgba(99,102,241,0.05)]" 
                    : "bg-[#FAF9F6]/40 border-slate-200/60 hover:bg-slate-50/80 hover:border-slate-350 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank Standings */}
                  <div className="w-6 text-center font-bold text-xs text-slate-500">
                    {rank}
                  </div>
                  
                  {/* User Profile Avatar */}
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 bg-[#FAF9F6] shrink-0">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${row.displayName}`} 
                      alt={row.displayName} 
                      className="w-full h-full object-cover" 
                    />
                  </div>

                  <div>
                    <h4 className={`text-xs font-bold flex items-center gap-1.5 ${isCurrentUser ? "text-indigo-650 text-indigo-600 font-extrabold" : "text-slate-800"}`}>
                      {row.displayName || "Scholar"} {isCurrentUser && <span className="text-[9px] font-black text-cyan-700 bg-cyan-50 border border-cyan-200 px-1.5 py-0.5 rounded uppercase tracking-wider">You</span>}
                    </h4>
                    <p className="text-[10px] text-slate-500 capitalize">{row.rank || "Rookie"} • Level {row.level || 1}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold text-cyan-600 text-xs">{(row.xp || 0).toLocaleString()} XP</p>
                  <p className="text-[9px] text-slate-555 text-slate-550 flex items-center justify-end gap-0.5 mt-0.5 font-semibold"><Flame className="w-3 h-3 text-amber-500" /> {(row.streak || 1)}d streak</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>

    </div>
  );
}
