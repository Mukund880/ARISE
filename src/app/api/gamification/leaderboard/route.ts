import { NextResponse } from 'next/server';
import { GamificationService } from '@/services/gamification.service';

export async function GET() {
  try {
    const leaderboard = await GamificationService.getLeaderboard(10);
    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('API Route Error (leaderboard):', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
