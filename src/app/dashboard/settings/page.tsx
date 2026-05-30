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
import { Settings, User, Trash2, Sparkles, ShieldAlert, Palette, Check, LifeBuoy, HelpCircle } from "lucide-react";
import { updateProfile, deleteUser } from "firebase/auth";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const { user, userProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"profile" | "theme" | "support">("profile");

  const [name, setName] = useState(user?.displayName || "");
  const [avatarStyle, setAvatarStyle] = useState(userProfile?.avatarStyle || "avataaars");
  const [avatarSeed, setAvatarSeed] = useState(userProfile?.avatarSeed || user?.displayName || "Scholar");
  
  const isCustomPhoto = user?.photoURL?.startsWith("/profile-pics/") || false;
  const [photoType, setPhotoType] = useState<"default" | "custom">(isCustomPhoto ? "custom" : "default");
  
  const initialCustomPhoto = isCustomPhoto 
    ? user?.photoURL?.replace("/profile-pics/", "") || "1.png" 
    : "1.png";
  const [selectedCustomPhoto, setSelectedCustomPhoto] = useState<string>(initialCustomPhoto);

  const customPhotos = [
    "1.png", "2.png", "3.png", "4.png", "5.png", "6,png.png", "7.png", "8.png", "9.png", "10.png",
    "11.png", "12.png", "13.png", "14.png", "15.png", "16.png", "17.png", "18.png", "19.png", "20.png",
    "21.png", "22.png"
  ];

  const [learningStyle, setLearningStyle] = useState(userProfile?.learningStyle || "Visual");
  const [dailyTarget, setDailyTarget] = useState(userProfile?.dailyTarget || "30");
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Support desk state
  const [supportQuery, setSupportQuery] = useState("");
  const [submittingSupport, setSubmittingSupport] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState(false);

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
      const updatedPhotoURL = photoType === "custom" ? `/profile-pics/${selectedCustomPhoto}` : "";
      await updateProfile(user, { 
        displayName: name,
        photoURL: updatedPhotoURL
      });
      await updateDoc(doc(db, "users", user.uid), {
        displayName: name,
        photoURL: updatedPhotoURL,
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

  const handleSendSupportQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportQuery.trim()) return;
    setSubmittingSupport(true);
    try {
      // Simulate sending support request
      await new Promise((r) => setTimeout(r, 1200));
      setSupportSuccess(true);
      setSupportQuery("");
      setTimeout(() => setSupportSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingSupport(false);
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

  const previewPhotoUrl = photoType === "custom"
    ? `/profile-pics/${selectedCustomPhoto}`
    : `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${avatarSeed || "User"}`;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-wider text-foreground uppercase flex items-center gap-3">
            <Settings className="text-primary w-6 h-6" />
            Account & Preferences
          </h1>
          <p className="text-muted-foreground text-xs mt-1">
            Configure your avatar, layout themes, daily targets, and access support tools.
          </p>
        </div>

        {/* Settings Navigation Tabs */}
        <div className="flex bg-secondary/15 p-1 rounded-lg border border-border max-w-sm shrink-0">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 py-1.5 px-3.5 text-[10px] font-mono uppercase tracking-wider rounded transition-all cursor-pointer ${
              activeTab === "profile"
                ? "bg-primary text-primary-foreground font-bold shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab("theme")}
            className={`flex-1 py-1.5 px-3.5 text-[10px] font-mono uppercase tracking-wider rounded transition-all cursor-pointer ${
              activeTab === "theme"
                ? "bg-primary text-primary-foreground font-bold shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Theme
          </button>
          <button
            onClick={() => setActiveTab("support")}
            className={`flex-1 py-1.5 px-3.5 text-[10px] font-mono uppercase tracking-wider rounded transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === "support"
                ? "bg-primary text-primary-foreground font-bold shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LifeBuoy className="w-3 h-3" /> Support
          </button>
        </div>
      </div>

      {activeTab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-8">
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
                    src={previewPhotoUrl}
                    alt="Profile Photo"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => { 
                      if (photoType === "default") {
                        (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${avatarSeed || "User"}`; 
                      }
                    }}
                  />
                </div>
              </div>

              {photoType === "custom" ? (
                <div className="mb-5 flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-md px-3 py-1.5 text-primary">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest">
                    Custom Photo: {selectedCustomPhoto}
                  </span>
                </div>
              ) : (
                <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-widest mb-5">Using Generative Avatar</p>
              )}

              {/* Photo Options Toggle Selector */}
              <div className="flex bg-secondary/15 p-1 rounded-lg border border-border w-full mb-5 shrink-0">
                <button
                  type="button"
                  onClick={() => setPhotoType("default")}
                  className={`flex-1 py-1.5 text-[9px] font-mono uppercase tracking-wider rounded transition-all cursor-pointer ${
                    photoType === "default"
                      ? "bg-primary text-primary-foreground font-bold shadow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Default (Avatar)
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoType("custom")}
                  className={`flex-1 py-1.5 text-[9px] font-mono uppercase tracking-wider rounded transition-all cursor-pointer ${
                    photoType === "custom"
                      ? "bg-primary text-primary-foreground font-bold shadow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Custom Photo
                </button>
              </div>

              {photoType === "default" ? (
                <div className="w-full space-y-4 text-left border-t border-border/40 pt-4 animate-in fade-in duration-300">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground font-bold">Generative Avatar</p>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-[9px] font-mono uppercase tracking-widest">Avatar Set</Label>
                    <select value={avatarStyle} onChange={(e) => setAvatarStyle(e.target.value)} className="w-full bg-card border border-border text-foreground h-10 rounded-md text-xs px-3 focus-visible:outline-none focus:border-primary transition-all">
                      {avatarStyles.map((s) => <option key={s.value} value={s.value} className="bg-card text-foreground">{s.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="avatarSeed" className="text-muted-foreground text-[9px] font-mono uppercase tracking-widest">Seed Keyphrase</Label>
                    <Input id="avatarSeed" value={avatarSeed} onChange={(e) => setAvatarSeed(e.target.value)} placeholder="e.g. PixelBoy" className="bg-card border-border text-foreground focus-visible:ring-primary/20 focus-visible:border-primary h-10 rounded-md text-xs" />
                  </div>
                </div>
              ) : (
                <div className="w-full space-y-4 text-left border-t border-border/40 pt-4 animate-in fade-in duration-300">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground font-bold mb-2">Choose Custom Photo</p>
                  <div className="grid grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1.5 rounded-lg border border-border bg-secondary/5 shadow-inner scrollbar-thin">
                    {customPhotos.map((photoName) => {
                      const isSelected = selectedCustomPhoto === photoName;
                      return (
                        <button
                          key={photoName}
                          type="button"
                          onClick={() => setSelectedCustomPhoto(photoName)}
                          className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 active:scale-95 cursor-pointer shadow-sm hover:scale-105 ${
                            isSelected
                              ? "border-primary bg-primary/5 shadow-md scale-105"
                              : "border-border hover:border-primary/40 bg-card"
                          }`}
                        >
                          <img
                            src={`/profile-pics/${photoName}`}
                            alt={photoName}
                            className="w-full h-full object-cover"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow">
                                <Check className="w-3 h-3 text-primary-foreground font-bold" />
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {activeTab === "theme" && (
        <Card className="p-6 border-border bg-card rounded-lg shadow-sm">
          <h3 className="text-xs font-mono uppercase tracking-widest text-primary font-bold border-b border-border/40 pb-3 mb-6 flex items-center gap-2">
            <Palette className="w-4 h-4" /> Interface Theme
          </h3>
          <p className="text-xs text-muted-foreground mb-6 leading-relaxed">Choose a custom color palette. Your selection applies instantly and is persisted in local storage.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {THEMES.map((t) => {
              const isActive = theme === t.id;
              return (
                <motion.button
                  key={t.id}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setTheme(t.id as ThemeId)}
                  className={`relative p-4 rounded-xl border text-left transition-all cursor-pointer group ${
                    isActive
                      ? "border-primary bg-primary/[0.02] shadow-[0_0_0_2px] shadow-primary/30"
                      : "border-border hover:border-primary/45 bg-card"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-7 h-7 rounded-lg border border-black/10 shadow-inner shrink-0" style={{ backgroundColor: t.swatches[0] }} />
                    <span className="w-7 h-7 rounded-lg border border-black/10 shadow-inner shrink-0" style={{ backgroundColor: t.swatches[1] }} />
                    {isActive && (
                      <span className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-foreground leading-tight">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-normal">{t.description}</p>
                </motion.button>
              );
            })}
          </div>
        </Card>
      )}

      {activeTab === "support" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* FAQ Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 border-border bg-card rounded-lg shadow-sm">
              <h3 className="text-xs font-mono uppercase tracking-widest text-primary font-bold border-b border-border/40 pb-3 mb-6 flex items-center gap-2">
                <HelpCircle className="w-4 h-4" /> Frequently Asked Questions
              </h3>

              <div className="space-y-6 divide-y divide-border/30">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-foreground">How does the AI syllabus generator work?</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    ARISE processes the topics you enter and any reference notes you upload to draft fully structured chapter modules, lesson explanations, and understanding check quizzes custom tailored to your knowledge level.
                  </p>
                </div>
                
                <div className="space-y-2 pt-4">
                  <h4 className="text-xs font-bold text-foreground">How do I maintain my study streak?</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Log in every day and complete a learning module or answer the Daily Challenge question on the main dashboard to keep your streak burning. Missing a day will reset your streak to 1.
                  </p>
                </div>

                <div className="space-y-2 pt-4">
                  <h4 className="text-xs font-bold text-foreground">How do I collaborate in Classroom Squads?</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Click the "Squads" tab on the sidebar/topbar. You can join a squad by entering the invite code shared by your teacher, or create your own squad if you are registered as an instructor.
                  </p>
                </div>

                <div className="space-y-2 pt-4">
                  <h4 className="text-xs font-bold text-foreground">How are Grand Tests unlocked?</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Once you complete all sequential study modules in a learning topic, the grand final test for that syllabus unlocks. Completing this test earns massive bonus XP and marks the topic as mastered.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Support Ticket Section */}
          <div>
            <Card className="p-6 border-border bg-card rounded-lg shadow-sm relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/5 blur-xl pointer-events-none" />
              <h3 className="text-xs font-mono uppercase tracking-widest text-primary font-bold border-b border-border/40 pb-3 mb-6 flex items-center gap-2">
                <LifeBuoy className="w-4 h-4" /> Help Desk Query
              </h3>

              <form onSubmit={handleSendSupportQuery} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-[8px] font-mono uppercase tracking-widest">User Name</Label>
                  <Input value={user?.displayName || "Scholar"} disabled className="bg-secondary/15 border-border text-muted-foreground cursor-not-allowed h-10 rounded-md text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="supportMessage" className="text-muted-foreground text-[8px] font-mono uppercase tracking-widest">How can we help?</Label>
                  <textarea
                    id="supportMessage"
                    required
                    value={supportQuery}
                    onChange={(e) => setSupportQuery(e.target.value)}
                    placeholder="Describe your issue or question..."
                    className="w-full min-h-[120px] bg-card border border-border rounded-md p-3 text-xs focus:outline-none focus:border-primary transition-all text-foreground leading-relaxed"
                  />
                </div>

                {supportSuccess && (
                  <p className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-wider">
                    Query submitted successfully! We'll reply shortly.
                  </p>
                )}

                <Button 
                  type="submit" 
                  disabled={submittingSupport || !supportQuery.trim()} 
                  className="w-full h-11 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest disabled:opacity-50 cursor-pointer"
                >
                  {submittingSupport ? "Sending query..." : "Submit Help Ticket"}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      )}

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
