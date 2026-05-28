import { NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { squadId, topicTitle, level, goal } = await req.json();

    if (!squadId || !topicTitle || !level || !goal) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Fetch squad and its members
    const squad = await prisma.squad.findUnique({
      where: { id: squadId },
      include: { members: true }
    });

    if (!squad) {
      return NextResponse.json({ error: 'Squad not found' }, { status: 404 });
    }

    if (squad.members.length === 0) {
      return NextResponse.json({ error: 'Cannot generate syllabus for an empty squad.' }, { status: 400 });
    }

    // 2. Generate roadmap structure once
    console.log(`Generating AI Syllabus for Squad ${squad.name}: ${topicTitle}`);
    const roadmap = await aiService.generatePersonalizedRoadmap(topicTitle, level, goal);

    // 3. Distribute to all members
    const distributions = [];
    for (const member of squad.members) {
      const topic = await prisma.topic.create({
        data: {
          userId: member.id,
          title: topicTitle,
          level,
          goal,
          progress: 0,
        }
      });

      const modulesData = roadmap.map((mod: any, index: number) => ({
        topicId: topic.id,
        title: mod.title,
        duration: mod.duration || "30m",
        xp: mod.xp || 100,
        order: index,
        isCompleted: false,
      }));

      await prisma.module.createMany({
        data: modulesData
      });

      distributions.push({
        userId: member.id,
        topicId: topic.id
      });
    }

    return NextResponse.json({
      success: true,
      message: `Syllabus distributed to ${squad.members.length} students.`,
      distributions,
      roadmap
    });
  } catch (error) {
    console.error('API Route Error (squad syllabus):', error);
    return NextResponse.json({ error: 'Failed to generate squad syllabus' }, { status: 500 });
  }
}
