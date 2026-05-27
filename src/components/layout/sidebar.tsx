"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain, LayoutDashboard, Compass, Trophy, Users, BookOpen, Settings, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { AriseMascot } from "@/components/AriseMascot";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Compass, label: "Explore Topics", href: "/dashboard/explore" },
  { icon: BookOpen, label: "My Learning", href: "/dashboard/learning" },
  { icon: Trophy, label: "Leaderboard", href: "/dashboard/leaderboard" },
  { icon: Users, label: "Squads", href: "/dashboard/squads" },
];

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const { user, userProfile } = useAuth();

  const level = userProfile?.level || 1;
  const rank = userProfile?.rank || "Rookie";
  const xp = userProfile?.xp || 0;

  // XP calculations: 1000 XP per level
  const xpInCurrentLevel = xp % 1000;
  const xpNeededForNextLevel = 1000;
  const progressPercent = Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100);
  const xpRemaining = xpNeededForNextLevel - xpInCurrentLevel;

  const hideMascot = 
    pathname === "/dashboard" || 
    pathname === "/dashboard/new-topic" || 
    pathname.startsWith("/dashboard/learning/");

  return (
    <aside className={`${isCollapsed ? "w-20" : "w-64"} border-r border-slate-200/60 bg-[#FAF9F6]/90 backdrop-blur-3xl hidden md:flex flex-col h-screen fixed top-0 left-0 z-50 transition-all duration-300 ease-in-out`}>
      {/* Absolute Expand/Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-7 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 shadow-sm hover:text-indigo-600 transition-colors z-50 cursor-pointer"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>

      {/* Brand Header */}
      <div className={`p-6 flex items-center ${isCollapsed ? "justify-center" : "justify-between"} border-b border-slate-200/60`}>
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="p-2 bg-gradient-to-tr from-indigo-500 to-cyan-500 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-transform group-hover:scale-105">
            <Brain className="w-6 h-6 text-white" />
          </div>
          {!isCollapsed && (
            <span className="text-2xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 uppercase">
              Arise
            </span>
          )}
        </Link>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 px-4 mt-8 space-y-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              title={isCollapsed ? item.label : undefined}
              className="block relative"
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 bg-indigo-50 border-l-4 border-indigo-500 rounded-xl"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <div className={`relative flex items-center ${isCollapsed ? "justify-center" : "gap-3.5"} px-4 py-3 rounded-xl transition-all duration-300 ${
                isActive 
                  ? "text-indigo-600 font-bold" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
              }`}>
                <item.icon className={`w-5 h-5 transition-transform duration-300 ${
                  isActive ? "text-indigo-600 scale-105" : "group-hover:scale-105"
                }`} />
                {!isCollapsed && <span className="text-sm">{item.label}</span>}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile Arena & Mascot */}
      <div className={`p-4 mt-auto border-t border-slate-200/60 ${isCollapsed ? "space-y-2" : "space-y-4"} relative`}>
        {isCollapsed ? (
          <div className="flex justify-center py-2">
            <div 
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white flex items-center justify-center font-bold text-sm shadow-[0_4px_12px_rgba(99,102,241,0.2)] cursor-pointer"
              title={user?.displayName || "Scholar"}
            >
              {user?.displayName ? user.displayName.split(" ").map(n => n[0]).join("") : "S"}
            </div>
          </div>
        ) : (
          /* Floating Mascot Study Card */
          <div className="relative p-4 rounded-2xl bg-gradient-to-br from-indigo-50 via-slate-50 to-white border border-indigo-100 shadow-sm overflow-hidden group">
            {/* Background vector circles */}
            <div className="absolute -right-12 -top-12 w-28 h-28 rounded-full bg-indigo-500/5 blur-xl pointer-events-none" />
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white flex items-center justify-center font-bold text-sm shadow-[0_4px_12px_rgba(99,102,241,0.2)]">
                {user?.displayName ? user.displayName.split(" ").map(n => n[0]).join("") : "S"}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Level {level}</p>
                  <span className="text-[9px] text-cyan-600 font-extrabold px-1.5 py-0.5 rounded-full bg-cyan-50 border border-cyan-200/30">{rank}</span>
                </div>
                <p className="text-sm font-bold text-slate-800 truncate max-w-[120px]">{user?.displayName || "Scholar"}</p>
              </div>
            </div>

            <div className="space-y-1.5 mt-3 relative z-10">
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>{xpInCurrentLevel} / {xpNeededForNextLevel} XP</span>
                <span className="text-indigo-500 font-medium">{xpRemaining} left</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 p-0.5 overflow-hidden border border-slate-200/50">
                <div 
                  className="bg-gradient-to-r from-cyan-400 via-indigo-500 to-pink-500 h-full rounded-full transition-all duration-700 ease-out" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Settings button */}
        <Link 
          href="/dashboard/settings" 
          title={isCollapsed ? "Settings" : undefined}
          className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"} px-4 py-3 text-slate-600 hover:text-indigo-600 transition-colors rounded-xl hover:bg-slate-100/50 border border-transparent hover:border-slate-200/40`}
        >
          <Settings className="w-5 h-5" />
          {!isCollapsed && <span className="text-sm font-medium">Settings</span>}
        </Link>
      </div>

      {/* Immersive Mascot Peeking from bottom-left corner */}
      <AnimatePresence>
        {!hideMascot && !isCollapsed && (
          <motion.div 
            initial={{ x: -60, y: 60, opacity: 0, rotate: -45 }}
            animate={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            exit={{ x: -60, y: 60, opacity: 0, rotate: -45 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="absolute bottom-16 -left-7 w-20 h-24 pointer-events-auto z-50"
          >
            <AriseMascot size={75} global={true} interactive={true} />
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}
