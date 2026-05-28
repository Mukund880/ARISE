"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { AriseMascot } from "@/components/AriseMascot";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground relative overflow-hidden px-4">
      {/* Background Glow */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[130px] rounded-full pointer-events-none" />

      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2.5 hover:opacity-80 transition-opacity z-20 group">
        <div className="p-1.5 bg-primary/5 border border-primary/30 rounded-lg">
          <Brain className="w-5 h-5 text-primary" />
        </div>
        <span className="text-sm font-bold tracking-widest uppercase text-primary">ARISE</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 rounded-lg bg-card border border-border backdrop-blur-md shadow-sm z-10 relative"
      >
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-24 h-24 flex items-center justify-center bg-card rounded-full border border-border p-2 shadow-sm">
          <AriseMascot size={70} state="wave" interactive={false} />
        </div>

        <div className="text-center mb-8 mt-6">
          <h2 className="text-xl font-bold mb-1 text-foreground">Create Account</h2>
          <p className="text-muted-foreground text-xs">Join ARISE to get custom roadmaps & gamified study aids.</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-muted-foreground text-[9px] font-mono uppercase tracking-widest">Full Name</Label>
            <Input 
              id="name" 
              type="text" 
              placeholder="Alex Chen" 
              className="bg-card border-border text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/20 focus-visible:border-primary h-12 rounded-md transition-all text-xs"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-muted-foreground text-[9px] font-mono uppercase tracking-widest">Email Address</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="alex@university.edu" 
              className="bg-card border-border text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/20 focus-visible:border-primary h-12 rounded-md transition-all text-xs"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-muted-foreground text-[9px] font-mono uppercase tracking-widest">Password</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="Min. 8 characters" 
              className="bg-card border-border text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/20 focus-visible:border-primary h-12 rounded-md transition-all text-xs"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/95 border border-primary/80 font-mono text-xs uppercase tracking-wider rounded-md transition-all cursor-pointer">
            {loading ? "Creating Account..." : "Create Free Account"}
          </Button>
        </form>

        <div className="mt-6 flex items-center justify-center space-x-3">
          <div className="flex-1 h-px bg-border/50" />
          <span className="text-[9px] text-muted-foreground font-mono uppercase tracking-wider">Or sign up with</span>
          <div className="flex-1 h-px bg-border/50" />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <Button 
            variant="outline" 
            onClick={handleGoogleSignIn}
            className="h-11 border-border bg-card hover:bg-secondary/15 rounded-md text-xs font-mono uppercase tracking-wider text-foreground"
          >
            Google
          </Button>
          <Button 
            variant="outline" 
            className="h-11 border-border bg-card hover:bg-secondary/15 rounded-md text-xs font-mono uppercase tracking-wider text-foreground"
          >
            GitHub
          </Button>
        </div>

        <p className="text-center text-muted-foreground text-xs mt-8">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline font-bold transition-colors">
            Log in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
