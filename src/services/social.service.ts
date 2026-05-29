import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, arrayUnion } from 'firebase/firestore';

export class SocialService {
  static async getSquads(ownerId?: string) {
    const squadsRef = collection(db, 'squads');
    let q = query(squadsRef);
    if (ownerId) {
      q = query(squadsRef, where('ownerId', '==', ownerId));
    }
    
    const snapshot = await getDocs(q);
    const squads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

    // Fetch all users to calculate accurate member count and XP
    const usersRef = collection(db, 'users');
    const usersSnap = await getDocs(usersRef);
    const allUsers = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

    const mappedSquads = squads.map(s => {
      const members = allUsers.filter(u => u.squadId === s.id || (u.squadIds && u.squadIds.includes(s.id)));
      const realXp = members.reduce((acc, m) => acc + (m.xp || 0), 0);
      return {
        ...s,
        totalXp: realXp,
        _count: { members: members.length },
        members: members.map(m => ({
          id: m.id,
          displayName: m.displayName,
          xp: m.xp,
          level: m.level,
          rank: m.rank,
          quizAccuracy: m.quizAccuracy
        }))
      };
    });

    mappedSquads.sort((a, b) => b.totalXp - a.totalXp);
    return mappedSquads;
  }

  static async joinSquad(userId: string, inviteCode: string) {
    const squadsRef = collection(db, 'squads');
    const q = query(squadsRef, where('inviteCode', '==', inviteCode));
    const snap = await getDocs(q);
    
    if (snap.empty) throw new Error("Invalid invite code");
    const squad = snap.docs[0];
    
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { 
      squadId: squad.id, // Keep for legacy
      squadIds: arrayUnion(squad.id) 
    });
    
    return { id: userId, squadId: squad.id, squadIds: [squad.id] };
  }

  static async createSquad(ownerId: string, name: string, desc: string) {
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newSquadRef = doc(collection(db, 'squads'));
    
    const squadData = {
      name,
      desc,
      ownerId,
      inviteCode,
      totalXp: 0,
      createdAt: new Date().toISOString()
    };
    
    await setDoc(newSquadRef, squadData);
    return { id: newSquadRef.id, ...squadData };
  }

  static async updateSquad(squadId: string, name: string, desc: string) {
    const squadRef = doc(db, 'squads', squadId);
    await updateDoc(squadRef, { name, desc });
    return { id: squadId, name, desc };
  }

  static async deleteSquad(squadId: string) {
    // Remove all members
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('squadId', '==', squadId));
    const snap = await getDocs(q);
    
    const updatePromises = snap.docs.map(userDoc => 
      updateDoc(doc(db, 'users', userDoc.id), { squadId: null })
    );
    await Promise.all(updatePromises);
    
    await deleteDoc(doc(db, 'squads', squadId));
    return { success: true };
  }

  static async removeMember(squadId: string, userId: string) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { squadId: null });
    return { success: true };
  }
}

