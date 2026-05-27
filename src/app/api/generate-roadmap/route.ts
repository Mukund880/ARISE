import { NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { topicId, topic, knowledgeLevel, goal } = body;

    if (!topic || !knowledgeLevel || !goal) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log(`Generating AI Roadmap for: ${topic} (${knowledgeLevel}) - Goal: ${goal}`);
    
    const roadmap = await aiService.generatePersonalizedRoadmap(topic, knowledgeLevel, goal, topicId);

    return NextResponse.json({
      topic,
      roadmap
    });
  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: 'Failed to generate roadmap' }, { status: 500 });
  }
}
