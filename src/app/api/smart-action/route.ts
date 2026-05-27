import { NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service';

export async function POST(req: Request) {
  try {
    const { text, action, context } = await req.json();

    if (!text || !action) {
      return NextResponse.json({ error: 'Missing text or action' }, { status: 400 });
    }

    const prompt = `
      You are an expert AI tutor helping a student learn about "${context}".
      The student has highlighted the following text from their lesson:
      "${text}"
      
      They have requested the following action: "${action}".
      
      Provide a concise, helpful, and highly accurate response. Use simple formatting (no heavy markdown, just plain text or simple bullet points) so it fits well in a small tooltip UI. Keep it under 150 words if possible.
    `;

    const res = await aiService.llm.invoke(prompt);
    
    return NextResponse.json({ result: res.content.toString().trim() });
  } catch (error) {
    console.error('API Route Error (smart-action):', error);
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}
