"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Brain, FileText, Table, Network, Download } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface LearningAidsProps {
  topicTitle: string;
  moduleTitle: string;
  topicId: string;
  moduleId: string;
}

export function LearningAids({ topicTitle, moduleTitle, topicId, moduleId }: LearningAidsProps) {
  const { user } = useAuth();
  const [aidContent, setAidContent] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeAid, setActiveAid] = useState<string | null>(null);

  const generateAid = async (aidType: string) => {
    if (!user) return;
    setIsGenerating(true);
    setActiveAid(aidType);
    setAidContent(null);
    try {
      // Create a URL safe ID for the aid document
      const aidDocId = aidType.replace(/\s+/g, "_").toLowerCase();
      const aidRef = doc(db, "users", user.uid, "topics", topicId, "modules", moduleId, "aids", aidDocId);
      const aidSnap = await getDoc(aidRef);

      if (aidSnap.exists()) {
        setAidContent(aidSnap.data().content);
        setIsGenerating(false);
        return;
      }

      const res = await fetch("/api/learning-aids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicTitle, moduleTitle, aidType })
      });
      if (!res.ok) throw new Error("Failed to generate aid");
      const data = await res.json();
      
      await setDoc(aidRef, { content: data.content });
      setAidContent(data.content);
    } catch (err) {
      console.error(err);
      setAidContent("Failed to generate the learning aid. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!aidContent) return;
    const blob = new Blob([aidContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${moduleTitle.replace(/\s+/g, "_")}_${activeAid}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#FAF9F6] border border-slate-200/60 rounded-2xl p-6 mt-6 shadow-sm">
      <h3 className="font-bold text-sm flex items-center gap-2 mb-4 text-slate-700 uppercase tracking-wider">
        <Brain className="w-4 h-4 text-indigo-500" />
        Generate Learning Aids
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Button 
          variant="outline" 
          onClick={() => generateAid("Cheat Sheet")}
          className={`bg-white border-slate-200 hover:bg-slate-50 transition-all font-semibold text-xs h-10 ${activeAid === "Cheat Sheet" ? "border-cyan-500 text-cyan-600 bg-cyan-50 shadow-[0_0_10px_rgba(34,211,238,0.1)]" : "text-slate-600"}`}
        >
          <FileText className="w-4 h-4 mr-2" /> Cheat Sheet
        </Button>
        <Button 
          variant="outline" 
          onClick={() => generateAid("Summary Table")}
          className={`bg-white border-slate-200 hover:bg-slate-50 transition-all font-semibold text-xs h-10 ${activeAid === "Summary Table" ? "border-purple-500 text-purple-600 bg-purple-50 shadow-[0_0_10px_rgba(168,85,247,0.1)]" : "text-slate-600"}`}
        >
          <Table className="w-4 h-4 mr-2" /> Summary Table
        </Button>
        <Button 
          variant="outline" 
          onClick={() => generateAid("Concept Map")}
          className={`bg-white border-slate-200 hover:bg-slate-50 transition-all font-semibold text-xs h-10 ${activeAid === "Concept Map" ? "border-pink-500 text-pink-600 bg-pink-50 shadow-[0_0_10px_rgba(236,72,153,0.1)]" : "text-slate-600"}`}
        >
          <Network className="w-4 h-4 mr-2" /> Concept Map
        </Button>
      </div>

      {isGenerating && (
        <div className="text-center py-8">
          <Brain className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-500">AI is drafting your {activeAid}...</p>
        </div>
      )}

      {aidContent && !isGenerating && (
        <div className="relative bg-white border border-slate-200/80 shadow-inner rounded-xl p-5 mt-4">
          <Button 
            onClick={handleDownload} 
            size="icon" 
            variant="ghost" 
            className="absolute top-2 right-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
          >
            <Download className="w-4 h-4" />
          </Button>
          <pre className="text-[11px] text-slate-700 font-mono whitespace-pre-wrap overflow-x-auto max-h-80 overflow-y-auto leading-relaxed pt-2">
            {aidContent}
          </pre>
        </div>
      )}
    </div>
  );
}
