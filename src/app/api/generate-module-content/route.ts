import { NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { topicTitle, moduleTitle, level, goal } = body;

    if (!topicTitle || !moduleTitle || !level || !goal) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log(`Generating AI Content for Module: ${moduleTitle} (Topic: ${topicTitle})`);
    
    const prompt = `
      You are an expert AI tutor. 
      Generate a detailed explanation and a practice exercise for the module: "${moduleTitle}" which belongs to the topic: "${topicTitle}".
      
      The practice exercise should randomly be either a Multiple Choice Question (MCQ) or a Fill-In-The-Blanks exercise.
      
      Format the output strictly as a JSON object with the following structure:
      {
        "explanation": "A detailed, engaging markdown explanation of the module. Include bullet points, analogies, and code snippets if relevant.",
        "exerciseType": "MCQ" or "FillInBlank",
        "quizQuestion": "The question to ask (if MCQ)",
        "quizOptions": ["Option A", "Option B", "Option C", "Option D"], // Provide if MCQ
        "correctOptionIndex": 0, // Provide if MCQ (0-3)
        "fillBlankQuestion": "The sentence with _____ where the blank is (if FillInBlank)",
        "fillBlankAnswer": "The exact word or phrase that goes in the blank (if FillInBlank)",
        "hint": "A helpful hint for the exercise."
      }
      
      Do not include markdown codeblocks (like \`\`\`json) or any other text, just the raw JSON object.
    `;

    const content = await aiService.generateModuleContent(topicTitle, moduleTitle, level, goal, prompt);

    return NextResponse.json(content);
  } catch (error) {
    console.error('API Route Error (generate-module-content):', error);
    return NextResponse.json({ error: 'Failed to generate module content' }, { status: 500 });
  }
}
