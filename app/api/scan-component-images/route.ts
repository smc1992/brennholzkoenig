import { NextResponse } from 'next/server';
import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ComponentImage {
  path: string;
  source: string;
  context: string;
}

async function scanComponentFiles(dirPath: string, baseContext: string = ''): Promise<ComponentImage[]> {
  const images: ComponentImage[] = [];
  
  try {
    const items = await readdir(dirPath);
    
    for (const item of items) {
      const fullPath = join(dirPath, item);
      const stats = await stat(fullPath);
      
      if (stats.isDirectory() && !item.startsWith('.') && !item.includes('node_modules')) {
        // Rekursiv in Unterordner scannen
        const subImages = await scanComponentFiles(fullPath, `${baseContext}/${item}`);
        images.push(...subImages);
      } else if (stats.isFile()) {
        // Prüfen ob es sich um eine React/Next.js Datei handelt
        const ext = item.toLowerCase().split('.').pop();
        if (['tsx', 'jsx', 'ts', 'js'].includes(ext || '')) {
          try {
            const content = await readFile(fullPath, 'utf-8');
            
            // Verschiedene Bild-Patterns suchen
            const patterns = [
              // img src="/path/to/image.jpg" oder src="https://..."
              /(?:img|Image)[^>]+src=["']([^"']+\.(jpg|jpeg|png|gif|webp|svg))["']/gi,
              // backgroundImage: 'url(/path/to/image.jpg)'
              /backgroundImage:[\s]*["']url\(([^)]+\.(jpg|jpeg|png|gif|webp|svg))\)["']/gi,
              // import imageName from '/path/to/image.jpg'
              /import[^from]+from[\s]+["']([^"']+\.(jpg|jpeg|png|gif|webp|svg))["']/gi,
              // require('/path/to/image.jpg')
              /require\(["']([^"']+\.(jpg|jpeg|png|gif|webp|svg))["']\)/gi,
              // '/images/...' oder '/public/...' Strings
              /["'](\/(?:images|public|assets)\/[^"']*\.(jpg|jpeg|png|gif|webp|svg))["']/gi,
              // Externe URLs: 'https://...image.jpg'
              /["'](https?:\/\/[^"']*\.(jpg|jpeg|png|gif|webp|svg))["']/gi,
              // Placeholder-Bilder: '/placeholder-image.jpg'
              /["'](\/[^"']*placeholder[^"']*\.(jpg|jpeg|png|gif|webp|svg))["']/gi,
              // Readdy.ai URLs
              /["'](https?:\/\/(?:static|public)\.readdy\.ai\/[^"']*\.(jpg|jpeg|png|gif|webp|svg))["']/gi,
              // Dynamische Pfade mit Template-Strings
              /`([^`]*\.(jpg|jpeg|png|gif|webp|svg))`/gi
            ];
            
            patterns.forEach(pattern => {
                let match;
                while ((match = pattern.exec(content)) !== null) {
                  const imagePath = match[1];
                  if (imagePath && !imagePath.startsWith('data:')) {
                    // Alle Bilder hinzufügen, auch externe URLs
                    images.push({
                      path: imagePath.startsWith('http') ? imagePath : (imagePath.startsWith('/') ? imagePath : `/${imagePath}`),
                      source: fullPath.replace(process.cwd(), ''),
                      context: `${baseContext}/${item}`
                    });
                  }
                }
              });
              
              // Zusätzlich nach hardcodierten Bild-URLs suchen
              const hardcodedPatterns = [
                // Spezifische externe Domains
                /readdy\.ai\/[^\s"']*\.(jpg|jpeg|png|gif|webp|svg)/gi,
                // API-Endpunkte für Bilder
                /\/api\/[^\s"']*image[^\s"']*/gi
              ];
              
              hardcodedPatterns.forEach(pattern => {
                let match;
                while ((match = pattern.exec(content)) !== null) {
                  const imagePath = match[0];
                  if (imagePath) {
                    images.push({
                      path: imagePath.startsWith('http') ? imagePath : `https://${imagePath}`,
                      source: fullPath.replace(process.cwd(), ''),
                      context: `${baseContext}/${item} (hardcoded)`
                    });
                  }
                }
              });
          } catch (error) {
            // Datei konnte nicht gelesen werden, überspringen
          }
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
    const projectRoot = process.cwd();
    
    // Scanne verschiedene Verzeichnisse nach Component-Bildern
    const [appImages, componentImages, pageImages, libImages] = await Promise.all([
      // /app/ Verzeichnis
      scanComponentFiles(join(projectRoot, 'app'), '/app').catch(() => []),
      // /components/ Verzeichnis
      scanComponentFiles(join(projectRoot, 'components'), '/components').catch(() => []),
      // /pages/ Verzeichnis (falls vorhanden)
      scanComponentFiles(join(projectRoot, 'pages'), '/pages').catch(() => []),
      // /lib/ Verzeichnis
      scanComponentFiles(join(projectRoot, 'lib'), '/lib').catch(() => [])
    ]);
    
    // Alle gefundenen Bilder zusammenfassen und deduplizieren
    const allImages = [...appImages, ...componentImages, ...pageImages, ...libImages];
    const uniqueImages = Array.from(new Set(allImages.map(img => img.path)))
      .map(path => allImages.find(img => img.path === path)!)
      .filter(img => img.path);
    
    // Nach Pfad sortieren
    uniqueImages.sort((a, b) => a.path.localeCompare(b.path));
    
    console.log(`🔍 Component-Bilder gefunden: ${uniqueImages.length}`);
    
    return NextResponse.json({
      success: true,
      count: uniqueImages.length,
      images: uniqueImages.map(img => img.path),
      details: uniqueImages,
      scannedDirectories: [
        '/app/',
        '/components/',
        '/pages/',
        '/lib/'
      ],
      patterns: [
        'img src="..."',
        'Image src="..."',
        'backgroundImage: url(...)',
        'import ... from "..."',
        'require("...")',
        'String literals with /images/ or /public/'
      ],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Fehler beim Scannen der Component-Bilder:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Scannen der Component-Bilder',
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