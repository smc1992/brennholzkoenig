'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

interface ImageItem {
  id: string;
  url: string;
  seoSlug: string;
  storageFilename: string;
  isMain?: boolean;
}

interface ProductImageGalleryProps {
  productData?: {
    name: string;
    category?: string;
    wood_type?: string;
    size?: string;
    id?: number;
  };
  initialImages?: string[];
  onImagesChange: (images: ImageItem[]) => void;
  maxImages?: number;
}

export default function ProductImageGallery({
  productData,
  initialImages = [],
  onImagesChange,
  maxImages = 6
}: ProductImageGalleryProps) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const onImagesChangeRef = useRef(onImagesChange);
  
  // Update ref when callback changes
  useEffect(() => {
    onImagesChangeRef.current = onImagesChange;
  }, [onImagesChange]);



  // Memoize initial images to prevent re-creation
  const memoizedInitialImages = useMemo(() => {
    if (initialImages.length > 0) {
      return initialImages.map((url, index) => ({
        id: `initial-${index}`,
        url,
        seoSlug: '',
        storageFilename: '',
        isMain: index === 0
      }));
    }
    return [];
  }, [initialImages.length, initialImages.join(',')]);

  // Initialize images from URLs
  useEffect(() => {
    if (memoizedInitialImages.length > 0) {
      setImages(memoizedInitialImages);
    } else if (images.length > 0) {
      setImages([]);
    }
    setIsInitialized(true);
  }, [memoizedInitialImages.length]); // Only depend on memoized length

  // Notify parent of image changes (only after initialization)
  useEffect(() => {
    if (isInitialized) {
      onImagesChangeRef.current(images);
    }
  }, [images, isInitialized]); // Separate effect for parent notification

  const handleFileUpload = async (files: FileList) => {
    if (!productData || !productData.name || productData.name.trim() === '') {
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
          const { seoUrl, seoSlug, storageFilename, cdnUrl } = result.data;
          const displayUrl = seoUrl || seoSlug || `/images/${seoSlug}`;

          return {
            id: `uploaded-${Date.now()}-${Math.random()}`,
            url: displayUrl,
            seoSlug,
            storageFilename,
            isMain: images.length === 0 // First image is main
          };
        }
        throw new Error('Upload failed');
      });

      const uploadedImages = await Promise.all(uploadPromises);
      const newImages = [...images, ...uploadedImages];
      setImages(newImages);

      console.log('Bilder erfolgreich hochgeladen:', uploadedImages);
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Fehler beim Hochladen: ${error}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (imageItem: ImageItem) => {
    if (!imageItem.storageFilename) {
      // Remove URL-only image
      const newImages = images.filter(img => img.id !== imageItem.id);
      setImages(newImages);
      return;
    }

    try {
      // Delete from Supabase Storage
      const { error: storageError } = await supabase.storage
        .from('products')
        .remove([imageItem.storageFilename]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
      }

      // Delete from image_mappings table
      if (imageItem.seoSlug) {
        const { error: mappingError } = await supabase
          .from('image_mappings')
          .delete()
          .eq('seo_slug', imageItem.seoSlug);

        if (mappingError) {
          console.error('Mapping delete error:', mappingError);
        }
      }

      // Remove from local state
      const newImages = images.filter(img => img.id !== imageItem.id);
      
      // If deleted image was main, make first remaining image main
      if (imageItem.isMain && newImages.length > 0) {
        newImages[0].isMain = true;
      }
      
      setImages(newImages);

      console.log('Bild erfolgreich gelöscht:', imageItem.seoSlug);
    } catch (error) {
      console.error('Delete error:', error);
      alert(`Fehler beim Löschen: ${error}`);
    }
  };

  const setAsMain = (imageId: string) => {
    const newImages = images.map(img => ({
      ...img,
      isMain: img.id === imageId
    }));
    setImages(newImages);
  };

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
            <i className="ri-upload-cloud-2-line text-3xl"></i>
          </div>
          <div>
            <label className="cursor-pointer">
              <span className="text-[#C04020] hover:text-[#A03318] font-medium">
                Bilder auswählen
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    handleFileUpload(e.target.files);
                    // Input zurücksetzen für weitere Uploads
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className={`relative group border-2 rounded-lg overflow-hidden ${
                image.isMain ? 'border-[#C04020]' : 'border-gray-200'
              }`}
            >
              {/* Main Badge */}
              {image.isMain && (
                <div className="absolute top-2 left-2 z-10">
                  <span className="bg-[#C04020] text-white text-xs px-2 py-1 rounded">
                    Hauptbild
                  </span>
                </div>
              )}

              {/* Image */}
              <div className="aspect-square bg-gray-100">
                <img
                  src={image.url}
                  alt="Produktbild"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-image.jpg';
                  }}
                />
              </div>

              {/* Actions */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex space-x-2">
                  {!image.isMain && (
                    <button
                      onClick={() => setAsMain(image.id)}
                      className="bg-white text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
                      title="Als Hauptbild setzen"
                    >
                      <i className="ri-star-line text-sm"></i>
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(image)}
                    className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                    title="Bild löschen"
                  >
                    <i className="ri-delete-bin-line text-sm"></i>
                  </button>
                </div>
              </div>

              {/* SEO Info */}
              {image.seoSlug && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="truncate" title={image.seoSlug}>
                    SEO: {image.seoSlug}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      {images.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <i className="ri-image-line text-4xl mb-2"></i>
          <div>Noch keine Bilder hochgeladen</div>
          <div className="text-sm">Das erste Bild wird automatisch als Hauptbild gesetzt</div>
        </div>
      )}
    </div>
  );
}