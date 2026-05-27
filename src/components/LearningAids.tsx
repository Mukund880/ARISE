"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Brain, FileText, Table, Network, Download } from "lucide-react";

interface LearningAidsProps {
  topicTitle: string;
  moduleTitle: string;
}

export function LearningAids({ topicTitle, moduleTitle }: LearningAidsProps) {
  const [aidContent, setAidContent] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeAid, setActiveAid] = useState<string | null>(null);

  const generateAid = async (aidType: string) => {
    setIsGenerating(true);
    setActiveAid(aidType);
    setAidContent(null);
    try {
      const res = await fetch("/api/learning-aids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicTitle, moduleTitle, aidType })
      });
      if (!res.ok) throw new Error("Failed to generate aid");
      const data = await res.json();
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
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mt-6">
      <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-purple-400" />
        Generate Learning Aids
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Button 
          variant="outline" 
          onClick={() => generateAid("Cheat Sheet")}
          className={`bg-white/5 border-white/10 hover:bg-white/10 ${activeAid === "Cheat Sheet" ? "border-cyan-500 text-cyan-400" : ""}`}
        >
          <FileText className="w-4 h-4 mr-2" /> Cheat Sheet
        </Button>
        <Button 
          variant="outline" 
          onClick={() => generateAid("Summary Table")}
          className={`bg-white/5 border-white/10 hover:bg-white/10 ${activeAid === "Summary Table" ? "border-purple-500 text-purple-400" : ""}`}
        >
          <Table className="w-4 h-4 mr-2" /> Summary Table
        </Button>
        <Button 
          variant="outline" 
          onClick={() => generateAid("Mind Map (Text)")}
          className={`bg-white/5 border-white/10 hover:bg-white/10 ${activeAid === "Mind Map (Text)" ? "border-pink-500 text-pink-400" : ""}`}
        >
          <Network className="w-4 h-4 mr-2" /> Concept Map
        </Button>
      </div>

      {isGenerating && (
        <div className="text-center py-8">
          <Brain className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-400">AI is drafting your {activeAid}...</p>
        </div>
      )}

      {aidContent && !isGenerating && (
        <div className="relative bg-black/40 border border-white/5 rounded-xl p-4 mt-4">
          <Button 
            onClick={handleDownload} 
            size="icon" 
            variant="ghost" 
            className="absolute top-2 right-2 hover:bg-white/10 text-gray-400 hover:text-white"
          >
            <Download className="w-4 h-4" />
          </Button>
          <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap overflow-x-auto max-h-64 overflow-y-auto">
            {aidContent}
          </pre>
        </div>
      )}
    </div>
  );
}
