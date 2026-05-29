"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { 
  ArrowLeft, Users, FileText, CheckSquare, Brain, Plus, Trash2, Calendar, 
  Upload, Download, Award, Clock, Target, Eye, X, BookOpen, AlertCircle,
  Paperclip, ExternalLink, Send, MessageSquare, Loader2
} from "lucide-react";
import Link from "next/link";
import { db, storage } from "@/lib/firebase";
import { 
  doc, getDoc, getDocs, collection, setDoc, updateDoc, deleteDoc, 
  query, where, onSnapshot, arrayUnion, arrayRemove, addDoc,
  increment, orderBy
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
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
  lastActive?: string;
}

export default function TeacherSquadConsole() {
  const { squadId } = useParams() as { squadId: string };
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  // Squad details state
  const [squad, setSquad] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, StudentAnalytics>>({});
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Selected Student sub-tab state
  const [selectedStudentTab, setSelectedStudentTab] = useState<"analytics" | "submissions" | "chat">("analytics");

  // Teacher direct messages with selected student
  const [teacherChatMessages, setTeacherChatMessages] = useState<any[]>([]);
  const [teacherChatText, setTeacherChatText] = useState("");
  const [sendingTeacherChat, setSendingTeacherChat] = useState(false);
  const teacherChatEndRef = useRef<HTMLDivElement>(null);

  // Tabs state
  const [activeTab, setActiveTab] = useState<"students" | "notes" | "assignments" | "tests">("students");

  // Notes state
  const [notes, setNotes] = useState<any[]>([]);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteFile, setNoteFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadingNote, setUploadingNote] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Assignments state
  const [assignments, setAssignments] = useState<any[]>([]);
  const [assignTitle, setAssignTitle] = useState("");
  const [assignDesc, setAssignDesc] = useState("");
  const [assignDueDate, setAssignDueDate] = useState("");
  const [assignXp, setAssignXp] = useState(100);
  const [creatingAssignment, setCreatingAssignment] = useState(false);

  // Tests state
  const [tests, setTests] = useState<any[]>([]);
  const [testTitle, setTestTitle] = useState("");
  const [testXp, setTestXp] = useState(150);
  const [testQuestions, setTestQuestions] = useState<Array<{
    question: string;
    options: string[];
    correctOptionIndex: number;
  }>>([{ question: "", options: ["", "", "", ""], correctOptionIndex: 0 }]);
  const [creatingTest, setCreatingTest] = useState(false);

  // 1. Fetch Squad and Members details (Real-time listener)
  useEffect(() => {
    if (!user || !squadId) return;

    const squadRef = doc(db, "squads", squadId);
    const unsubscribeSquad = onSnapshot(squadRef, async (squadSnap) => {
      if (!squadSnap.exists()) {
        setSquad(null);
        setLoading(false);
        return;
      }
      
      const squadData = squadSnap.data();
      setSquad({ id: squadSnap.id, ...squadData });

      // Fetch all users to identify who is in this squad
      const usersRef = collection(db, "users");
      const q = query(usersRef);
      const querySnap = await getDocs(q);
      const allUsers = querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      const squadMembers = allUsers.filter(u => u.squadId === squadId || (u.squadIds && u.squadIds.includes(squadId)));
      setStudents(squadMembers);

      // Listen to squad student analytics
      const analyticsRef = collection(db, "squads", squadId, "analytics");
      const unsubscribeAnalytics = onSnapshot(analyticsRef, (analyticsSnap) => {
        const analyticsData: Record<string, StudentAnalytics> = {};
        analyticsSnap.docs.forEach(doc => {
          analyticsData[doc.id] = { userId: doc.id, ...doc.data() } as StudentAnalytics;
        });
        setAnalytics(analyticsData);
        setLoading(false);
      });

      return () => unsubscribeAnalytics();
    });

    return () => {
      unsubscribeSquad();
    };
  }, [user, squadId]);

  // 2. Fetch Notes, Assignments, Tests
  useEffect(() => {
    if (!squadId) return;

    const unsubscribeNotes = onSnapshot(
      collection(db, "squads", squadId, "notes"),
      (snap) => {
        setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    );

    const unsubscribeAssignments = onSnapshot(
      collection(db, "squads", squadId, "assignments"),
      (snap) => {
        setAssignments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    );

    const unsubscribeTests = onSnapshot(
      collection(db, "squads", squadId, "tests"),
      (snap) => {
        setTests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    );

    return () => {
      unsubscribeNotes();
      unsubscribeAssignments();
      unsubscribeTests();
    };
  }, [squadId]);

  // 3. Remove Student
  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm("Are you sure you want to remove this student from the squad?")) return;
    try {
      const userRef = doc(db, "users", studentId);
      
      // Update student profile: remove squadId references
      await updateDoc(userRef, {
        squadId: null,
        squadIds: arrayRemove(squadId)
      });
      
      // Send notification
      await NotificationService.sendNotification(studentId, "Squad Removed", `You have been removed from classroom squad "${squad.name}".`);

      alert("Student removed successfully.");
      if (selectedStudent?.id === studentId) setSelectedStudent(null);
    } catch (err) {
      console.error(err);
      alert("Error removing student.");
    }
  };

  // 4. File Upload (Class Notes)
  const handleUploadNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteFile || !noteTitle.trim()) return;

    setUploadingNote(true);
    setUploadProgress(20);

    try {
      const formData = new FormData();
      formData.append("file", noteFile);
      formData.append("squadId", squadId);

      setUploadProgress(50);
      const res = await fetch("/api/squad-material/upload", {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        throw new Error("Failed to upload file to local server");
      }

      setUploadProgress(80);
      const data = await res.json();

      // Save note in firestore
      await addDoc(collection(db, "squads", squadId, "notes"), {
        title: noteTitle,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        fileType: data.fileType,
        uploadedAt: new Date().toISOString()
      });

      // Notify all squad members
      await NotificationService.notifySquadMembers(
        squadId,
        "New Study Material Uploaded",
        `New note material: "${noteTitle}" has been uploaded in squad ${squad.name}.`
      );

      setUploadProgress(100);
      alert("Material uploaded successfully!");
      setNoteTitle("");
      setNoteFile(null);
      setUploadingNote(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error uploading note.");
      setUploadingNote(false);
      setUploadProgress(null);
    }
  };

  // 5. Delete Note
  const handleDeleteNote = async (noteId: string, fileUrl: string) => {
    if (!confirm("Delete this study note?")) return;
    try {
      await deleteDoc(doc(db, "squads", squadId, "notes", noteId));
      
      // Try deleting from Firebase Storage
      try {
        const storageRef = ref(storage, fileUrl);
        await deleteObject(storageRef);
      } catch (storageErr) {
        console.warn("Storage deletion warning (might not exist):", storageErr);
      }

      alert("Note deleted.");
    } catch (err) {
      console.error(err);
      alert("Error deleting note.");
    }
  };

  // 6. Create Assignment
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTitle.trim() || !assignDueDate) return;

    setCreatingAssignment(true);
    try {
      await addDoc(collection(db, "squads", squadId, "assignments"), {
        title: assignTitle,
        desc: assignDesc,
        dueDate: assignDueDate,
        xpReward: Number(assignXp) || 100,
        createdAt: new Date().toISOString()
      });

      // Notify squad members
      await NotificationService.notifySquadMembers(
        squadId,
        "New Assignment Assigned",
        `New assignment "${assignTitle}" (Due: ${assignDueDate}) has been assigned.`
      );

      alert("Assignment successfully assigned!");
      setAssignTitle("");
      setAssignDesc("");
      setAssignDueDate("");
      setAssignXp(100);
      setCreatingAssignment(false);
    } catch (err) {
      console.error(err);
      alert("Error creating assignment.");
      setCreatingAssignment(false);
    }
  };

  // 7. Delete Assignment
  const handleDeleteAssignment = async (assignId: string) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;
    try {
      await deleteDoc(doc(db, "squads", squadId, "assignments", assignId));
      alert("Assignment deleted.");
    } catch (err) {
      console.error(err);
      alert("Error deleting assignment.");
    }
  };

  // 8. Test Builder Helpers
  const handleAddQuestion = () => {
    setTestQuestions(prev => [
      ...prev, 
      { question: "", options: ["", "", "", ""], correctOptionIndex: 0 }
    ]);
  };

  const handleRemoveQuestion = (qIndex: number) => {
    if (testQuestions.length === 1) return;
    setTestQuestions(prev => prev.filter((_, i) => i !== qIndex));
  };

  const handleUpdateQuestionText = (qIndex: number, text: string) => {
    setTestQuestions(prev => prev.map((q, i) => i === qIndex ? { ...q, question: text } : q));
  };

  const handleUpdateOption = (qIndex: number, oIndex: number, val: string) => {
    setTestQuestions(prev => prev.map((q, i) => {
      if (i === qIndex) {
        const newOpts = [...q.options];
        newOpts[oIndex] = val;
        return { ...q, options: newOpts };
      }
      return q;
    }));
  };

  const handleUpdateCorrectIndex = (qIndex: number, indexStr: string) => {
    setTestQuestions(prev => prev.map((q, i) => 
      i === qIndex ? { ...q, correctOptionIndex: Number(indexStr) } : q
    ));
  };

  // 9. Submit Test
  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle.trim()) return;

    // Validate that questions are filled
    const invalid = testQuestions.some(q => !q.question.trim() || q.options.some(o => !o.trim()));
    if (invalid) {
      alert("Please fill in all questions and options!");
      return;
    }

    setCreatingTest(true);
    try {
      await addDoc(collection(db, "squads", squadId, "tests"), {
        title: testTitle,
        xpReward: Number(testXp) || 150,
        questions: testQuestions,
        createdAt: new Date().toISOString()
      });

      // Notify squad members
      await NotificationService.notifySquadMembers(
        squadId,
        "New Practice Test Conducted",
        `A new understanding test: "${testTitle}" is now available in ${squad.name}.`
      );

      alert("Class test created successfully!");
      setTestTitle("");
      setTestXp(150);
      setTestQuestions([{ question: "", options: ["", "", "", ""], correctOptionIndex: 0 }]);
      setCreatingTest(false);
    } catch (err) {
      console.error(err);
      alert("Error creating test.");
      setCreatingTest(false);
    }
  };

  // 10. Delete Test
  const handleDeleteTest = async (testId: string) => {
    if (!confirm("Are you sure you want to delete this test?")) return;
    try {
      await deleteDoc(doc(db, "squads", squadId, "tests", testId));
      alert("Test deleted.");
    } catch (err) {
      console.error(err);
      alert("Error deleting test.");
    }
  };

  // 10.5 Load Tab Query & Real-time student chat
  useEffect(() => {
    if (tabParam && ["students", "notes", "assignments", "tests"].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);

  useEffect(() => {
    if (!squadId || !selectedStudent || selectedStudentTab !== "chat") return;

    const chatsRef = collection(db, "squads", squadId, "chats");
    const q = query(chatsRef, where("studentId", "==", selectedStudent.id), orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snap) => {
      setTeacherChatMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setTimeout(() => teacherChatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });

    return () => unsubscribe();
  }, [squadId, selectedStudent, selectedStudentTab]);

  const handleSendTeacherChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherChatText.trim() || !user || !selectedStudent) return;

    setSendingTeacherChat(true);
    try {
      const chatsRef = collection(db, "squads", squadId, "chats");
      await addDoc(chatsRef, {
        studentId: selectedStudent.id,
        senderId: user.uid,
        senderName: userProfile?.displayName || user.displayName || "Instructor",
        text: teacherChatText.trim(),
        createdAt: new Date().toISOString()
      });
      setTeacherChatText("");
    } catch (err) {
      console.error("Error sending teacher chat:", err);
      alert("Failed to send message.");
    } finally {
      setSendingTeacherChat(false);
    }
  };

  const handleReviewSubmission = async (studentId: string, assignmentId: string, action: "accept" | "reject") => {
    const confirmMsg = action === "accept" 
      ? "Accept this student's submission and reward the XP?" 
      : "Reject this student's submission?";
    if (!confirm(confirmMsg)) return;

    let feedback = "";
    if (action === "reject") {
      feedback = prompt("Provide feedback to the student explaining the rejection (optional):") || "";
    }

    try {
      const analyticsRef = doc(db, "squads", squadId, "analytics", studentId);
      const analyticsSnap = await getDoc(analyticsRef);
      if (!analyticsSnap.exists()) return;

      const studentStats = analyticsSnap.data() as StudentAnalytics;
      const currentSubmissions = studentStats.submissions || [];
      
      const updatedSubmissions = currentSubmissions.map((sub: any) => {
        if (sub.assignmentId === assignmentId) {
          return { ...sub, status: action === "accept" ? "accepted" : "rejected", feedback: feedback || null };
        }
        return sub;
      });

      const assignment = assignments.find(a => a.id === assignmentId);
      const xpReward = assignment?.xpReward || 100;

      if (action === "accept") {
        await updateDoc(analyticsRef, {
          submissions: updatedSubmissions,
          completedAssignments: arrayUnion(assignmentId),
          assignmentsCompleted: increment(1),
          xpEarned: increment(xpReward)
        });

        const studentUserRef = doc(db, "users", studentId);
        const studentSnap = await getDoc(studentUserRef);
        if (studentSnap.exists()) {
          const studentProfile = studentSnap.data();
          const currentXp = Number(studentProfile.xp) || 0;
          const newXp = currentXp + xpReward;
          const newLevel = Math.floor(newXp / 1000) + 1;
          let newRank = "Rookie";
          if (newLevel >= 15) newRank = "Grandmaster";
          else if (newLevel >= 10) newRank = "Master";
          else if (newLevel >= 5) newRank = "Scholar";

          await updateDoc(studentUserRef, {
            xp: newXp,
            level: newLevel,
            rank: newRank
          });

          try {
            await fetch("/api/gamification/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                uid: studentId,
                email: studentProfile.email,
                displayName: studentProfile.displayName || 'Scholar',
                xp: newXp,
                level: newLevel,
                rank: newRank
              })
            });
          } catch {}
        }

        await NotificationService.sendNotification(
          studentId,
          "Work Approved! 🎉",
          `Your work for "${assignment?.title || 'Assignment'}" has been approved! +${xpReward} XP awarded.`,
          `/dashboard/squads/${squadId}?tab=assignments`
        );
        alert("Submission approved and student rewarded!");
      } else {
        await updateDoc(analyticsRef, {
          submissions: updatedSubmissions
        });

        await NotificationService.sendNotification(
          studentId,
          "Work Rejected ❌",
          `Your work for "${assignment?.title || 'Assignment'}" was rejected.${feedback ? ' Feedback: ' + feedback : ' Please review and resubmit.'}`,
          `/dashboard/squads/${squadId}?tab=assignments`
        );
        alert("Submission rejected. Student has been notified.");
      }
    } catch (err) {
      console.error(err);
      alert("Error reviewing work.");
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse text-xs font-mono uppercase tracking-widest">Assembling squad console...</div>;
  if (!squad) return <div className="p-8 text-center text-destructive">Classroom squad not found.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Console Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-border/40 pb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/teachers">
            <Button variant="ghost" size="icon" className="h-10 w-10 border border-border bg-card rounded-md">
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-wider text-foreground uppercase flex items-center gap-3">
              <Users className="text-primary w-6 h-6" />
              <span>Manage: {squad.name}</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Invite Code: <strong className="text-primary font-bold">{squad.inviteCode}</strong> • Total Squad XP: {squad.totalXp?.toLocaleString() || 0}
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex gap-1.5 bg-secondary/15 p-1 rounded-lg border border-border">
          <button 
            onClick={() => setActiveTab("students")} 
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-md transition-all ${activeTab === "students" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"}`}
          >
            Students
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
        </div>
      </div>

      {/* Main Console Workspace */}
      <div className="grid grid-cols-1 gap-8">
        
        {/* Tab 1: Students & Analytics */}
        {activeTab === "students" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 p-0 border-border bg-card rounded-lg overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border bg-secondary/10 flex justify-between items-center">
                <span className="text-xs font-mono uppercase tracking-widest text-primary font-bold">Squad Roster ({students.length})</span>
              </div>
              
              {students.length === 0 ? (
                <div className="p-16 text-center text-xs font-mono text-muted-foreground uppercase tracking-widest leading-loose">
                  No students in this classroom squad yet. <br />
                  Students can join using code: <strong className="text-primary">{squad.inviteCode}</strong>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {students.map((student) => {
                    const stats = analytics[student.id] || { xpEarned: 0, studyTime: 0, quizAccuracy: 0, assignmentsCompleted: 0, testsTaken: 0 };
                    return (
                      <div 
                        key={student.id} 
                        onClick={() => {
                          setSelectedStudent(student);
                          setSelectedStudentTab("analytics");
                        }}
                        className={`flex items-center justify-between p-4 hover:bg-secondary/10 transition-colors cursor-pointer ${selectedStudent?.id === student.id ? 'bg-primary/5 border-l-2 border-primary' : ''}`}
                      >
                        <div>
                          <p className="font-bold text-sm text-foreground">{student.displayName}</p>
                          <p className="text-[10px] text-muted-foreground font-mono mt-0.5 uppercase tracking-wider">
                            Global Level {student.level} • {student.rank}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-[10px] text-primary font-mono font-bold uppercase">{stats.xpEarned || 0} Squad XP</p>
                            <p className="text-[9px] text-muted-foreground font-mono mt-0.5">{stats.studyTime || 0} mins • {stats.quizAccuracy || 0}% acc</p>
                          </div>
                          <Button 
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); handleRemoveStudent(student.id); }}
                            className="text-destructive hover:bg-destructive/10 h-8 w-8 hover:text-destructive shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Student Analytics Sidepanel */}
            <div className="space-y-6">
              {selectedStudent ? (
                <Card className="p-6 border-border bg-card rounded-lg shadow-sm relative overflow-hidden flex flex-col justify-between h-fit max-h-[85vh]">
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/5 blur-xl pointer-events-none" />
                  
                  <div className="space-y-6 overflow-y-auto pr-1">
                    <div className="flex justify-between items-start border-b border-border/40 pb-4">
                      <div>
                        <h3 className="font-extrabold text-sm text-foreground">{selectedStudent.displayName}</h3>
                        <p className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">{selectedStudent.email}</p>
                      </div>
                      <button onClick={() => setSelectedStudent(null)} className="text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Stats details */}
                    {(() => {
                      const stats = analytics[selectedStudent.id] || {
                        xpEarned: 0,
                        studyTime: 0,
                        assignmentsCompleted: 0,
                        testsTaken: 0,
                        quizAccuracy: 0,
                        totalQuestionsAttempted: 0,
                        totalQuestionsCorrect: 0,
                        submissions: [],
                        testScores: []
                      };
                      return (
                        <div className="space-y-5">
                          {/* Segmented control tabs */}
                          <div className="flex gap-1.5 bg-secondary/15 p-1 rounded-lg border border-border">
                            <button
                              type="button"
                              onClick={() => setSelectedStudentTab("analytics")}
                              className={`flex-1 py-1.5 text-[9px] font-mono uppercase tracking-wider rounded transition-all ${
                                selectedStudentTab === "analytics"
                                  ? "bg-primary text-primary-foreground font-bold shadow"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              Stats & Tests
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedStudentTab("submissions")}
                              className={`flex-1 py-1.5 text-[9px] font-mono uppercase tracking-wider rounded transition-all ${
                                selectedStudentTab === "submissions"
                                  ? "bg-primary text-primary-foreground font-bold shadow"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              Work ({stats.submissions?.length || 0})
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedStudentTab("chat")}
                              className={`flex-1 py-1.5 text-[9px] font-mono uppercase tracking-wider rounded transition-all ${
                                selectedStudentTab === "chat"
                                  ? "bg-primary text-primary-foreground font-bold shadow"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              Chat
                            </button>
                          </div>

                          {selectedStudentTab === "analytics" && (
                            <div className="space-y-5">
                              <p className="text-[9px] font-mono font-bold text-primary uppercase tracking-widest border-l-2 border-primary pl-2">Squad Specific Analytics</p>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-secondary/15 rounded-md border border-border/50 text-center">
                                  <Award className="w-4 h-4 text-primary mx-auto mb-1.5" />
                                  <p className="text-sm font-bold text-foreground">{stats.xpEarned}</p>
                                  <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-wider mt-0.5">Earned XP</p>
                                </div>
                                <div className="p-3 bg-secondary/15 rounded-md border border-border/50 text-center">
                                  <Clock className="w-4 h-4 text-primary mx-auto mb-1.5" />
                                  <p className="text-sm font-bold text-foreground">{stats.studyTime} MIN</p>
                                  <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-wider mt-0.5">Study Time</p>
                                </div>
                                <div className="p-3 bg-secondary/15 rounded-md border border-border/50 text-center">
                                  <Target className="w-4 h-4 text-primary mx-auto mb-1.5" />
                                  <p className="text-sm font-bold text-foreground">{stats.quizAccuracy}%</p>
                                  <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-wider mt-0.5">Test Accuracy</p>
                                </div>
                                <div className="p-3 bg-secondary/15 rounded-md border border-border/50 text-center">
                                  <CheckSquare className="w-4 h-4 text-primary mx-auto mb-1.5" />
                                  <p className="text-sm font-bold text-foreground">{stats.assignmentsCompleted}</p>
                                  <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-wider mt-0.5">Completed work</p>
                                </div>
                              </div>

                              <div className="border-t border-border/40 pt-4 space-y-2">
                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                  <span>Questions Answered:</span>
                                  <span className="font-mono text-foreground font-bold">{stats.totalQuestionsAttempted || 0}</span>
                                </div>
                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                  <span>Questions Correct:</span>
                                  <span className="font-mono text-green-600 font-bold">{stats.totalQuestionsCorrect || 0}</span>
                                </div>
                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                  <span>Tests Completed:</span>
                                  <span className="font-mono text-foreground font-bold">{stats.testsTaken || 0}</span>
                                </div>
                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                  <span>Last Active inside Squad:</span>
                                  <span className="font-mono text-foreground">{stats.lastActive ? new Date(stats.lastActive).toLocaleDateString() : "Never"}</span>
                                </div>
                              </div>

                              {/* Test Scores Review Deck */}
                              <div className="border-t border-border/40 pt-4 space-y-3">
                                <p className="text-[9px] font-mono font-bold text-primary uppercase tracking-widest border-l-2 border-primary pl-2">Practice Test Scores ({stats.testScores?.length || 0})</p>
                                {(!stats.testScores || stats.testScores.length === 0) ? (
                                  <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider text-center py-4 bg-secondary/5 border border-border/40 border-dashed rounded-md">No test scores recorded yet</p>
                                ) : (
                                  <div className="space-y-2.5">
                                    {stats.testScores.map((score, sIdx) => {
                                      const testObj = tests.find(t => t.id === score.testId);
                                      const scorePercent = Math.round((score.score / score.total) * 100);
                                      return (
                                        <div key={sIdx} className="p-3 bg-secondary/15 border border-border/40 rounded-lg flex justify-between items-center gap-3">
                                          <div className="min-w-0">
                                            <p className="text-xs font-bold text-foreground truncate">{testObj ? testObj.title : "Unknown Quiz"}</p>
                                            <p className="text-[9px] text-muted-foreground font-mono mt-0.5">{scorePercent}% Accuracy • {new Date(score.takenAt).toLocaleDateString()}</p>
                                          </div>
                                          <span className="text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded font-mono shrink-0">
                                            {score.score}/{score.total}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {selectedStudentTab === "submissions" && (
                            <div className="space-y-3">
                              <p className="text-[9px] font-mono font-bold text-primary uppercase tracking-widest border-l-2 border-primary pl-2">Work Submissions ({stats.submissions?.length || 0})</p>
                              {(!stats.submissions || stats.submissions.length === 0) ? (
                                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider text-center py-4 bg-secondary/5 border border-border/40 border-dashed rounded-md">No assignment submissions yet</p>
                              ) : (
                                <div className="space-y-3.5">
                                  {stats.submissions.map((sub, idx) => {
                                    const assignment = assignments.find(a => a.id === sub.assignmentId);
                                    const status = sub.status || "pending";
                                    return (
                                      <div key={idx} className="p-3 bg-secondary/15 border border-border/40 rounded-lg space-y-2.5">
                                        <div className="flex justify-between items-start gap-2">
                                          <div>
                                            <p className="text-xs font-bold text-foreground line-clamp-1">{assignment ? assignment.title : "Unknown Assignment"}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                              {status === "accepted" && (
                                                <span className="text-[8px] font-mono font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-200 uppercase">Approved</span>
                                              )}
                                              {status === "rejected" && (
                                                <span className="text-[8px] font-mono font-bold text-destructive bg-destructive/5 px-1.5 py-0.5 rounded border border-destructive/20 uppercase">Rejected</span>
                                              )}
                                              {status === "pending" && (
                                                <span className="text-[8px] font-mono font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 uppercase">Pending Review</span>
                                              )}
                                            </div>
                                          </div>
                                          <span className="text-[8px] text-muted-foreground font-mono shrink-0">{new Date(sub.submittedAt).toLocaleDateString()}</span>
                                        </div>
                                        
                                        {sub.text && (
                                          <p className="text-[11px] text-muted-foreground whitespace-pre-wrap p-2 bg-background border border-border/40 rounded-md italic">
                                            {sub.text}
                                          </p>
                                        )}
                                        
                                        {sub.feedback && (
                                          <p className="text-[10px] text-destructive bg-destructive/5 p-2 rounded-md border border-destructive/10">
                                            <strong className="font-bold">Feedback:</strong> {sub.feedback}
                                          </p>
                                        )}

                                        {sub.attachments && sub.attachments.length > 0 && (
                                          <div className="space-y-1.5 pt-1">
                                            <p className="text-[9px] font-mono text-muted-foreground font-bold uppercase">Attachments:</p>
                                            <div className="grid grid-cols-1 gap-1.5">
                                              {sub.attachments.map((att, attIdx) => {
                                                const isImage = att.type?.toLowerCase().includes("image") || 
                                                                att.name?.toLowerCase().endsWith(".jpg") || 
                                                                att.name?.toLowerCase().endsWith(".jpeg") || 
                                                                att.name?.toLowerCase().endsWith(".png") ||
                                                                att.name?.toLowerCase().endsWith(".gif");
                                                return (
                                                  <div key={attIdx} className="flex flex-col p-2 bg-background/50 border border-border/40 rounded-md gap-2">
                                                    <div className="flex items-center justify-between min-w-0">
                                                      <div className="flex items-center gap-1.5 min-w-0">
                                                        <Paperclip className="w-3 h-3 text-primary shrink-0" />
                                                        <span className="text-[9px] font-mono text-foreground truncate">{att.name}</span>
                                                      </div>
                                                      <a 
                                                        href={att.url} 
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        className="p-1 text-primary hover:bg-primary/10 rounded-md shrink-0 transition-colors"
                                                      >
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                      </a>
                                                    </div>
                                                    {isImage && (
                                                      <div className="border border-border/40 rounded overflow-hidden max-h-[120px] bg-black/5 flex justify-center">
                                                        <img 
                                                          src={att.url} 
                                                          alt={att.name} 
                                                          className="object-contain max-h-[120px] w-auto"
                                                        />
                                                      </div>
                                                    )}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        )}

                                        {status === "pending" && (
                                          <div className="flex gap-2 pt-2">
                                            <Button
                                              type="button"
                                              size="sm"
                                              onClick={() => handleReviewSubmission(selectedStudent.id, sub.assignmentId, "accept")}
                                              className="flex-1 h-8 bg-green-600 hover:bg-green-755 text-white font-mono text-[9px] uppercase tracking-wider rounded cursor-pointer"
                                            >
                                              Accept
                                            </Button>
                                            <Button
                                              type="button"
                                              size="sm"
                                              onClick={() => handleReviewSubmission(selectedStudent.id, sub.assignmentId, "reject")}
                                              className="flex-1 h-8 bg-destructive hover:bg-destructive/90 text-white font-mono text-[9px] uppercase tracking-wider rounded cursor-pointer"
                                            >
                                              Reject
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}

                          {selectedStudentTab === "chat" && (
                            <div className="space-y-4 flex flex-col h-[400px]">
                              {/* Message bubbles container */}
                              <div className="flex-1 overflow-y-auto space-y-3 p-2 bg-secondary/5 border border-border/40 rounded-lg max-h-[300px]">
                                {teacherChatMessages.length === 0 ? (
                                  <div className="h-full flex flex-col justify-center items-center text-center text-muted-foreground text-[10px] font-mono uppercase tracking-wider py-12">
                                    No chat history yet. Send a message to start direct chat.
                                  </div>
                                ) : (
                                  teacherChatMessages.map((msg) => {
                                    const isMe = msg.senderId === user?.uid;
                                    return (
                                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-lg p-2.5 text-[11px] leading-relaxed ${
                                          isMe 
                                            ? 'bg-primary text-primary-foreground font-bold rounded-tr-none shadow-sm' 
                                            : 'bg-secondary/25 text-foreground border border-border/30 rounded-tl-none font-medium'
                                        }`}>
                                          <div className="flex justify-between items-center gap-4 mb-0.5">
                                            <span className="font-mono text-[8px] font-bold opacity-80">{isMe ? 'You' : msg.senderName}</span>
                                            <span className="text-[7px] font-mono opacity-60">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                          </div>
                                          <p className="whitespace-pre-wrap">{msg.text}</p>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                                <div ref={teacherChatEndRef} />
                              </div>

                              {/* Input panel */}
                              <form onSubmit={handleSendTeacherChat} className="flex gap-2">
                                <Input
                                  required
                                  value={teacherChatText}
                                  onChange={e => setTeacherChatText(e.target.value)}
                                  placeholder="Reply to student..."
                                  className="bg-secondary/20 border-border text-xs rounded-md h-9"
                                  disabled={sendingTeacherChat}
                                />
                                <Button 
                                  type="submit" 
                                  disabled={sendingTeacherChat || !teacherChatText.trim()}
                                  className="h-9 w-9 p-0 bg-primary text-primary-foreground hover:bg-primary/95 flex items-center justify-center shrink-0 rounded-md cursor-pointer"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </Button>
                              </form>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </Card>
              ) : (
                <Card className="p-6 border-border bg-card rounded-lg border-dashed text-center flex flex-col justify-center items-center py-16 text-muted-foreground text-xs font-mono uppercase tracking-wider leading-relaxed">
                  <Eye className="w-8 h-8 text-muted-foreground/30 mb-3" />
                  Select a student from roster <br /> to inspect analytics
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Notes & Study Materials */}
        {activeTab === "notes" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload Material Form */}
            <Card className="p-6 border-border bg-card rounded-lg shadow-sm">
              <h3 className="text-xs font-mono uppercase tracking-widest text-primary font-bold mb-6">Upload Notes / Slides</h3>
              <form onSubmit={handleUploadNote} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground">Note Title</label>
                  <Input 
                    required 
                    value={noteTitle} 
                    onChange={e => setNoteTitle(e.target.value)} 
                    placeholder="e.g. Lecture 1: Quantum Tunnelling"
                    className="bg-secondary/20 border-border text-xs rounded-md h-10 focus:border-primary/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground">File Selection (pdf, docx, txt, etc.)</label>
                  <div className="border border-border border-dashed rounded-lg p-5 text-center bg-secondary/5 hover:bg-secondary/10 transition-colors cursor-pointer relative">
                    <input 
                      type="file" 
                      required 
                      ref={fileInputRef} 
                      onChange={e => setNoteFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="w-5 h-5 text-primary mx-auto mb-2" />
                    <p className="text-[10px] font-bold text-foreground truncate">{noteFile ? noteFile.name : "Choose notes document..."}</p>
                    <p className="text-[8px] text-muted-foreground mt-0.5 font-mono uppercase">Max size 20MB</p>
                  </div>
                </div>

                {uploadProgress !== null && (
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-[9px] font-mono text-muted-foreground font-bold">
                      <span>UPLOADING FILE...</span>
                      <span className="text-primary">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-secondary/50 rounded-full h-1 overflow-hidden border border-border/50">
                      <div className="h-full bg-primary" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={uploadingNote || !noteFile || !noteTitle.trim()} 
                  className="w-full h-11 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest disabled:opacity-50"
                >
                  {uploadingNote ? "Uploading note..." : "Upload Material"}
                </Button>
              </form>
            </Card>

            {/* List of notes */}
            <Card className="lg:col-span-2 p-0 border-border bg-card rounded-lg overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border bg-secondary/10">
                <span className="text-xs font-mono uppercase tracking-widest text-primary font-bold">Notes Repository ({notes.length})</span>
              </div>

              {notes.length === 0 ? (
                <div className="p-16 text-center text-xs font-mono text-muted-foreground uppercase tracking-widest">
                  No materials uploaded yet.
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {notes.map((note) => (
                    <div key={note.id} className="flex items-center justify-between p-4 hover:bg-secondary/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-lg text-primary shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-foreground truncate">{note.title}</p>
                          <p className="text-[9px] text-muted-foreground font-mono mt-0.5 truncate uppercase">
                            {note.fileType} • {note.fileName}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a href={note.fileUrl} target="_blank" rel="noreferrer">
                          <Button variant="outline" size="icon" className="h-8 w-8 border-border hover:bg-secondary/15">
                            <Download className="w-3.5 h-3.5 text-foreground" />
                          </Button>
                        </a>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteNote(note.id, note.fileUrl)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Tab 3: Assignments */}
        {activeTab === "assignments" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create Assignment Form */}
            <Card className="p-6 border-border bg-card rounded-lg shadow-sm">
              <h3 className="text-xs font-mono uppercase tracking-widest text-primary font-bold mb-6">Assign Class Work</h3>
              <form onSubmit={handleCreateAssignment} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground">Work Title</label>
                  <Input 
                    required 
                    value={assignTitle} 
                    onChange={e => setAssignTitle(e.target.value)} 
                    placeholder="e.g. Solve Practice Set 2"
                    className="bg-secondary/20 border-border text-xs rounded-md h-10 focus:border-primary/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground">Instructions / Description</label>
                  <textarea 
                    value={assignDesc} 
                    onChange={e => setAssignDesc(e.target.value)} 
                    placeholder="Provide assignment description, references, and what details you want student to submit..."
                    className="w-full min-h-[96px] text-xs bg-secondary/20 border border-border rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground">XP Reward</label>
                    <Input 
                      type="number" 
                      required 
                      value={assignXp} 
                      onChange={e => setAssignXp(Number(e.target.value))} 
                      className="bg-secondary/20 border-border text-xs rounded-md h-10 focus:border-primary/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground">Due Date</label>
                    <Input 
                      type="date" 
                      required 
                      value={assignDueDate} 
                      onChange={e => setAssignDueDate(e.target.value)} 
                      className="bg-secondary/20 border-border text-xs rounded-md h-10 focus:border-primary/50"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={creatingAssignment || !assignTitle.trim() || !assignDueDate} 
                  className="w-full h-11 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest mt-2 disabled:opacity-50"
                >
                  {creatingAssignment ? "Assigning work..." : "Assign Work"}
                </Button>
              </form>
            </Card>

            {/* List of Assignments */}
            <Card className="lg:col-span-2 p-0 border-border bg-card rounded-lg overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border bg-secondary/10">
                <span className="text-xs font-mono uppercase tracking-widest text-primary font-bold">Assigned Tasks ({assignments.length})</span>
              </div>

              {assignments.length === 0 ? (
                <div className="p-16 text-center text-xs font-mono text-muted-foreground uppercase tracking-widest">
                  No assignments listed yet.
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {assignments.map((assign) => (
                    <div key={assign.id} className="p-4 hover:bg-secondary/10 transition-colors flex justify-between items-start gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-lg text-primary shrink-0 mt-1">
                          <CheckSquare className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-foreground truncate">{assign.title}</p>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{assign.desc || "No instructions provided."}</p>
                          <div className="flex flex-wrap items-center gap-3 mt-3.5 text-[9px] font-mono font-bold uppercase text-muted-foreground">
                            <span className="flex items-center gap-1 text-primary"><Award className="w-3 h-3 text-primary" /> +{assign.xpReward} XP</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-amber-600"><Calendar className="w-3 h-3 text-amber-500" /> Due: {assign.dueDate}</span>
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteAssignment(assign.id)}
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 mt-1 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Tab 4: Conduct Tests */}
        {activeTab === "tests" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Create Test Form (Test Builder) */}
            <Card className="lg:col-span-2 p-6 border-border bg-card rounded-lg shadow-sm h-fit">
              <h3 className="text-xs font-mono uppercase tracking-widest text-primary font-bold mb-6">Class Test Creator</h3>
              <form onSubmit={handleCreateTest} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground">Test Title</label>
                    <Input 
                      required 
                      value={testTitle} 
                      onChange={e => setTestTitle(e.target.value)} 
                      placeholder="e.g. Chapter 1 Quiz"
                      className="bg-secondary/20 border-border text-xs rounded-md h-10"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground">XP Reward</label>
                    <Input 
                      type="number" 
                      required 
                      value={testXp} 
                      onChange={e => setTestXp(Number(e.target.value))} 
                      className="bg-secondary/20 border-border text-xs rounded-md h-10"
                    />
                  </div>
                </div>

                {/* Questions list editor */}
                <div className="space-y-6 border-t border-border/40 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-muted-foreground">Questions ({testQuestions.length})</span>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={handleAddQuestion}
                      className="h-8 border-primary/30 text-primary hover:bg-primary/5 text-[10px] font-mono uppercase tracking-wider"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add
                    </Button>
                  </div>

                  <div className="space-y-6 divide-y divide-border/40 max-h-[360px] overflow-y-auto pr-1">
                    {testQuestions.map((q, qIdx) => (
                      <div key={qIdx} className={`space-y-3 ${qIdx > 0 ? 'pt-5' : ''}`}>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-mono font-bold text-primary">QUESTION {qIdx + 1}</span>
                          {testQuestions.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => handleRemoveQuestion(qIdx)}
                              className="text-[9px] text-destructive hover:underline font-mono uppercase"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <Input 
                          required 
                          value={q.question} 
                          onChange={e => handleUpdateQuestionText(qIdx, e.target.value)} 
                          placeholder="Enter quiz question prompt..."
                          className="bg-secondary/20 border-border text-xs rounded-md h-9"
                        />

                        {/* Options grid */}
                        <div className="grid grid-cols-2 gap-2">
                          {q.options.map((opt, oIdx) => (
                            <Input 
                              key={oIdx}
                              required 
                              value={opt} 
                              onChange={e => handleUpdateOption(qIdx, oIdx, e.target.value)} 
                              placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                              className="bg-secondary/10 border-border/70 text-[11px] rounded-md h-8"
                            />
                          ))}
                        </div>

                        <div className="space-y-1 pt-1">
                          <label className="text-[8px] font-mono tracking-wider uppercase text-muted-foreground">Correct Option</label>
                          <select
                            value={q.correctOptionIndex}
                            onChange={e => handleUpdateCorrectIndex(qIdx, e.target.value)}
                            className="w-full bg-secondary/20 border border-border rounded-md px-2.5 py-1.5 text-[11px] focus:outline-none cursor-pointer"
                          >
                            <option value={0}>Option A</option>
                            <option value={1}>Option B</option>
                            <option value={2}>Option C</option>
                            <option value={3}>Option D</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={creatingTest || !testTitle.trim() || testQuestions.some(q => !q.question.trim())} 
                  className="w-full h-11 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest disabled:opacity-50"
                >
                  {creatingTest ? "Conducting test..." : "Publish Test"}
                </Button>
              </form>
            </Card>

            {/* List of Published Tests */}
            <Card className="lg:col-span-3 p-0 border-border bg-card rounded-lg overflow-hidden shadow-sm h-fit">
              <div className="p-4 border-b border-border bg-secondary/10">
                <span className="text-xs font-mono uppercase tracking-widest text-primary font-bold">Classroom Tests ({tests.length})</span>
              </div>

              {tests.length === 0 ? (
                <div className="p-16 text-center text-xs font-mono text-muted-foreground uppercase tracking-widest">
                  No tests conducted yet.
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {tests.map((test) => (
                    <div key={test.id} className="p-4 hover:bg-secondary/10 transition-colors flex justify-between items-start gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-lg text-primary shrink-0 mt-1">
                          <Brain className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-foreground truncate">{test.title}</p>
                          <p className="text-[10px] text-muted-foreground font-mono mt-1 uppercase tracking-wider">{test.questions?.length || 0} Questions</p>
                          <div className="flex items-center gap-3 mt-3 text-[9px] font-mono font-bold uppercase text-muted-foreground">
                            <span className="flex items-center gap-1 text-primary"><Award className="w-3 h-3 text-primary" /> +{test.xpReward} XP</span>
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteTest(test.id)}
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 mt-1 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}
