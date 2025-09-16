'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
  minWidth?: number;
  minHeight?: number;
}

export default function ImageCropper({
  imageSrc,
  onCropComplete,
  onCancel,
  aspectRatio = 1, // Standard: quadratisch
  minWidth = 200,
  minHeight = 200
}: ImageCropperProps) {
  console.log('🎨 ImageCropper gerendert mit:', {
    imageSrc: imageSrc ? 'vorhanden' : 'fehlt',
    imageSrcLength: imageSrc?.length || 0,
    aspectRatio,
    minWidth,
    minHeight
  });
  
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    
    // Zentrierten Crop mit gewünschtem Seitenverhältnis erstellen
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 80,
        },
        aspectRatio,
        width,
        height
      ),
      width,
      height
    );
    
    setCrop(crop);
  }, [aspectRatio]);

  const getCroppedImg = useCallback(async () => {
    if (!completedCrop || !imgRef.current || !canvasRef.current) {
      return;
    }

    setIsProcessing(true);

    try {
      const image = imgRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No 2d context');
      }

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      // Canvas-Größe auf Crop-Größe setzen
      canvas.width = completedCrop.width;
      canvas.height = completedCrop.height;

      // Bild auf Canvas zeichnen
      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        completedCrop.width,
        completedCrop.height
      );

      // Canvas zu Blob konvertieren
      canvas.toBlob(
        (blob) => {
          if (blob) {
            onCropComplete(blob);
          }
        },
        'image/jpeg',
        0.9
      );
    } catch (error) {
      console.error('Fehler beim Zuschneiden:', error);
      alert('Fehler beim Zuschneiden des Bildes');
    } finally {
      setIsProcessing(false);
    }
  }, [completedCrop, onCropComplete]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    console.log('🖱️ Overlay geklickt - verhindere Schließen');
    // Verhindere Schließen durch Klick auf Overlay
    e.preventDefault();
    e.stopPropagation();
    // Explizit NICHT onCancel() aufrufen
  };

  const handleModalClick = (e: React.MouseEvent) => {
    console.log('🖱️ Modal-Content geklickt');
    // Verhindere Event-Bubbling vom Modal-Content
    e.stopPropagation();
  };

  const handleCancel = () => {
    console.log('❌ Cancel-Button geklickt');
    onCancel();
  };

  // Portal-Container für stabiles Rendering
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  // Verhindere ungewolltes Schließen durch Browser-Events
  useEffect(() => {
    console.log('🔒 Modal-Schutz aktiviert');
    
    // Portal-Container erstellen
    const container = document.createElement('div');
    container.id = 'image-cropper-portal';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    setPortalContainer(container);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.log('⌨️ Escape gedrückt - ignoriere');
        e.preventDefault();
        e.stopPropagation();
        // Explizit NICHT schließen
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      console.log('🚪 Seite wird verlassen - verhindere');
      e.preventDefault();
      return 'Möchten Sie die Bildbearbeitung wirklich verlassen?';
    };

    // Event-Listener hinzufügen
    document.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Body-Scroll verhindern
    document.body.style.overflow = 'hidden';
    
    return () => {
      console.log('🔓 Modal-Schutz deaktiviert');
      document.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.body.style.overflow = 'auto';
      
      // Portal-Container entfernen
      if (container && document.body.contains(container)) {
        document.body.removeChild(container);
      }
    };
  }, []);

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={handleOverlayClick}
    >
      <div 
        className="bg-white rounded-2xl max-w-4xl w-full my-8 flex flex-col max-h-[calc(100vh-4rem)]"
        onClick={handleModalClick}
      >
        {/* Header - Fixed */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#1A1A1A]">
              Bild zuschneiden
            </h2>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            Wählen Sie den gewünschten Bildausschnitt aus und klicken Sie auf "Zuschneiden".
          </p>
        </div>
        
        {/* Crop Area - Scrollable */}
        <div className="flex-1 overflow-auto p-6">
          <div className="flex justify-center min-h-[400px]">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop: Crop) => setCrop(percentCrop)}
              onComplete={(c: PixelCrop) => setCompletedCrop(c)}
              aspect={aspectRatio}
              minWidth={minWidth}
              minHeight={minHeight}
              className="max-w-full"
            >
              <img
                ref={imgRef}
                alt="Zu zuschneidendes Bild"
                src={imageSrc}
                onLoad={onImageLoad}
                className="max-w-full h-auto"
                style={{ maxHeight: '70vh' }}
              />
            </ReactCrop>
          </div>
        </div>
        
        {/* Footer - Fixed */}
        <div className="p-6 border-t border-gray-200 flex-shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              <p>Seitenverhältnis: {aspectRatio === 1 ? 'Quadratisch (1:1)' : `${aspectRatio}:1`}</p>
              <p>Mindestgröße: {minWidth}×{minHeight} Pixel</p>
            </div>
            
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={handleCancel}
                className="flex-1 sm:flex-none bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
                disabled={isProcessing}
              >
                Abbrechen
              </button>
              <button
                onClick={getCroppedImg}
                disabled={!completedCrop || isProcessing}
                className="flex-1 sm:flex-none bg-[#C04020] hover:bg-[#A03318] text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    Verarbeitung...
                  </>
                ) : (
                  <>
                    <i className="ri-crop-line mr-2"></i>
                    Zuschneiden
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Hidden Canvas für Crop-Verarbeitung */}
        <canvas
          ref={canvasRef}
          className="hidden"
        />
      </div>
    </div>
  );

  // Render über Portal für maximale Stabilität
  if (!portalContainer) {
    console.log('⏳ Portal-Container noch nicht bereit');
    return null;
  }

  console.log('🌐 Rendering über Portal');
  return createPortal(modalContent, portalContainer);
}