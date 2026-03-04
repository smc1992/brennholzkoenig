import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RenderedImage {
  url: string;
  source: string;
  context: string;
  type: 'hardcoded' | 'dynamic' | 'external' | 'placeholder';
}

// Bekannte Bild-URLs aus der Analyse der Komponenten
const KNOWN_IMAGES = [
  // Externe URLs aus Komponenten
  'https://static.readdy.ai/image/5cb98375ce345c7331a1619afba21cba/255afa48d4769354fa7fedfea18b5f4b.webp',
  'https://static.readdy.ai/image/5cb98375ce345c7331a1619afba21cba/501398866eb96573186841197a5add47.webp',
  'https://public.readdy.ai/ai/img_res/86db7336-c7fd-4211-8615-9dceb4ceb922.jpg',
  'https://static.readdy.ai/image/5cb98375ce345c7331a1619afba21cba/fc6bd73633df28293b3a47852f59e15a.webp',
  
  // Lokale Bilder
  '/images/brennholz-hero.jpg',
  '/placeholder-image.jpg',
  '/placeholder-product.jpg',
  
  // Dynamische API-URLs
  'https://readdy.ai/api/search-image?query=Premium%20firewood%20warehouse',
  
  // Favicon und Icons
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Zusätzliche dynamische Bildquellen
const DYNAMIC_IMAGE_SOURCES = [
  {
    url: '/api/content?page=home&section=hero&type=background_image',
    context: 'Hero Section Background',
    type: 'dynamic' as const
  },
  {
    url: '/api/content?page=home&section=about&type=image',
    context: 'About Section Image',
    type: 'dynamic' as const
  },
  {
    url: '/api/content?page=shop&section=hero&type=background_image',
    context: 'Shop Hero Background',
    type: 'dynamic' as const
  }
];

export async function GET() {
  try {
    const renderedImages: RenderedImage[] = [];
    
    // Bekannte statische Bilder hinzufügen
    KNOWN_IMAGES.forEach(imageUrl => {
      let type: 'hardcoded' | 'dynamic' | 'external' | 'placeholder' = 'hardcoded';
      let context = 'Static Reference';
      
      if (imageUrl.includes('placeholder')) {
        type = 'placeholder';
        context = 'Placeholder Image';
      } else if (imageUrl.startsWith('http')) {
        type = 'external';
        context = 'External CDN';
      } else if (imageUrl.includes('api')) {
        type = 'dynamic';
        context = 'API Generated';
      }
      
      renderedImages.push({
        url: imageUrl,
        source: 'Component Analysis',
        context,
        type
      });
    });
    
    // Dynamische Bildquellen testen
    for (const source of DYNAMIC_IMAGE_SOURCES) {
      try {
        const response = await fetch(`http://localhost:3005${source.url}`, {
          headers: { 'Accept': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.content && typeof data.content === 'string') {
            renderedImages.push({
              url: data.content,
              source: 'Dynamic API',
              context: source.context,
              type: source.type
            });
          }
        }
      } catch (error) {
        // API nicht verfügbar, überspringen
      }
    }
    
    // Produktbilder aus verschiedenen Quellen
    const productImagePatterns = [
      '/images/brennholz-buche-25cm.jpg',
      '/images/brennholz-eiche-25cm.jpg',
      '/images/brennholz-birke-25cm.jpg',
      '/images/kaminholz-buche-33cm.jpg',
      '/images/anzuendholz-birke.jpg'
    ];
    
    productImagePatterns.forEach(pattern => {
      renderedImages.push({
        url: pattern,
        source: 'Product Pattern',
        context: 'Generated Product Image Path',
        type: 'dynamic'
      });
    });
    
    // CSS-Background-Images aus kompilierten Styles
    try {
      const cssFiles = [
        join(process.cwd(), 'app/globals.css'),
        join(process.cwd(), 'app/output.css')
      ];
      
      for (const cssFile of cssFiles) {
        try {
          const cssContent = await readFile(cssFile, 'utf-8');
          
          // CSS background-image URLs extrahieren
          const cssImagePattern = /background-image:\s*url\(["']?([^"')]+)["']?\)/gi;
          let match;
          
          while ((match = cssImagePattern.exec(cssContent)) !== null) {
            const imageUrl = match[1];
            if (imageUrl && !imageUrl.startsWith('data:')) {
              renderedImages.push({
                url: imageUrl,
                source: 'CSS Styles',
                context: `Background Image from ${cssFile.split('/').pop()}`,
                type: 'hardcoded'
              });
            }
          }
        } catch (error) {
          // CSS-Datei nicht gefunden, überspringen
        }
      }
    } catch (error) {
      // CSS-Analyse fehlgeschlagen
    }
    
    // Deduplizierung
    const uniqueImages = Array.from(
      new Map(renderedImages.map(img => [img.url, img])).values()
    );
    
    // Nach URL sortieren
    uniqueImages.sort((a, b) => a.url.localeCompare(b.url));
    
    console.log(`🎨 Gerenderte Bilder gefunden: ${uniqueImages.length}`);
    
    return NextResponse.json({
      success: true,
      count: uniqueImages.length,
      images: uniqueImages.map(img => img.url),
      details: uniqueImages,
      sources: {
        static: uniqueImages.filter(img => img.type === 'hardcoded').length,
        dynamic: uniqueImages.filter(img => img.type === 'dynamic').length,
        external: uniqueImages.filter(img => img.type === 'external').length,
        placeholder: uniqueImages.filter(img => img.type === 'placeholder').length
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Fehler beim Scannen gerendeter Bilder:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Scannen der gerenderten Bilder',
      details: (error as Error).message,
      images: [],
      count: 0
    }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}