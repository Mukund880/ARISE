from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
import json
from typing import List, Optional
from services.ai_service import ai_service

app = FastAPI(title="Lumen AI Backend")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RoadmapRequest(BaseModel):
    topic: str
    knowledgeLevel: str
    goal: str

@app.get("/")
def read_root():
    return {"status": "AI Backend is running"}

@app.post("/api/generate-roadmap")
async def generate_roadmap(request: RoadmapRequest):
    """
    Generates a personalized learning roadmap based on the user's inputs via Gemini.
    """
    print(f"Generating roadmap for {request.topic} at {request.knowledgeLevel} level for {request.goal}")
    
    try:
        # Call the real AI service
        ai_response_text = ai_service.generate_personalized_roadmap(
            topic=request.topic,
            knowledge_level=request.knowledgeLevel,
            goal=request.goal
        )
        
        # Clean up Markdown formatting from Gemini response if present
        cleaned_text = ai_response_text.strip()
        if cleaned_text.startswith("```json"):
            cleaned_text = cleaned_text[7:]
        if cleaned_text.endswith("```"):
            cleaned_text = cleaned_text[:-3]
            
        roadmap_data = json.loads(cleaned_text.strip())
        
        # Ensure it's in the expected format (modules array)
        if "modules" in roadmap_data:
            modules = roadmap_data["modules"]
        else:
            modules = roadmap_data
            
        # Ensure modules have IDs
        for i, mod in enumerate(modules):
            if "id" not in mod:
                mod["id"] = i + 1
                
        return {"topic": request.topic, "roadmap": modules}
    except Exception as e:
        print(f"Error generating roadmap: {e}")
        # Fallback in case of error
        modules = [
            {"id": 1, "title": f"Introduction to {request.topic}", "duration": "1h", "xp": 100},
            {"id": 2, "title": "Core Concepts", "duration": "2h", "xp": 200},
        ]
        return {"topic": request.topic, "roadmap": modules}

@app.post("/api/upload-materials")
async def upload_materials(files: List[UploadFile] = File(...)):
    """
    Process uploaded files (PDFs, etc.), extract text, chunk it, and store in Pinecone.
    """
    processed_files = []
    for file in files:
        # TODO: Implement PDF parsing, chunking, and embedding with LangChain
        processed_files.append(file.filename)
        
    return {"status": "success", "processedFiles": processed_files}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
