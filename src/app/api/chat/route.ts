import { NextResponse } from 'next/server';
import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string });
const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "models/gemini-embedding-001",
  apiKey: process.env.GEMINI_API_KEY,
});
const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  apiKey: process.env.GEMINI_API_KEY,
  temperature: 0.5,
});

export async function POST(req: Request) {
  try {
    const { message, history, currentTopic, topicId } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    let contextStr = "";

    // Perform RAG if a topicId is provided (user is in a specific study context)
    if (topicId) {
      try {
        const pineconeIndex = pinecone.Index("lms-documents");
        const vectorStore = await PineconeStore.fromExistingIndex(embeddings, { pineconeIndex });
        const results = await vectorStore.similaritySearch(message, 4, { topicId });
        
        if (results.length > 0) {
          contextStr = "\nHere is the relevant factual context retrieved from the user's uploaded materials:\n";
          results.forEach((doc, i) => {
            contextStr += `\n[Reference ${i+1}]: ${doc.pageContent}\n`;
          });
        }
      } catch (e) {
        console.warn("Pinecone search failed during chat:", e);
      }
    }

    const sysPrompt = `
      You are ARIS (Adaptive Interactive learning companion), a friendly, encouraging, and world-class AI tutor.
      ${currentTopic ? `The student is currently studying: ${currentTopic}.` : ""}
      
      Your style:
      - Be highly interactive: don't just dump text. Prompt the student with simple check questions or ask them to summarize a point.
      - Be encouraging, friendly, and structured.
      - Use rich Markdown formatting (bullet points, bold text, code blocks) to make your answers beautiful and readable.
      - When relevant, give copyable code snippets in standard fenced code blocks.
      
      ${contextStr ? `\nUse the following reference materials to ground your answers: ${contextStr}` : ""}
    `;

    // Construct message history
    const messages: any[] = [new SystemMessage(sysPrompt)];
    
    // Add past history (limit to last 10 messages to avoid context bloat)
    if (Array.isArray(history)) {
      const recentHistory = history.slice(-10);
      recentHistory.forEach((msg: any) => {
        if (msg.role === 'user') messages.push(new HumanMessage(msg.content));
        // We technically should use AIMessage for assistant, but for simplicity we inject it as text for gemini or use HumanMessage
      });
    }
    
    messages.push(new HumanMessage(message));

    const modelList = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-flash-latest", "gemini-pro-latest"];
    let lastError;
    let res;

    for (const modelName of modelList) {
      try {
        const chatModel = new ChatGoogleGenerativeAI({
          model: modelName,
          apiKey: process.env.GEMINI_API_KEY,
          temperature: 0.5,
        });
        res = await chatModel.invoke(messages);
        break;
      } catch (err: any) {
        console.warn(`Chat failed with model ${modelName}:`, err.message || err);
        lastError = err;
      }
    }

    if (!res) {
      throw lastError || new Error("Failed to connect to any Gemini models.");
    }
    
    return NextResponse.json({ response: res.content.toString() });
  } catch (error: any) {
    console.error('API Route Error (chat):', error);
    return NextResponse.json({ error: error.message || 'Failed to process chat' }, { status: 500 });
  }
}
