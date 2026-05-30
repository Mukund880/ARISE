"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Brain, FileText, Table, Network, Download, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

// Inline YouTube Icon SVG to avoid import conflicts on older Lucide-React packages
function YoutubeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
    </svg>
  );
}

interface TreeNode {
  text: string;
  children: TreeNode[];
}

function parseIndentedTree(text: string): TreeNode[] {
  const lines = text.split("\n").filter(l => l.trim().length > 0);
  const roots: TreeNode[] = [];
  const stack: { node: TreeNode; indent: number }[] = [];

  lines.forEach(line => {
    const match = line.match(/^(\s*)[-*+•]?\s*(.*)$/);
    if (!match) return;
    const indent = match[1].length;
    const content = match[2].trim();
    if (!content) return;

    const node: TreeNode = { text: content, children: [] };

    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    if (stack.length === 0) {
      roots.push(node);
    } else {
      stack[stack.length - 1].node.children.push(node);
    }

    stack.push({ node, indent });
  });

  return roots;
}

function parseMarkdownTable(text: string) {
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  const tableLines = lines.filter(line => line.startsWith("|") && line.endsWith("|"));
  if (tableLines.length < 2) return null;

  const rows = tableLines.map(line => {
    return line.split("|").slice(1, -1).map(c => c.trim());
  });

  const hasSeparator = rows[1]?.every(cell => /^:?-+:?$/.test(cell));
  const headerRow = rows[0];
  const dataRows = hasSeparator ? rows.slice(2) : rows.slice(1);

  return {
    headers: headerRow,
    rows: dataRows
  };
}

function ConceptTreeNode({ node, depth = 0 }: { node: TreeNode; depth: number }) {
  return (
    <div className="flex flex-col items-center relative">
      <div className={`relative px-4 py-2.5 rounded-2xl border transition-all duration-300 hover:scale-105 shadow-sm text-center font-bold tracking-tight select-none max-w-xs ${
        depth === 0 
          ? "bg-indigo-600 border-indigo-700 text-white text-xs font-black shadow-lg shadow-indigo-100" 
          : depth === 1 
            ? "bg-cyan-50 border-cyan-200 text-cyan-700 text-xs font-extrabold"
            : depth === 2
              ? "bg-purple-50 border-purple-200 text-purple-700 text-[11px] font-bold"
              : "bg-slate-50 border-slate-200 text-slate-650 text-[10px]"
      }`}>
        {node.text}
      </div>

      {node.children.length > 0 && (
        <div className="flex flex-col items-center mt-4 w-full">
          <div className="w-0.5 h-5 bg-slate-250 bg-slate-200" />
          <div className="flex flex-wrap justify-center gap-6 relative w-full pt-4 border-t border-dashed border-slate-200">
            {node.children.map((child, i) => (
              <ConceptTreeNode key={i} node={child} depth={depth + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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
  
  // YouTube Data API states
  const [videos, setVideos] = useState<any[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);

  const generateAid = async (aidType: string) => {
    if (!user) return;
    setIsGenerating(true);
    setActiveAid(aidType);
    setAidContent(null);
    setVideos([]);
    try {
      // Create a URL safe ID for the aid document
      const aidDocId = aidType.replace(/\s+/g, "_").toLowerCase();
      const aidRef = doc(db, "users", user.uid, "topics", topicId, "modules", String(moduleId), "aids", aidDocId);
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

  const fetchYoutubeVideos = async () => {
    setLoadingVideos(true);
    setActiveAid("Video Tutorials");
    setAidContent(null);
    setVideos([]);
    try {
      const res = await fetch(`/api/youtube?query=${encodeURIComponent(topicTitle + " " + moduleTitle)}`);
      if (!res.ok) throw new Error("Failed to fetch videos");
      const data = await res.json();
      setVideos(data.videos || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingVideos(false);
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
        Generate Learning Aids & Resources
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
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
        <Button 
          variant="outline" 
          onClick={fetchYoutubeVideos}
          className={`bg-white border-slate-200 hover:bg-slate-50 transition-all font-semibold text-xs h-10 ${activeAid === "Video Tutorials" ? "border-amber-500 text-amber-600 bg-amber-50 shadow-[0_0_10px_rgba(245,158,11,0.1)]" : "text-slate-600"}`}
        >
          <YoutubeIcon className="w-4 h-4 mr-2 text-rose-500 fill-rose-500" /> Video Guide
        </Button>
      </div>

      {isGenerating && (
        <div className="text-center py-8">
          <Brain className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-500">AI is drafting your {activeAid}...</p>
        </div>
      )}

      {loadingVideos && (
        <div className="text-center py-8">
          <YoutubeIcon className="w-8 h-8 text-rose-400 animate-pulse mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-500">Retrieving YouTube video tutorials...</p>
        </div>
      )}

      {aidContent && !isGenerating && (() => {
        const parsedTable = activeAid === "Summary Table" ? parseMarkdownTable(aidContent) : null;
        const parsedTree = activeAid === "Concept Map" ? parseIndentedTree(aidContent) : null;
        
        return (
          <div className="relative bg-white border border-slate-200/80 shadow-inner rounded-xl p-5 mt-4">
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
              <Button 
                onClick={handleDownload} 
                size="icon" 
                variant="ghost" 
                className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 h-8 w-8 rounded-lg"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button 
                onClick={() => {
                  setAidContent(null);
                  setActiveAid(null);
                }} 
                size="icon" 
                variant="ghost" 
                className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 h-8 w-8 rounded-lg"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="pt-6">
              {activeAid === "Concept Map" && parsedTree && parsedTree.length > 0 ? (
                <div className="w-full overflow-x-auto py-6 flex flex-col items-center bg-[#FAF9F6] rounded-2xl border border-slate-200/40 p-6 shadow-inner min-h-[300px]">
                  <div className="flex flex-wrap justify-center gap-12 items-start w-full">
                    {parsedTree.map((root, i) => (
                      <ConceptTreeNode key={i} node={root} depth={0} />
                    ))}
                  </div>
                </div>
              ) : activeAid === "Summary Table" && parsedTable ? (
                <div className="w-full overflow-x-auto rounded-xl border border-slate-200/80 shadow-sm bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200/85">
                        {parsedTable.headers.map((header, i) => (
                          <th key={i} className="py-3 px-4 font-black text-slate-700 uppercase tracking-wider border-r border-slate-200/40 last:border-r-0">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedTable.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 odd:bg-[#FAF9F6]/20 transition-colors">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="py-3.5 px-4 text-slate-655 font-semibold leading-relaxed border-r border-slate-200/30 last:border-r-0">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <pre className="text-[11px] text-slate-700 font-mono whitespace-pre-wrap overflow-x-auto max-h-80 overflow-y-auto leading-relaxed font-semibold">
                  {aidContent}
                </pre>
              )}
            </div>
          </div>
        );
      })()}

      {videos.length > 0 && !loadingVideos && (
        <div className="relative mt-4">
          <div className="flex justify-end mb-3">
            <Button
              onClick={() => {
                setVideos([]);
                setActiveAid(null);
              }}
              size="sm"
              variant="outline"
              className="text-xs h-8 text-slate-500 hover:text-rose-600 border-slate-200 hover:bg-rose-50 rounded-xl flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" /> Close Video Guide
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in">
          {videos.map((video) => (
            <div 
              key={video.videoId} 
              className="bg-white border border-slate-200/75 rounded-2xl p-4 flex flex-col shadow-sm hover:scale-[1.01] hover:shadow-md transition-all duration-300 relative overflow-hidden"
            >
              {/* YouTube video embed */}
              <iframe
                src={`https://www.youtube.com/embed/${video.videoId}`}
                title={video.title}
                className="w-full h-48 rounded-xl border border-slate-100 shadow-sm"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <div className="mt-3 flex-1 flex flex-col justify-between">
                <div>
                  <h4 
                    className="font-extrabold text-xs text-slate-800 line-clamp-1 leading-snug"
                    dangerouslySetInnerHTML={{ __html: video.title }}
                  />
                  <p className="text-[10px] text-slate-450 font-bold mt-1 uppercase tracking-wider">
                    📺 {video.channelTitle}
                  </p>
                  <p className="text-[10px] text-slate-500 font-semibold line-clamp-2 mt-1 leading-relaxed">
                    {video.description}
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <a 
                    href={`https://www.youtube.com/watch?v=${video.videoId}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center text-[10px] font-black text-rose-600 hover:text-rose-700 transition-colors uppercase tracking-wider"
                  >
                    Watch on YouTube ↗
                  </a>
                  <span className="text-[8px] font-mono text-slate-400">
                    {new Date(video.publishedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>
      )}
      
      {activeAid === "Video Tutorials" && videos.length === 0 && !loadingVideos && (
        <div className="text-center py-10 bg-white border border-slate-200/60 rounded-xl mt-4">
          <YoutubeIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-500">No tutorials found for this topic.</p>
        </div>
      )}
    </div>
  );
}
