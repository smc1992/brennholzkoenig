'use client';
import { useState } from 'react';
import { getCDNUrl, getProductImageUrl } from '@/utils/cdn';
import { generateImageSlug } from '@/utils/seo';

interface ProductImageUploaderProps {
  initialUrl?: string;
  onImageUploaded: (url: string, seoSlug?: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  productData?: {
    name: string;
    category?: string;
    wood_type?: string;
    size?: string;
    id?: number;
  };
}

export default function ProductImageUploader({
  initialUrl = '',
  onImageUploaded,
  label = 'Bild',
  required = false,
  placeholder = 'Bild hochladen oder URL eingeben',
  productData
}: ProductImageUploaderProps) {
  const [imageUrl, setImageUrl] = useState<string>(initialUrl);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [seoSlug, setSeoSlug] = useState<string>('');
  const [showMediaManager, setShowMediaManager] = useState<boolean>(false);

  // Debug: Produktdaten loggen
  console.log('ProductImageUploader productData:', productData);
  console.log('ProductImageUploader productData.name:', productData?.name);
  console.log('ProductImageUploader productData vorhanden:', !!productData && !!productData.name);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setImageUrl(url);
    onImageUploaded(url);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validierung: Produktname ist erforderlich
    if (!productData || !productData.name || productData.name.trim() === '') {
      alert('Fehler: Ein Produktname muss eingegeben werden, bevor ein Bild hochgeladen werden kann.');
      // Input zurücksetzen
      e.target.value = '';
      return;
    }

    console.log('Upload gestartet mit Produktdaten:', productData);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // FormData für Upload-API vorbereiten
      const formData = new FormData();
      formData.append('file', file);
      
      // Produktdaten nur hinzufügen wenn vorhanden
      if (productData && productData.name) {
        formData.append('productData', JSON.stringify(productData));
      }

      // Upload über neue API-Route
      const response = await fetch('/api/upload/product-image', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload fehlgeschlagen');
      }

      if (result.success) {
        const { seoUrl, seoSlug: uploadedSeoSlug, storageFilename, cdnUrl } = result.data;
        
        // CDN-URL für Bildanzeige verwenden
        const displayUrl = cdnUrl || `/api/cdn/products/${storageFilename}`;
        setImageUrl(displayUrl);
        setSeoSlug(uploadedSeoSlug);
        
        // Parent-Komponente benachrichtigen
        onImageUploaded(storageFilename, uploadedSeoSlug);
        
        console.log('Upload erfolgreich:', {
          seoUrl,
          cdnUrl: displayUrl,
          seoSlug: uploadedSeoSlug,
          storageFilename
        });
      }

    } catch (error) {
      console.error('Fehler beim Hochladen des Bildes:', error);
      alert(`Fehler beim Hochladen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="flex flex-col space-y-3">
        {/* Upload-Progress */}
        {isUploading && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}

        {/* Vorschau des aktuellen Bildes */}
        {imageUrl && (
          <div className="space-y-2">
            <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden">
              <img 
                src={imageUrl} 
                alt="Produktbild" 
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setImageUrl('');
                  setSeoSlug('');
                  onImageUploaded('');
                }}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                title="Bild entfernen"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            {/* SEO-URL Anzeige */}
            {seoSlug && (
              <div className="text-xs text-gray-600 bg-green-50 p-2 rounded border">
                <span className="font-medium text-green-700">SEO-URL:</span> /images/{seoSlug}
              </div>
            )}
          </div>
        )}
        
        {/* SEO-URL Vorschau */}
        {productData && productData.name && (
          <div className="text-xs bg-blue-50 p-2 rounded border">
            <strong className="text-blue-700">SEO-URL Vorschau:</strong>
            <span className="font-mono text-blue-600">
              /images/{productData.wood_type?.toLowerCase() || 'brennholz'}-{productData.category?.toLowerCase() || 'holz'}-{productData.size || '25cm'}.jpg
            </span>
          </div>
        )}

        {/* Debug-Info (nur Development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs bg-yellow-50 p-2 rounded border">
            <strong>Debug:</strong> productData = {JSON.stringify(productData)}
            <br />
            Upload disabled: {isUploading ? 'true' : 'false'}
          </div>
        )}

        {/* URL-Eingabe und Upload-Buttons */}
        <div className="flex gap-2">
          <input
            type="text"
            value={imageUrl}
            onChange={handleUrlChange}
            placeholder={placeholder}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
            required={required && !imageUrl}
          />
          
          <label className={`
            px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center
            ${isUploading 
              ? 'bg-blue-100 text-blue-700 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'}
            ${!productData ? 'opacity-50 cursor-not-allowed' : ''}
          `}>
            {isUploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload
              </>
            )}
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
