import { NextResponse } from 'next/server';
import { UserService } from '@/services/user.service';

export async function POST(req: Request) {
  try {
    const { uid, email, displayName, xp, level, rank } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: 'Missing UID' }, { status: 400 });
    }

    // Ensure user exists in Prisma DB
    await UserService.getUserProfile(uid, email || `${uid}@placeholder.com`, displayName);

    // Sync XP, Level, Rank from client-side Firebase state to secure Firestore DB
    if (xp !== undefined) {
      const { db } = await import('@/lib/firebase');
      const { doc, updateDoc } = await import('firebase/firestore');
      
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        xp: Number(xp),
        level: Number(level || 1),
        rank: rank || 'Rookie',
        updatedAt: new Date().toISOString()
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Route Error (gamification-sync):', error);
    return NextResponse.json({ error: 'Failed to sync gamification stats' }, { status: 500 });
  }
}
