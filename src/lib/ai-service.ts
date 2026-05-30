import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import dotenv from "dotenv";
import path from "path";

// Explicitly load env variables from .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
const dotenvResult = dotenv.config({ path: envPath });

// Map GEMINI_API_KEY to GOOGLE_API_KEY for LangChain compatibility
if (process.env.GEMINI_API_KEY) {
  process.env.GOOGLE_API_KEY = process.env.GEMINI_API_KEY;
}

console.log("=== AI Service Load Debug ===");
console.log("Process CWD:", process.cwd());
console.log("Attempted Env Path:", envPath);
console.log("Dotenv Result:", dotenvResult);
console.log("GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);
console.log("GOOGLE_API_KEY exists:", !!process.env.GOOGLE_API_KEY);
console.log("=============================");

export function extractJson(text: string): string {
  const firstBrace = text.indexOf('{');
  const firstBracket = text.indexOf('[');
  let startIdx = -1;
  
  if (firstBrace !== -1 && firstBracket !== -1) {
    startIdx = Math.min(firstBrace, firstBracket);
  } else {
    startIdx = firstBrace !== -1 ? firstBrace : firstBracket;
  }
  
  if (startIdx === -1) {
    throw new Error("No JSON object or array found in model response");
  }
  
  const lastBrace = text.lastIndexOf('}');
  const lastBracket = text.lastIndexOf(']');
  let endIdx = -1;
  
  if (lastBrace !== -1 && lastBracket !== -1) {
    endIdx = Math.max(lastBrace, lastBracket);
  } else {
    endIdx = lastBrace !== -1 ? lastBrace : lastBracket;
  }
  
  if (endIdx === -1 || endIdx < startIdx) {
    throw new Error("Malformed JSON bounds in model response");
  }
  
  return text.substring(startIdx, endIdx + 1);
}

export class AIService {
  public llm: ChatGoogleGenerativeAI;
  private embeddings: GoogleGenerativeAIEmbeddings;
  private pinecone: Pinecone;
  private indexName = "lms-documents";

  constructor() {
    this.llm = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-pro",
      apiKey: process.env.GEMINI_API_KEY,
      temperature: 0.7,
      maxRetries: 0,
    } as any);

    this.embeddings = new GoogleGenerativeAIEmbeddings({
      model: "models/gemini-embedding-001",
      apiKey: process.env.GEMINI_API_KEY,
    });

    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY as string,
    });
  }

  async generatePersonalizedRoadmap(topic: string, knowledgeLevel: string, goal: string, topicId?: string) {
    let contextStr = "";

    if (topicId) {
      try {
        const pineconeIndex = this.pinecone.Index(this.indexName);
        const vectorStore = await PineconeStore.fromExistingIndex(this.embeddings, {
          pineconeIndex,
        });
        
        // Search Pinecone for context related to the topic
        const results = await vectorStore.similaritySearch(topic, 3, { topicId });
        if (results.length > 0) {
          contextStr = "\nHere is custom material uploaded by the user. Ensure the roadmap specifically covers this material:\n";
          results.forEach((doc, i) => {
            contextStr += `\n[Source ${i+1}]: ${doc.pageContent}\n`;
          });
        }
      } catch (e) {
        console.warn("Pinecone search skipped or failed during roadmap generation:", e);
      }
    }


    const prompt = `
    You are an expert AI tutor. 
    Create a detailed, gamified learning roadmap for the topic: ${topic}.
    The student's current knowledge level is: ${knowledgeLevel}.
    Their primary goal is: ${goal}.
    ${contextStr}
    
    Break the roadmap down into bite-sized modules. For each module provide:
    - id (a unique integer starting from 1)
    - title
    - duration (e.g., 30m, 1h)
    - xp (experience points based on difficulty, e.g., 100 to 500)
    
    Format the output strictly as a valid JSON array of module objects. Do not include markdown codeblocks (like \`\`\`json) or any other text, just the raw JSON array.
    `;

    const modelList = [
      "gemini-3.5-pro",
      "gemini-2.5-pro",
      "gemini-3.1-pro-preview",
      "gemini-3.5-flash",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-flash-latest",
      "gemini-2.5-flash-lite",
      "gemini-pro-latest"
    ];
    let lastError;

    for (const modelName of modelList) {
      try {
        const chatModel = new ChatGoogleGenerativeAI({
          model: modelName,
          apiKey: process.env.GEMINI_API_KEY,
          temperature: 0.7,
          maxRetries: 0,
          responseMimeType: "application/json",
        } as any);
        const response = await chatModel.invoke(prompt);
        const text = response.content.toString();
        const jsonStr = extractJson(text);
        const parsedRoadmap = JSON.parse(jsonStr);


        return parsedRoadmap;
      } catch (error: any) {
        console.warn(`Roadmap generation failed with model ${modelName}:`, error.message || error);
        lastError = error;
      }
    }

    console.error("AI Generation Error (all models failed):", lastError);
    throw new Error("Failed to generate personalized roadmap due to API limit or error.");
  }

  async generateModuleContent(topicTitle: string, moduleTitle: string, level: string, goal: string, promptOverride?: string) {
    const defaultPrompt = `
    You are an expert AI tutor. Generate a lesson for:
    Topic: ${topicTitle}
    Module: ${moduleTitle}
    Level: ${level}
    Goal: ${goal}
    
    The response must contain:
    1. A detailed explanation of the module concepts, structured with clear paragraphs, subheadings, and Markdown formatting. Make it comprehensive, informative, and engaging.
    2. A single multiple-choice question to test the user's understanding of this concept.
    3. Exactly 4 answer options.
    4. The index (0-3) of the correct answer.
    5. A brief hint/explanation of the correct answer.
    
    Format the output strictly as a valid JSON object. Do not include markdown codeblocks (like \`\`\`json) or any other text, just the raw JSON object.
    The JSON structure must match:
    {
      "explanation": "...",
      "quizQuestion": "...",
      "quizOptions": ["option 1", "option 2", "option 3", "option 4"],
      "correctOptionIndex": 0,
      "hint": "..."
    }
    `;

    const prompt = promptOverride || defaultPrompt;

    const modelList = [
      "gemini-3.5-pro",
      "gemini-2.5-pro",
      "gemini-3.1-pro-preview",
      "gemini-3.5-flash",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-flash-latest",
      "gemini-2.5-flash-lite",
      "gemini-pro-latest"
    ];
    let lastError;

    for (const modelName of modelList) {
      try {
        const chatModel = new ChatGoogleGenerativeAI({
          model: modelName,
          apiKey: process.env.GEMINI_API_KEY,
          temperature: 0.7,
          maxRetries: 0,
          responseMimeType: "application/json",
        } as any);
        const response = await chatModel.invoke(prompt);
        const text = response.content.toString();
        const jsonStr = extractJson(text);
        return JSON.parse(jsonStr);
      } catch (error: any) {
        console.warn(`Module content generation failed with model ${modelName}:`, error.message || error);
        lastError = error;
      }
    }

    console.error("AI Module Generation Error (all models failed):", lastError);
    throw new Error("Failed to generate module content due to API limit or error.");
  }
}

export const aiService = new AIService();
