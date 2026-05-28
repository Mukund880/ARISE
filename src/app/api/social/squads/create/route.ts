import { NextResponse } from 'next/server';
import { SocialService } from '@/services/social.service';

export async function POST(req: Request) {
  try {
    const { ownerId, name, desc } = await req.json();
    if (!ownerId || !name || !desc) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const squad = await SocialService.createSquad(ownerId, name, desc);
    return NextResponse.json(squad);
  } catch (error) {
    console.error('API Route Error (create squad):', error);
    return NextResponse.json({ error: 'Failed to create squad' }, { status: 500 });
  }
}
