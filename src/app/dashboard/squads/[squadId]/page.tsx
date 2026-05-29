"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { 
  ArrowLeft, FileText, CheckSquare, Brain, Download, 
  Award, Clock, Target, Eye, X, BookOpen, AlertCircle, Play,
  Camera, Paperclip, Trash2, Loader2, Send, MessageSquare
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { 
  doc, getDoc, getDocs, collection, setDoc, updateDoc, 
  query, where, onSnapshot, arrayUnion, increment, addDoc, orderBy
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { NotificationService } from "@/services/notification.service";

interface StudentAnalytics {
  userId: string;
  displayName: string;
  email: string;
  xpEarned: number;
  studyTime: number;
  assignmentsCompleted: number;
  testsTaken: number;
  quizAccuracy: number;
  totalQuestionsAttempted: number;
  totalQuestionsCorrect: number;
  completedAssignments: string[];
  submissions?: Array<{
    assignmentId: string;
    submittedAt: string;
    text: string;
    attachments: Array<{
      name: string;
      url: string;
      type: string;
    }>;
    status?: "pending" | "accepted" | "rejected";
    feedback?: string | null;
  }>;
  testScores?: Array<{
    testId: string;
    score: number;
    total: number;
    takenAt: string;
  }>;
}

export default function StudentSquadPortal() {
  const { squadId } = useParams() as { squadId: string };
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  // Squad data
  const [squad, setSquad] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState<"performance" | "notes" | "assignments" | "tests" | "chat">("performance");

  // Student Squad Analytics State
  const [myAnalytics, setMyAnalytics] = useState<StudentAnalytics | null>(null);

  // Notes, Assignments, Tests lists
  const [notes, setNotes] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);

  // Active assignment viewer modal
  const [viewingAssignment, setViewingAssignment] = useState<any>(null);
  const [submissionText, setSubmissionText] = useState("");
  const [submittingWork, setSubmittingWork] = useState(false);
  const [uploadedAttachments, setUploadedAttachments] = useState<Array<{ name: string, url: string, type: string }>>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Chat states
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatText, setChatText] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Active test taker modal
  const [activeTest, setActiveTest] = useState<any>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [testAnswers, setTestAnswers] = useState<Record<number, number>>({});
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [testScore, setTestScore] = useState({ correct: 0, total: 0 });

  // 1. Load squad data and student's squad-specific analytics
  useEffect(() => {
    if (!user || !squadId) return;

    const squadRef = doc(db, "squads", squadId);
    const unsubscribeSquad = onSnapshot(squadRef, (snap) => {
      if (!snap.exists()) {
        setSquad(null);
        setLoading(false);
        return;
      }
      setSquad({ id: snap.id, ...snap.data() });
    });

    const myAnalyticsRef = doc(db, "squads", squadId, "analytics", user.uid);
    const unsubscribeAnalytics = onSnapshot(myAnalyticsRef, async (snap) => {
      if (snap.exists()) {
        setMyAnalytics(snap.data() as StudentAnalytics);
      } else {
        // Initialize empty squad analytics for this student
        const initialAnalytics: StudentAnalytics = {
          userId: user.uid,
          displayName: userProfile?.displayName || user.displayName || "Scholar",
          email: user.email || "",
          xpEarned: 0,
          studyTime: 0,
          assignmentsCompleted: 0,
          testsTaken: 0,
          quizAccuracy: 0,
          totalQuestionsAttempted: 0,
          totalQuestionsCorrect: 0,
          completedAssignments: [],
          submissions: [],
          testScores: []
        };
        await setDoc(myAnalyticsRef, initialAnalytics);
        setMyAnalytics(initialAnalytics);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeSquad();
      unsubscribeAnalytics();
    };
  }, [user, squadId, userProfile]);

  // 2. Fetch materials, assignments, tests in real-time
  useEffect(() => {
    if (!squadId) return;

    const unsubscribeNotes = onSnapshot(
      collection(db, "squads", squadId, "notes"),
      (snap) => setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    const unsubscribeAssignments = onSnapshot(
      collection(db, "squads", squadId, "assignments"),
      (snap) => setAssignments(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    const unsubscribeTests = onSnapshot(
      collection(db, "squads", squadId, "tests"),
      (snap) => setTests(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    return () => {
      unsubscribeNotes();
      unsubscribeAssignments();
      unsubscribeTests();
    };
  }, [squadId]);

  // 2.5 Stop camera stream and clear uploads when modal closes
  useEffect(() => {
    if (!viewingAssignment) {
      stopCamera();
      setShowCamera(false);
      setSubmissionText("");
      setUploadedAttachments([]);
    }
  }, [viewingAssignment]);

  // Set tab from URL param if valid
  useEffect(() => {
    if (tabParam && ["performance", "notes", "assignments", "tests", "chat"].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);

  // Load chat messages with teacher in real-time
  useEffect(() => {
    if (!squadId || !user || activeTab !== "chat") return;

    const chatsRef = collection(db, "squads", squadId, "chats");
    const q = query(chatsRef, where("studentId", "==", user.uid), orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snap) => {
      setChatMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });

    return () => unsubscribe();
  }, [squadId, user, activeTab]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim() || !user || !squad) return;

    setSendingChat(true);
    try {
      const chatsRef = collection(db, "squads", squadId, "chats");
      await addDoc(chatsRef, {
        studentId: user.uid,
        senderId: user.uid,
        senderName: userProfile?.displayName || user.displayName || "Scholar",
        text: chatText.trim(),
        createdAt: new Date().toISOString()
      });

      // Send real-time notification to the squad instructor
      await NotificationService.sendNotification(
        squad.ownerId,
        "New Message from Student",
        `${userProfile?.displayName || user.displayName || "Scholar"} sent you a message in squad "${squad.name}".`,
        `/dashboard/teachers/squad/${squadId}?tab=students`
      );

      setChatText("");
    } catch (err) {
      console.error("Error sending chat message:", err);
      alert("Failed to send message.");
    } finally {
      setSendingChat(false);
    }
  };

  // 3. Increment study time inside squad when studying notes (simulated bonus)
  const handleStudyMaterial = async (materialTitle: string) => {
    if (!user || !squadId) return;
    try {
      const myAnalyticsRef = doc(db, "squads", squadId, "analytics", user.uid);
      
      // Award 2 mins study bonus for viewing notes
      await updateDoc(myAnalyticsRef, {
        studyTime: increment(2),
        lastActive: new Date().toISOString()
      });

      // Update global user stats
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        studyTime: increment(2)
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Camera & File Capture Helpers
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" });
          await handleUploadAttachment(file);
        }
      }, "image/jpeg", 0.8);
    }
    stopCamera();
    setShowCamera(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleUploadAttachment(file);
    }
  };

  const handleUploadAttachment = async (file: File) => {
    setUploadingAttachment(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("squadId", squadId);

      const res = await fetch("/api/squad-material/upload", {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        throw new Error("Failed to upload file");
      }

      const data = await res.json();
      setUploadedAttachments(prev => [
        ...prev,
        {
          name: data.fileName,
          url: data.fileUrl,
          type: data.fileType
        }
      ]);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error uploading file");
    } finally {
      setUploadingAttachment(false);
    }
  };

  // 4. Submit Assignment
  const handleSubmitAssignment = async () => {
    if (!user || !squadId || !viewingAssignment) return;
    setSubmittingWork(true);

    try {
      const myAnalyticsRef = doc(db, "squads", squadId, "analytics", user.uid);
      
      const newSubmission = {
        assignmentId: viewingAssignment.id,
        submittedAt: new Date().toISOString(),
        text: submissionText,
        attachments: uploadedAttachments,
        status: "pending" as const,
        feedback: null
      };

      const currentSubmissions = myAnalytics?.submissions || [];
      let updatedSubmissions = [];
      const existingSubIdx = currentSubmissions.findIndex(s => s.assignmentId === viewingAssignment.id);
      if (existingSubIdx > -1) {
        updatedSubmissions = [...currentSubmissions];
        updatedSubmissions[existingSubIdx] = newSubmission;
      } else {
        updatedSubmissions = [...currentSubmissions, newSubmission];
      }

      // Update student's squad analytics document
      // Note: We DO NOT increment assignmentsCompleted, completedAssignments, or xpEarned. 
      // Defer all of those until approved by teacher.
      await updateDoc(myAnalyticsRef, {
        submissions: updatedSubmissions,
        lastActive: new Date().toISOString()
      });

      // Notify the teacher (squad owner)
      const studentName = userProfile?.displayName || user.displayName || "Scholar";
      await NotificationService.sendNotification(
        squad.ownerId,
        "Assignment Submission Received",
        `${studentName} submitted work for "${viewingAssignment.title}" in squad ${squad.name}.`,
        `/dashboard/teachers/squad/${squadId}?tab=students`
      );

      alert("Work submitted successfully!");
      setViewingAssignment(null);
      setSubmissionText("");
      setUploadedAttachments([]);
      stopCamera();
      setShowCamera(false);
    } catch (err) {
      console.error(err);
      alert("Error submitting work.");
    } finally {
      setSubmittingWork(false);
    }
  };

  // 5. Submit Test Score
  const handleSubmitTest = async () => {
    if (!user || !squadId || !activeTest) return;

    let correctCount = 0;
    activeTest.questions.forEach((q: any, idx: number) => {
      if (testAnswers[idx] === q.correctOptionIndex) {
        correctCount++;
      }
    });

    const totalCount = activeTest.questions.length;
    
    try {
      const myAnalyticsRef = doc(db, "squads", squadId, "analytics", user.uid);
      
      // Fetch fresh analytics state to do proper percentage recalculation
      const analyticsSnap = await getDoc(myAnalyticsRef);
      const currentAnalytics = analyticsSnap.data() as StudentAnalytics;

      const currentAttempted = currentAnalytics.totalQuestionsAttempted || 0;
      const currentCorrect = currentAnalytics.totalQuestionsCorrect || 0;
      
      const newAttempted = currentAttempted + totalCount;
      const newCorrect = currentCorrect + correctCount;
      const newAccuracy = Math.round((newCorrect / newAttempted) * 100);

      const testResult = {
        testId: activeTest.id,
        score: correctCount,
        total: totalCount,
        takenAt: new Date().toISOString()
      };

      // Award proportional XP
      const proportion = correctCount / totalCount;
      const xpReward = Math.round(activeTest.xpReward * proportion);
      
      // Update squad analytics
      await updateDoc(myAnalyticsRef, {
        testsTaken: increment(1),
        totalQuestionsAttempted: newAttempted,
        totalQuestionsCorrect: newCorrect,
        quizAccuracy: newAccuracy,
        xpEarned: increment(xpReward),
        studyTime: increment(totalCount * 2), // 2 min study bonus per question
        testScores: arrayUnion(testResult),
        lastActive: new Date().toISOString()
      });

      // Update global user metrics
      const userRef = doc(db, "users", user.uid);
      const currentXp = Number(userProfile?.xp) || 0;
      const newXp = currentXp + xpReward;
      const newLevel = Math.floor(newXp / 1000) + 1;
      let newRank = "Rookie";
      if (newLevel >= 15) newRank = "Grandmaster";
      else if (newLevel >= 10) newRank = "Master";
      else if (newLevel >= 5) newRank = "Scholar";

      const currentGlobalAttempted = Number(userProfile?.quizQuestionsAnswered) || 0;
      const currentGlobalCorrect = Number(userProfile?.quizQuestionsCorrect) || 0;
      const newGlobalAttempted = currentGlobalAttempted + totalCount;
      const newGlobalCorrect = currentGlobalCorrect + correctCount;
      const newGlobalAccuracy = Math.round((newGlobalCorrect / newGlobalAttempted) * 100);

      await updateDoc(userRef, {
        xp: newXp,
        level: newLevel,
        rank: newRank,
        studyTime: increment(totalCount * 2),
        quizQuestionsAnswered: newGlobalAttempted,
        quizQuestionsCorrect: newGlobalCorrect,
        quizAccuracy: newGlobalAccuracy
      });

      // Sync XP
      try {
        await fetch("/api/gamification/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: userProfile?.displayName || 'Scholar',
            xp: newXp,
            level: newLevel,
            rank: newRank
          })
        });
      } catch {}

      // Notify teacher
      const studentName = userProfile?.displayName || user.displayName || "Scholar";
      await NotificationService.sendNotification(
        squad.ownerId,
        "Test Completed by Student",
        `${studentName} scored ${correctCount}/${totalCount} on test "${activeTest.title}" in squad ${squad.name}.`
      );

      setTestScore({ correct: correctCount, total: totalCount });
      setTestSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("Error submitting test.");
    }
  };

  const startTestTaker = (test: any) => {
    setActiveTest(test);
    setCurrentQuestionIdx(0);
    setTestAnswers({});
    setTestSubmitted(false);
  };

  const closeTestTaker = () => {
    setActiveTest(null);
    setTestAnswers({});
    setTestSubmitted(false);
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse text-xs font-mono uppercase tracking-widest">Entering squad portal...</div>;
  if (!squad) return <div className="p-8 text-center text-destructive">Classroom squad not found.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Portal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-border/40 pb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/squads">
            <Button variant="ghost" size="icon" className="h-10 w-10 border border-border bg-card rounded-md">
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-wider text-foreground uppercase flex items-center gap-3">
              <BookOpen className="text-primary w-6 h-6" />
              <span>Squad Workspace: {squad.name}</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {squad.desc}
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-1.5 bg-secondary/15 p-1 rounded-lg border border-border">
          <button 
            onClick={() => setActiveTab("performance")} 
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-md transition-all ${activeTab === "performance" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"}`}
          >
            My Stats
          </button>
          <button 
            onClick={() => setActiveTab("notes")} 
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-md transition-all ${activeTab === "notes" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"}`}
          >
            Notes
          </button>
          <button 
            onClick={() => setActiveTab("assignments")} 
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-md transition-all ${activeTab === "assignments" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"}`}
          >
            Work
          </button>
          <button 
            onClick={() => setActiveTab("tests")} 
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-md transition-all ${activeTab === "tests" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"}`}
          >
            Tests
          </button>
          <button 
            onClick={() => setActiveTab("chat")} 
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-md transition-all ${activeTab === "chat" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"}`}
          >
            Chat
          </button>
        </div>
      </div>

      {/* Main Workspace Contents */}
      <div className="grid grid-cols-1 gap-8">
        
        {/* Tab 1: Performance Stats */}
        {activeTab === "performance" && myAnalytics && (
          <div className="space-y-6">
            <h2 className="text-xs font-mono uppercase tracking-widest text-primary font-bold">My Squad Performance Index</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-5 rounded-lg border border-border bg-card flex flex-col justify-between text-center hover:scale-[1.02] duration-300">
                <Award className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{myAnalytics.xpEarned}</p>
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mt-1">XP Earned here</p>
              </Card>
              <Card className="p-5 rounded-lg border border-border bg-card flex flex-col justify-between text-center hover:scale-[1.02] duration-300">
                <Clock className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{myAnalytics.studyTime} MIN</p>
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mt-1">Study time here</p>
              </Card>
              <Card className="p-5 rounded-lg border border-border bg-card flex flex-col justify-between text-center hover:scale-[1.02] duration-300">
                <Target className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{myAnalytics.quizAccuracy}%</p>
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mt-1">Test Accuracy</p>
              </Card>
              <Card className="p-5 rounded-lg border border-border bg-card flex flex-col justify-between text-center hover:scale-[1.02] duration-300">
                <CheckSquare className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{myAnalytics.assignmentsCompleted}</p>
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mt-1">Tasks Completed</p>
              </Card>
            </div>

            {/* Submissions checklist logs */}
            <Card className="p-6 border-border bg-card rounded-lg shadow-sm">
              <h3 className="text-xs font-mono uppercase tracking-widest text-primary font-bold mb-4">Activity Breakdown</h3>
              <div className="space-y-3.5 text-xs text-muted-foreground">
                <div className="flex justify-between items-center py-2.5 border-b border-border/40">
                  <span>Questions Attempted inside squad tests:</span>
                  <span className="font-mono text-foreground font-bold">{myAnalytics.totalQuestionsAttempted}</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-border/40">
                  <span>Questions Answered Correctly:</span>
                  <span className="font-mono text-green-600 font-bold">{myAnalytics.totalQuestionsCorrect}</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-border/40">
                  <span>Practice Quizzes Completed:</span>
                  <span className="font-mono text-foreground font-bold">{myAnalytics.testsTaken}</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Tab 2: Notes / Study Materials */}
        {activeTab === "notes" && (
          <Card className="p-0 border-border bg-card rounded-lg overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border bg-secondary/10">
              <span className="text-xs font-mono uppercase tracking-widest text-primary font-bold">Class Materials</span>
            </div>

            {notes.length === 0 ? (
              <div className="p-16 text-center text-xs font-mono text-muted-foreground uppercase tracking-widest">
                No materials uploaded by the teacher yet.
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {notes.map((note) => (
                  <div key={note.id} className="flex items-center justify-between p-4 hover:bg-secondary/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-lg text-primary shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-foreground">{note.title}</p>
                        <p className="text-[9px] text-muted-foreground font-mono mt-0.5 uppercase">
                          {note.fileType} • {note.fileName}
                        </p>
                      </div>
                    </div>
                    <a 
                      href={note.fileUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      onClick={() => handleStudyMaterial(note.title)}
                    >
                      <Button variant="outline" className="h-9 px-4 border-border text-xs flex items-center gap-2 hover:bg-secondary/15">
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Tab 3: Assignments */}
        {activeTab === "assignments" && (
          <Card className="p-0 border-border bg-card rounded-lg overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border bg-secondary/10">
              <span className="text-xs font-mono uppercase tracking-widest text-primary font-bold">Squad Assignments</span>
            </div>

            {assignments.length === 0 ? (
              <div className="p-16 text-center text-xs font-mono text-muted-foreground uppercase tracking-widest">
                No work assigned yet. Enjoy the breather!
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {assignments.map((assign) => {
                  const isCompleted = myAnalytics?.completedAssignments?.includes(assign.id) || false;
                  const submission = myAnalytics?.submissions?.find(s => s.assignmentId === assign.id);
                  const status = submission?.status || (submission ? "pending" : null);

                  return (
                    <div key={assign.id} className="p-4 hover:bg-secondary/10 transition-colors flex flex-col gap-3">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-lg text-primary shrink-0 mt-0.5">
                            <CheckSquare className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-foreground truncate">{assign.title}</p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{assign.desc}</p>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-[9px] font-mono font-bold uppercase text-muted-foreground">
                              <span className="flex items-center gap-1 text-primary"><Award className="w-3 h-3 text-primary" /> +{assign.xpReward} XP</span>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-amber-600">Due: {assign.dueDate}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                          {status === "accepted" && (
                            <span className="text-[9px] font-mono tracking-wider font-bold text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded uppercase whitespace-nowrap">
                              Completed ✓
                            </span>
                          )}
                          {status === "pending" && (
                            <span className="text-[9px] font-mono tracking-wider font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded uppercase whitespace-nowrap">
                              Pending Review ⏳
                            </span>
                          )}
                          {status === "rejected" && (
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-mono tracking-wider font-bold text-destructive bg-destructive/5 border border-destructive/20 px-3 py-1.5 rounded uppercase whitespace-nowrap">
                                Rejected ❌
                              </span>
                              <Button 
                                onClick={() => {
                                  setViewingAssignment(assign);
                                  setSubmissionText(submission?.text || "");
                                  setUploadedAttachments(submission?.attachments || []);
                                }}
                                className="bg-primary text-primary-foreground hover:bg-primary/95 text-[10px] font-mono uppercase tracking-wider h-8 px-3 shrink-0 cursor-pointer"
                              >
                                Re-submit
                              </Button>
                            </div>
                          )}
                          {!status && (
                            <Button 
                              onClick={() => setViewingAssignment(assign)}
                              className="bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-mono uppercase tracking-wider h-9 px-4 shrink-0 cursor-pointer"
                            >
                              Submit Work
                            </Button>
                          )}
                        </div>
                      </div>

                      {status === "rejected" && submission?.feedback && (
                        <div className="ml-12 p-3 bg-destructive/5 border border-destructive/10 rounded-md text-xs text-destructive">
                          <strong className="font-bold">Rejection Feedback:</strong> {submission.feedback}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {/* Tab 4: Tests */}
        {activeTab === "tests" && (
          <Card className="p-0 border-border bg-card rounded-lg overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border bg-secondary/10">
              <span className="text-xs font-mono uppercase tracking-widest text-primary font-bold">Classroom Tests</span>
            </div>

            {tests.length === 0 ? (
              <div className="p-16 text-center text-xs font-mono text-muted-foreground uppercase tracking-widest">
                No tests published yet.
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {tests.map((test) => {
                  const scoreRecord = myAnalytics?.testScores?.find(s => s.testId === test.id);
                  const isTaken = scoreRecord !== undefined;
                  
                  return (
                    <div key={test.id} className="p-4 hover:bg-secondary/10 transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-lg text-primary shrink-0 mt-0.5">
                          <Brain className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-foreground">{test.title}</p>
                          <p className="text-[10px] text-muted-foreground font-mono mt-1 uppercase tracking-wider">{test.questions?.length || 0} Questions</p>
                          <div className="flex items-center gap-3 mt-1.5 text-[9px] font-mono font-bold uppercase text-muted-foreground">
                            <span className="flex items-center gap-1 text-primary"><Award className="w-3 h-3 text-primary" /> +{test.xpReward} XP Max</span>
                          </div>
                        </div>
                      </div>

                      {isTaken ? (
                        <div className="text-right self-start sm:self-center">
                          <span className="text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded font-mono block">
                            Score: {scoreRecord.score} / {scoreRecord.total}
                          </span>
                          <span className="text-[8px] text-muted-foreground font-mono block mt-1 uppercase">Taken on {new Date(scoreRecord.takenAt).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <Button 
                          onClick={() => startTestTaker(test)}
                          className="bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-mono uppercase tracking-wider h-9 px-4 shrink-0 flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-primary-foreground" />
                          Take Test
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {/* Tab 5: Chat with Teacher */}
        {activeTab === "chat" && squad && (
          <Card className="p-6 border-border bg-card rounded-lg flex flex-col h-[500px]">
            <div className="flex justify-between items-center pb-4 border-b border-border/40 mb-4">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-widest text-primary font-bold">Squad Chat Channel</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Private channel with your squad instructor</p>
              </div>
            </div>

            {/* Messages container */}
            <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-secondary/5 border border-border/40 rounded-lg mb-4">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col justify-center items-center text-center text-muted-foreground text-[10.5px] font-mono uppercase tracking-widest leading-loose py-20">
                  No messages yet. <br />
                  Send a message to contact your instructor.
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.senderId === user?.uid;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-lg p-3 text-xs leading-relaxed ${
                        isMe 
                          ? 'bg-primary text-primary-foreground font-bold rounded-tr-none shadow-sm' 
                          : 'bg-secondary/25 text-foreground border border-border/30 rounded-tl-none font-medium'
                      }`}>
                        <div className="flex justify-between items-center gap-4 mb-0.5">
                          <span className="font-mono text-[8px] font-bold opacity-80">{isMe ? 'You' : msg.senderName}</span>
                          <span className="text-[7.5px] font-mono opacity-60">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Send Form */}
            <form onSubmit={handleSendChat} className="flex gap-2">
              <Input
                required
                value={chatText}
                onChange={e => setChatText(e.target.value)}
                placeholder="Type your message to instructor..."
                className="bg-secondary/20 border-border text-xs rounded-md h-10 focus:border-primary/50"
                disabled={sendingChat}
              />
              <Button 
                type="submit" 
                disabled={sendingChat || !chatText.trim()}
                className="h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/95 flex items-center justify-center shrink-0 rounded-md cursor-pointer animate-none font-mono text-xs uppercase tracking-wider"
              >
                <Send className="w-4 h-4 mr-1.5" />
                Send
              </Button>
            </form>
          </Card>
        )}

      </div>

      {/* Assignment submission modal */}
      <AnimatePresence>
        {viewingAssignment && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-xl max-w-lg w-full p-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setViewingAssignment(null)} 
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-5">
                <div>
                  <span className="text-[9px] font-mono font-bold tracking-widest text-primary uppercase">Submit Work</span>
                  <h3 className="text-md font-bold text-foreground mt-1">{viewingAssignment.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 font-mono uppercase tracking-wider">Reward: {viewingAssignment.xpReward} XP</p>
                </div>

                <div className="p-4 bg-secondary/15 border border-border/40 rounded-lg text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  <strong className="text-foreground block font-bold mb-1">Instructions:</strong>
                  {viewingAssignment.desc || "No instructions provided."}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground">My Answer / Submission Notes</label>
                  <textarea 
                    value={submissionText} 
                    onChange={e => setSubmissionText(e.target.value)} 
                    placeholder="Enter your answers or submission notes here..."
                    className="w-full min-h-[120px] text-xs bg-secondary/20 border border-border rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground">Attachments</label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (showCamera) {
                            stopCamera();
                            setShowCamera(false);
                          } else {
                            setShowCamera(true);
                            startCamera();
                          }
                        }}
                        className="h-8 text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5 border-border"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        {showCamera ? "Close Camera" : "Camera Photo"}
                      </Button>
                      <label className="h-8 px-3 border border-border bg-card rounded-md hover:bg-secondary/15 transition-all text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>Upload File</span>
                        <input
                          type="file"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Camera live video view */}
                  {showCamera && (
                    <div className="border border-border rounded-lg overflow-hidden bg-black relative flex flex-col items-center">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full max-h-[200px] object-cover"
                      />
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
                        <Button
                          type="button"
                          onClick={capturePhoto}
                          className="bg-primary text-primary-foreground font-mono text-[9px] uppercase tracking-widest h-8 px-4"
                        >
                          Capture Snapshot
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Attachment list */}
                  {uploadedAttachments.length > 0 && (
                    <div className="space-y-1.5">
                      {uploadedAttachments.map((att, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-secondary/15 border border-border/50 rounded-md">
                          <div className="flex items-center gap-2 min-w-0">
                            <Paperclip className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="text-[10px] font-mono text-foreground truncate">{att.name}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setUploadedAttachments(prev => prev.filter((_, i) => i !== idx));
                            }}
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {uploadingAttachment && (
                    <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      <span>UPLOADING ATTACHMENT...</span>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleSubmitAssignment}
                  disabled={submittingWork || (!submissionText.trim() && uploadedAttachments.length === 0)}
                  className="w-full h-11 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest disabled:opacity-50"
                >
                  {submittingWork ? "Submitting..." : "Submit to Teacher"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interactive test taker modal */}
      <AnimatePresence>
        {activeTest && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-xl max-w-2xl w-full p-6 shadow-2xl relative"
            >
              {!testSubmitted && (
                <button 
                  onClick={() => {
                    if (confirm("Quit test? Progress will not be saved.")) closeTestTaker();
                  }} 
                  className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {testSubmitted ? (
                // Test result summary view
                <div className="text-center py-8 space-y-6">
                  <Award className="w-12 h-12 text-primary mx-auto animate-bounce" />
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-foreground">Test Finished: {activeTest.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      You scored <strong className="text-green-600 font-bold">{testScore.correct} out of {testScore.total}</strong> correct answers!
                    </p>
                    <p className="text-[10px] text-primary font-mono font-bold uppercase tracking-wider mt-1">
                      Awarded +{Math.round(activeTest.xpReward * (testScore.correct / testScore.total))} XP
                    </p>
                  </div>
                  <Button 
                    onClick={closeTestTaker}
                    className="px-8 h-11 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest"
                  >
                    Return to Portal
                  </Button>
                </div>
              ) : (
                // Interactive question view
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-border/40 pb-3">
                    <div>
                      <span className="text-[9px] font-mono font-bold tracking-widest text-primary uppercase">Classroom Test</span>
                      <h3 className="text-sm font-bold text-foreground">{activeTest.title}</h3>
                    </div>
                    <span className="text-xs font-mono font-bold text-primary">
                      {currentQuestionIdx + 1} / {activeTest.questions.length}
                    </span>
                  </div>

                  {(() => {
                    const currentQ = activeTest.questions[currentQuestionIdx];
                    return (
                      <div className="space-y-5">
                        <div className="bg-secondary/10 border border-border/40 p-4 rounded-lg">
                          <p className="text-sm font-bold leading-relaxed text-foreground">{currentQ.question}</p>
                        </div>

                        <div className="space-y-2.5">
                          {currentQ.options.map((opt: string, optIdx: number) => {
                            const isSelected = testAnswers[currentQuestionIdx] === optIdx;
                            return (
                              <button
                                key={optIdx}
                                onClick={() => setTestAnswers(prev => ({ ...prev, [currentQuestionIdx]: optIdx }))}
                                className={`w-full text-left py-3.5 px-4 text-xs font-medium border rounded-lg transition-all flex justify-between items-center ${
                                  isSelected 
                                    ? 'bg-primary/10 border-primary text-primary font-bold shadow-sm' 
                                    : 'bg-card border-border text-muted-foreground hover:bg-secondary/15 hover:text-foreground'
                                }`}
                              >
                                <span>{opt}</span>
                                <span className="text-[9px] font-mono text-muted-foreground border border-border px-1.5 py-0.5 rounded font-bold uppercase">
                                  Option {String.fromCharCode(65 + optIdx)}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex justify-between items-center pt-4 border-t border-border/40">
                    <Button
                      variant="outline"
                      disabled={currentQuestionIdx === 0}
                      onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
                      className="h-10 text-xs font-mono uppercase tracking-wider border-border"
                    >
                      Back
                    </Button>

                    {currentQuestionIdx === activeTest.questions.length - 1 ? (
                      <Button
                        disabled={testAnswers[currentQuestionIdx] === undefined}
                        onClick={handleSubmitTest}
                        className="bg-green-600 hover:bg-green-650 text-white text-xs font-mono uppercase tracking-wider h-10 px-5 cursor-pointer"
                      >
                        Submit Test
                      </Button>
                    ) : (
                      <Button
                        disabled={testAnswers[currentQuestionIdx] === undefined}
                        onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                        className="bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-mono uppercase tracking-wider h-10 px-5 cursor-pointer"
                      >
                        Next Question
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
