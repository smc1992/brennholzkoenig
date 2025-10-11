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
  // 1) Fallback, wenn gar keine Infos vorhanden sind
  if (!filename && !seoSlug) {
    return '/api/placeholder?width=400&height=400&text=Bild+nicht+verfügbar';
  }

  const input = filename || '';

  // 2) Bereits vollständige URLs oder bekannte absolute Pfade unangetastet lassen
  if (input.startsWith('http')) return input;
  if (input.startsWith('/api/cdn/')) return input;
  // Behandle alte /images/ SEO-Referenzen als CDN-SEO-Slug
  if (input.startsWith('/images/')) {
    const slugFromImages = input.replace('/images/', '').replace(/^\//, '');
    return `/api/cdn/products/${slugFromImages}`;
  }
  if (input.startsWith('/storage-images/')) return input; // evtl. alternative Route

  // 3) SEO-Slug bevorzugen, wenn konfiguriert
  const useSEOSlug = !!seoSlug && process.env.NEXT_PUBLIC_USE_SEO_URLS !== 'false';

  // 4) Auf Basename reduzieren (entfernt etwa 'products/')
  const basename = (input.split('/').pop() || input).replace(/^\//, '');

  // 5) Ziel ermitteln – Extension NICHT erforderlich (SEO-Slugs erlaubt)
  const target = useSEOSlug ? seoSlug! : basename;

  // 6) Wenn gar kein Ziel ermittelbar ist, Fallback
  if (!target) {
    return '/api/placeholder?width=400&height=400&text=Bild+nicht+verfügbar';
  }

  // 7) Einheitliche API-Route für Supabase-Storage nutzen (mit oder ohne Extension)
  return `/api/cdn/products/${target}`;
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
  return (url.startsWith('/api/cdn/products/') || url.startsWith('/storage-images/') || url.startsWith('/images/')) && /\.[a-z]{3,4}$/.test(url);
};

/**
 * Extrahiert den SEO-Slug aus einer URL
 */
export const extractSEOSlug = (url: string): string | null => {
  const match = url.match(/\/images\/([^?#]+)/);
  return match ? match[1] : null;
};
