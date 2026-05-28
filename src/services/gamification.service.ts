import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, query, orderBy, limit, getDocs, increment } from 'firebase/firestore';

export class GamificationService {
  static async addXp(userId: string, amount: number) {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) throw new Error("User not found");

    const userData = userSnap.data();
    const newXp = (userData.xp || 0) + amount;
    const newLevel = Math.floor(newXp / 1000) + 1;
    
    let newRank = "Rookie";
    if (newLevel >= 15) newRank = "Grandmaster";
    else if (newLevel >= 10) newRank = "Master";
    else if (newLevel >= 5) newRank = "Scholar";

    // If user is in a squad, update squad's total XP too
    if (userData.squadId) {
      try {
        const squadRef = doc(db, 'squads', userData.squadId);
        await updateDoc(squadRef, {
          totalXp: increment(amount)
        });
      } catch (err) {
        console.error("Failed to update squad total XP:", err);
      }
    }

    await updateDoc(userRef, {
      xp: newXp,
      level: newLevel,
      rank: newRank,
      updatedAt: new Date().toISOString()
    });
    
    return { ...userData, xp: newXp, level: newLevel, rank: newRank };
  }

  static async getLeaderboard(limitNum: number = 10) {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('xp', 'desc'), limit(limitNum));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      displayName: doc.data().displayName,
      xp: doc.data().xp,
      level: doc.data().level,
      rank: doc.data().rank,
      streak: doc.data().streak
    }));
  }
}


