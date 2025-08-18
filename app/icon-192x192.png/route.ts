
export const dynamic = 'force-static';

export async function GET() {
  try {
    const response = await fetch('https://static.readdy.ai/image/5cb98375ce345c7331a1619afba21cba/ff927ce5a36d05511a60d1cac00ee2e2.png');
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    return new Response(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    // Fallback zu einem einfachen Icon
    const fallbackIcon = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABS3GwHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAE8klEQVR4nO3dMW4TQRSG4X8SJFpKSg5ARwcdHQ0lHR0NHR0NHR0NHQ0lHR0NHR0NHR0NHQ0lHR0NHR0NHR0NHQ0lHR0NHR0NHR0NHQ0lHR0NHR0NHR0lHR0NHR0NHQ0lHR0NHR0NHQ0lHR0NHR0NHQ0lHR0NHR0NHQ0lHR0NHR0NHQ0lHR0NHR0NHQ0lHR0NHR0NHQ0lHR0NHR0NHQ0lHR0NHR0NHQ0lHR0NHR0NHQ0lHR0NHR0NHQ0lHR0NHR0NHQ0lHR0NHR0NHQ0lHR0NHR0NHQ0lHR0NHR0NHQ0lHR0NHR0NHQ0lHR0NHR0NHQ0lHR0NHR0NHQ0lHR0NHR0NHQ0lHR0NHR0NHQ0lHR0NHR0NHQ0lHR0NHR0NHQ0lHR0NHR0NHQ==', 'base64');
    
    return new Response(fallbackIcon, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }
}
