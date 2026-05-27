"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, User, KeyRound } from "lucide-react";
import { updateProfile } from "firebase/auth";

export default function SettingsPage() {
  const { user, userProfile } = useAuth();
  const [name, setName] = useState(user?.displayName || "");
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUpdating(true);
    setSuccess(false);
    try {
      // Update Firebase Auth display name
      await updateProfile(user, { displayName: name });

      // Update Firestore user document
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        displayName: name
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header Info */}
      <div>
        <h1 className="text-3xl font-black flex items-center gap-3 tracking-tight text-slate-800">
          <Settings className="text-indigo-500 w-9 h-9" />
          Account Settings
        </h1>
        <p className="text-slate-500 text-sm mt-1">Manage your student profile credentials and view system connections.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Left Form: Profile settings */}
        <div className="md:col-span-2 space-y-6">
          <Card className="glasspanel p-6 border-slate-200 bg-white rounded-3xl shadow-sm">
            <h3 className="text-base font-extrabold flex items-center gap-2 mb-6 uppercase tracking-wider text-slate-650 border-b border-slate-100 pb-3">
              <User className="w-4 h-4 text-cyan-600" />
              Student Profile
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              
              {/* Avatar Preview Section */}
              <div className="flex items-center gap-4 bg-[#FAF9F6] p-4 border border-slate-200/60 rounded-2xl">
                <div className="w-14 h-14 rounded-full border border-slate-200 overflow-hidden bg-white">
                  <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name || 'User'}`} 
                    alt="Seed Avatar" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 leading-none">Avatar Seed Preview</p>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-bold">Generates from your display name</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-500 text-xs font-bold uppercase tracking-wider">Email Address (Read-only)</Label>
                <Input 
                  id="email" 
                  value={user?.email || ""} 
                  disabled 
                  className="bg-slate-50 border-slate-200 text-slate-450 cursor-not-allowed h-11 rounded-xl focus-visible:ring-0 focus-visible:border-slate-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-slate-500 text-xs font-bold uppercase tracking-wider">Full Name</Label>
                <Input 
                  id="displayName" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white border-slate-200 text-slate-805 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 h-11 rounded-xl transition-all"
                  required
                />
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  disabled={updating}
                  className="bg-indigo-600 hover:bg-indigo-755 text-white font-bold px-6 h-11 text-xs rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all arbuttonchunky"
                >
                  {updating ? "Saving Changes..." : success ? "Changes Saved ✓" : "Save Profile Details"}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Info: Connected keys and service status */}
        <div className="space-y-6">
          <Card className="glasspanel p-6 border-slate-200 bg-white rounded-3xl relative overflow-hidden shadow-sm">
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-indigo-500/5 blur-xl" />
            
            <h3 className="text-base font-extrabold flex items-center gap-2 mb-4 uppercase tracking-wider text-slate-650 border-b border-slate-100 pb-3">
              <KeyRound className="w-4 h-4 text-indigo-500" />
              API Connectivity
            </h3>
            
            <div className="space-y-3.5">
              <div className="p-3.5 bg-[#FAF9F6] border border-slate-200/50 rounded-2xl flex justify-between items-center shadow-inner">
                <span className="text-xs font-bold text-slate-600">Google Gemini API</span>
                <span className="text-[10px] font-black text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" /> Connected
                </span>
              </div>

              <div className="p-3.5 bg-[#FAF9F6] border border-slate-200/50 rounded-2xl flex justify-between items-center shadow-inner">
                <span className="text-xs font-bold text-slate-600">Pinecone Vector DB</span>
                <span className="text-[10px] font-black text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" /> Connected
                </span>
              </div>

              <div className="p-3.5 bg-[#FAF9F6] border border-slate-200/50 rounded-2xl flex justify-between items-center shadow-inner">
                <span className="text-xs font-bold text-slate-600">Firebase Firestore</span>
                <span className="text-[10px] font-black text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" /> Active
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
