import { NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service';

export async function POST(req: Request) {
  try {
    const { topicTitle, moduleTitle, aidType } = await req.json();

    if (!topicTitle || !moduleTitle || !aidType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const prompt = `
      You are an expert educator.
      The student is studying a module called "${moduleTitle}" within the broader topic of "${topicTitle}".
      They have requested a learning aid of type: "${aidType}".
      
      Generate a highly organized, easy-to-read ${aidType} for this specific module.
      If it's a Cheat Sheet, provide bullet points of syntax/formulas/rules.
      If it's a Summary Table, format it as an ASCII/Markdown table.
      If it's a Concept Map, provide a structured text hierarchy using indentation.
      
      Do not include chatty text, just the requested structured output.
    `;

    const res = await aiService.llm.invoke(prompt);
    
    let content = res.content.toString().trim();
    if (content.startsWith("\`\`\`")) {
      content = content.replace(/\`\`\`(markdown)?/g, "").trim();
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error('API Route Error (learning-aids):', error);
    return NextResponse.json({ error: 'Failed to generate learning aid' }, { status: 500 });
  }
}
