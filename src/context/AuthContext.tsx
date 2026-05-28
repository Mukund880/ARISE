"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userProfile: any | null;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, userProfile: null });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

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
          // Fetch or create user profile in Firestore and listen in real-time
          const userRef = doc(db, 'users', currentUser.uid);
          
          unsubscribeProfile = onSnapshot(userRef, async (snapshot) => {
            if (snapshot.exists()) {
              setUserProfile(snapshot.data());
            } else {
              // Initialize new user profile if doc does not exist yet
              const initialProfile = {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName || 'New Scholar',
                xp: 0,
                level: 1,
                rank: 'Rookie',
                streak: 1,
                subscriptionTier: 'scholar',
                lastLogin: new Date(),
                joinedAt: new Date()
              };
              await setDoc(userRef, initialProfile);
              setUserProfile(initialProfile);
            }
          }, (err) => {
            console.error("Firestore onSnapshot error:", err);
          });
        } else {
          setUserProfile(null);
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
    <AuthContext.Provider value={{ user, loading, userProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
