"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Brain } from "lucide-react";
import { AITutorChat } from "@/components/AITutorChat";
import { MascotProvider } from "@/context/MascotContext";
import { motion } from "framer-motion";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] text-slate-800 flex items-center justify-center">
        <Brain className="w-12 h-12 animate-pulse text-indigo-500" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <MascotProvider>
      <div className="min-h-screen bg-[#FDFBF7] text-slate-800 flex">
        {/* Background static gradients */}
        <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-400/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-400/5 blur-[120px] rounded-full pointer-events-none" />

        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        
        <motion.div
          animate={{ marginLeft: isCollapsed ? 64 : 256 }}
          transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          className="flex-1 flex flex-col min-h-screen relative z-10"
        >
          <Topbar />
          <main className="flex-1 p-8 overflow-y-auto">
            {children}
          </main>
        </motion.div>

        <AITutorChat />
      </div>
    </MascotProvider>
  );
}
