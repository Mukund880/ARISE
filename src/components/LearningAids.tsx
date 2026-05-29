"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Brain, FileText, Table, Network, Download } from "lucide-react";
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
          <pre className="text-[11px] text-slate-700 font-mono whitespace-pre-wrap overflow-x-auto max-h-80 overflow-y-auto leading-relaxed pt-2 font-semibold">
            {aidContent}
          </pre>
        </div>
      )}

      {videos.length > 0 && !loadingVideos && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4 animate-fade-in">
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
