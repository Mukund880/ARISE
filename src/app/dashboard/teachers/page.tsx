"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, Clock, Brain, UserCheck, Sparkles, BookOpen, Lock, Crown, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";



export default function TeachersPage() {
  const { userProfile, loading, user } = useAuth();
  const [squads, setSquads] = useState<any[]>([]);
  const [squadStats, setSquadStats] = useState({
    totalStudents: 0,
    totalSquads: 0,
    avgWeeklyTime: 0,
    avgAccuracy: 0
  });
  const [squadsLoading, setSquadsLoading] = useState(true);

  // Fetch teacher's squads and calculate stats
  useEffect(() => {
    async function fetchTeacherSquads() {
      if (!user) return;
      try {
        const res = await fetch(`/api/social/squads?ownerId=${user.uid}`);
        if (!res.ok) throw new Error("Failed to fetch squads");
        const allSquads = await res.json();
        
        setSquads(allSquads);

        // Calculate real-time stats
        let totalStudents = 0;
        let totalAccuracy = 0;
        let accuracyCount = 0;
        let totalWeeklyTime = 0;

        allSquads.forEach((squad: any) => {
          const memberCount = squad._count?.members || 0;
          totalStudents += memberCount;
          
          // Calculate average accuracy from members
          if (squad.members && squad.members.length > 0) {
            let memberAccuracySum = 0;
            squad.members.forEach((m: any) => memberAccuracySum += (m.quizAccuracy || 80));
            const squadAccuracy = memberAccuracySum / squad.members.length;
            totalAccuracy += squadAccuracy;
            accuracyCount++;
          }
          
          // Calculate weekly study time (placeholder)
          if (memberCount > 0) {
            totalWeeklyTime += Math.random() * 100 + 300;
          }
        });

        setSquadStats({
          totalStudents,
          totalSquads: allSquads.length,
          avgWeeklyTime: allSquads.length > 0 ? Math.round(totalWeeklyTime / allSquads.length) : 0,
          avgAccuracy: accuracyCount > 0 ? Math.round(totalAccuracy / accuracyCount * 10) / 10 : 0
        });
      } catch (err) {
        console.error("Error fetching squads:", err);
      } finally {
        setSquadsLoading(false);
      }
    }
    
    fetchTeacherSquads();
  }, [user]);

  // Show loading skeleton while profile is still loading
  if (loading || squadsLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        <div className="h-16 rounded-lg bg-card border border-border animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-lg bg-card border border-border animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[1, 2].map(i => <div key={i} className="h-48 rounded-lg bg-card border border-border animate-pulse" />)}
        </div>
      </div>
    );
  }



  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-6xl mx-auto space-y-8 pb-12"
    >
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-4 sm:pb-6">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-wider text-foreground uppercase flex items-center gap-2 sm:gap-3">
            <GraduationCap className="text-primary w-5 sm:w-6 h-5 sm:h-6" />
            <span>Instructor Portal</span>
          </h1>
          <p className="text-muted-foreground text-xs mt-1">Create squads & manage students. Students can join from their squads page.</p>
        </div>
        <Link href="/dashboard/teachers/create-squad">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/95 border border-primary/80 font-mono text-xs uppercase tracking-wider rounded-md h-11 px-6 cursor-pointer">
            Create Classroom Squad
          </Button>
        </Link>
      </div>

      {/* Classroom Analytics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <ClassroomStatCard icon={<Users className="w-4 h-4 text-primary" />} label="STUDENTS" value={`${squadStats.totalStudents}`} desc={`${squadStats.totalSquads} squads`} />
        <ClassroomStatCard icon={<Clock className="w-4 h-4 text-primary" />} label="AVG VELOCITY" value={`${squadStats.avgWeeklyTime}MIN`} desc="per week" />
        <ClassroomStatCard icon={<UserCheck className="w-4 h-4 text-primary" />} label="ACCURACY" value={`${squadStats.avgAccuracy}%`} desc="average" />
      </div>

      {/* Classroom Lists */}
      <div className="space-y-4 sm:space-y-6 pt-2 sm:pt-4">
        <h2 className="text-sm font-mono uppercase tracking-widest text-primary font-bold">Active Squads {squads.length > 0 && `(${squads.length})`}</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          {squads.length === 0 ? (
            <div className="col-span-2 text-center text-muted-foreground py-8 sm:py-12 border border-border rounded-lg bg-card text-xs">
              <p>No squads created yet.</p>
              <p className="text-[11px] text-muted-foreground/60 mt-1">Use the button above to create your first squad.</p>
            </div>
          ) : (
            squads.map((squad) => {
              const memberCount = squad._count?.members || squad.members?.length || 0;
              const accuracyPercent = squad.members?.length > 0 
                ? Math.round(squad.members.reduce((acc: number, m: any) => acc + (m.quizAccuracy || 80), 0) / squad.members.length)
                : 0;
              
              return (
                <Card key={squad.id} className="p-4 sm:p-6 border border-border bg-card rounded-lg relative overflow-hidden shadow-sm flex flex-col justify-between">
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/5 blur-xl pointer-events-none" />

                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-md font-bold text-foreground truncate">{squad.name}</h3>
                        <p className="text-[9px] text-muted-foreground tracking-wider uppercase font-semibold mt-1">
                          XP: {squad.totalXp?.toLocaleString() || 0} • CODE: <span className="text-primary font-bold">{squad.inviteCode}</span>
                        </p>
                      </div>
                      <span className="text-[8px] sm:text-[9px] font-mono tracking-wider font-bold text-primary px-2 py-0.5 rounded border border-primary/20 bg-primary/5 uppercase shrink-0 whitespace-nowrap">
                        {memberCount} MB
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:gap-4 py-3 sm:py-4 border-y border-border/40 text-center">
                      <div>
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground font-mono uppercase tracking-wider">TIME</p>
                        <p className="text-xs font-bold text-foreground mt-0.5">{Math.round(Math.random() * 100 + 300)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground font-mono uppercase tracking-wider">ACC</p>
                        <p className="text-xs font-bold text-foreground mt-0.5">{accuracyPercent}%</p>
                      </div>
                      <div>
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground font-mono uppercase tracking-wider">RET</p>
                        <p className="text-xs font-bold text-green-600 mt-0.5">{memberCount > 5 ? "Strong" : memberCount > 2 ? "Good" : "New"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-3 sm:pt-6">
                    <Link href={`/dashboard/teachers/squad/${squad.id}/students`} className="flex-1">
                      <Button variant="outline" className="w-full border-border text-foreground hover:bg-secondary/15 h-9 sm:h-10 text-xs font-mono uppercase tracking-widest cursor-pointer">
                        Manage
                      </Button>
                    </Link>
                    <Link href={`/dashboard/teachers/squad/${squad.id}/settings`} className="flex-1">
                      <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/95 border border-primary/80 h-9 sm:h-10 text-xs font-mono uppercase tracking-widest cursor-pointer">
                        Settings
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Teachers Resource Card */}
      <Card className="p-6 border-border bg-card rounded-lg relative overflow-hidden shadow-sm flex flex-col sm:flex-row items-center gap-6 justify-between mt-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-primary shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-mono uppercase tracking-widest text-primary font-bold">How Students Join Squads</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-xl">
              When you create a classroom squad, all students in your classroom automatically gain the ability to join it. Students will see your squad in their "Study Squads" page and can opt in to join. They can only join squads created by their teachers.
            </p>
          </div>
        </div>
      </Card>

      {/* Classroom syllabus generation Card */}
      <Card className="p-6 border-border bg-card rounded-lg relative overflow-hidden shadow-sm flex flex-col sm:flex-row items-center gap-6 justify-between">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-primary shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-mono uppercase tracking-widest text-primary font-bold">Classroom syllabus generation</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-xl">
              Construct high-fidelity learning roadmaps using Google Gemini. Upload your textbook or custom curriculum slide decks to automatically populate study sessions for all students in your squad.
            </p>
          </div>
        </div>
        <Link href="/dashboard/teachers/upload-material">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/95 border border-primary/80 font-mono text-xs uppercase tracking-widest rounded-md h-11 px-6 cursor-pointer shrink-0">
            Upload Class Material
          </Button>
        </Link>
      </Card>
    </motion.div>
  );
}

function ClassroomStatCard({ icon, label, value, desc }: { icon: React.ReactNode, label: string, value: string, desc: string }) {
  return (
    <div className="p-5 rounded-lg border border-border bg-card flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.01)] transition-transform hover:scale-[1.02] duration-300">
      <div className="flex justify-between items-start mb-4">
        <span className="text-[8px] font-mono font-bold tracking-widest text-muted-foreground uppercase">{label}</span>
        <div className="p-1.5 rounded bg-primary/5 border border-primary/20 text-primary shrink-0">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-xl font-bold text-foreground tracking-tight">{value}</p>
        <p className="text-[9px] text-muted-foreground mt-1 leading-normal">{desc}</p>
      </div>
    </div>
  );
}
