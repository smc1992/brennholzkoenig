import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page');
    const section = searchParams.get('section');
    const type = searchParams.get('type');
    
    // Standard Fallback-URLs für verschiedene Inhalte
    const fallbackContent = {
      home: {
        hero: {
          background_image: 'https://readdy.ai/api/search-image?query=Premium%20firewood%20warehouse%20with%20stacked%20dry%20oak%20wood%20logs%2C%20professional%20firewood%20business%20setting%2C%20wooden%20atmosphere%20with%20natural%20lighting%2C%20cozy%20rustic%20wood%20storage%20facility%2C%20organized%20firewood%20display%20in%20German%20countryside%2C%20warm%20wood%20textures%20and%20timber%20stacks%2C%20professional%20lumber%20yard%20environment%20with%20golden%20hour%20lighting%20creating%20warm%20wood%20tones&width=1920&height=1080&seq=hero-firewood-v2&orientation=landscape',
          title: 'Premium Brennholz aus nachhaltiger Forstwirtschaft',
          subtitle: 'Kammergetrocknetes Qualitätsholz direkt vom Produzenten',
          cta_text: 'Jetzt bestellen'
        }
      }
    };
    
    // Content basierend auf Parametern abrufen
    let content = null;
    
    if (page && section && type) {
      const pageContent = fallbackContent[page as keyof typeof fallbackContent];
      if (pageContent) {
        const sectionContent = pageContent[section as keyof typeof pageContent];
        if (sectionContent && typeof sectionContent === 'object') {
          content = sectionContent[type as keyof typeof sectionContent];
        }
      }
    }
    
    // Fallback wenn kein spezifischer Content gefunden wird
    if (!content) {
      content = fallbackContent.home.hero.background_image;
    }
    
    return Response.json({
      success: true,
      content,
      page,
      section,
      type
    });
    
  } catch (error) {
    console.error('Content API error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Fehler beim Laden des Contents',
        content: 'https://readdy.ai/api/search-image?query=Premium%20firewood%20warehouse%20with%20stacked%20dry%20oak%20wood%20logs%2C%20professional%20firewood%20business%20setting%2C%20wooden%20atmosphere%20with%20natural%20lighting%2C%20cozy%20rustic%20wood%20storage%20facility%2C%20organized%20firewood%20display%20in%20German%20countryside%2C%20warm%20wood%20textures%20and%20timber%20stacks%2C%20professional%20lumber%20yard%20environment%20with%20golden%20hour%20lighting%20creating%20warm%20wood%20tones&width=1920&height=1080&seq=hero-firewood-v2&orientation=landscape'
      }, 
      { status: 500 }
    );
  }
}

// Unterstützte HTTP-Methoden
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}