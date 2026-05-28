"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db, auth } from "@/lib/firebase";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, User, Trash2, Eye, ShieldAlert, Sparkles } from "lucide-react";
import { updateProfile, deleteUser } from "firebase/auth";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  
  const [name, setName] = useState(user?.displayName || "");
  const [avatarStyle, setAvatarStyle] = useState(userProfile?.avatarStyle || "avataaars");
  const [avatarSeed, setAvatarSeed] = useState(userProfile?.avatarSeed || user?.displayName || "Scholar");
  const [learningStyle, setLearningStyle] = useState(userProfile?.learningStyle || "Visual");
  const [dailyTarget, setDailyTarget] = useState(userProfile?.dailyTarget || "30");
  
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Account Deletion States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const avatarStyles = [
    { value: "avataaars", label: "Avataaars (Human)" },
    { value: "bottts", label: "Bottts (Robots)" },
    { value: "pixel-art", label: "Pixel Art (Retro)" },
    { value: "identicon", label: "Identicon (Geometric)" },
    { value: "micah", label: "Micah (Minimalist)" }
  ];

  const learningStyles = ["Visual", "Auditory", "Reading / Writing", "Kinesthetic"];
  const studyTargets = [
    { value: "15", label: "15 Minutes (Casual)" },
    { value: "30", label: "30 Minutes (Regular)" },
    { value: "45", label: "45 Minutes (Dedicated)" },
    { value: "60", label: "60 Minutes (Intense)" }
  ];

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUpdating(true);
    setSuccess(false);
    try {
      // Update Firebase Auth profile
      await updateProfile(user, { displayName: name });

      // Update Firestore user document
      const userRef = doc(db, "users", user.uid);
      const updatedFields = {
        displayName: name,
        avatarStyle,
        avatarSeed,
        learningStyle,
        dailyTarget: parseInt(dailyTarget, 10) || 30
      };
      await updateDoc(userRef, updatedFields);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating settings:", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || confirmText !== "DELETE MY ACCOUNT") return;
    setDeleting(true);
    try {
      // 1. Delete Firestore document
      const userRef = doc(db, "users", user.uid);
      await deleteDoc(userRef);

      // 2. Delete the user authentication record
      await deleteUser(user);

      // 3. Redirect to signup
      router.push("/signup");
    } catch (err: any) {
      console.error("Failed to delete account:", err);
      alert("Security restriction: To delete your account, please log out and log back in, then retry this action immediately.");
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header Info */}
      <div>
        <h1 className="text-xl font-bold tracking-wider text-foreground uppercase flex items-center gap-3">
          <Settings className="text-primary w-6 h-6" />
          Account & Profile Settings
        </h1>
        <p className="text-muted-foreground text-xs mt-1">Manage your custom scholar avatar, preferences, daily study goals, and account credentials.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Form: Profile settings & Preferences */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-6 border-border bg-card rounded-lg shadow-sm">
            <h3 className="text-xs font-mono uppercase tracking-widest text-primary font-bold border-b border-border/40 pb-3 mb-6 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Student Profile
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Profile details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-muted-foreground text-[9px] font-mono uppercase tracking-widest">Full Name</Label>
                  <Input 
                    id="displayName" 
                    value={name} 
                    onChange={(e) => {
                      setName(e.target.value);
                      if (avatarSeed === name || avatarSeed === "") {
                        setAvatarSeed(e.target.value);
                      }
                    }}
                    className="bg-card border-border text-foreground focus-visible:ring-primary/20 focus-visible:border-primary h-11 rounded-md text-xs transition-all"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-muted-foreground text-[9px] font-mono uppercase tracking-widest">Email (Read-only)</Label>
                  <Input 
                    id="email" 
                    value={user?.email || ""} 
                    disabled 
                    className="bg-secondary/15 border-border text-muted-foreground cursor-not-allowed h-11 rounded-md text-xs focus-visible:ring-0 focus-visible:border-border"
                  />
                </div>
              </div>

              {/* Preferences Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-[9px] font-mono uppercase tracking-widest">Learning Style</Label>
                  <select
                    value={learningStyle}
                    onChange={(e) => setLearningStyle(e.target.value)}
                    className="w-full bg-card border border-border text-foreground h-11 rounded-md text-xs px-3 focus-visible:outline-none focus:border-primary transition-all"
                  >
                    {learningStyles.map((style) => (
                      <option key={style} value={style} className="bg-card text-foreground">{style}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground text-[9px] font-mono uppercase tracking-widest">Daily Target</Label>
                  <select
                    value={dailyTarget}
                    onChange={(e) => setDailyTarget(e.target.value)}
                    className="w-full bg-card border border-border text-foreground h-11 rounded-md text-xs px-3 focus-visible:outline-none focus:border-primary transition-all"
                  >
                    {studyTargets.map((target) => (
                      <option key={target.value} value={target.value} className="bg-card text-foreground">{target.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-border/40">
                <Button 
                  type="submit" 
                  disabled={updating}
                  className="bg-primary text-primary-foreground hover:bg-primary/95 border border-primary/80 font-mono text-xs uppercase tracking-wider rounded-md px-6 h-11 transition-all cursor-pointer"
                >
                  {updating ? "Saving Changes..." : success ? "Changes Saved ✓" : "Save Profile Details"}
                </Button>
              </div>
            </form>
          </Card>

          {/* Account Security (Double Confirmation Delete) */}
          <Card className="p-6 border-destructive/30 bg-card rounded-lg shadow-sm">
            <h3 className="text-xs font-mono uppercase tracking-widest text-destructive font-bold border-b border-border/40 pb-3 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-destructive" />
              Account Security & Danger Zone
            </h3>
            <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
              Once you delete your account, there is no going back. All of your personalized syllabi, topic masteries, daily study streak indicators, and total XP rewards will be wiped from Firestore databases permanently.
            </p>
            <Button 
              variant="outline"
              onClick={() => setShowDeleteModal(true)}
              className="border-destructive/40 text-destructive hover:bg-destructive/10 text-xs font-mono uppercase tracking-wider h-11 px-6 rounded-md cursor-pointer flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
            </Button>
          </Card>
        </div>

        {/* Right Info: Interactive Avatar Customizer */}
        <div className="space-y-6">
          <Card className="p-6 border-border bg-card rounded-lg relative overflow-hidden shadow-sm flex flex-col items-center text-center">
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/5 blur-xl pointer-events-none" />
            
            <h3 className="text-xs font-mono uppercase tracking-widest text-primary font-bold border-b border-border/40 pb-3 mb-6 w-full text-left flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Avatar Customizer
            </h3>

            {/* Real-time custom Dicebear render */}
            <div className="w-28 h-28 rounded-full border border-primary/45 p-1 bg-card/50 relative overflow-hidden mb-6 shadow-inner flex items-center justify-center">
              <div className="w-full h-full bg-card rounded-full flex items-center justify-center overflow-hidden">
                <img 
                  src={`https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${avatarSeed || 'User'}`} 
                  alt="Real-time Custom Avatar Preview" 
                  className="w-full h-full object-cover" 
                />
              </div>
            </div>

            <div className="w-full space-y-4 text-left">
              <div className="space-y-2">
                <Label className="text-muted-foreground text-[9px] font-mono uppercase tracking-widest">Avatar Set</Label>
                <select
                  value={avatarStyle}
                  onChange={(e) => setAvatarStyle(e.target.value)}
                  className="w-full bg-card border border-border text-foreground h-10 rounded-md text-xs px-3 focus-visible:outline-none focus:border-primary transition-all"
                >
                  {avatarStyles.map((style) => (
                    <option key={style.value} value={style.value} className="bg-card text-foreground">{style.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatarSeed" className="text-muted-foreground text-[9px] font-mono uppercase tracking-widest">Custom Seed / Keyphrase</Label>
                <Input 
                  id="avatarSeed" 
                  value={avatarSeed} 
                  onChange={(e) => setAvatarSeed(e.target.value)}
                  placeholder="e.g. PixelBoy"
                  className="bg-card border-border text-foreground focus-visible:ring-primary/20 focus-visible:border-primary h-10 rounded-md text-xs transition-all"
                />
                <span className="text-[8px] text-muted-foreground leading-normal block uppercase tracking-wider">Change the seed keyphrase above to randomize your character variables.</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Account Modal (Double Confirmation overlay) */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-neutral-950/70 z-50 flex items-center justify-center px-4 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card border border-destructive/30 rounded-lg p-6 max-w-md w-full relative space-y-6 text-center shadow-lg"
          >
            <div className="w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center text-destructive mx-auto border border-destructive/20 mb-2">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-foreground">Confirm Account Deletion</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This is a fully destructive, permanent action. Please type <strong className="text-destructive font-mono uppercase font-bold tracking-wider">DELETE MY ACCOUNT</strong> in the field below to verify credentials.
              </p>
            </div>

            <div className="space-y-2 text-left">
              <Label className="text-muted-foreground text-[8px] font-mono uppercase tracking-widest">Verification Prompt</Label>
              <Input 
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE MY ACCOUNT"
                className="bg-card border-border text-foreground focus-visible:ring-destructive/20 focus-visible:border-destructive h-11 rounded-md text-xs text-center"
              />
            </div>

            <div className="flex gap-4 pt-2">
              <Button 
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmText("");
                }}
                className="flex-1 border-border text-foreground hover:bg-secondary/15 h-11 text-xs uppercase font-mono tracking-wider"
              >
                Cancel Action
              </Button>
              <Button 
                onClick={handleDeleteAccount}
                disabled={confirmText !== "DELETE MY ACCOUNT" || deleting}
                className="flex-1 bg-destructive hover:bg-destructive/90 text-white border border-destructive h-11 text-xs uppercase font-mono tracking-wider cursor-pointer"
              >
                {deleting ? "Deleting Profile..." : "Confirm Delete"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
