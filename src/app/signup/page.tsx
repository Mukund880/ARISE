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
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] text-slate-800 relative overflow-hidden px-4">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-pink-200/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-200/20 blur-[130px] rounded-full pointer-events-none" />

      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2.5 hover:opacity-80 transition-opacity z-20 group">
        <div className="p-1.5 bg-gradient-to-tr from-indigo-500 to-cyan-500 rounded-lg">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-black tracking-wider uppercase text-slate-800">ARISE</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 rounded-3xl bg-white/80 border border-slate-200/60 backdrop-blur-xl shadow-xl z-10 relative"
      >
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-24 h-24 flex items-center justify-center bg-[#FAF9F6] rounded-full border border-slate-200/50 p-2 shadow-md">
          <AriseMascot size={70} state="wave" interactive={false} />
        </div>

        <div className="text-center mb-8 mt-6">
          <h2 className="text-2xl font-black mb-1 text-slate-800">Create Account</h2>
          <p className="text-slate-500 text-xs">Join ARISE to get custom roadmaps & gamified study aids.</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-600 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-600 text-xs font-bold uppercase tracking-wider">Full Name</Label>
            <Input 
              id="name" 
              type="text" 
              placeholder="Alex Chen" 
              className="bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 h-12 rounded-xl transition-all"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-600 text-xs font-bold uppercase tracking-wider">Email Address</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="alex@university.edu" 
              className="bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 h-12 rounded-xl transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-600 text-xs font-bold uppercase tracking-wider">Password</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="Min. 8 characters" 
              className="bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 h-12 rounded-xl transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full h-12 bg-indigo-600 hover:bg-indigo-755 text-white font-bold text-sm rounded-xl active:scale-[0.98] transition-transform arbuttonchunky">
            {loading ? "Creating Account..." : "Create Free Account"}
          </Button>
        </form>

        <div className="mt-6 flex items-center justify-center space-x-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Or sign up with</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <Button 
            variant="outline" 
            onClick={handleGoogleSignIn}
            className="h-11 border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold transition-all hover:border-indigo-200 text-slate-700"
          >
            Google
          </Button>
          <Button 
            variant="outline" 
            className="h-11 border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold transition-all hover:border-indigo-200 text-slate-700"
          >
            GitHub
          </Button>
        </div>

        <p className="text-center text-slate-500 text-xs mt-8">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-600 hover:text-indigo-500 font-bold transition-colors">
            Log in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
