import { NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service';

export async function POST(req: Request) {
  try {
    const { squadId, topicTitle, level, goal } = await req.json();

    if (!squadId || !topicTitle || !level || !goal) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { db } = await import('@/lib/firebase');
    const { doc, getDoc, collection, query, where, getDocs, setDoc } = await import('firebase/firestore');

    // 1. Fetch squad and its members
    const squadRef = doc(db, 'squads', squadId);
    const squadSnap = await getDoc(squadRef);

    if (!squadSnap.exists()) {
      return NextResponse.json({ error: 'Squad not found' }, { status: 404 });
    }
    const squad = squadSnap.data();

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('squadId', '==', squadId));
    const membersSnap = await getDocs(q);
    const members = membersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (members.length === 0) {
      return NextResponse.json({ error: 'Cannot generate syllabus for an empty squad.' }, { status: 400 });
    }

    // 2. Generate roadmap structure once
    console.log(`Generating AI Syllabus for Squad ${squad.name}: ${topicTitle}`);
    const roadmap = await aiService.generatePersonalizedRoadmap(topicTitle, level, goal);

    // 3. Distribute to all members
    const distributions = [];
    const topicsRef = collection(db, 'topics');
    const modulesRef = collection(db, 'modules');

    for (const member of members) {
      const topicDocRef = doc(topicsRef);
      await setDoc(topicDocRef, {
        userId: member.id,
        title: topicTitle,
        level,
        goal,
        progress: 0,
        createdAt: new Date().toISOString()
      });

      const modulePromises = roadmap.map(async (mod: any, index: number) => {
        const modRef = doc(modulesRef);
        await setDoc(modRef, {
          topicId: topicDocRef.id,
          title: mod.title,
          duration: mod.duration || "30m",
          xp: mod.xp || 100,
          order: index,
          isCompleted: false,
          createdAt: new Date().toISOString()
        });
      });
      await Promise.all(modulePromises);

      distributions.push({
        userId: member.id,
        topicId: topicDocRef.id
      });
    }

    return NextResponse.json({
      success: true,
      message: `Syllabus distributed to ${members.length} students.`,
      distributions,
      roadmap
    });
  } catch (error) {
    console.error('API Route Error (squad syllabus):', error);
    return NextResponse.json({ error: 'Failed to generate squad syllabus' }, { status: 500 });
  }
}

