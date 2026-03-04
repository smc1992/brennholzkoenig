import { NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ImageFile {
  path: string;
  size: number;
  modified: string;
}

async function scanDirectory(dirPath: string, baseUrl: string = ''): Promise<ImageFile[]> {
  const images: ImageFile[] = [];
  
  try {
    const items = await readdir(dirPath);
    
    for (const item of items) {
      const fullPath = join(dirPath, item);
      const stats = await stat(fullPath);
      
      if (stats.isDirectory()) {
        // Rekursiv in Unterordner scannen
        const subImages = await scanDirectory(fullPath, `${baseUrl}/${item}`);
        images.push(...subImages);
      } else if (stats.isFile()) {
        // Prüfen ob es sich um ein Bild handelt
        const ext = item.toLowerCase().split('.').pop();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext || '')) {
          images.push({
            path: `${baseUrl}/${item}`,
            size: stats.size,
            modified: stats.mtime.toISOString()
          });
        }
      }
    }
  } catch (error) {
    console.error(`Fehler beim Scannen von ${dirPath}:`, error);
  }
  
  return images;
}

export async function GET() {
  try {
    const publicDir = join(process.cwd(), 'public');
    
    // Scanne verschiedene Verzeichnisse im public-Ordner
    const [imagesDir, uploadsDir, rootImages] = await Promise.all([
      // /public/images/
      scanDirectory(join(publicDir, 'images'), '/images').catch(() => []),
      // /public/uploads/
      scanDirectory(join(publicDir, 'uploads'), '/uploads').catch(() => []),
      // Direkt im /public/ Ordner
      scanDirectory(publicDir, '').catch(() => [])
    ]);
    
    // Alle gefundenen Bilder zusammenfassen
    const allImages = [...imagesDir, ...uploadsDir, ...rootImages.filter(img => 
      !img.path.startsWith('/images/') && 
      !img.path.startsWith('/uploads/') &&
      !img.path.includes('favicon') &&
      !img.path.includes('icon-') &&
      !img.path.includes('apple-touch')
    )];
    
    // Nach Größe sortieren (größte zuerst)
    allImages.sort((a, b) => b.size - a.size);
    
    console.log(`📸 Statische Bilder gefunden: ${allImages.length}`);
    
    return NextResponse.json({
      success: true,
      count: allImages.length,
      images: allImages.map(img => img.path),
      details: allImages,
      scannedDirectories: [
        '/public/images/',
        '/public/uploads/', 
        '/public/'
      ],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Fehler beim Scannen statischer Bilder:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Scannen der Bilder',
      details: (error as Error).message,
      images: [],
      count: 0
    }, { status: 500 });
  }
}

export async function POST() {
  // Für zukünftige Erweiterungen (z.B. Cache-Refresh)
  return GET();
}