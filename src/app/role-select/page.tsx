"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Brain, BookOpen, Users } from "lucide-react";
import Link from "next/link";

export default function RoleSelectPage() {
  const { user, loading, role, setRole } = useAuth();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already has a role
  if (!loading && role) {
    router.push("/dashboard");
    return null;
  }

  // Redirect if not authenticated
  if (!loading && !user) {
    router.push("/login");
    return null;
  }

  const handleRoleSelect = async (newRole: 'student' | 'teacher') => {
    setSelectedRole(newRole);
    setIsSubmitting(true);
    try {
      await setRole(newRole);
      router.push("/dashboard");
    } catch (err) {
      console.error("Error setting role:", err);
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center text-muted-foreground animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground relative overflow-hidden px-4">
      {/* Background Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[130px] rounded-full pointer-events-none" />

      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2.5 hover:opacity-80 transition-opacity z-20">
        <div className="p-1.5 bg-primary/5 border border-primary/30 rounded-lg">
          <Brain className="w-5 h-5 text-primary" />
        </div>
        <span className="text-sm font-bold tracking-widest uppercase text-primary">ARISE</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl z-10 relative"
      >
        <div className="text-center mb-12">
          <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-foreground">Welcome to ARISE, {user?.displayName}!</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Choose your role to get started. You can change this later in settings.</p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Student Card */}
          <motion.div
            whileHover={{ scale: selectedRole === 'student' ? 1 : 1.02 }}
            onClick={() => !isSubmitting && handleRoleSelect('student')}
            className={`p-8 rounded-lg border-2 cursor-pointer transition-all ${
              selectedRole === 'student'
                ? 'border-primary bg-primary/10 shadow-lg'
                : 'border-border bg-card hover:border-primary/50 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-primary/10 mb-4 mx-auto">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-center mb-2 text-foreground">Student</h2>
            <p className="text-muted-foreground text-sm text-center mb-6">
              Access personalized learning roadmaps, take quizzes, track progress, and join study squads.
            </p>
            <ul className="space-y-2 text-xs text-muted-foreground mb-6">
              <li>✓ Custom learning paths</li>
              <li>✓ AI-powered quizzes</li>
              <li>✓ Progress tracking</li>
              <li>✓ Leaderboards</li>
              <li>✓ Join study squads</li>
            </ul>
            {selectedRole === 'student' && !isSubmitting && (
              <Button disabled className="w-full bg-primary text-primary-foreground">
                Selected
              </Button>
            )}
            {selectedRole === 'student' && isSubmitting && (
              <Button disabled className="w-full bg-primary text-primary-foreground animate-pulse">
                Setting up...
              </Button>
            )}
            {selectedRole !== 'student' && (
              <Button 
                onClick={() => handleRoleSelect('student')}
                disabled={isSubmitting}
                className="w-full border border-border hover:border-primary/50 hover:bg-primary/5"
                variant="outline"
              >
                Continue as Student
              </Button>
            )}
          </motion.div>

          {/* Teacher Card */}
          <motion.div
            whileHover={{ scale: selectedRole === 'teacher' ? 1 : 1.02 }}
            onClick={() => !isSubmitting && handleRoleSelect('teacher')}
            className={`p-8 rounded-lg border-2 cursor-pointer transition-all ${
              selectedRole === 'teacher'
                ? 'border-primary bg-primary/10 shadow-lg'
                : 'border-border bg-card hover:border-primary/50 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-primary/10 mb-4 mx-auto">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-center mb-2 text-foreground">Teacher</h2>
            <p className="text-muted-foreground text-sm text-center mb-6">
              Create and manage classroom squads, generate AI syllabuses, and track student progress.
            </p>
            <ul className="space-y-2 text-xs text-muted-foreground mb-6">
              <li>✓ Classroom management</li>
              <li>✓ Generate AI content</li>
              <li>✓ Student progress tracking</li>
              <li>✓ Squad analytics</li>
              <li>✓ Distribute assignments</li>
            </ul>
            {selectedRole === 'teacher' && !isSubmitting && (
              <Button disabled className="w-full bg-primary text-primary-foreground">
                Selected
              </Button>
            )}
            {selectedRole === 'teacher' && isSubmitting && (
              <Button disabled className="w-full bg-primary text-primary-foreground animate-pulse">
                Setting up...
              </Button>
            )}
            {selectedRole !== 'teacher' && (
              <Button 
                onClick={() => handleRoleSelect('teacher')}
                disabled={isSubmitting}
                className="w-full border border-border hover:border-primary/50 hover:bg-primary/5"
                variant="outline"
              >
                Continue as Teacher
              </Button>
            )}
          </motion.div>
        </div>

        <p className="text-center text-muted-foreground text-xs mt-8">
          You can always change your role in your account settings later.
        </p>
      </motion.div>
    </div>
  );
}
