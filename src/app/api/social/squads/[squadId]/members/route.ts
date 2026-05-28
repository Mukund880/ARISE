import { NextResponse } from 'next/server';
import { SocialService } from '@/services/social.service';

export async function DELETE(req: Request, { params }: { params: Promise<{ squadId: string }> }) {
  try {
    const { squadId } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    await SocialService.removeMember(squadId, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Route Error (remove member):', error);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
