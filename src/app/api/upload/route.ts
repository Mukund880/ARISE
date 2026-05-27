import { NextResponse } from 'next/server';
import { ContentIngestionService } from '@/services/content-ingestion.service';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const topicId = formData.get('topicId') as string;

    if (!file || !userId || !topicId) {
      return NextResponse.json({ error: 'Missing file, userId, or topicId' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ingestionService = new ContentIngestionService();
    
    // In production, you'd also upload the raw file to S3/Cloudinary here.
    // We skip that for now as per the local mock requirement in Phase 2.
    
    const result = await ingestionService.processAndStoreFile(
      buffer,
      file.name,
      file.type,
      userId,
      topicId
    );

    return NextResponse.json({ 
      success: true, 
      message: 'File processed and embedded successfully',
      chunks: result.chunks
    });
  } catch (error: any) {
    console.error('API Route Error (upload):', error);
    return NextResponse.json({ error: error.message || 'Failed to upload and process file' }, { status: 500 });
  }
}
