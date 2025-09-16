'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import ImageCropper from './ImageCropper';

interface ImageItem {
  id: string;
  url: string;
  seoSlug: string;
  storageFilename: string;
  isMain?: boolean;
}

interface ProductImageGalleryWithCropProps {
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
  aspectRatio?: number;
  minWidth?: number;
  minHeight?: number;
}

export default function ProductImageGalleryWithCrop({
  productData,
  initialImages = [],
  onImagesChange,
  maxImages = 6,
  aspectRatio = 1, // Standard: quadratisch
  minWidth = 300,
  minHeight = 300
}: ProductImageGalleryWithCropProps) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const onImagesChangeRef = useRef(onImagesChange);
  
  // Update ref when callback changes
  useEffect(() => {
    onImagesChangeRef.current = onImagesChange;
  }, [onImagesChange]);

  // Load existing images from database when product ID is available
  useEffect(() => {
    if (productData?.id) {
      loadExistingImages();
    }
  }, [productData?.id]);

  const loadExistingImages = async () => {
    if (!productData?.id) return;

    try {
      // Lade alle Bilder aus image_mappings für dieses Produkt
      const { data: mappings, error: mappingsError } = await supabase
        .from('image_mappings')
        .select('*')
        .eq('product_id', productData.id)
        .order('image_order', { ascending: true });

      if (mappingsError) {
        console.error('Fehler beim Laden der Bild-Mappings:', mappingsError);
        return;
      }

      const loadedImages: ImageItem[] = [];
      
      // Alle Bilder aus image_mappings hinzufügen
      if (mappings && mappings.length > 0) {
        mappings.forEach((mapping: any, index: number) => {
          loadedImages.push({
            id: `mapping-${mapping.id}`,
            url: `/api/cdn/products/${mapping.storage_filename}`,
            seoSlug: mapping.seo_slug,
            storageFilename: mapping.storage_filename,
            isMain: mapping.is_main_image || false
          });
        });
      }
      
      setImages(loadedImages);
      console.log('Bestehende Bilder geladen:', loadedImages);
    } catch (error) {
      console.error('Fehler beim Laden der Bilder:', error);
    }
  };

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
    console.log('🔄 useEffect für Bildinitialisierung ausgelöst:', {
      memoizedInitialImagesLength: memoizedInitialImages.length,
      currentImagesLength: images.length,
      isInitialized,
      showCropper,
      editingImageId
    });
    
    // Verhindere Reset während Cropping
    if (showCropper || editingImageId) {
      console.log('⚠️ Cropping aktiv - überspringe Bildinitialisierung');
      return;
    }
    
    if (memoizedInitialImages.length > 0) {
      console.log('📸 Setze memoized initial images');
      setImages(memoizedInitialImages);
    } else if (images.length > 0 && !isInitialized) {
      console.log('🗑️ Leere Bilder-Array');
      setImages([]);
    }
    
    if (!isInitialized) {
      setIsInitialized(true);
      console.log('✅ Initialisierung abgeschlossen');
    }
  }, [memoizedInitialImages.length, showCropper, editingImageId]);

  // Notify parent of image changes (only after initialization)
  useEffect(() => {
    console.log('🔔 useEffect für onImagesChange ausgelöst:', {
      isInitialized,
      imagesLength: images.length,
      showCropper,
      editingImageId
    });
    
    if (isInitialized) {
      console.log('📤 Benachrichtige Parent über Bildänderungen');
      onImagesChangeRef.current(images);
    }
  }, [images, isInitialized]);

  const handleFileSelect = async (files: FileList) => {
    if (!productData || !productData.name || productData.name.trim() === '') {
      alert('Fehler: Ein Produktname muss eingegeben werden, bevor Bilder hochgeladen werden können.');
      return;
    }

    if (images.length + files.length > maxImages) {
      alert(`Maximal ${maxImages} Bilder erlaubt. Aktuell: ${images.length}`);
      return;
    }

    // Nur das erste Bild für Cropping verwenden
    const file = files[0];
    if (!file) return;

    // Dateityp validieren
    if (!file.type.startsWith('image/')) {
      alert('Bitte wählen Sie eine gültige Bilddatei aus.');
      return;
    }

    // Dateigröße validieren (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Die Datei ist zu groß. Maximale Größe: 10MB.');
      return;
    }

    // Datei für Cropping vorbereiten
    setCurrentFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setShowCropper(true);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!currentFile || !productData) return;

    setShowCropper(false);
    setIsUploading(true);

    try {
      // Cropped Blob zu File konvertieren
      const croppedFile = new File(
        [croppedBlob],
        currentFile.name,
        { type: 'image/jpeg' }
      );

      // FormData für Upload-API vorbereiten
      const formData = new FormData();
      formData.append('file', croppedFile);
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
        
        if (editingImageId) {
          // Bestehendes Bild ersetzen
          const imageToEdit = images.find(img => img.id === editingImageId);
          if (imageToEdit) {
            // Altes Bild aus Storage löschen
            if (imageToEdit.storageFilename) {
              try {
                await fetch('/api/delete/product-image', {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ filename: imageToEdit.storageFilename })
                });
              } catch (deleteError) {
                console.warn('Fehler beim Löschen des alten Bildes:', deleteError);
              }
            }
            
            // Bild in der Liste aktualisieren
            setImages(prev => prev.map(img => 
              img.id === editingImageId 
                ? {
                    ...img,
                    url: cdnUrl || `/api/cdn/products/${storageFilename}`,
                    seoSlug,
                    storageFilename
                  }
                : img
            ));
            console.log('Bild erfolgreich bearbeitet:', editingImageId);
          }
        } else {
          // Neues Bild hinzufügen
          const newImage: ImageItem = {
            id: `uploaded-${Date.now()}`,
            url: cdnUrl || `/api/cdn/products/${storageFilename}`,
            seoSlug,
            storageFilename,
            isMain: images.length === 0 // Erstes Bild ist Hauptbild
          };

          setImages(prev => [...prev, newImage]);
          console.log('Bild erfolgreich hochgeladen:', newImage);
        }
      }
    } catch (error) {
      console.error('Upload-Fehler:', error);
      alert('Fehler beim Hochladen des Bildes: ' + (error as Error).message);
    } finally {
      setIsUploading(false);
      cleanupCropper();
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    cleanupCropper();
  };

  const cleanupCropper = () => {
    setCurrentFile(null);
    setEditingImageId(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
  };

  const editExistingImage = async (imageId: string) => {
    console.log('🖼️ Starte Bildbearbeitung für ID:', imageId);
    
    const imageToEdit = images.find(img => img.id === imageId);
    if (!imageToEdit) {
      console.error('❌ Bild nicht gefunden:', imageId);
      alert('Bild nicht gefunden!');
      return;
    }

    console.log('📸 Gefundenes Bild:', imageToEdit);

    try {
      console.log('🔄 Lade Bild von URL:', imageToEdit.url);
      
      // Lade das Bild als Blob
      const response = await fetch(imageToEdit.url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('✅ Blob geladen, Größe:', blob.size, 'bytes, Typ:', blob.type);
      
      // Erstelle eine File-Instanz aus dem Blob
      const file = new File([blob], 'existing-image.jpg', { type: 'image/jpeg' });
      console.log('📁 File erstellt:', file.name, file.size, 'bytes');
      
      // Erstelle Preview-URL
      const url = URL.createObjectURL(blob);
      console.log('🔗 Preview-URL erstellt:', url);
      
      // Setze States
      console.log('⚙️ Setze States...');
      setEditingImageId(imageId);
      setCurrentFile(file);
      setPreviewUrl(url);
      setShowCropper(true);
      
      console.log('✅ Cropper sollte jetzt geöffnet sein');
      
    } catch (error) {
      console.error('❌ Fehler beim Laden des Bildes:', error);
      alert('Fehler beim Laden des Bildes für die Bearbeitung: ' + (error as Error).message);
    }
  };

  const removeImage = async (imageId: string) => {
    const imageToRemove = images.find(img => img.id === imageId);
    if (!imageToRemove) return;

    try {
      // Wenn es ein hochgeladenes Bild ist, aus Storage löschen
      if (imageToRemove.storageFilename) {
        const params = new URLSearchParams({
          storageFilename: imageToRemove.storageFilename
        });
        const response = await fetch(`/api/delete/product-image?${params}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          console.warn('Fehler beim Löschen aus Storage:', await response.text());
        }
      }

      // Bild aus Liste entfernen
      const updatedImages = images.filter(img => img.id !== imageId);
      
      // Wenn das Hauptbild gelöscht wurde, das erste verbleibende Bild zum Hauptbild machen
      if (imageToRemove.isMain && updatedImages.length > 0) {
        updatedImages[0].isMain = true;
      }
      
      setImages(updatedImages);
    } catch (error) {
      console.error('Fehler beim Löschen des Bildes:', error);
      alert('Fehler beim Löschen des Bildes');
    }
  };

  const setMainImage = (imageId: string) => {
    setImages(prev => prev.map(img => ({
      ...img,
      isMain: img.id === imageId
    })));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload-Bereich */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver
            ? 'border-[#C04020] bg-[#C04020]/5'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-3">
          <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
            <i className="ri-image-add-line text-xl text-gray-400"></i>
          </div>
          
          <div>
            <label className="cursor-pointer bg-[#C04020] hover:bg-[#A03318] text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center">
              <i className="ri-upload-2-line mr-2"></i>
              {isUploading ? 'Wird hochgeladen...' : 'Bilder hochladen'}
              <input
                type="file"
                accept="image/*"
                multiple={false} // Nur ein Bild für Cropping
                onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                className="hidden"
                disabled={isUploading || images.length >= maxImages}
              />
            </label>
            <span className="text-gray-500 ml-2">oder hierher ziehen</span>
          </div>
          
          <div className="text-sm text-gray-500">
            <p>Maximal {maxImages} Bilder • JPG, PNG, WebP • Max. 10MB pro Bild</p>
            <p>Seitenverhältnis: {aspectRatio === 1 ? 'Quadratisch (1:1)' : `${aspectRatio}:1`}</p>
            <p>Mindestgröße: {minWidth}×{minHeight} Pixel</p>
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
            <span>Bild wird verarbeitet...</span>
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
                  />
                </div>
                
                {/* Overlay mit Aktionen */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                  {!image.isMain && (
                    <button
                      onClick={() => setMainImage(image.id)}
                      className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
                      title="Als Hauptbild setzen"
                    >
                      <i className="ri-star-line text-sm"></i>
                    </button>
                  )}
                  
                  {/* Bild zuschneiden */}
                  <button
                    onClick={async () => {
                      console.log('✂️ Starte Bildzuschnitt für ID:', image.id);
                      
                      if (!image.url) {
                        alert('Fehler: Bild-URL nicht verfügbar');
                        return;
                      }
                      
                      try {
                        console.log('🔄 Lade Bild für Zuschnitt:', image.url);
                        
                        // Bild als Blob laden
                        const response = await fetch(image.url);
                        if (!response.ok) {
                          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }
                        
                        const blob = await response.blob();
                        console.log('✅ Bild geladen:', blob.size, 'bytes, Typ:', blob.type);
                        
                        // File-Objekt erstellen
                        const file = new File([blob], 'existing-image.jpg', { type: blob.type });
                        console.log('📁 File erstellt:', file.name, file.size, 'bytes');
                        
                        // Preview-URL erstellen
                        const previewUrl = URL.createObjectURL(blob);
                        console.log('🔗 Preview-URL erstellt:', previewUrl);
                        
                        // States für Cropper setzen
                        setEditingImageId(image.id);
                        setCurrentFile(file);
                        setPreviewUrl(previewUrl);
                        setShowCropper(true);
                        
                        console.log('✅ Cropper sollte jetzt geöffnet sein');
                      } catch (error) {
                        console.error('❌ Fehler beim Laden des Bildes:', error);
                        alert('Fehler beim Laden des Bildes: ' + (error as Error).message);
                      }
                    }}
                    className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
                    title="Bild zuschneiden"
                  >
                    <i className="ri-crop-line text-sm"></i>
                  </button>
                  
                  {/* Bild ersetzen */}
                  <button
                    onClick={async () => {
                      console.log('🔄 Direkter Bildaustausch ohne Modal für ID:', image.id);
                      
                      // Erstelle File-Input für neues Bild
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      
                      input.onchange = async (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (!file || !productData) return;
                        
                        console.log('📁 Neue Datei ausgewählt:', file.name);
                        setIsUploading(true);
                        
                        try {
                          // FormData für Upload vorbereiten
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
                            
                            // Altes Bild löschen
                            if (image.storageFilename) {
                              try {
                                await fetch('/api/delete/product-image', {
                                  method: 'DELETE',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ filename: image.storageFilename })
                                });
                              } catch (deleteError) {
                                console.warn('Fehler beim Löschen des alten Bildes:', deleteError);
                              }
                            }
                            
                            // Bild in der Liste ersetzen
                            setImages(prev => prev.map(img => 
                              img.id === image.id 
                                ? {
                                    ...img,
                                    url: cdnUrl || `/api/cdn/products/${storageFilename}`,
                                    seoSlug,
                                    storageFilename
                                  }
                                : img
                            ));
                            
                            console.log('✅ Bild erfolgreich ersetzt!');
                            alert('Bild wurde erfolgreich ersetzt!');
                          }
                        } catch (error) {
                          console.error('❌ Fehler beim Bildaustausch:', error);
                          alert('Fehler beim Bildaustausch: ' + (error as Error).message);
                        } finally {
                          setIsUploading(false);
                        }
                      };
                      
                      // File-Dialog öffnen
                      input.click();
                    }}
                    className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition-colors"
                    title="Bild ersetzen"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <i className="ri-loader-4-line animate-spin text-sm"></i>
                    ) : (
                      <i className="ri-upload-line text-sm"></i>
                    )}
                  </button>
                  
                  <button
                    onClick={() => removeImage(image.id)}
                    className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                    title="Bild löschen"
                  >
                    <i className="ri-delete-bin-line text-sm"></i>
                  </button>
                </div>
                
                {/* Hauptbild-Indikator */}
                {image.isMain && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
                    <i className="ri-star-fill mr-1"></i>
                    Hauptbild
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Image Cropper Modal */}
       {showCropper && previewUrl && (
         <ImageCropper
           imageSrc={previewUrl}
           aspectRatio={aspectRatio}
           minWidth={minWidth}
           minHeight={minHeight}
           onCropComplete={handleCropComplete}
           onCancel={handleCropCancel}
         />
       )}
    </div>
  );
}