import { NextRequest } from 'next/server';
import { getCDNUrl } from '../../../utils/cdn';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Test URLs from the database
    const testUrls = [
      '/images/scheitholz-industrieholz-mix-33-cm-1757489188236.webp',
      '/api/cdn/products/1756679692645-sbgcne0s2nm.webp',
      '/images/industrieholz-buche-klasse-1-1756333840437.png',
      '/images/scheitholz-buche-25-cm-1756684793745.webp'
    ];

    const results = [];

    for (const url of testUrls) {
      try {
        // Test the getCDNUrl function
        const processedUrl = getCDNUrl(url);
        
        // Test if the URL is accessible
        const response = await fetch(`http://localhost:3000${url}`, { 
          method: 'HEAD',
          headers: {
            'User-Agent': 'Debug-Test'
          }
        });

        results.push({
          originalUrl: url,
          processedUrl: processedUrl,
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get('content-type'),
          accessible: response.ok
        });
      } catch (error) {
        results.push({
          originalUrl: url,
          processedUrl: getCDNUrl(url),
          error: (error as Error).message,
          accessible: false
        });
      }
    }

    return Response.json({
      success: true,
      message: 'Image URL debug test completed',
      results: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in debug-images:', error);
    return Response.json({ 
      success: false, 
      error: 'Failed to debug images',
      details: (error as Error).message 
    }, { status: 500 });
  }
}