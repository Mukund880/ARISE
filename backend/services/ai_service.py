import os
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Pinecone as PineconeVectorStore
from pinecone import Pinecone
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain

class AIService:
    def __init__(self):
        # API Keys should be set in environment variables
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "dummy_gemini_key")
        self.pinecone_api_key = os.getenv("PINECONE_API_KEY", "dummy_pinecone_key")
        
        self.index_name = "lms-documents"
        
        # Initialize LLM and Embeddings if configured
        if self.gemini_api_key != "dummy_gemini_key":
            self.embeddings = GoogleGenerativeAIEmbeddings(google_api_key=self.gemini_api_key, model="models/embedding-001")
            self.llm = ChatGoogleGenerativeAI(google_api_key=self.gemini_api_key, model="gemini-1.5-pro", temperature=0.7)
            self.pc = Pinecone(api_key=self.pinecone_api_key)
            self.vectorstore = PineconeVectorStore.from_existing_index(self.index_name, self.embeddings)

    def process_and_embed_document(self, text: str, document_id: str, metadata: dict = None):
        """
        Splits a document into chunks and embeds them into Pinecone.
        """
        if not hasattr(self, 'vectorstore'):
            print("AI Service not fully initialized. Missing API Keys.")
            return False

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
        chunks = text_splitter.split_text(text)
        
        metadatas = [metadata or {} for _ in chunks]
        for i, md in enumerate(metadatas):
            md["document_id"] = document_id
            md["chunk_index"] = i

        self.vectorstore.add_texts(texts=chunks, metadatas=metadatas)
        return True

    def generate_personalized_roadmap(self, topic: str, knowledge_level: str, goal: str) -> str:
        """
        Uses the LLM to generate a personalized learning roadmap.
        """
        if not hasattr(self, 'llm'):
            # Return dummy data if not initialized
            return '{"modules": [{"title": "Introduction", "duration": "1h", "xp": 100}]}'

        prompt_template = """
        You are an expert AI tutor. 
        Create a detailed, gamified learning roadmap for the topic: {topic}.
        The student's current knowledge level is: {knowledge_level}.
        Their primary goal is: {goal}.
        
        Break the roadmap down into bite-sized modules. For each module provide:
        - title
        - duration (e.g., 30m, 1h)
        - xp (experience points based on difficulty, e.g., 100 to 500)
        
        Format the output as a valid JSON string.
        """
        
        prompt = PromptTemplate(
            input_variables=["topic", "knowledge_level", "goal"],
            template=prompt_template
        )
        
        chain = LLMChain(llm=self.llm, prompt=prompt)
        response = chain.run({"topic": topic, "knowledge_level": knowledge_level, "goal": goal})
        
        return response

    def ask_ai_tutor(self, question: str, topic: str, context: str = "") -> str:
        """
        Retrieves context from Pinecone and answers the student's question via RAG.
        """
        if not hasattr(self, 'llm'):
            return "I am a dummy AI Tutor. Please configure my API keys to chat!"

        # Retrieve relevant documents
        docs = self.vectorstore.similarity_search(question, k=3)
        retrieved_context = "\n".join([doc.page_content for doc in docs])
        
        full_context = context + "\n" + retrieved_context

        prompt = f"""
        You are an AI Tutor for the topic: {topic}.
        Answer the student's question clearly, using examples and analogies.
        
        Context information:
        {full_context}
        
        Question:
        {question}
        """
        
        response = self.llm.predict(prompt)
        return response

# Instantiate a singleton AI service
ai_service = AIService()
