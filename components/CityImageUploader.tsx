'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface CityImageUploaderProps {
  currentImageUrl?: string;
  onImageUploaded: (imageUrl: string) => void;
  label: string;
  placeholder?: string;
  citySlug?: string;
  sectionType: string;
  className?: string;
}

export default function CityImageUploader({
  currentImageUrl,
  onImageUploaded,
  label,
  placeholder,
  citySlug,
  sectionType,
  className = ""
}: CityImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validierung
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (file.size > maxSize) {
      alert('Die Datei ist zu groß. Maximale Größe: 5MB');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      alert('Nur JPEG, PNG und WebP Dateien sind erlaubt');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Eindeutigen Dateinamen generieren
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop();
      const fileName = `city-images/${citySlug || 'default'}/${sectionType}/${timestamp}-${randomId}.${fileExtension}`;

      // Datei zu Supabase Storage hochladen
      const { data, error } = await supabase.storage
        .from('media')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Supabase Upload Fehler:', error);
        throw new Error(`Upload fehlgeschlagen: ${error.message}`);
      }

      // Öffentliche URL generieren
      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      setPreviewUrl(publicUrl);
      onImageUploaded(publicUrl);

      alert('Bild erfolgreich hochgeladen!');
    } catch (error) {
      console.error('Fehler beim Hochladen:', error);
      alert(`Fehler beim Hochladen: ${(error as Error).message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUrlChange = (url: string) => {
    setPreviewUrl(url);
    onImageUploaded(url);
  };

  const handleRemoveImage = async () => {
    if (currentImageUrl && currentImageUrl.includes('supabase')) {
      try {
        // Extrahiere den Pfad aus der URL
        const urlParts = currentImageUrl.split('/');
        const pathIndex = urlParts.findIndex(part => part === 'media');
        if (pathIndex !== -1) {
          const filePath = urlParts.slice(pathIndex + 1).join('/');
          
          const { error } = await supabase.storage
            .from('media')
            .remove([filePath]);
          
          if (error) {
            console.error('Fehler beim Löschen aus Storage:', error);
          }
        }
      } catch (error) {
        console.error('Storage-Löschfehler:', error);
      }
    }
    
    setPreviewUrl('');
    onImageUploaded('');
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      {/* URL Input */}
      <div className="flex gap-2">
        <input
          type="url"
          value={previewUrl}
          onChange={(e) => handleUrlChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
          placeholder={placeholder || "https://example.com/bild.jpg oder Datei hochladen"}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="px-4 py-2 bg-[#C04020] text-white rounded-lg hover:bg-[#A03318] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <i className="ri-upload-line"></i>
          {isUploading ? 'Lädt...' : 'Upload'}
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Progress */}
      {isUploading && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-[#C04020] h-2 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}

      {/* Image Preview */}
      {previewUrl && (
        <div className="relative">
          <div className="relative overflow-hidden rounded-lg border border-gray-300">
            <img 
              src={previewUrl} 
              alt={`Vorschau für ${label}`}
              className="w-full h-32 object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700 text-xs"
              title="Bild entfernen"
            >
              ×
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Klicken Sie auf das X um das Bild zu entfernen
          </p>
        </div>
      )}

      {/* Help Text */}
      <p className="text-sm text-gray-500">
        Unterstützte Formate: JPEG, PNG, WebP. Maximale Größe: 5MB.
        {citySlug && ` Bilder werden unter city-images/${citySlug}/${sectionType}/ gespeichert.`}
      </p>
    </div>
  );
}