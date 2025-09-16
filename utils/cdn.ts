const CDN_ORIGIN = process.env.NEXT_PUBLIC_CDN_ORIGIN || 'https://cdn.brennholz-koenig.de';

/**
 * Erzeugt eine CDN-URL.
 * Beispiel: cdnUrl('/images/produkt1.jpg') -> https://cdn.../images/produkt1.jpg
 * Erwartet Pfade mit führendem '/' und Bucket im Pfad (z. B. '/images/...').
 */
export function cdnUrl(path: string) {
  if (!path.startsWith('/')) path = '/' + path;
  return `${CDN_ORIGIN}${path}`;
}

export const getCDNUrl = (filename: string, seoSlug?: string): string => {
  // Prüfen, ob filename null oder undefined ist
  if (!filename) {
    return '/api/placeholder?width=400&height=400&text=Bild+nicht+verfügbar';
  }
  
  // Prüfen, ob es sich bereits um eine vollständige URL handelt
  if (filename.startsWith('http')) {
    return filename;
  }
  
  // Wenn der Pfad bereits mit /images/ beginnt, verwende ihn direkt
  if (filename.startsWith('/images/')) {
    return filename;
  }
  
  // Bereinige den Dateinamen von führenden Slashes
  let cleanFilename = filename;
  if (cleanFilename.startsWith('/')) {
    cleanFilename = cleanFilename.substring(1);
  }
  
  // Prüfen, ob es sich um einen SEO-Slug handelt (enthält Produktname)
  const isSEOSlug = cleanFilename.includes('-') && !cleanFilename.match(/^\d+-[a-z0-9]+\./i);
  
  // SEO-freundliche URLs haben Priorität - verwende saubere /images/ Route
  if (seoSlug && process.env.NEXT_PUBLIC_USE_SEO_URLS !== 'false') {
    return `/images/${seoSlug}`;
  }
  
  // Alle Produktbilder verwenden die /images/ Route
  return `/images/${cleanFilename}`;
};

/**
 * Generiert eine SEO-optimierte Bild-URL basierend auf Produktdaten
 */
export const getProductImageUrl = (product: any): string => {
  // Wenn SEO-Slug verfügbar ist, verwende SEO-URL
  if (product.image_seo_slug) {
    return getCDNUrl(product.image_url, product.image_seo_slug);
  }
  
  // Fallback auf Standard-CDN-URL
  return getCDNUrl(product.image_url);
};

/**
 * Prüft ob eine URL eine SEO-freundliche Bild-URL ist
 */
export const isSEOImageUrl = (url: string): boolean => {
  return url.startsWith('/images/') && /\.[a-z]{3,4}$/.test(url);
};

/**
 * Extrahiert den SEO-Slug aus einer URL
 */
export const extractSEOSlug = (url: string): string | null => {
  const match = url.match(/\/images\/([^?#]+)/);
  return match ? match[1] : null;
};
