"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, FolderOpen, Save, Trash2, Edit3, Loader2, 
  ChevronRight, ChevronDown, BookOpen, AlertCircle 
} from "lucide-react";
import { AriseMascot } from "@/components/AriseMascot";
import { useMascot } from "@/context/MascotContext";

interface ModuleNote {
  id: string;
  title: string;
  studentNotes?: string;
}

interface TopicNotes {
  id: string;
  title: string;
  level: string;
  modules: ModuleNote[];
}

export default function MyNotesPage() {
  const { user } = useAuth();
  const { triggerEmotion } = useMascot();
  const [topics, setTopics] = useState<TopicNotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [activeNotesText, setActiveNotesText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadNotesData() {
      if (!user) return;
      try {
        setLoading(true);
        const topicsCol = collection(db, "users", user.uid, "topics");
        const topicsSnap = await getDocs(topicsCol);
        
        const topicsList: TopicNotes[] = [];
        
        for (const topicDoc of topicsSnap.docs) {
          const topicData = topicDoc.data();
          
          // Fetch modules sub-collection for this topic
          const modulesCol = collection(db, "users", user.uid, "topics", topicDoc.id, "modules");
          const modulesSnap = await getDocs(modulesCol);
          
          const modulesList: ModuleNote[] = modulesSnap.docs.map(doc => ({
            id: doc.id,
            title: doc.data().title || "Untitled Module",
            studentNotes: doc.data().studentNotes || ""
          }));

          // Keep all topics, but note which modules have notes
          topicsList.push({
            id: topicDoc.id,
            title: topicData.title || "Untitled Topic",
            level: topicData.level || "Beginner",
            modules: modulesList
          });
        }
        
        setTopics(topicsList);
      } catch (err) {
        console.error("Failed to load notes data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadNotesData();
  }, [user]);

  const toggleTopicExpand = (topicId: string) => {
    setExpandedTopics(prev => ({
      ...prev,
      [topicId]: !prev[topicId]
    }));
  };

  const handleSelectModule = (topicId: string, moduleId: string) => {
    const topic = topics.find(t => t.id === topicId);
    const mod = topic?.modules.find(m => m.id === moduleId);
    
    setSelectedTopicId(topicId);
    setSelectedModuleId(moduleId);
    setActiveNotesText(mod?.studentNotes || "");
    triggerEmotion("focused", 2000);
  };

  const handleSaveNotes = async () => {
    if (!user || !selectedTopicId || !selectedModuleId) return;
    setIsSaving(true);
    triggerEmotion("excited", 1500);
    try {
      const docRef = doc(db, "users", user.uid, "topics", selectedTopicId, "modules", selectedModuleId);
      await updateDoc(docRef, {
        studentNotes: activeNotesText
      });

      // Update local state
      setTopics(prev => prev.map(topic => {
        if (topic.id !== selectedTopicId) return topic;
        return {
          ...topic,
          modules: topic.modules.map(mod => {
            if (mod.id !== selectedModuleId) return mod;
            return { ...mod, studentNotes: activeNotesText };
          })
        };
      }));
    } catch (err) {
      console.error("Error saving notes:", err);
      triggerEmotion("confused", 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedModuleDetails = () => {
    if (!selectedTopicId || !selectedModuleId) return null;
    const topic = topics.find(t => t.id === selectedTopicId);
    const mod = topic?.modules.find(m => m.id === selectedModuleId);
    return {
      topicTitle: topic?.title,
      moduleTitle: mod?.title
    };
  };

  const details = selectedModuleDetails();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse text-xs font-mono uppercase tracking-widest">Opening notes shelf...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3 tracking-wider text-foreground uppercase">
          <FileText className="text-primary w-7 h-7" />
          My Notes Shelf
        </h1>
        <p className="text-muted-foreground text-xs mt-1">
          Review, expand, and manage your parent-child study logs written inside the study arenas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Side: Topic & Module tree explorer */}
        <div className="lg:col-span-4 space-y-4 flex flex-col">
          <Card className="p-4 border-border bg-card/60 backdrop-blur-md rounded-2xl flex-1 flex flex-col min-h-[450px]">
            <h2 className="text-[10px] font-mono font-bold tracking-widest text-muted-foreground uppercase mb-4 border-b border-border pb-2 flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5" />
              Syllabus Notes Tree
            </h2>

            {topics.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 flex-1">
                <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center">
                  <AriseMascot size={60} state="sleep" interactive={false} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-foreground">No Topics Found</p>
                  <p className="text-[10px] text-muted-foreground max-w-[200px] leading-relaxed">
                    Syllabus notebooks will automatically populate here once you start generating roadmaps.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[500px] flex-1 pr-1">
                {topics.map(topic => {
                  const isExpanded = !!expandedTopics[topic.id];
                  const hasNotes = topic.modules.some(m => m.studentNotes && m.studentNotes.trim() !== "");
                  
                  return (
                    <div key={topic.id} className="space-y-1">
                      {/* Topic Parent Element */}
                      <button
                        onClick={() => toggleTopicExpand(topic.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                          selectedTopicId === topic.id
                            ? "bg-primary/5 border-primary/40 text-primary"
                            : "bg-secondary/20 border-border/60 hover:bg-secondary/40 text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <BookOpen className={`w-4 h-4 shrink-0 ${selectedTopicId === topic.id ? "text-primary" : "text-muted-foreground"}`} />
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate leading-snug">{topic.title}</p>
                            <p className="text-[8px] font-mono tracking-wide uppercase text-muted-foreground mt-0.5">{topic.level} level</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {hasNotes && (
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse shrink-0" title="Contains active logs" />
                          )}
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
                        </div>
                      </button>

                      {/* Sub-module Child Elements */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden pl-3 space-y-1 mt-1 border-l border-dashed border-border"
                          >
                            {topic.modules.map(mod => {
                              const isSelected = selectedModuleId === mod.id;
                              const isFilled = mod.studentNotes && mod.studentNotes.trim() !== "";
                              
                              return (
                                <button
                                  key={mod.id}
                                  onClick={() => handleSelectModule(topic.id, mod.id)}
                                  className={`w-full flex items-center justify-between py-2 px-3 rounded-lg text-left transition-all text-[11px] ${
                                    isSelected
                                      ? "bg-primary/10 text-primary font-bold"
                                      : "hover:bg-secondary/30 text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <FileText className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-primary" : (isFilled ? "text-indigo-400" : "text-slate-300")}`} />
                                    <span className="truncate">{mod.title}</span>
                                  </div>
                                  {isFilled && (
                                    <span className="text-[8px] font-mono font-bold bg-indigo-50 border border-indigo-100 text-indigo-500 px-1 rounded scale-90 shrink-0">
                                      LOG
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right Side: Notes Editor Pane */}
        <div className="lg:col-span-8 flex flex-col">
          <Card className="p-5 border-border bg-card/65 backdrop-blur-md rounded-2xl flex-1 flex flex-col min-h-[450px]">
            {selectedModuleId && details ? (
              <div className="flex-1 flex flex-col space-y-4">
                {/* Meta details & Save action */}
                <div className="flex justify-between items-start gap-4 border-b border-border pb-3 shrink-0">
                  <div className="min-w-0">
                    <p className="text-[9px] font-mono font-bold tracking-widest text-muted-foreground uppercase">{details.topicTitle}</p>
                    <h3 className="text-sm font-bold text-foreground truncate mt-0.5">{details.moduleTitle}</h3>
                  </div>
                  <Button
                    onClick={handleSaveNotes}
                    disabled={isSaving}
                    className="bg-primary text-primary-foreground hover:bg-primary/95 border border-primary/80 font-mono text-[10px] uppercase tracking-wider h-9 px-4 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {isSaving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>{isSaving ? "Saving..." : "Save Notes"}</span>
                  </Button>
                </div>

                {/* Editor Textarea */}
                <textarea
                  value={activeNotesText}
                  onChange={(e) => setActiveNotesText(e.target.value)}
                  placeholder="Start writing down key definitions, summaries, observations, or formulas for this module here..."
                  className="flex-1 w-full bg-secondary/15 hover:bg-secondary/20 focus:bg-secondary/10 border border-border/80 focus:border-primary/50 text-foreground placeholder:text-muted-foreground/50 rounded-2xl p-5 text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-sans resize-none min-h-[300px]"
                />

                <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground/80 font-mono shrink-0">
                  <AlertCircle className="w-3 h-3 text-indigo-400" />
                  <span>Tip: These notes are synced. Modifications made here are automatically saved to your cloud profile when you click Save.</span>
                </div>
              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-center space-y-5 py-16">
                <div className="w-24 h-24 rounded-2xl border border-dashed border-border flex items-center justify-center bg-secondary/10 overflow-visible relative">
                  <AriseMascot size={75} state="idle" global={true} />
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <h3 className="text-xs font-bold text-foreground">Select a notebook node</h3>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Click any sub-module node in the Syllabus Notes Tree on the left to review or edit your personalized study logs.
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
}
