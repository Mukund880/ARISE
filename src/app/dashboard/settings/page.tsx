"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme, THEMES, ThemeId } from "@/context/ThemeContext";
import { db, auth } from "@/lib/firebase";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, User, Trash2, Sparkles, ShieldAlert, Palette, Check } from "lucide-react";
import { updateProfile, deleteUser } from "firebase/auth";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const { user, userProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const [name, setName] = useState(user?.displayName || "");
  const [avatarStyle, setAvatarStyle] = useState(userProfile?.avatarStyle || "avataaars");
  const [avatarSeed, setAvatarSeed] = useState(userProfile?.avatarSeed || user?.displayName || "Scholar");
  const [learningStyle, setLearningStyle] = useState(userProfile?.learningStyle || "Visual");
  const [dailyTarget, setDailyTarget] = useState(userProfile?.dailyTarget || "30");
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const avatarStyles = [
    { value: "avataaars", label: "Avataaars (Human)" },
    { value: "bottts", label: "Bottts (Robots)" },
    { value: "pixel-art", label: "Pixel Art (Retro)" },
    { value: "identicon", label: "Identicon (Geometric)" },
    { value: "micah", label: "Micah (Minimalist)" },
  ];
  const learningStyles = ["Visual", "Auditory", "Reading / Writing", "Kinesthetic"];
  const studyTargets = [
    { value: "15", label: "15 Minutes (Casual)" },
    { value: "30", label: "30 Minutes (Regular)" },
    { value: "45", label: "45 Minutes (Dedicated)" },
    { value: "60", label: "60 Minutes (Intense)" },
  ];

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUpdating(true);
    setSuccess(false);
    try {
      await updateProfile(user, { displayName: name });
      await updateDoc(doc(db, "users", user.uid), {
        displayName: name,
        avatarStyle,
        avatarSeed,
        learningStyle,
        dailyTarget: parseInt(dailyTarget, 10) || 30,
      });
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
      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(user);
      router.push("/signup");
    } catch (err: any) {
      console.error("Failed to delete account:", err);
      alert("Security restriction: Please log out and log back in, then retry immediately.");
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-wider text-foreground uppercase flex items-center gap-3">
          <Settings className="text-primary w-6 h-6" />
          Account & Profile Settings
        </h1>
        <p className="text-muted-foreground text-xs mt-1">
          Manage your avatar, theme, preferences, study goals, and account credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-8">

          {/* ── Profile Form ─────────────────────────────── */}
          <Card className="p-6 border-border bg-card rounded-lg shadow-sm">
            <h3 className="text-xs font-mono uppercase tracking-widest text-primary font-bold border-b border-border/40 pb-3 mb-6 flex items-center gap-2">
              <User className="w-4 h-4" /> Student Profile
            </h3>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-muted-foreground text-[9px] font-mono uppercase tracking-widest">Full Name</Label>
                  <Input
                    id="displayName"
                    value={name}
                    onChange={(e) => { setName(e.target.value); if (avatarSeed === name || avatarSeed === "") setAvatarSeed(e.target.value); }}
                    className="bg-card border-border text-foreground focus-visible:ring-primary/20 focus-visible:border-primary h-11 rounded-md text-xs"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-muted-foreground text-[9px] font-mono uppercase tracking-widest">Email (Read-only)</Label>
                  <Input id="email" value={user?.email || ""} disabled className="bg-secondary/15 border-border text-muted-foreground cursor-not-allowed h-11 rounded-md text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-[9px] font-mono uppercase tracking-widest">Learning Style</Label>
                  <select value={learningStyle} onChange={(e) => setLearningStyle(e.target.value)} className="w-full bg-card border border-border text-foreground h-11 rounded-md text-xs px-3 focus-visible:outline-none focus:border-primary transition-all">
                    {learningStyles.map((s) => <option key={s} value={s} className="bg-card text-foreground">{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-[9px] font-mono uppercase tracking-widest">Daily Target</Label>
                  <select value={dailyTarget} onChange={(e) => setDailyTarget(e.target.value)} className="w-full bg-card border border-border text-foreground h-11 rounded-md text-xs px-3 focus-visible:outline-none focus:border-primary transition-all">
                    {studyTargets.map((t) => <option key={t.value} value={t.value} className="bg-card text-foreground">{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="pt-4 border-t border-border/40">
                <Button type="submit" disabled={updating} className="bg-primary text-primary-foreground hover:bg-primary/95 border border-primary/80 font-mono text-xs uppercase tracking-wider rounded-md px-6 h-11 cursor-pointer">
                  {updating ? "Saving..." : success ? "Saved ✓" : "Save Profile"}
                </Button>
              </div>
            </form>
          </Card>

          {/* ── Theme Picker ──────────────────────────────── */}
          <Card className="p-6 border-border bg-card rounded-lg shadow-sm">
            <h3 className="text-xs font-mono uppercase tracking-widest text-primary font-bold border-b border-border/40 pb-3 mb-6 flex items-center gap-2">
              <Palette className="w-4 h-4" /> Interface Theme
            </h3>
            <p className="text-xs text-muted-foreground mb-5">Choose a colour palette that matches your vibe. Changes apply instantly and are saved to your browser.</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {THEMES.map((t) => {
                const isActive = theme === t.id;
                return (
                  <motion.button
                    key={t.id}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setTheme(t.id as ThemeId)}
                    className={`relative p-3 rounded-lg border text-left transition-all cursor-pointer group ${
                      isActive
                        ? "border-primary shadow-[0_0_0_2px] shadow-primary/30"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    {/* Swatches */}
                    <div className="flex items-center gap-2 mb-2.5">
                      <span
                        className="w-7 h-7 rounded-md border border-black/10 shadow-inner shrink-0"
                        style={{ backgroundColor: t.swatches[0] }}
                      />
                      <span
                        className="w-7 h-7 rounded-md border border-black/10 shadow-inner shrink-0"
                        style={{ backgroundColor: t.swatches[1] }}
                      />
                      {isActive && (
                        <span className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-bold text-foreground leading-tight">{t.name}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5 leading-normal line-clamp-2">{t.description}</p>
                  </motion.button>
                );
              })}
            </div>
          </Card>

          {/* ── Danger Zone ──────────────────────────────── */}
          <Card className="p-6 border-destructive/30 bg-card rounded-lg shadow-sm">
            <h3 className="text-xs font-mono uppercase tracking-widest text-destructive font-bold border-b border-border/40 pb-3 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> Account Security & Danger Zone
            </h3>
            <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
              Once you delete your account, there is no going back. All syllabi, topic masteries, streaks, and XP will be permanently wiped.
            </p>
            <Button variant="outline" onClick={() => setShowDeleteModal(true)} className="border-destructive/40 text-destructive hover:bg-destructive/10 text-xs font-mono uppercase tracking-wider h-11 px-6 rounded-md cursor-pointer flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Delete Account
            </Button>
          </Card>
        </div>

        {/* Right column — Profile Photo */}
        <div className="space-y-6">
          <Card className="p-6 border-border bg-card rounded-lg relative overflow-hidden shadow-sm flex flex-col items-center text-center">
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/5 blur-xl pointer-events-none" />
            <h3 className="text-xs font-mono uppercase tracking-widest text-primary font-bold border-b border-border/40 pb-3 mb-6 w-full text-left flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Profile Photo
            </h3>

            <div className="w-28 h-28 rounded-full border border-primary/45 p-1 bg-card/50 relative overflow-hidden mb-3 shadow-inner flex items-center justify-center">
              <div className="w-full h-full bg-card rounded-full flex items-center justify-center overflow-hidden">
                <img
                  src={user?.photoURL ? user.photoURL : `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${avatarSeed || "User"}`}
                  alt="Profile Photo"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${avatarSeed || "User"}`; }}
                />
              </div>
            </div>

            {user?.photoURL ? (
              <div className="mb-5 flex items-center gap-1.5 bg-secondary/20 border border-border/50 rounded-md px-3 py-1.5">
                {user.providerData?.[0]?.providerId === "google.com" ? (
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                ) : user.providerData?.[0]?.providerId === "github.com" ? (
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                ) : <User className="w-3 h-3 text-primary" />}
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
                  {user.providerData?.[0]?.providerId === "google.com" ? "Google Account" : user.providerData?.[0]?.providerId === "github.com" ? "GitHub Account" : "Provider Photo"}
                </span>
              </div>
            ) : (
              <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-widest mb-5">No provider photo — using custom avatar</p>
            )}

            <div className="w-full space-y-4 text-left border-t border-border/40 pt-4">
              <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground font-bold">Custom Avatar (Fallback)</p>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-[9px] font-mono uppercase tracking-widest">Avatar Set</Label>
                <select value={avatarStyle} onChange={(e) => setAvatarStyle(e.target.value)} className="w-full bg-card border border-border text-foreground h-10 rounded-md text-xs px-3 focus-visible:outline-none focus:border-primary transition-all">
                  {avatarStyles.map((s) => <option key={s.value} value={s.value} className="bg-card text-foreground">{s.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatarSeed" className="text-muted-foreground text-[9px] font-mono uppercase tracking-widest">Seed / Keyphrase</Label>
                <Input id="avatarSeed" value={avatarSeed} onChange={(e) => setAvatarSeed(e.target.value)} placeholder="e.g. PixelBoy" className="bg-card border-border text-foreground focus-visible:ring-primary/20 focus-visible:border-primary h-10 rounded-md text-xs" />
                <span className="text-[8px] text-muted-foreground leading-normal block uppercase tracking-wider">Change the seed to randomize your avatar character.</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-neutral-950/70 z-50 flex items-center justify-center px-4 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card border border-destructive/30 rounded-lg p-6 max-w-md w-full space-y-6 text-center shadow-lg"
          >
            <div className="w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center text-destructive mx-auto border border-destructive/20 mb-2">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-foreground">Confirm Account Deletion</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Type <strong className="text-destructive font-mono uppercase font-bold tracking-wider">DELETE MY ACCOUNT</strong> to confirm.
              </p>
            </div>
            <div className="space-y-2 text-left">
              <Label className="text-muted-foreground text-[8px] font-mono uppercase tracking-widest">Verification Prompt</Label>
              <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE MY ACCOUNT" className="bg-card border-border text-foreground focus-visible:ring-destructive/20 focus-visible:border-destructive h-11 rounded-md text-xs text-center" />
            </div>
            <div className="flex gap-4 pt-2">
              <Button variant="outline" onClick={() => { setShowDeleteModal(false); setConfirmText(""); }} className="flex-1 border-border text-foreground hover:bg-secondary/15 h-11 text-xs uppercase font-mono tracking-wider">Cancel</Button>
              <Button onClick={handleDeleteAccount} disabled={confirmText !== "DELETE MY ACCOUNT" || deleting} className="flex-1 bg-destructive hover:bg-destructive/90 text-white border border-destructive h-11 text-xs uppercase font-mono tracking-wider cursor-pointer">
                {deleting ? "Deleting..." : "Confirm Delete"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
