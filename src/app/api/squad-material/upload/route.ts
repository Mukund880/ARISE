import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const squadId = formData.get('squadId') as string;

    if (!file || !squadId) {
      return NextResponse.json({ error: 'Missing file or squadId' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create target directory: public/uploads/squads/[squadId]/
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'squads', squadId);
    await fs.mkdir(uploadDir, { recursive: true });

    // Clean filename to prevent security injection issues
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const fileName = `${Date.now()}_${safeFileName}`;
    const filePath = path.join(uploadDir, fileName);
    
    await fs.writeFile(filePath, buffer);

    const fileUrl = `/uploads/squads/${squadId}/${fileName}`;

    return NextResponse.json({ 
      success: true, 
      fileUrl, 
      fileName: file.name,
      fileType: file.name.split('.').pop() || 'unknown'
    });
  } catch (err: any) {
    console.error('Error uploading squad material:', err);
    return NextResponse.json({ error: err.message || 'Failed to upload file' }, { status: 500 });
  }
}
