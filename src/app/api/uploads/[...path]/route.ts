import { NextRequest } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const MIME_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.txt': 'text/plain',
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.zip': 'application/zip',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg'
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: filePathArray } = await params;
    if (!filePathArray || filePathArray.length === 0) {
      return new Response('File not found', { status: 404 });
    }

    const relativePath = filePathArray.join('/');
    
    // Resolve absolute path inside public/uploads
    const absolutePath = path.join(process.cwd(), 'public', 'uploads', relativePath);
    
    // Check if file exists
    try {
      await fs.access(absolutePath);
    } catch {
      return new Response('File not found', { status: 404 });
    }
    
    const fileBuffer = await fs.readFile(absolutePath);
    
    const ext = path.extname(absolutePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    return new Response(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (err: any) {
    console.error('Error serving upload:', err);
    return new Response('Error serving file', { status: 500 });
  }
}
