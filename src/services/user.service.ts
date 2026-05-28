import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';

export class UserService {
  static async getUserProfile(uid: string, email: string, displayName?: string) {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      const newUser = {
        id: uid,
        email,
        displayName: displayName || email.split('@')[0],
        xp: 0,
        level: 1,
        rank: 'Rookie',
        streak: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(userRef, newUser);
      return newUser;
    }
    
    return userSnap.data();
  }

  static async updateStreak(uid: string) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      streak: increment(1),
      updatedAt: new Date().toISOString()
    });
  }
}

