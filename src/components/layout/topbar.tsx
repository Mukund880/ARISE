"use client";

import { Bell, Search, Zap, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export function Topbar() {
  const { user, userProfile } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <header className="h-20 border-b border-slate-200/60 bg-white/40 backdrop-blur-3xl flex items-center justify-between px-8 sticky top-0 z-40">
      {/* Search Bar Container */}
      <div className="flex items-center w-full max-w-sm relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
        <Input 
          placeholder="Search lessons, squads, or help..." 
          className="pl-10 bg-slate-100/80 border-slate-200/50 text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 rounded-full h-10 w-full transition-all focus:ring-2 focus:ring-indigo-500/10 text-sm"
        />
      </div>

      {/* Action center */}
      <div className="flex items-center gap-5">
        {/* Streak flame badge */}
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 rounded-full shadow-sm select-none">
          <Zap className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
          <span className="font-extrabold text-xs text-amber-600 tracking-wider uppercase">
            {userProfile?.streak || 1} Day Streak
          </span>
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full relative border border-transparent hover:border-slate-200/40">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
        </Button>

        {/* User profile dropdown container */}
        <div className="w-10 h-10 rounded-full border-2 border-indigo-500/30 bg-gradient-to-tr from-indigo-500 to-pink-500 p-0.5 cursor-pointer relative group transition-transform hover:scale-105">
          <div className="w-full h-full bg-[#FAF9F6] rounded-full flex items-center justify-center overflow-hidden">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.displayName || 'User'}`} alt="Avatar" className="w-full h-full object-cover" />
          </div>

          {/* Premium dropdown menu */}
          <div className="absolute right-0 top-full mt-3 hidden group-hover:block w-40 bg-white border border-slate-200/80 rounded-2xl p-2 shadow-xl origin-top-right transition-all">
            <div className="px-2 py-1.5 border-b border-slate-100 mb-1.5">
              <p className="text-[10px] text-indigo-500 font-extrabold uppercase">Signed In As</p>
              <p className="text-xs font-bold text-slate-800 truncate">{user?.displayName || "Scholar"}</p>
            </div>
            <button 
              onClick={handleLogout} 
              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all font-semibold"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout Account
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
