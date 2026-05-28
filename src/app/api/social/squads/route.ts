import { NextResponse } from 'next/server';
import { SocialService } from '@/services/social.service';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ownerId = searchParams.get("ownerId") || undefined;
    
    const squads = await SocialService.getSquads(ownerId);
    return NextResponse.json(squads);
  } catch (error) {
    console.error('API Route Error (squads):', error);
    return NextResponse.json({ error: 'Failed to fetch squads' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId, squadId } = await req.json();
    if (!userId || !squadId) {
      return NextResponse.json({ error: 'Missing userId or squadId' }, { status: 400 });
    }
    const updatedUser = await SocialService.joinSquad(userId, squadId);
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('API Route Error (join squad):', error);
    return NextResponse.json({ error: 'Failed to join squad' }, { status: 500 });
  }
}

