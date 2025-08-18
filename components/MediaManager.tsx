
'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

interface MediaFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  created_at: string;
  path: string;
}

interface MediaManagerProps {
  onSelect?: (url: string) => void;
  allowMultiple?: boolean;
  fileTypes?: string[];
}

export default function MediaManager({ 
  onSelect, 
  allowMultiple = false,
  fileTypes = ['image/*']
}: MediaManagerProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const supabase = createClient('https://your-supabase-instance.supabase.co', 'your-anon-key');

  useEffect(() => {
    loadMediaFiles();
  }, []);

  const loadMediaFiles = async () => {
    try {
      const { data } = await supabase
        .from('media_files')
        .select('*')
        .order('created_at', { ascending: false });

      setFiles(data || []);
    } catch (error) {
      console.error('Error loading media files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    setIsUploading(true);

    try {
      for (const file of Array.from(uploadedFiles)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `media/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);

        await supabase
          .from('media_files')
          .insert({
            name: file.name,
            url: publicUrl,
            size: file.size,
            type: file.type,
            path: filePath
          });
      }

      loadMediaFiles();
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const deleteFile = async (file: MediaFile) => {
    if (!confirm(`Möchten Sie "${file.name}" wirklich löschen?`)) return;

    try {
      await supabase.storage
        .from('media')
        .remove([file.path]);

      await supabase
        .from('media_files')
        .delete()
        .eq('id', file.id);

      loadMediaFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const toggleFileSelection = (url: string) => {
    if (allowMultiple) {
      setSelectedFiles(prev => 
        prev.includes(url) 
          ? prev.filter(f => f !== url)
          : [...prev, url]
      );
    } else {
      setSelectedFiles([url]);
      if (onSelect) onSelect(url);
    }
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="w-12 h-12 flex items-center justify-center bg-blue-100 rounded-full mx-auto mb-4 animate-pulse">
          <i className="ri-image-line text-2xl text-blue-600"></i>
        </div>
        <p className="text-lg font-medium text-gray-700">Lade Medien...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 flex items-center justify-center bg-blue-100 rounded-full mr-3">
              <i className="ri-image-line text-blue-600"></i>
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1A1A1A]">Medien-Bibliothek</h3>
              <p className="text-gray-600">{files.length} Dateien</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Dateien suchen..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            </div>

            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded cursor-pointer ${
                  viewMode === 'grid' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <i className="ri-grid-line"></i>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded cursor-pointer ${
                  viewMode === 'list' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <i className="ri-list-unordered"></i>
              </button>
            </div>

            <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap">
              <i className="ri-upload-line mr-2"></i>
              {isUploading ? 'Uploading...' : 'Upload'}
              <input
                type="file"
                multiple
                accept={fileTypes.join(',')}
                onChange={handleFileUpload}
                className="hidden"
                disabled={isUploading}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Files Grid/List */}
      <div className="p-6">
        {filteredFiles.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
              <i className="ri-image-line text-2xl text-gray-400"></i>
            </div>
            <h4 className="text-lg font-medium text-gray-600 mb-2">
              {searchTerm ? 'Keine Dateien gefunden' : 'Noch keine Medien'}
            </h4>
            <p className="text-gray-500">
              {searchTerm ? 'Versuchen Sie einen anderen Suchbegriff' : 'Laden Sie Ihre ersten Medien hoch'}
            </p>
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4'
              : 'space-y-2'
          }>
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className={`border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all cursor-pointer
                  ${selectedFiles.includes(file.url) ? 'ring-2 ring-blue-500 border-blue-500' : ''}
                  ${viewMode === 'list' ? 'flex items-center p-3' : 'aspect-square'}
                `}
                onClick={() => toggleFileSelection(file.url)}
              >
                {viewMode === 'grid' ? (
                  <>
                    <div className="aspect-square bg-gray-100 flex items-center justify-center">
                      {file.type.startsWith('image/') ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <i className="ri-file-line text-2xl text-gray-400"></i>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium text-gray-800 truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center mr-3">
                      {file.type.startsWith('image/') ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <i className="ri-file-line text-xl text-gray-400"></i>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{file.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFile(file);
                      }}
                      className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Files Actions */}
      {selectedFiles.length > 0 && onSelect && allowMultiple && (
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {selectedFiles.length} Datei(en) ausgewählt
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedFiles([])}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 cursor-pointer"
              >
                Auswahl aufheben
              </button>
              <button
                onClick={() => onSelect(selectedFiles.join(','))}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                Auswählen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
