'use client';
import { useState } from 'react';
import { getCDNUrl, getProductImageUrl } from '@/utils/cdn';
import { generateImageSlug } from '@/utils/seo';
import ImageCropper from './ImageCropper';

interface ProductImageUploaderWithCropProps {
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
  aspectRatio?: number;
  minWidth?: number;
  minHeight?: number;
}

export default function ProductImageUploaderWithCrop({
  initialUrl = '',
  onImageUploaded,
  label = 'Bild',
  required = false,
  placeholder = 'Bild hochladen oder URL eingeben',
  productData,
  aspectRatio = 1, // Standard: quadratisch
  minWidth = 300,
  minHeight = 300
}: ProductImageUploaderWithCropProps) {
  const [imageUrl, setImageUrl] = useState<string>(initialUrl);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [seoSlug, setSeoSlug] = useState<string>('');
  const [showCropper, setShowCropper] = useState<boolean>(false);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setImageUrl(url);
    onImageUploaded(url);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validierung: Produktname ist erforderlich
    if (!productData || !productData.name || productData.name.trim() === '') {
      alert('Fehler: Ein Produktname muss eingegeben werden, bevor ein Bild hochgeladen werden kann.');
      e.target.value = '';
      return;
    }

    // Dateityp validieren
    if (!file.type.startsWith('image/')) {
      alert('Bitte wählen Sie eine gültige Bilddatei aus.');
      e.target.value = '';
      return;
    }

    // Dateigröße validieren (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Die Datei ist zu groß. Maximale Größe: 10MB.');
      e.target.value = '';
      return;
    }

    // Datei für Cropping vorbereiten
    setOriginalFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setShowCropper(true);

    // Input zurücksetzen
    e.target.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!originalFile || !productData) return;

    setShowCropper(false);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Cropped Blob zu File konvertieren
      const croppedFile = new File(
        [croppedBlob],
        originalFile.name,
        { type: 'image/jpeg' }
      );

      // FormData für Upload-API vorbereiten
      const formData = new FormData();
      formData.append('file', croppedFile);
      formData.append('productData', JSON.stringify(productData));

      // Upload über API-Route
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
      console.error('Upload-Fehler:', error);
      alert('Fehler beim Hochladen des Bildes: ' + (error as Error).message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setOriginalFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl('');
      }
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setOriginalFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
  };

  const removeImage = () => {
    setImageUrl('');
    setSeoSlug('');
    onImageUploaded('');
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {/* Aktuelles Bild anzeigen */}
      {imageUrl && (
        <div className="relative inline-block">
          <img
            src={imageUrl}
            alt="Produktbild"
            className="w-32 h-32 object-cover rounded-lg border border-gray-300"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
            title="Bild entfernen"
          >
            <i className="ri-close-line"></i>
          </button>
        </div>
      )}
      
      {/* Upload-Bereich */}
      <div className="space-y-3">
        {/* Datei-Upload */}
        <div className="flex items-center space-x-3">
          <label className="cursor-pointer bg-[#C04020] hover:bg-[#A03318] text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center">
            <i className="ri-upload-2-line mr-2"></i>
            {isUploading ? 'Wird hochgeladen...' : 'Bild hochladen'}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />
          </label>
          
          {isUploading && (
            <div className="flex items-center space-x-2 text-[#C04020]">
              <div className="w-4 h-4 border-2 border-[#C04020] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Wird verarbeitet...</span>
            </div>
          )}
        </div>
        
        {/* URL-Input als Alternative */}
        <div className="text-sm text-gray-500 text-center">oder</div>
        <input
          type="url"
          value={imageUrl}
          onChange={handleUrlChange}
          placeholder={placeholder}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
          disabled={isUploading}
        />
      </div>
      
      {/* Hinweise */}
      <div className="text-xs text-gray-500">
        <p>• Unterstützte Formate: JPG, PNG, WebP</p>
        <p>• Maximale Dateigröße: 10MB</p>
        <p>• Empfohlene Mindestgröße: {minWidth}×{minHeight} Pixel</p>
        <p>• Seitenverhältnis: {aspectRatio === 1 ? 'Quadratisch (1:1)' : `${aspectRatio}:1`}</p>
      </div>
      
      {/* SEO-Slug anzeigen */}
      {seoSlug && (
        <div className="text-xs text-green-600">
          <i className="ri-check-line mr-1"></i>
          SEO-URL: {seoSlug}
        </div>
      )}
      
      {/* Image Cropper Modal */}
      {showCropper && previewUrl && (
        <ImageCropper
          imageSrc={previewUrl}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={aspectRatio}
          minWidth={minWidth}
          minHeight={minHeight}
        />
      )}
    </div>
  );
}