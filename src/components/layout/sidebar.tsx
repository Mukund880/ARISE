"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain, LayoutDashboard, Compass, Users, BookOpen,
  Settings, TrendingUp, CreditCard, GraduationCap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { AriseMascot } from "@/components/AriseMascot";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard",     href: "/dashboard" },
  { icon: Compass,         label: "Explore Topics", href: "/dashboard/explore" },
  { icon: BookOpen,        label: "My Learning",    href: "/dashboard/learning" },
  { icon: TrendingUp,      label: "My Progress",    href: "/dashboard/progress" },
  { icon: Users,           label: "Squads",         href: "/dashboard/squads" },
  { icon: CreditCard,      label: "Pricing",        href: "/dashboard/pricing" },
];

const getNavItems = (role?: string) => {
  const items = [...navItems];
  if (role === "teacher") {
    items.push({ icon: GraduationCap,   label: "For Teachers",   href: "/dashboard/teachers" });
  }
  return items;
};

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
}

export function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname  = usePathname();
  const { user, userProfile } = useAuth();

  const xp      = Number(userProfile?.xp) || 0;
  const level   = Math.floor(xp / 1000) + 1;
  let rank = "Rookie";
  if (level >= 15) rank = "Grandmaster";
  else if (level >= 10) rank = "Master";
  else if (level >= 5) rank = "Scholar";
  const xpInCurrentLevel   = xp % 1000;
  const xpNeededForNextLevel = 1000;
  const progressPercent    = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100)));
  const xpRemaining        = Math.max(0, xpNeededForNextLevel - xpInCurrentLevel);

  const hideMascot =
    pathname === "/dashboard" ||
    pathname === "/dashboard/new-topic" ||
    pathname.startsWith("/dashboard/learning/");

  // Single source of truth – everything driven by CSS transitions, no mount/unmount
  const expanded = !isCollapsed;

  const avatarNode = user?.photoURL ? (
    <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
  ) : (
    <span>{user?.displayName ? user.displayName.split(" ").map((n: string) => n[0]).join("") : "S"}</span>
  );

  return (
    <aside
      onClick={() => setIsCollapsed(!isCollapsed)}
      style={{ width: expanded ? 256 : 64 }}
      className="border-r border-border bg-sidebar hidden md:flex flex-col h-screen fixed top-0 left-0 z-50 overflow-hidden cursor-pointer"
    >
      {/* We wrap everything in a motion.div that animates width for GPU-accelerated smoothness */}
      <motion.div
        animate={{ width: expanded ? 256 : 64 }}
        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
        className="flex flex-col h-full w-full overflow-hidden"
      >

        {/* ── Brand header (same height as topbar h-20) ─────────────── */}
        <div className="h-20 border-b border-border flex items-center px-3 shrink-0 overflow-hidden">
          <Link href="/dashboard" className="flex items-center gap-3 group min-w-0">
            <div className="p-2 border border-primary/45 rounded-lg transition-transform group-hover:scale-105 shrink-0">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            {/* Always in DOM – opacity fade only */}
            <span
              className="text-xl font-bold tracking-widest text-primary uppercase whitespace-nowrap transition-opacity duration-200"
              style={{ opacity: expanded ? 1 : 0, pointerEvents: expanded ? "auto" : "none" }}
            >
              Arise
            </span>
          </Link>
        </div>

        {/* ── Nav items ─────────────────────────────────────────────── */}
        <nav className="flex-1 px-2 mt-6 space-y-0.5 overflow-hidden">
          {getNavItems(userProfile?.role).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={!expanded ? item.label : undefined}
                className="block relative"
                onClick={(e) => e.stopPropagation()}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-pill"
                    className="absolute inset-0 bg-accent/40 border-l-2 border-primary rounded-md"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <div
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors duration-150 ${
                    isActive
                       ? "text-primary font-semibold"
                       : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
                  }`}
                >
                  <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
                  {/* Always in DOM – opacity only */}
                  <span
                    className="text-xs uppercase tracking-wider whitespace-nowrap transition-opacity duration-200"
                    style={{ opacity: expanded ? 1 : 0 }}
                  >
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* ── Bottom: profile card + settings ──────────────────────── */}
        <div className="p-2 mt-auto border-t border-border space-y-1 relative overflow-hidden">

          {/* Profile card – single element, details fade in/out */}
          <div className="p-3 rounded-lg bg-secondary/20 border border-border/80 overflow-hidden">
            <div className="flex items-center gap-3">
              {/* Avatar always visible */}
              <div
                className="rounded-full border border-primary/40 bg-card text-primary flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden"
                style={{ width: 32, height: 32 }}
                title={!expanded ? (user?.displayName || "Scholar") : undefined}
              >
                {avatarNode}
              </div>

              {/* Text details fade in */}
              <div
                className="flex-1 min-w-0 overflow-hidden transition-all duration-250"
                style={{
                  opacity: expanded ? 1 : 0,
                  maxHeight: expanded ? "48px" : "0px",
                  pointerEvents: expanded ? "auto" : "none",
                }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-bold text-primary uppercase tracking-widest">Lvl {level}</p>
                  <span className="text-[8px] text-primary/80 font-bold px-1.5 py-0.5 rounded border border-primary/20 bg-primary/5 uppercase tracking-wider">
                    {rank}
                  </span>
                </div>
                <p className="text-xs font-semibold text-foreground truncate">{user?.displayName || "Scholar"}</p>
              </div>
            </div>

            {/* XP bar – collapses height AND opacity when sidebar is collapsed */}
            <div
              className="space-y-1 overflow-hidden transition-all duration-250"
              style={{
                opacity: expanded ? 1 : 0,
                maxHeight: expanded ? "40px" : "0px",
                marginTop: expanded ? "12px" : "0px",
              }}
            >
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

          {/* Settings link */}
          <Link
            href="/dashboard/settings"
            title={!expanded ? "Settings" : undefined}
            onClick={(e) => e.stopPropagation()}
            className={`flex items-center gap-3 px-3 py-2.5 text-muted-foreground hover:text-primary transition-colors duration-150 rounded-md hover:bg-accent/10 ${
              !expanded ? "justify-center" : ""
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span
              className="text-xs uppercase tracking-wider font-medium whitespace-nowrap transition-opacity duration-200"
              style={{ opacity: expanded ? 1 : 0 }}
            >
              Settings
            </span>
          </Link>
        </div>

      </motion.div>
    </aside>
  );
}
