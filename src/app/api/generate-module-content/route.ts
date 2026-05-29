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
      You are an expert, world-class computer science educator (like GeeksforGeeks, LeetCode, or MDN).
      Generate an exceptionally detailed, comprehensive, high-fidelity lesson explanation and a practice exercise for the module: "${moduleTitle}" which belongs to the topic: "${topicTitle}".
      
      Requirements for the lesson:
      1. Write a massive, comprehensive technical guide (at least 1500 words) with clear sections.
      2. Include detailed structured comparisons using Markdown tables.
      3. Provide multiple detailed, production-grade copyable code blocks (use standard fenced code blocks like \`\`\`cpp or \`\`\`python).
      4. Provide a conceptual comparison chart representable as a bar, line, or pie chart.
      5. Provide one or two downloadable source code files related to the lesson.
      
      Format the output strictly as a JSON object with the following structure:
      {
        "explanation": "A detailed, massive, GeeksforGeeks-grade markdown explanation of the module. Must be 1500+ words, containing rich paragraphs, headers, bullet points, Markdown comparison tables, and copyable code blocks.",
        "exerciseType": "MCQ",
        "quizQuestion": "A high-quality question to test understanding of the material",
        "quizOptions": ["Option A", "Option B", "Option C", "Option D"],
        "correctOptionIndex": 0,
        "hint": "A detailed explanation of why the correct option is correct.",
        "chartData": {
          "type": "bar",
          "title": "E.g., Comparison metric",
          "labels": ["Case A", "Case B", "Case C"],
          "values": [30, 75, 95]
        },
        "downloadableFiles": [
          {
            "name": "demo_code.py",
            "content": "# Enter actual executable code corresponding to the lesson here\n"
          }
        ]
      }
      
      Do not include markdown wrappers (like \`\`\`json) or any extra characters. Output only the pure JSON.
    `;

    const content = await aiService.generateModuleContent(topicTitle, moduleTitle, level, goal, prompt);

    return NextResponse.json(content);
  } catch (error) {
    console.error('API Route Error (generate-module-content):', error);
    return NextResponse.json({ error: 'Failed to generate module content' }, { status: 500 });
  }
}
