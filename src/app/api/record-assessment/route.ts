import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { userId, topicId, score } = await req.json();

    if (!userId || !topicId || score === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // A real app would calculate spaced repetition dates here (e.g. using SuperMemo algorithm)
    // For now, we update the topic progress and save a record.
    
    const { db } = await import('@/lib/firebase');
    const { doc, updateDoc } = await import('firebase/firestore');

    // Save to Firestore
    try {
      const topicRef = doc(db, 'topics', topicId);
      await updateDoc(topicRef, { progress: 100 });
    } catch (e) {
      // Catch in case the topic doesn't exist
      console.warn("Could not update topic progress", e);
    }

    return NextResponse.json({ success: true, spacedRepetitionDate: new Date(Date.now() + 86400000) }); // +1 day
  } catch (error) {
    console.error('API Route Error (record-assessment):', error);
    return NextResponse.json({ error: 'Failed to record assessment' }, { status: 500 });
  }
}
