import { NextResponse } from 'next/server';
import { UserService } from '@/services/user.service';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { uid, email, displayName, xp, level, rank } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: 'Missing UID' }, { status: 400 });
    }

    // Ensure user exists in Prisma DB
    await UserService.getUserProfile(uid, email || `${uid}@placeholder.com`, displayName);

    // Sync XP, Level, Rank from client-side Firebase state to secure Prisma DB
    if (xp !== undefined) {
      await prisma.user.update({
        where: { id: uid },
        data: {
          xp: Number(xp),
          level: Number(level || 1),
          rank: rank || 'Rookie',
          updatedAt: new Date()
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Route Error (gamification-sync):', error);
    return NextResponse.json({ error: 'Failed to sync gamification stats' }, { status: 500 });
  }
}
