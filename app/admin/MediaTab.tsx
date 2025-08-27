
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Using the centralized Supabase client from lib/supabase.ts

interface MediaFile {
  id: string;
  file_name: string;
  original_name: string;
  file_path: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  category: string;
  usage_type: string;
  alt_text: string;
  folder_id?: string;
  created_at: string;
}

interface ImageFolder {
  id: string;
  name: string;
  description: string;
  parent_id?: string;
  created_at: string;
}

const USAGE_TYPES = [
  { id: 'hero', name: 'Hero-Bereiche', description: 'Hauptbilder für Hero-Sektionen' },
  { id: 'products', name: 'Produktbilder', description: 'Bilder für Brennholzprodukte' },
  { id: 'about', name: 'Über Uns', description: 'Team- und Unternehmensbilder' },
  { id: 'testimonials', name: 'Kundenstimmen', description: 'Kundenfotos und -bewertungen' },
  { id: 'process', name: 'Prozesse', description: 'Arbeitsabläufe und Produktion' },
  { id: 'warehouse', name: 'Lager & Logistik', description: 'Lagerbilder und Lieferung' },
  { id: 'quality', name: 'Qualität', description: 'Qualitätsbilder und Zertifikate' },
  { id: 'contact', name: 'Kontakt', description: 'Standort und Kontaktbilder' },
  { id: 'backgrounds', name: 'Hintergründe', description: 'Hintergrundbilder für Sektionen' },
  { id: 'icons', name: 'Icons & Symbole', description: 'Grafische Elemente' },
  { id: 'banners', name: 'Banner & Werbung', description: 'Werbebanner und Promotions' }
];

export default function MediaTab() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [folders, setFolders] = useState<ImageFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [editingImage, setEditingImage] = useState<MediaFile | null>(null);

  useEffect(() => {
    loadMediaFiles();
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('image_folders')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setFolders(data || []);
    } catch (error) {
      console.error('Fehler beim Laden der Ordner:', error);
    }
  };

  const loadMediaFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMediaFiles(data || []);
    } catch (error) {
      console.error('Fehler beim Laden der Medien:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, usageType: string, folderId?: string) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        // Datei auf Server hochladen
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', usageType);

        const uploadResponse = await fetch('/api/upload-media', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Upload fehlgeschlagen');
        }

        const uploadResult = await uploadResponse.json();

        // Metadaten in Datenbank speichern
        const { error: dbError } = await supabase
          .from('media_files')
          .insert({
            file_name: uploadResult.fileName,
            original_name: file.name,
            file_path: uploadResult.filePath,
            file_url: uploadResult.fileUrl,
            file_size: file.size,
            mime_type: file.type,
            category: usageType,
            usage_type: usageType,
            folder_id: folderId || null,
            alt_text: file.name.replace(/\.[^/.]+$/, '')
          });

        if (dbError) throw dbError;
      }

      await loadMediaFiles();
      alert('Dateien erfolgreich hochgeladen!');
    } catch (error) {
      console.error('Upload-Fehler:', error);
      alert('Fehler beim Hochladen der Dateien');
    } finally {
      setUploading(false);
    }
  };

  const copyImageUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('URL kopiert!');
  };

  const updateImageSettings = async () => {
    if (!editingImage) return;

    try {
      const { error } = await supabase
        .from('media_files')
        .update({
          alt_text: editingImage.alt_text,
          usage_type: editingImage.usage_type
        })
        .eq('id', editingImage.id);

      if (error) throw error;

      await loadMediaFiles();
      setShowImageEditor(false);
      setEditingImage(null);
      alert('Bild-Einstellungen aktualisiert!');
    } catch (error) {
      console.error('Fehler beim Aktualisieren:', error);
      alert('Fehler beim Aktualisieren der Einstellungen');
    }
  };

  const deleteImage = async (id: string) => {
    if (!confirm('Bild wirklich löschen?')) return;

    try {
      const { error } = await supabase
        .from('media_files')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadMediaFiles();
      alert('Bild gelöscht!');
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen des Bildes');
    }
  };

  const filteredFiles = mediaFiles.filter(file => {
    const matchesCategory = selectedCategory === 'all' || file.usage_type === selectedCategory;
    const matchesFolder = selectedFolder === 'all' || file.folder_id === selectedFolder;
    const matchesSearch = file.original_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.alt_text.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesFolder && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Medien werden geladen...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Website-Bilder verwalten</h2>
        <div className="text-sm text-gray-600">
          {mediaFiles.length} Dateien | {(mediaFiles.reduce((total, file) => total + file.file_size, 0) / 1024 / 1024).toFixed(1)} MB
        </div>
      </div>

      {/* Filter und Suche */}
      <div className="flex gap-4 items-center flex-wrap">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border rounded-lg px-3 py-2"
        >
          <option value="all">Alle Kategorien</option>
          {USAGE_TYPES.map(type => (
            <option key={type.id} value={type.id}>{type.name}</option>
          ))}
        </select>

        <select
          value={selectedFolder}
          onChange={(e) => setSelectedFolder(e.target.value)}
          className="border rounded-lg px-3 py-2"
        >
          <option value="all">Alle Ordner</option>
          {folders.map(folder => (
            <option key={folder.id} value={folder.id}>{folder.name}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Bilder suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded-lg px-3 py-2 flex-1 max-w-md"
        />
      </div>

      {/* Upload-Bereiche mit Ordner-Integration */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {folders.map(folder => (
          <div key={folder.id} className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
            <div className="text-center">
              <div className="mb-2">
                <i className="ri-folder-line text-3xl text-gray-400"></i>
              </div>
              <h3 className="font-semibold text-gray-700 mb-1">{folder.name}</h3>
              <p className="text-xs text-gray-500 mb-3">{folder.description}</p>
              <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors inline-block">
                <i className="ri-upload-line mr-2"></i>
                Upload
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'general', folder.id)}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* Bilder-Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredFiles.map(file => (
          <div key={file.id} className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-square overflow-hidden">
              <img
                src={file.file_url}
                alt={file.alt_text}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </div>

            <div className="p-3">
              <div className="text-xs text-gray-500 mb-1">
                {USAGE_TYPES.find(t => t.id === file.usage_type)?.name || file.usage_type}
              </div>
              <div className="text-sm font-medium truncate mb-2">{file.original_name}</div>

              <div className="flex gap-1">
                <button
                  onClick={() => copyImageUrl(file.file_url)}
                  className="flex-1 bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 transition-colors"
                  title="URL kopieren"
                >
                  <i className="ri-link mr-1"></i>URL
                </button>
                <button
                  onClick={() => {
                    setEditingImage(file);
                    setShowImageEditor(true);
                  }}
                  className="flex-1 bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
                  title="Bearbeiten"
                >
                  <i className="ri-edit-line mr-1"></i>Edit
                </button>
                <button
                  onClick={() => deleteImage(file.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 transition-colors"
                  title="Löschen"
                >
                  <i className="ri-delete-bin-line"></i>
                </button>
              </div>
            </div>

            {/* Image Info Overlay */}
            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              {(file.file_size / 1024).toFixed(0)}KB
            </div>
          </div>
        ))}
      </div>

      {filteredFiles.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <i className="ri-image-line text-6xl mb-4"></i>
          <div className="text-xl mb-2">Keine Bilder gefunden</div>
          <div>Laden Sie Bilder in den entsprechenden Kategorien hoch</div>
        </div>
      )}

      {/* Image Editor Modal */}
      {showImageEditor && editingImage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Bild bearbeiten</h3>
                <button
                  onClick={() => setShowImageEditor(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div className="space-y-4">
                <div className="aspect-video overflow-hidden rounded-lg bg-gray-100">
                  <img
                    src={editingImage.file_url}
                    alt={editingImage.alt_text}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Verwendungszweck</label>
                    <select
                      value={editingImage.usage_type}
                      onChange={(e) => setEditingImage({...editingImage, usage_type: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      {USAGE_TYPES.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Alt-Text</label>
                    <input
                      type="text"
                      value={editingImage.alt_text}
                      onChange={(e) => setEditingImage({...editingImage, alt_text: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="Beschreibung für das Bild"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Dateiname:</strong> {editingImage.original_name}
                    </div>
                    <div>
                      <strong>Größe:</strong> {(editingImage.file_size / 1024).toFixed(0)} KB
                    </div>
                    <div>
                      <strong>Typ:</strong> {editingImage.mime_type}
                    </div>
                    <div>
                      <strong>Hochgeladen:</strong> {new Date(editingImage.created_at).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm font-medium mb-2">URL für Frontend:</div>
                  <div className="bg-white border rounded px-3 py-2 font-mono text-sm break-all">
                    {editingImage.file_url}
                  </div>
                  <button
                    onClick={() => copyImageUrl(editingImage.file_url)}
                    className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                  >
                    <i className="ri-clipboard-line mr-2"></i>
                    URL kopieren
                  </button>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={updateImageSettings}
                    className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <i className="ri-save-line mr-2"></i>
                    Änderungen speichern
                  </button>
                  <button
                    onClick={() => setShowImageEditor(false)}
                    className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
