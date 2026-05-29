"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userProfile: any | null;
  role: 'student' | 'teacher' | null;
  setRole: (role: 'student' | 'teacher') => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, userProfile: null, role: null, setRole: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [role, setRoleState] = useState<'student' | 'teacher' | null>(null);
  const [loading, setLoading] = useState(true);

  const setRole = async (newRole: 'student' | 'teacher') => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { role: newRole });
      setRoleState(newRole);
    } catch (err) {
      console.error("Error setting role:", err);
      throw err;
    }
  };

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }

        setUser(currentUser);
        
        if (currentUser) {
          const userRef = doc(db, 'users', currentUser.uid);
          
          // Perform one-time streak check and metrics initialization on login
          try {
            const initialSnap = await getDoc(userRef);
            if (initialSnap.exists()) {
              const data = initialSnap.data();
              const today = new Date().toDateString();
              const lastLoginDate = data.lastLoginDate;
              
              const updates: any = {};
              
              // Ensure metrics fields are initialized in database
              if (data.studyTime === undefined) updates.studyTime = 0;
              if (data.quizAccuracy === undefined) updates.quizAccuracy = 0;
              if (data.quizQuestionsAnswered === undefined) updates.quizQuestionsAnswered = 0;
              if (data.quizQuestionsCorrect === undefined) updates.quizQuestionsCorrect = 0;
              
              if (lastLoginDate !== today) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toDateString();
                
                let newStreak = data.streak || 1;
                if (lastLoginDate === yesterdayStr) {
                  newStreak += 1;
                } else {
                  newStreak = 1;
                }
                
                updates.streak = newStreak;
                updates.lastLoginDate = today;
                updates.lastLogin = new Date().toISOString();
              }
              
              if (Object.keys(updates).length > 0) {
                await updateDoc(userRef, updates);
              }
            }
          } catch (streakErr) {
            console.error("Error updating streak/metrics on login:", streakErr);
          }

          // Register real-time listener for updates
          unsubscribeProfile = onSnapshot(userRef, async (snapshot) => {
            if (snapshot.exists()) {
              const profileData = snapshot.data();
              setUserProfile(profileData);
              setRoleState(profileData.role || null);
            } else {
              // Initialize new user profile if doc does not exist yet
              const initialProfile = {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName || 'New Scholar',
                role: null, // Role will be set after user selects
                xp: 0,
                level: 1,
                rank: 'Rookie',
                streak: 1,
                subscriptionTier: 'scholar',
                studyTime: 0,
                quizAccuracy: 0,
                quizQuestionsAnswered: 0,
                quizQuestionsCorrect: 0,
                lastLoginDate: new Date().toDateString(),
                lastLogin: new Date().toISOString(),
                joinedAt: new Date().toISOString()
              };
              await setDoc(userRef, initialProfile);
              setUserProfile(initialProfile);
              setRoleState(null);
            }
          }, (err) => {
            console.error("Firestore onSnapshot error:", err);
          });
        } else {
          setUserProfile(null);
          setRoleState(null);
        }
      } catch (err) {
        console.error("Error loading user profile from Firestore:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, userProfile, role, setRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
