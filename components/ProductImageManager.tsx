'use client';

import { useState, useEffect } from 'react';
import { getCDNUrl } from '@/utils/cdn';
import { supabase } from '@/lib/supabase';

interface ImageItem {
  id: string;
  seoSlug: string;
  storageFilename: string;
  url: string;
  mappingId?: number;
  isMain?: boolean;
  imageOrder?: number;
  imageIndex?: number;
}

interface ProductImageManagerProps {
  productData: {
    id?: number;
    name: string;
    category?: string;
    wood_type?: string;
    size?: string;
  };
  onImagesChange?: (images: ImageItem[]) => void;
  onImageUpdate?: (imageUrl: string) => void;
  maxImages?: number;
  showMainImageSelector?: boolean;
}

export default function ProductImageManager({
  productData,
  onImagesChange,
  onImageUpdate,
  maxImages = 6,
  showMainImageSelector = true
}: ProductImageManagerProps) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Bilder laden wenn Produkt-ID vorhanden
  useEffect(() => {
    if (productData.id) {
      loadExistingImages();
    }
  }, [productData.id]);

  // Parent über Änderungen informieren
  useEffect(() => {
    if (onImagesChange) {
      onImagesChange(images);
    }
  }, [images, onImagesChange]);

  const loadExistingImages = async () => {
    if (!productData.id) return;
    
    try {
      const { data, error } = await supabase
        .from('image_mappings')
        .select('id, seo_slug, storage_filename, is_main_image, image_order, image_index')
        .eq('product_id', productData.id)
        .order('image_order', { ascending: true }); // Sortiere nach Reihenfolge
      
      if (error) throw error;
      
      const loadedImages: ImageItem[] = data.map((mapping: any) => ({
        id: `mapping-${mapping.id}`,
        seoSlug: mapping.seo_slug as string,
        storageFilename: mapping.storage_filename as string,
        url: `/images/${mapping.seo_slug}`,
        mappingId: mapping.id as number,
        isMain: mapping.is_main_image || false,
        imageOrder: mapping.image_order || 1,
        imageIndex: mapping.image_index || 1
      }));
      
      // Sortiere Bilder: Hauptbild zuerst, dann nach image_order
      const sortedImages = loadedImages.sort((a, b) => {
        if (a.isMain && !b.isMain) return -1;
        if (!a.isMain && b.isMain) return 1;
        return (a.imageOrder || 1) - (b.imageOrder || 1);
      });
      
      setImages(sortedImages);
      console.log(`Loaded ${sortedImages.length} images for product ${productData.id}:`, {
        mainImage: sortedImages.find(img => img.isMain)?.url,
        totalImages: sortedImages.length
      });
    } catch (error) {
      console.error('Error loading existing images:', error);
    }
  };

  const setAsMainImage = async (imageId: string) => {
    if (!productData.id) return;
    
    try {
      // Finde das Bild in der lokalen Liste
      const targetImage = images.find(img => img.id === imageId);
      if (!targetImage || !targetImage.mappingId) {
        console.error('Image not found or missing mapping ID');
        return;
      }
      
      // Verwende die Set-Main-Image API
      const response = await fetch('/api/set-main-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: productData.id,
          imageId: targetImage.mappingId
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Error setting main image:', result.error);
        return;
      }
      
      // Aktualisiere lokalen State
      setImages(prevImages => 
        prevImages.map(img => ({
          ...img,
          isMain: img.id === imageId
        }))
      );
      
      // Callback für Parent-Komponente
      if (onImageUpdate) {
        onImageUpdate(targetImage.url);
      }
      
      console.log('Main image updated successfully:', result.data.newMainImageUrl);
    } catch (error) {
      console.error('Error setting main image:', error);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (!productData.name || productData.name.trim() === '') {
      alert('Fehler: Ein Produktname muss eingegeben werden, bevor Bilder hochgeladen werden können.');
      return;
    }

    if (images.length + files.length > maxImages) {
      alert(`Maximal ${maxImages} Bilder erlaubt. Aktuell: ${images.length}`);
      return;
    }

    setIsUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('productData', JSON.stringify(productData));

        const response = await fetch('/api/upload/product-image', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Upload fehlgeschlagen');
        }

        if (result.success) {
          const { seoSlug, storageFilename, mappingId } = result.data;
          
          return {
            id: `uploaded-${Date.now()}-${Math.random()}`,
            seoSlug,
            storageFilename,
            url: `/images/${seoSlug}`,
            mappingId,
            isMain: images.length === 0 // Erstes Bild ist Hauptbild
          };
        }
        throw new Error('Upload failed');
      });

      const uploadedImages = await Promise.all(uploadPromises);
      const newImages = [...images, ...uploadedImages];
      setImages(newImages);

      // Sofortiges Callback-Feedback für Parent-Komponenten
      if (onImagesChange) {
        onImagesChange(newImages);
      }
      
      // Benachrichtige Parent über Hauptbild-Update
      if (onImageUpdate && uploadedImages.length > 0) {
        const mainImage = uploadedImages.find(img => img.isMain) || uploadedImages[0];
        onImageUpdate(mainImage.url);
      }

      console.log('Bilder erfolgreich hochgeladen:', uploadedImages);
      console.log('✅ Sofortiges UI-Feedback gesendet');
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Fehler beim Hochladen: ${error}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async (image: ImageItem) => {
    if (!confirm('Möchten Sie dieses Bild wirklich löschen?')) {
      return;
    }

    setIsDeleting(image.id);

    try {
      const params = new URLSearchParams();
      if (image.mappingId) {
        params.append('mappingId', image.mappingId.toString());
      } else {
        params.append('seoSlug', image.seoSlug);
      }

      const response = await fetch(`/api/delete/product-image?${params}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Löschen fehlgeschlagen');
      }

      // Bild aus der Liste entfernen
      setImages(prev => {
        const newImages = prev.filter(img => img.id !== image.id);
        // Wenn das gelöschte Bild das Hauptbild war, das erste verbleibende als Hauptbild setzen
        if (image.isMain && newImages.length > 0) {
          newImages[0].isMain = true;
        }
        return newImages;
      });

      console.log('Bild erfolgreich gelöscht:', image.seoSlug);
    } catch (error) {
      console.error('Delete error:', error);
      alert(`Fehler beim Löschen: ${error}`);
    } finally {
      setIsDeleting(null);
    }
  };

  // Die setAsMainImage-Funktion wurde bereits oben definiert - entferne diese Duplikation

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver
            ? 'border-[#C04020] bg-orange-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="space-y-2">
          <div className="text-gray-600">
            <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <label className="cursor-pointer">
              <span className="text-[#C04020] hover:text-[#A03318] font-medium">
                Bilder auswählen
              </span>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    handleFileUpload(e.target.files);
                    e.target.value = '';
                  }
                }}
                disabled={isUploading}
              />
            </label>
            <span className="text-gray-500"> oder hierher ziehen</span>
          </div>
          <div className="text-sm text-gray-500">
            Maximal {maxImages} Bilder • JPG, PNG, WebP • Max. 5MB pro Bild
          </div>
          {images.length > 0 && (
            <div className="text-sm text-gray-600">
              {images.length} von {maxImages} Bildern hochgeladen
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isUploading && (
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center space-x-2 text-[#C04020]">
            <div className="w-4 h-4 border-2 border-[#C04020] border-t-transparent rounded-full animate-spin"></div>
            <span>Bilder werden hochgeladen...</span>
          </div>
        </div>
      )}

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Hochgeladene Bilder</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={image.url}
                    alt={`Produktbild ${image.seoSlug}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/api/placeholder?width=400&height=400&text=Bild+nicht+verfügbar';
                    }}
                  />
                </div>
                
                {/* Overlay mit Aktionen */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                    {/* Hauptbild setzen */}
                    {showMainImageSelector && (
                      <button
                        onClick={() => setAsMainImage(image.id)}
                        className={`px-2 py-1 text-xs rounded ${
                          image.isMain
                            ? 'bg-green-500 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                        title={image.isMain ? 'Hauptbild' : 'Als Hauptbild setzen'}
                      >
                        {image.isMain ? '★ Haupt' : '☆ Haupt'}
                      </button>
                    )}
                    
                    {/* Löschen */}
                    <button
                      onClick={() => handleDeleteImage(image)}
                      disabled={isDeleting === image.id}
                      className="bg-red-500 text-white p-2 rounded hover:bg-red-600 disabled:opacity-50"
                      title="Bild löschen"
                    >
                      {isDeleting === image.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Hauptbild-Badge */}
                {image.isMain && showMainImageSelector && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                    Hauptbild
                  </div>
                )}
                
                {/* SEO-Slug anzeigen */}
                <div className="mt-2 text-xs text-gray-500 truncate" title={image.seoSlug}>
                  SEO: {image.seoSlug}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}