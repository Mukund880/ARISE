"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Search, Zap, LogOut, User, TrendingUp, CreditCard, GraduationCap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function Topbar() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const mockNotifications = [
    { id: 1, title: "Squad Update", desc: "Alex just claimed 500 XP in Rust!", time: "5m ago" },
    { id: 2, title: "Syllabus Ready", desc: "Your 'Machine Learning' roadmap has been generated.", time: "1h ago" },
    { id: 3, title: "New Achievement", desc: "You unlocked the 'Daily Streak' gold emblem!", time: "2h ago" },
  ];

  return (
    <header className="h-20 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-40">
      {/* Search Bar Container */}
      <div className="flex items-center w-full max-w-sm relative">
        <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3.5" />
        <Input 
          placeholder="Search lessons, squads, or help..." 
          className="pl-10 bg-secondary/35 border-border text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/30 focus-visible:border-primary rounded-md h-9 w-full transition-all text-xs"
        />
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
                src={`https://api.dicebear.com/7.x/${userProfile?.avatarStyle || "avataaars"}/svg?seed=${user?.displayName || 'User'}`} 
                alt="Avatar" 
                className="w-full h-full object-cover" 
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
