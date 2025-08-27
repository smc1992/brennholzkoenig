/**
 * SEO-Utilities für Brennholzkönig
 * Generiert SEO-freundliche URLs und Slugs
 */

export interface Product {
  id?: number;
  name: string;
  category?: string;
  size?: string;
  wood_type?: string;
  description?: string;
}

/**
 * Generiert einen SEO-freundlichen Slug aus Produktdaten
 */
export const generateProductSlug = (product: Product): string => {
  const parts = [
    product.wood_type || '',
    product.category || '',
    product.size || '',
    'brennholz'
  ].filter(Boolean);
  
  return parts
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim();
};

/**
 * Generiert einen SEO-freundlichen Dateinamen für Bilder
 */
export const generateImageSlug = (product: Product, originalFilename?: string): string => {
  const name = product.name || 'produkt';
  const category = product.category || 'brennholz';
  
  // Dateiendung extrahieren
  const extension = originalFilename ? 
    originalFilename.split('.').pop()?.toLowerCase() || 'jpg' : 
    'jpg';
  
  // Eindeutigen Timestamp hinzufügen
  const timestamp = Date.now();
  
  // Produktname für SEO-Slug verwenden
  let baseSlug = name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Sonderzeichen entfernen
    .replace(/\s+/g, '-') // Leerzeichen zu Bindestrichen
    .replace(/-+/g, '-') // Mehrfache Bindestriche reduzieren
    .replace(/^-|-$/g, ''); // Bindestriche am Anfang/Ende entfernen
  
  // Falls der Produktname zu kurz ist, Fallback verwenden
  if (baseSlug.length < 3) {
    const productSlug = generateProductSlug(product);
    baseSlug = productSlug;
  }
  
  // SEO-freundlichen Slug erstellen
  const slug = `${baseSlug}-${timestamp}.${extension}`
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return slug;
};

/**
 * Generiert einen eindeutigen Dateinamen für Supabase Storage
 */
export const generateStorageFilename = (originalFilename: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalFilename.split('.').pop()?.toLowerCase() || 'jpg';
  
  return `${timestamp}-${randomString}.${extension}`;
};

/**
 * Mapping zwischen SEO-URLs und Storage-Dateinamen
 */
export interface ImageMapping {
  seoSlug: string;
  storageFilename: string;
  productId?: number;
  createdAt: string;
}

/**
 * Erstellt ein Image-Mapping für die Datenbank
 */
export const createImageMapping = (
  product: Product, 
  storageFilename: string,
  originalFilename?: string
): ImageMapping => {
  return {
    seoSlug: generateImageSlug(product, originalFilename),
    storageFilename,
    productId: product.id,
    createdAt: new Date().toISOString()
  };
};

/**
 * Validiert einen SEO-Slug
 */
export const isValidSlug = (slug: string): boolean => {
  return /^[a-z0-9-]+\.[a-z]{3,4}$/.test(slug);
};

/**
 * Extrahiert Produktinformationen aus einem SEO-Slug
 */
export const parseProductSlug = (slug: string): Partial<Product> => {
  const parts = slug.replace(/\.[^.]+$/, '').split('-');
  
  return {
    wood_type: parts[0] || '',
    category: parts[1] || '',
    size: parts[2] || ''
  };
};

/**
 * Generiert Alt-Text für Bilder basierend auf Produktdaten
 */
export const generateImageAltText = (product: Product): string => {
  const parts = [
    product.wood_type || 'Brennholz',
    product.category || '',
    product.size || '',
    'von Brennholzkönig'
  ].filter(Boolean);
  
  return parts.join(' ');
};

/**
 * Generiert Meta-Description für Produktseiten
 */
export const generateProductMetaDescription = (product: Product): string => {
  const woodType = product.wood_type || 'Brennholz';
  const category = product.category || '';
  const size = product.size || '';
  
  return `${woodType} ${category} ${size} online kaufen bei Brennholzkönig. ✓ Premium Qualität ✓ Schnelle Lieferung ✓ Faire Preise. Jetzt bestellen!`
    .replace(/\s+/g, ' ')
    .trim();
};