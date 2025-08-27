'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getCDNUrl } from '@/utils/cdn';
import { useImageCache } from '@/hooks/useImageCache';

interface ProductImageGalleryDisplayProps {
  productName: string;
  productId?: number;
  className?: string;
}

interface ImageItem {
  seo_slug: string;
  created_at: string;
}

export default function ProductImageGalleryDisplay({
  productName,
  productId,
  className = ''
}: ProductImageGalleryDisplayProps) {
  const [images, setImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState<string[]>([]);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lastSync, setLastSync] = useState<number>(Date.now());

  const { getProductImages, invalidateCache } = useImageCache();

  const loadProductImages = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      
      // Bei forceRefresh Cache invalidieren
      if (forceRefresh) {
        invalidateCache(productName);
      }
      
      // Lade Bilder über Cache
      const imageUrls = await getProductImages(productName, productId);
      
      if (imageUrls.length > 0) {
        setImages(imageUrls);
        
        // Setze das erste Bild als ausgewählt, falls noch keins ausgewählt ist
        if (!selectedImage || !imageUrls.includes(selectedImage)) {
          setSelectedImage(imageUrls[0]);
        }
        
        setLastSync(Date.now());
      } else {
        setImages([]);
        setSelectedImage('');
      }
    } catch (error) {
      console.error('Error loading product images:', error);
    } finally {
      setIsLoading(false);
    }
  }, [productName, productId, getProductImages, invalidateCache, selectedImage]);

  // Initial load
  useEffect(() => {
    loadProductImages();
  }, [loadProductImages]);

  // Auto-Sync alle 30 Sekunden
  useEffect(() => {
    if (!productName) return;
    
    const interval = setInterval(() => {
      loadProductImages(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [productName, loadProductImages]);

  // Listen for real-time image changes
  useEffect(() => {
    const handleImageChange = (event: CustomEvent) => {
      const { productName: changedProduct, action } = event.detail;
      
      // Check if this change affects our product
      const ourProductSlug = productName
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      if (changedProduct.includes(ourProductSlug) || ourProductSlug.includes(changedProduct)) {
        console.log(`Real-time update for ${productName}: ${action}`);
        loadProductImages(true); // Force refresh
      }
    };

    window.addEventListener('imageChange', handleImageChange as EventListener);
    
    return () => {
      window.removeEventListener('imageChange', handleImageChange as EventListener);
    };
  }, [productName, loadProductImages]);

  const handleImageError = (imageUrl: string) => {
    setImageError(prev => [...prev, imageUrl]);
  };

  const getImageUrl = (url: string) => {
    if (url.startsWith('http')) {
      return url;
    }
    return getCDNUrl(url);
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  const nextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const setAsMainImage = useCallback(async (imageUrl: string) => {
    if (!productId) return;
    
    try {
      // Aktualisiere das Hauptbild in der Datenbank
      const { error } = await supabase
        .from('products')
        .update({ image_url: imageUrl })
        .eq('id', productId);

      if (error) {
        console.error('Error updating main image:', error);
        return;
      }

      // Aktualisiere lokalen State
      setSelectedImage(imageUrl);
      
      // Cache invalidieren für sofortige Aktualisierung
      invalidateCache(productName);
      
      console.log('Main image updated successfully');
    } catch (error) {
      console.error('Error setting main image:', error);
    }
  }, [productId, invalidateCache, productName]);

  const refreshImages = useCallback(() => {
    loadProductImages(true);
  }, [loadProductImages]);

  if (isLoading) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center h-96 ${className}`}>
        <div className="text-center text-gray-500">
          <div className="animate-spin w-8 h-8 border-2 border-[#C04020] border-t-transparent rounded-full mx-auto mb-2"></div>
          <div>Bilder werden geladen...</div>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center h-96 ${className}`}>
        <div className="text-center text-gray-500">
          <i className="ri-image-line text-4xl mb-2"></i>
          <div>Kein Bild verfügbar</div>
        </div>
      </div>
    );
  }

  // Einzelbild-Anzeige (keine Galerie)
  if (images.length === 1) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="relative group">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={getImageUrl(selectedImage)}
              alt={productName}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => handleImageError(selectedImage)}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`space-y-4 ${className}`}>
        {/* Main Image */}
        <div className="relative group">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={getImageUrl(selectedImage)}
              alt={productName}
              className="w-full h-full object-cover cursor-zoom-in transition-transform duration-300 group-hover:scale-105"
              onClick={() => openLightbox(images.indexOf(selectedImage))}
              onError={() => handleImageError(selectedImage)}
            />
          </div>
          
          {/* Zoom Icon */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-black bg-opacity-50 text-white p-2 rounded-full">
              <i className="ri-zoom-in-line text-sm"></i>
            </div>
          </div>

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
              {images.indexOf(selectedImage) + 1} / {images.length}
            </div>
          )}

          {/* Refresh Button */}
          <div className="absolute top-4 left-4">
            <button
              onClick={refreshImages}
              className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
              title="Bilder aktualisieren"
            >
              <i className="ri-refresh-line text-sm"></i>
            </button>
          </div>

          {/* Sync Status */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-green-500 bg-opacity-80 text-white px-2 py-1 rounded text-xs">
              Sync: {new Date(lastSync).toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Thumbnail Gallery */}
        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {images.map((image, index) => {
              const isSelected = image === selectedImage;
              const hasError = imageError.includes(image);
              
              if (hasError) return null;
              
              return (
                <div
                  key={index}
                  className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 group ${
                    isSelected 
                      ? 'ring-2 ring-[#C04020] ring-offset-2' 
                      : 'hover:ring-2 hover:ring-gray-300 hover:ring-offset-1'
                  }`}
                  onClick={() => setSelectedImage(image)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setAsMainImage(image);
                  }}
                >
                  <img
                    src={getImageUrl(image)}
                    alt={`${productName} - Bild ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(image)}
                  />
                  
                  {/* Hauptbild-Indikator */}
                  {image === selectedImage && (
                    <div className="absolute top-1 right-1 bg-[#C04020] text-white p-1 rounded-full text-xs">
                      <i className="ri-star-fill"></i>
                    </div>
                  )}
                  
                  {/* Hauptbild-Button (bei Hover) */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAsMainImage(image);
                      }}
                      className="opacity-0 group-hover:opacity-100 bg-[#C04020] text-white px-2 py-1 rounded text-xs transition-opacity"
                      title="Als Hauptbild setzen"
                    >
                      Hauptbild
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="relative max-w-4xl max-h-full p-4">
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
                >
                  <i className="ri-arrow-left-line text-3xl"></i>
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
                >
                  <i className="ri-arrow-right-line text-3xl"></i>
                </button>
              </>
            )}

            {/* Main Image */}
            <img
              src={getImageUrl(images[lightboxIndex])}
              alt={`${productName} - Bild ${lightboxIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full">
              {lightboxIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}