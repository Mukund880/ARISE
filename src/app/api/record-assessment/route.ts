import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { userId, topicId, score } = await req.json();

    if (!userId || !topicId || score === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // A real app would calculate spaced repetition dates here (e.g. using SuperMemo algorithm)
    // For now, we update the topic progress and save a record.
    
    // Save to relational DB
    await prisma.topic.update({
      where: { id: topicId },
      data: {
        progress: 100
      }
    }).catch(() => null); // Catch in case the topic isn't synced to Prisma yet since we use Firestore heavily right now.

    return NextResponse.json({ success: true, spacedRepetitionDate: new Date(Date.now() + 86400000) }); // +1 day
  } catch (error) {
    console.error('API Route Error (record-assessment):', error);
    return NextResponse.json({ error: 'Failed to record assessment' }, { status: 500 });
  }
}
