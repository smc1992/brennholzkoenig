import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface UploadResult {
  fileName: string;
  filePath: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string || 'general';

    if (!file) {
      return NextResponse.json(
        { error: 'Keine Datei gefunden' },
        { status: 400 }
      );
    }

    // Validiere Dateityp
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
      'video/mp4',
      'video/webm'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Dateityp nicht unterstützt' },
        { status: 400 }
      );
    }

    // Validiere Dateigröße (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Datei zu groß (max 10MB)' },
        { status: 400 }
      );
    }

    // Generiere eindeutigen Dateinamen
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const fileName = `${timestamp}-${randomId}.${fileExtension}`;

    // Erstelle Upload-Verzeichnis
    const uploadDir = join(process.cwd(), 'public', 'uploads', category);
    
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Speichere Datei
    const filePath = join(uploadDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    await writeFile(filePath, buffer);

    // Generiere öffentliche URL
    const fileUrl = `/uploads/${category}/${fileName}`;
    const relativePath = `uploads/${category}/${fileName}`;

    const result: UploadResult = {
      fileName,
      filePath: relativePath,
      fileUrl,
      fileSize: file.size,
      mimeType: file.type
    };

    console.log('Datei erfolgreich hochgeladen:', {
      originalName: file.name,
      fileName,
      category,
      size: file.size,
      type: file.type
    });

    return NextResponse.json({
      success: true,
      message: 'Datei erfolgreich hochgeladen',
      ...result
    });

  } catch (error) {
    console.error('Upload-Fehler:', error);
    return NextResponse.json(
      { 
        error: 'Fehler beim Hochladen der Datei',
        details: (error as Error).message 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Media Upload API',
    supportedTypes: [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
      'video/mp4',
      'video/webm'
    ],
    maxSize: '10MB',
    categories: [
      'hero',
      'products', 
      'about',
      'testimonials',
      'process',
      'warehouse',
      'quality',
      'contact',
      'backgrounds',
      'icons',
      'banners',
      'general'
    ]
  });
}