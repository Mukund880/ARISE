// Firestore Data Models

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  xp: number;
  level: number;
  rank: 'Rookie' | 'Explorer' | 'Scholar' | 'Master' | 'Legend';
  streak: number;
  lastLogin: Date;
  joinedAt: Date;
}

export interface Topic {
  id: string;
  userId: string;
  title: string;
  goal: string;
  knowledgeLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  progress: number;
  createdAt: Date;
  sourceFiles: string[]; // URLs to Firebase Storage
}

export interface Module {
  id: string;
  topicId: string;
  title: string;
  description: string;
  status: 'locked' | 'active' | 'completed';
  xpReward: number;
  order: number;
  estimatedTime: string;
  content: {
    type: 'text' | 'video' | 'quiz' | 'interactive';
    data: any;
  }[];
}

export interface Quiz {
  id: string;
  moduleId: string;
  questions: {
    question: string;
    options: string[];
    correctAnswerIndex: number;
    explanation: string;
  }[];
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  photoURL: string;
  xp: number;
  rank: number;
}
