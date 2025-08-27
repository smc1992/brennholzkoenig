'use client';
import { useState } from 'react';
import { getCDNUrl } from '@/utils/cdn';

interface ShopImageGalleryProps {
  mainImage: string;
  additionalImages?: string[];
  productName: string;
  className?: string;
}

export default function ShopImageGallery({
  mainImage,
  additionalImages = [],
  productName,
  className = ''
}: ShopImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(mainImage);
  const [imageError, setImageError] = useState<string[]>([]);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Combine all images
  const allImages = [mainImage, ...additionalImages].filter(Boolean);

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
    setLightboxIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setLightboxIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  if (allImages.length === 0) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500">
          <i className="ri-image-line text-4xl mb-2"></i>
          <div>Kein Bild verfügbar</div>
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
              onClick={() => openLightbox(allImages.indexOf(selectedImage))}
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
          {allImages.length > 1 && (
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
              {allImages.indexOf(selectedImage) + 1} / {allImages.length}
            </div>
          )}
        </div>

        {/* Thumbnail Gallery */}
        {allImages.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {allImages.map((image, index) => {
              const isSelected = image === selectedImage;
              const hasError = imageError.includes(image);
              
              if (hasError) return null;
              
              return (
                <button
                  key={index}
                  onClick={() => setSelectedImage(image)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    isSelected
                      ? 'border-[#C04020] ring-2 ring-[#C04020] ring-opacity-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={getImageUrl(image)}
                    alt={`${productName} - Bild ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(image)}
                  />
                </button>
              );
            })}
          </div>
        )}

        {/* Image Info */}
        <div className="text-sm text-gray-600 space-y-1">
          <div className="flex items-center justify-between">
            <span>Hochauflösende Produktbilder</span>
            {allImages.length > 1 && (
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                {allImages.length} Bilder
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            Klicken Sie auf das Bild für eine vergrößerte Ansicht
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
          <div className="relative max-w-4xl max-h-full p-4">
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-colors"
            >
              <i className="ri-close-line text-xl"></i>
            </button>

            {/* Navigation Buttons */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-colors"
                >
                  <i className="ri-arrow-left-line text-xl"></i>
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-colors"
                >
                  <i className="ri-arrow-right-line text-xl"></i>
                </button>
              </>
            )}

            {/* Main Lightbox Image */}
            <div className="relative">
              <img
                src={getImageUrl(allImages[lightboxIndex])}
                alt={`${productName} - Bild ${lightboxIndex + 1}`}
                className="max-w-full max-h-[80vh] object-contain"
              />
              
              {/* Image Counter */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full">
                {lightboxIndex + 1} / {allImages.length}
              </div>
            </div>

            {/* Thumbnail Strip */}
            {allImages.length > 1 && (
              <div className="flex justify-center mt-4 space-x-2 overflow-x-auto">
                {allImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setLightboxIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      index === lightboxIndex
                        ? 'border-[#C04020]'
                        : 'border-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={getImageUrl(image)}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Click outside to close */}
          <div
            className="absolute inset-0 -z-10"
            onClick={closeLightbox}
          ></div>
        </div>
      )}
    </>
  );
}