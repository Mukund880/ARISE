"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain, LayoutDashboard, Compass, Users, BookOpen, Settings, Zap, ChevronLeft, ChevronRight, TrendingUp, CreditCard, GraduationCap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { AriseMascot } from "@/components/AriseMascot";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Compass, label: "Explore Topics", href: "/dashboard/explore" },
  { icon: BookOpen, label: "My Learning", href: "/dashboard/learning" },
  { icon: TrendingUp, label: "My Progress", href: "/dashboard/progress" },
  { icon: Users, label: "Squads", href: "/dashboard/squads" },
  { icon: CreditCard, label: "Pricing", href: "/dashboard/pricing" },
  { icon: GraduationCap, label: "For Teachers", href: "/dashboard/teachers" },
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
    <aside className={`${isCollapsed ? "w-20" : "w-64"} border-r border-border bg-sidebar hidden md:flex flex-col h-screen fixed top-0 left-0 z-50 transition-all duration-300 ease-in-out`}>
      {/* Absolute Expand/Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-7 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-primary transition-colors z-50 cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Brand Header */}
      <div className={`p-6 flex items-center ${isCollapsed ? "justify-center" : "justify-between"} border-b border-border`}>
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="p-2 border border-primary/45 rounded-lg transition-transform group-hover:scale-105">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          {!isCollapsed && (
            <span className="text-xl font-bold tracking-widest text-primary uppercase">
              Arise
            </span>
          )}
        </Link>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 px-4 mt-8 space-y-1">
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
                  className="absolute inset-0 bg-accent/40 border-l-2 border-primary rounded-md"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <div className={`relative flex items-center ${isCollapsed ? "justify-center" : "gap-3"} px-4 py-2.5 rounded-md transition-all duration-300 ${
                isActive 
                  ? "text-primary font-semibold" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
              }`}>
                <item.icon className={`w-4 h-4 transition-transform duration-300 ${
                  isActive ? "text-primary scale-105" : "group-hover:scale-105"
                }`} />
                {!isCollapsed && <span className="text-xs uppercase tracking-wider">{item.label}</span>}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile Arena & Mascot */}
      <div className={`p-4 mt-auto border-t border-border ${isCollapsed ? "space-y-2" : "space-y-4"} relative`}>
        {isCollapsed ? (
          <div className="flex justify-center py-2">
            <div 
              className="w-9 h-9 rounded-full border border-primary/40 bg-card text-primary flex items-center justify-center font-semibold text-xs cursor-pointer"
              title={user?.displayName || "Scholar"}
            >
              {user?.displayName ? user.displayName.split(" ").map(n => n[0]).join("") : "S"}
            </div>
          </div>
        ) : (
          /* Floating Mascot Study Card */
          <div className="relative p-4 rounded-lg bg-secondary/20 border border-border/80 group">
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-9 h-9 rounded-full border border-primary/40 bg-card text-primary flex items-center justify-center font-bold text-xs">
                {user?.displayName ? user.displayName.split(" ").map(n => n[0]).join("") : "S"}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-bold text-primary uppercase tracking-widest">Lvl {level}</p>
                  <span className="text-[8px] text-primary/80 font-bold px-1.5 py-0.5 rounded border border-primary/20 bg-primary/5 uppercase tracking-wider">{rank}</span>
                </div>
                <p className="text-xs font-semibold text-foreground truncate max-w-[120px]">{user?.displayName || "Scholar"}</p>
              </div>
            </div>

            <div className="space-y-1 mt-3 relative z-10">
              <div className="flex justify-between text-[9px] text-muted-foreground">
                <span>{xpInCurrentLevel} / {xpNeededForNextLevel} XP</span>
                <span className="text-primary font-medium">{xpRemaining} left</span>
              </div>
              <div className="w-full bg-secondary/50 rounded-full h-1 overflow-hidden border border-border/50">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-700 ease-out" 
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
          className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"} px-4 py-2.5 text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-accent/10 border border-transparent`}
        >
          <Settings className="w-4 h-4" />
          {!isCollapsed && <span className="text-xs uppercase tracking-wider font-medium">Settings</span>}
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
