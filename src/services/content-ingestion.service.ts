import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import * as pdfParse from "pdf-parse";
import { HumanMessage } from "@langchain/core/messages";

const pdf = (pdfParse as any).default || pdfParse;

export class ContentIngestionService {
  private embeddings: GoogleGenerativeAIEmbeddings;
  private pinecone: Pinecone;
  private llm: ChatGoogleGenerativeAI;
  private indexName = "lms-documents";

  constructor() {
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      modelName: "models/gemini-embedding-001",
      apiKey: process.env.GEMINI_API_KEY,
    });

    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY as string,
    });

    this.llm = new ChatGoogleGenerativeAI({
      model: "gemini-2.0-flash",
      apiKey: process.env.GEMINI_API_KEY,
      temperature: 0.1, // Low temp for OCR
    });
  }

  async processAndStoreFile(fileBuffer: Buffer, fileName: string, mimeType: string, userId: string, topicId: string) {
    let extractedText = "";

    console.log(`Processing file: ${fileName} (${mimeType})`);

    try {
      if (mimeType === "application/pdf") {
        const pdfData = await pdf(fileBuffer);
        extractedText = pdfData.text;
      } else if (mimeType.startsWith("image/")) {
        // Use Gemini Vision for OCR
        const base64Image = fileBuffer.toString("base64");
        const msg = new HumanMessage({
          content: [
            { type: "text", text: "Extract all text, concepts, and diagrams from this image in extreme detail. Format as structured markdown." },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } }
          ]
        });
        const modelList = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-flash-latest", "gemini-pro-latest"];
        let lastError;
        let res;

        for (const modelName of modelList) {
          try {
            const chatModel = new ChatGoogleGenerativeAI({
              model: modelName,
              apiKey: process.env.GEMINI_API_KEY,
              temperature: 0.1, // Low temp for OCR
            });
            res = await chatModel.invoke([msg]);
            break;
          } catch (err: any) {
            console.warn(`Ingestion OCR failed with model ${modelName}:`, err.message || err);
            lastError = err;
          }
        }

        if (!res) {
          throw lastError || new Error("Failed to run OCR on the image using Gemini.");
        }
        
        extractedText = res.content.toString();
      } else if (mimeType === "text/plain" || mimeType === "text/markdown") {
        extractedText = fileBuffer.toString("utf-8");
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }

      if (!extractedText.trim()) {
        throw new Error("No text could be extracted from the file.");
      }

      // Chunk the text
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      const docs = await splitter.createDocuments(
        [extractedText],
        [{ source: fileName, userId, topicId }]
      );

      console.log(`Chunked into ${docs.length} segments. Storing to Pinecone...`);

      // Store in Pinecone
      const pineconeIndex = this.pinecone.Index(this.indexName);
      await PineconeStore.fromDocuments(docs, this.embeddings, {
        pineconeIndex,
        maxConcurrency: 5, // Prevent rate limits
      });

      console.log(`Successfully stored ${fileName} embeddings in Pinecone.`);
      
      return { success: true, chunks: docs.length };
    } catch (err: any) {
      console.error("Content Ingestion Error:", err);
      throw new Error(`Failed to ingest content: ${err.message}`);
    }
  }
}
