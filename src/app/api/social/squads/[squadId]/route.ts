import { NextResponse } from 'next/server';
import { SocialService } from '@/services/social.service';

export async function PUT(req: Request, { params }: { params: Promise<{ squadId: string }> }) {
  try {
    const { squadId } = await params;
    const { name, desc } = await req.json();
    
    if (!name || !desc) {
      return NextResponse.json({ error: 'Missing name or desc' }, { status: 400 });
    }

    const updatedSquad = await SocialService.updateSquad(squadId, name, desc);
    return NextResponse.json(updatedSquad);
  } catch (error) {
    console.error('API Route Error (update squad):', error);
    return NextResponse.json({ error: 'Failed to update squad' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ squadId: string }> }) {
  try {
    const { squadId } = await params;
    await SocialService.deleteSquad(squadId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Route Error (delete squad):', error);
    return NextResponse.json({ error: 'Failed to delete squad' }, { status: 500 });
  }
}
