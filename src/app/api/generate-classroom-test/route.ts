import { NextResponse } from 'next/server';
import { aiService, extractJson } from '@/lib/ai-service';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

export async function POST(req: Request) {
  try {
    const { topic, difficulty, numQuestions } = await req.json();

    if (!topic || !difficulty || !numQuestions) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const prompt = `
      You are an expert academic examiner. Generate a comprehensive classroom test on the topic: "${topic}".
      The difficulty level is: "${difficulty}".
      Generate exactly ${numQuestions} Multiple Choice Questions (MCQ).
      
      For each question:
      - It must have exactly 4 plausible options.
      - The correct option index (0 to 3) must be specified.
      
      Format the output strictly as a JSON object with a single key "questions" containing an array of question objects. Do not include markdown codeblocks or any other text.
      The JSON structure must match:
      {
        "questions": [
          {
            "question": "Question text here...",
            "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
            "correctOptionIndex": 0
          }
        ]
      }
    `;

    const modelList = [
      "gemini-2.5-flash-lite",
      "gemini-3.5-flash",
      "gemini-flash-latest",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-pro-latest"
    ];
    
    let lastError;
    let content = "";

    for (const modelName of modelList) {
      try {
        const chatModel = new ChatGoogleGenerativeAI({
          model: modelName,
          apiKey: process.env.GEMINI_API_KEY,
          temperature: 0.7,
          maxRetries: 0,
          responseMimeType: "application/json",
        } as any);
        const res = await chatModel.invoke(prompt);
        content = res.content.toString();
        break;
      } catch (err: any) {
        console.warn(`Classroom test generation failed with model ${modelName}:`, err.message || err);
        lastError = err;
      }
    }

    if (!content) {
      throw lastError || new Error("Failed to generate test with any Gemini model.");
    }

    const jsonStr = extractJson(content);
    const data = JSON.parse(jsonStr);

    if (!data.questions || !Array.isArray(data.questions)) {
      throw new Error("Invalid response format from AI model");
    }

    return NextResponse.json({ questions: data.questions });
  } catch (error: any) {
    console.error('API Route Error (generate-classroom-test):', error);
    return NextResponse.json({ error: error.message || 'Failed to generate classroom test' }, { status: 500 });
  }
}
