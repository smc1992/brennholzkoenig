'use client';
import { useState, useEffect } from 'react';

interface MediaFile {
  id: string;
  filename: string;
  url: string;
  category: string;
}

interface ImagePickerProps {
  onSelect: (url: string) => void;
  selectedUrl?: string;
  category?: string;
}

export default function ImagePicker({ onSelect, selectedUrl, category }: ImagePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadMediaFiles();
    }
  }, [isOpen]);

  const loadMediaFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/media');
      if (response.ok) {
        const files = await response.json();
        setMediaFiles(files);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Medien:', error);
    }
    setLoading(false);
  };

  const filteredFiles = mediaFiles.filter(file => {
    const matchesSearch = file.filename.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !category || file.category === category;
    return matchesSearch && matchesCategory;
  });

  const handleSelect = (url: string) => {
    onSelect(url);
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-left whitespace-nowrap"
      >
        <i className="ri-image-line mr-2"></i>
        {selectedUrl ? 'Bild ändern' : 'Bild auswählen'}
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">Bild auswählen</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            {/* Suche */}
            <div className="p-4 border-b">
              <div className="relative">
                <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Bilder durchsuchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Bild-Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="text-center py-8">
                  <i className="ri-loader-4-line text-2xl animate-spin text-gray-400"></i>
                  <p className="text-gray-500 mt-2">Lade Bilder...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredFiles.map(file => (
                    <div
                      key={file.id}
                      onClick={() => handleSelect(file.url)}
                      className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all hover:shadow-lg ${
                        selectedUrl === file.url ? 'border-orange-500' : 'border-gray-200'
                      }`}
                    >
                      <div className="aspect-video bg-gray-100">
                        <img
                          src={file.url}
                          alt={file.filename}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2">
                        <p className="text-xs truncate">{file.filename}</p>
                      </div>
                      {selectedUrl === file.url && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                          <i className="ri-check-line text-white text-sm"></i>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {filteredFiles.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  <i className="ri-image-line text-4xl mb-4"></i>
                  <p>Keine Bilder gefunden</p>
                  <p className="text-sm mt-2">Laden Sie zuerst Bilder im Medien-Tab hoch</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t flex justify-between">
              <p className="text-sm text-gray-500">
                {filteredFiles.length} Bilder verfügbar
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg whitespace-nowrap"
                >
                  Abbrechen
                </button>
                {selectedUrl && (
                  <button
                    onClick={() => handleSelect('')}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 whitespace-nowrap"
                  >
                    Bild entfernen
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}