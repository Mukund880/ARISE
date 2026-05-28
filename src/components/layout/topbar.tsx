"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Bell, Search, Zap, LogOut, User, TrendingUp, CreditCard, GraduationCap, BrainCircuit, Compass, Users, Settings, BarChart2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

// Static nav pages to always include in search
const NAV_PAGES = [
  { title: "Dashboard", href: "/dashboard", icon: "dashboard", desc: "Home overview & stats" },
  { title: "Explore Topics", href: "/dashboard/explore", icon: "explore", desc: "Discover new learning topics" },
  { title: "My Learning", href: "/dashboard/learning", icon: "learning", desc: "Your active roadmaps" },
  { title: "Start New Topic", href: "/dashboard/new-topic", icon: "new", desc: "Generate a new AI roadmap" },
  { title: "My Progress", href: "/dashboard/progress", icon: "progress", desc: "XP, streaks & achievements" },
  { title: "Study Squads", href: "/dashboard/squads", icon: "squads", desc: "Collaborative learning groups" },
  { title: "Settings", href: "/dashboard/settings", icon: "settings", desc: "Profile & account preferences" },
  { title: "Pricing", href: "/dashboard/pricing", icon: "pricing", desc: "Plans & subscription tiers" },
  { title: "Instructor Portal", href: "/dashboard/teachers", icon: "teachers", desc: "Teacher tools & dashboards" },
];

function NavIcon({ icon }: { icon: string }) {
  const cls = "w-3.5 h-3.5";
  switch (icon) {
    case "explore": return <Compass className={cls} />;
    case "learning": return <BrainCircuit className={cls} />;
    case "new": return <BrainCircuit className={cls} />;
    case "progress": return <BarChart2 className={cls} />;
    case "squads": return <Users className={cls} />;
    case "settings": return <Settings className={cls} />;
    case "pricing": return <CreditCard className={cls} />;
    case "teachers": return <GraduationCap className={cls} />;
    default: return <Search className={cls} />;
  }
}

export function Topbar() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [topics, setTopics] = useState<any[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Fetch user topics once on mount
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const topicsCol = collection(db, "users", user.uid, "topics");
        const q = query(topicsCol, orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setTopics(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch {}
    })();
  }, [user]);

  // Build search results
  const results = useCallback(() => {
    if (!searchQuery.trim()) return { pages: [], userTopics: [] };
    const q = searchQuery.toLowerCase();

    const pages = NAV_PAGES.filter(
      (p) => p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
    );

    const userTopics = topics.filter(
      (t) =>
        t.title?.toLowerCase().includes(q) ||
        t.goal?.toLowerCase().includes(q) ||
        t.level?.toLowerCase().includes(q)
    );

    return { pages, userTopics };
  }, [searchQuery, topics]);

  const { pages: pageResults, userTopics: topicResults } = results();
  const allResults = [
    ...pageResults.map((p) => ({ type: "page" as const, ...p })),
    ...topicResults.map((t) => ({ type: "topic" as const, title: t.title, href: `/dashboard/learning/${t.id}`, desc: `${t.level || ""}${t.goal ? " · " + t.goal : ""}`, icon: "learning" })),
  ];

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setActiveIdx(-1);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!searchOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, allResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIdx >= 0 && allResults[activeIdx]) {
      e.preventDefault();
      navigateTo(allResults[activeIdx].href);
    } else if (e.key === "Escape") {
      setSearchOpen(false);
      setSearchQuery("");
      setActiveIdx(-1);
      inputRef.current?.blur();
    }
  };

  const navigateTo = (href: string) => {
    router.push(href);
    setSearchQuery("");
    setSearchOpen(false);
    setActiveIdx(-1);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const mockNotifications = [
    { id: 1, title: "Squad Update", desc: "Alex just claimed 500 XP in Rust!", time: "5m ago" },
    { id: 2, title: "Syllabus Ready", desc: "Your 'Machine Learning' roadmap has been generated.", time: "1h ago" },
    { id: 3, title: "New Achievement", desc: "You unlocked the 'Daily Streak' gold emblem!", time: "2h ago" },
  ];

  const showDropdown = searchOpen && searchQuery.trim().length > 0;

  return (
    <header className="h-20 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-40">
      {/* Search Bar Container */}
      <div className="flex items-center w-full max-w-sm relative" ref={searchRef}>
        <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3.5 z-10 pointer-events-none" />
        <Input
          ref={inputRef}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSearchOpen(true);
            setActiveIdx(-1);
          }}
          onFocus={() => setSearchOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search lessons, pages, or topics..."
          className="pl-10 pr-8 bg-secondary/35 border-border text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/30 focus-visible:border-primary rounded-md h-9 w-full transition-all text-xs"
          id="global-search-input"
        />
        {searchQuery && (
          <button
            onClick={() => { setSearchQuery(""); setSearchOpen(false); inputRef.current?.focus(); }}
            className="absolute right-2.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        {/* Search Results Dropdown */}
        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-2 w-[420px] bg-card border border-border rounded-md shadow-[0_16px_48px_-8px_rgba(0,0,0,0.18)] z-50 overflow-hidden"
            >
              {allResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                  <Search className="w-6 h-6 text-muted-foreground/40" />
                  <p className="text-xs font-semibold text-muted-foreground">No results for <span className="text-foreground">"{searchQuery}"</span></p>
                  <p className="text-[10px] text-muted-foreground/70">Try searching a topic name, page, or skill</p>
                </div>
              ) : (
                <div className="p-1.5 max-h-[360px] overflow-y-auto">
                  {/* Pages section */}
                  {pageResults.length > 0 && (
                    <div className="mb-1">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 px-2.5 py-1.5">Pages</p>
                      {pageResults.map((page, i) => {
                        const globalIdx = i;
                        return (
                          <button
                            key={page.href}
                            onClick={() => navigateTo(page.href)}
                            onMouseEnter={() => setActiveIdx(globalIdx)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
                              activeIdx === globalIdx ? "bg-primary/10 text-foreground" : "hover:bg-secondary/20 text-muted-foreground"
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${activeIdx === globalIdx ? "bg-primary/15 text-primary" : "bg-secondary/30 text-muted-foreground"}`}>
                              <NavIcon icon={page.icon} />
                            </div>
                            <div className="min-w-0">
                              <p className={`text-xs font-semibold truncate ${activeIdx === globalIdx ? "text-foreground" : ""}`}>{page.title}</p>
                              <p className="text-[10px] text-muted-foreground/70 truncate">{page.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* User topics section */}
                  {topicResults.length > 0 && (
                    <div>
                      {pageResults.length > 0 && <div className="border-t border-border/40 my-1" />}
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 px-2.5 py-1.5">Your Learning Topics</p>
                      {topicResults.map((topic, i) => {
                        const globalIdx = pageResults.length + i;
                        return (
                          <button
                            key={topic.id}
                            onClick={() => navigateTo(`/dashboard/learning/${topic.id}`)}
                            onMouseEnter={() => setActiveIdx(globalIdx)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
                              activeIdx === globalIdx ? "bg-primary/10 text-foreground" : "hover:bg-secondary/20 text-muted-foreground"
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${activeIdx === globalIdx ? "bg-primary/15 text-primary" : "bg-secondary/30 text-muted-foreground"}`}>
                              <BrainCircuit className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs font-semibold truncate ${activeIdx === globalIdx ? "text-foreground" : ""}`}>{topic.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {topic.level && (
                                  <span className="text-[9px] font-mono text-primary bg-primary/8 px-1.5 py-0.5 rounded uppercase tracking-wider">{topic.level}</span>
                                )}
                                <span className="text-[10px] text-muted-foreground/70 truncate">{topic.goal}</span>
                              </div>
                            </div>
                            <div className="w-10 shrink-0">
                              <div className="w-full bg-secondary/50 rounded-full h-1 overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${topic.progress || 0}%` }} />
                              </div>
                              <p className="text-[9px] text-primary font-mono text-right mt-0.5">{topic.progress || 0}%</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Footer hint */}
                  <div className="border-t border-border/40 mt-1 pt-1.5 pb-0.5 px-2.5 flex items-center gap-3">
                    <span className="text-[9px] text-muted-foreground/50 font-mono">↑↓ navigate</span>
                    <span className="text-[9px] text-muted-foreground/50 font-mono">↵ open</span>
                    <span className="text-[9px] text-muted-foreground/50 font-mono">Esc close</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action center */}
      <div className="flex items-center gap-5">
        {/* Streak flame badge */}
        <div className="flex items-center gap-2 border border-primary/30 px-3.5 py-1 rounded-md select-none bg-primary/5">
          <Zap className="w-3.5 h-3.5 text-primary fill-primary animate-pulse" />
          <span className="font-bold text-[10px] text-primary tracking-wider uppercase">
            {userProfile?.streak || 1} Day Streak
          </span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notificationsRef}>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`text-muted-foreground hover:text-foreground hover:bg-accent/15 rounded-md relative border border-transparent w-8 h-8 cursor-pointer ${
              isNotificationsOpen ? "bg-accent/15 text-foreground border-border/50" : ""
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
          </Button>

          {isNotificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-card border border-border rounded-md p-1.5 shadow-[0_10px_35px_-8px_rgba(0,0,0,0.15)] origin-top-right transition-all z-50">
              <div className="px-2.5 py-2 border-b border-border mb-1">
                <p className="text-[9px] text-primary font-bold uppercase tracking-wider">Alerts & Messages</p>
              </div>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {mockNotifications.map((notif) => (
                  <div key={notif.id} className="p-2 hover:bg-secondary/15 rounded-md transition-colors text-left">
                    <div className="flex justify-between items-start mb-0.5">
                      <p className="text-[10px] font-bold text-foreground">{notif.title}</p>
                      <span className="text-[8px] text-muted-foreground font-mono">{notif.time}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-normal">{notif.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User profile dropdown container */}
        <div className="relative" ref={profileRef}>
          <div 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-8 h-8 rounded-full border border-primary/45 p-0.5 cursor-pointer transition-transform hover:scale-105"
          >
            <div className="w-full h-full bg-card rounded-full flex items-center justify-center overflow-hidden">
              <img 
                src={
                  user?.photoURL
                    ? user.photoURL
                    : `https://api.dicebear.com/7.x/${userProfile?.avatarStyle || "avataaars"}/svg?seed=${user?.displayName || 'User'}`
                }
                alt="Avatar" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/${userProfile?.avatarStyle || "avataaars"}/svg?seed=${user?.displayName || 'User'}`;
                }}
              />
            </div>
          </div>

          {/* Premium dropdown menu */}
          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-md p-1.5 shadow-[0_10px_35px_-8px_rgba(0,0,0,0.15)] origin-top-right transition-all z-50">
              <div className="px-2.5 py-2 border-b border-border mb-1.5">
                <p className="text-[9px] text-primary font-bold uppercase tracking-wider">Signed In As</p>
                <p className="text-xs font-semibold text-foreground truncate">{user?.displayName || "Scholar"}</p>
              </div>
              
              <div className="space-y-0.5 border-b border-border pb-1.5 mb-1.5">
                <Link 
                  href="/dashboard/settings" 
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 px-2.5 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/15 rounded-md transition-colors font-medium"
                >
                  <User className="w-3.5 h-3.5 text-primary" />
                  View Profile
                </Link>
                <Link 
                  href="/dashboard/progress" 
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 px-2.5 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/15 rounded-md transition-colors font-medium"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  My Progress
                </Link>
                <Link 
                  href="/dashboard/pricing" 
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 px-2.5 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/15 rounded-md transition-colors font-medium"
                >
                  <CreditCard className="w-3.5 h-3.5 text-primary" />
                  Pricing Plan
                </Link>
                <Link 
                  href="/dashboard/teachers" 
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 px-2.5 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/15 rounded-md transition-colors font-medium"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-primary" />
                  Instructor Portal
                </Link>
              </div>

              <button 
                onClick={handleLogout} 
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-[11px] text-destructive hover:bg-destructive/10 rounded-md transition-all font-medium cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout Account
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
