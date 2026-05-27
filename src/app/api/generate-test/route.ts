import { NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service';

export async function POST(req: Request) {
  try {
    const { topicTitle, level } = await req.json();

    if (!topicTitle) {
      return NextResponse.json({ error: 'Missing topic' }, { status: 400 });
    }

    const prompt = `
      You are an expert examiner. Generate a comprehensive final test for the topic: "${topicTitle}".
      The user's level is: ${level}.
      
      Generate exactly 5 questions. Mix Multiple Choice Questions (MCQ) and Short Answer (FillInBlank) types.
      Make the questions challenging enough to test deep understanding, but fair for their level.
      
      Format the output strictly as a JSON array of question objects. Do not include markdown codeblocks or any other text.
      Each question object must match one of these structures depending on its type:
      
      For MCQ:
      {
        "type": "MCQ",
        "question": "The question text...",
        "options": ["Opt A", "Opt B", "Opt C", "Opt D"],
        "correctIndex": 0
      }
      
      For FillInBlank:
      {
        "type": "FillInBlank",
        "question": "The sentence with exactly one ______ blank.",
        "answer": "The exact word or short phrase for the blank"
      }
    `;

    const res = await aiService.llm.invoke(prompt);
    
    let content = res.content.toString().trim();
    if (content.startsWith("\`\`\`json")) content = content.slice(7);
    if (content.startsWith("\`\`\`")) content = content.slice(3);
    if (content.endsWith("\`\`\`")) content = content.slice(0, -3);

    const questions = JSON.parse(content.trim());
    return NextResponse.json({ questions });
  } catch (error) {
    console.error('API Route Error (generate-test):', error);
    return NextResponse.json({ error: 'Failed to generate test' }, { status: 500 });
  }
}
