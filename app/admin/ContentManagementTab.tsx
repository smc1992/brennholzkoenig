
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface ContentSection {
  id: string;
  page: string;
  section: string;
  content_type: string;
  content_key: string;
  content_value: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

interface ImageFolder {
  id: string;
  name: string;
  description: string;
  parent_id?: string;
  created_at: string;
}

const PAGES = [
  { id: 'home', name: 'Startseite', sections: [
    'hero', 'usp', 'qualifier', 'trust', 'testimonials', 'cost-calculator', 
    'comparison', 'process', 'safety', 'products', 'region'
  ]},
  { id: 'shop', name: 'Shop', sections: ['hero', 'info'] },
  { id: 'about', name: 'Über Uns', sections: ['hero', 'story', 'team', 'expertise', 'quality'] },
  { id: 'contact', name: 'Kontakt', sections: ['hero', 'info', 'form', 'map'] }
];

const CONTENT_TYPES = [
  { id: 'title', name: 'Titel' },
  { id: 'subtitle', name: 'Untertitel' },
  { id: 'description', name: 'Beschreibung' },
  { id: 'button_text', name: 'Button Text' },
  { id: 'background_image', name: 'Hintergrundbild' },
  { id: 'hero_image', name: 'Hero Bild' },
  { id: 'section_image', name: 'Sektions Bild' }
];

export default function ContentManagementTab() {
  const [contents, setContents] = useState<ContentSection[]>([]);
  const [folders, setFolders] = useState<ImageFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPage, setSelectedPage] = useState('home');
  const [selectedSection, setSelectedSection] = useState('');
  const [editingContent, setEditingContent] = useState<ContentSection | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showFolderManager, setShowFolderManager] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [selectedParentFolder, setSelectedParentFolder] = useState('');
  // Using the centralized Supabase client from lib/supabase.ts

  useEffect(() => {
    loadContents();
    loadFolders();
  }, []);

  const loadContents = async () => {
    try {
      const { data, error } = await supabase
        .from('page_contents')
        .select('*')
        .order('page', { ascending: true })
        .order('section', { ascending: true });

      if (error) throw error;
      setContents(data || []);
    } catch (error) {
      console.error('Fehler beim Laden der Inhalte:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const saveContent = async () => {
    if (!editingContent) return;

    try {
      const { error } = await supabase
        .from('page_contents')
        .upsert({
          ...editingContent,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      await loadContents();
      setShowEditor(false);
      setEditingContent(null);
      alert('Inhalt erfolgreich gespeichert!');
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern des Inhalts');
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const { error } = await supabase
        .from('image_folders')
        .insert({
          name: newFolderName,
          description: newFolderDescription,
          parent_id: selectedParentFolder || null
        });

      if (error) throw error;

      await loadFolders();
      setNewFolderName('');
      setNewFolderDescription('');
      setSelectedParentFolder('');
      alert('Ordner erfolgreich erstellt!');
    } catch (error) {
      console.error('Fehler beim Erstellen des Ordners:', error);
      alert('Fehler beim Erstellen des Ordners');
    }
  };

  const deleteFolder = async (folderId: string) => {
    if (!confirm('Ordner wirklich löschen? Alle Unterordner werden ebenfalls gelöscht.')) return;

    try {
      const { error } = await supabase
        .from('image_folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;
      await loadFolders();
      alert('Ordner gelöscht!');
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen des Ordners');
    }
  };

  const getCurrentPageSections = () => {
    const page = PAGES.find(p => p.id === selectedPage);
    return page ? page.sections : [];
  };

  const getContentForSection = (section: string, contentType: string) => {
    return contents.find(c => 
      c.page === selectedPage && 
      c.section === section && 
      c.content_type === contentType
    );
  };

  const startEditing = (page: string, section: string, contentType: string) => {
    const existing = getContentForSection(section, contentType);
    
    setEditingContent(existing || {
      id: '',
      page,
      section,
      content_type: contentType,
      content_key: `${page}_${section}_${contentType}`,
      content_value: '',
      image_url: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    setShowEditor(true);
  };

  const filteredContents = contents.filter(c => 
    c.page === selectedPage && 
    (!selectedSection || c.section === selectedSection)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Inhalte werden geladen...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Website-Inhalte verwalten</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFolderManager(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
          >
            <i className="ri-folder-add-line mr-2"></i>
            Ordner verwalten
          </button>
        </div>
      </div>

      {/* Page und Section Filter */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Seite auswählen</label>
            <select
              value={selectedPage}
              onChange={(e) => {
                setSelectedPage(e.target.value);
                setSelectedSection('');
              }}
              className="w-full border rounded-lg px-3 py-2"
            >
              {PAGES.map(page => (
                <option key={page.id} value={page.id}>{page.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Sektion filtern (optional)</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Alle Sektionen</option>
              {getCurrentPageSections().map(section => (
                <option key={section} value={section}>{section}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {getCurrentPageSections().map(section => (
            <div key={section} className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-bold text-lg mb-4 capitalize">{section}</h3>
              <div className="space-y-2">
                {CONTENT_TYPES.map(type => {
                  const content = getContentForSection(section, type.id);
                  return (
                    <div key={type.id} className="flex justify-between items-center">
                      <span className="text-sm font-medium">{type.name}</span>
                      <button
                        onClick={() => startEditing(selectedPage, section, type.id)}
                        className={`px-3 py-1 rounded text-xs font-medium cursor-pointer ${
                          content 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {content ? 'Bearbeiten' : 'Erstellen'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Existing Contents List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-bold">Vorhandene Inhalte</h3>
          <p className="text-sm text-gray-600">
            {filteredContents.length} Inhalte für {PAGES.find(p => p.id === selectedPage)?.name}
          </p>
        </div>
        
        <div className="divide-y">
          {filteredContents.map(content => (
            <div key={content.id} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                      {content.section}
                    </span>
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                      {CONTENT_TYPES.find(t => t.id === content.content_type)?.name}
                    </span>
                  </div>
                  
                  {content.content_type.includes('image') ? (
                    <div className="flex items-center gap-3">
                      {content.image_url && (
                        <img 
                          src={content.image_url} 
                          alt="Preview" 
                          className="w-16 h-16 object-cover rounded border"
                        />
                      )}
                      <div className="text-sm text-gray-600 font-mono break-all">
                        {content.content_value || content.image_url || 'Kein Bild'}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-800 line-clamp-2">
                      {content.content_value || 'Kein Inhalt'}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 mt-2">
                    Aktualisiert: {new Date(content.updated_at).toLocaleDateString('de-DE')}
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setEditingContent(content);
                    setShowEditor(true);
                  }}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors cursor-pointer ml-4"
                >
                  <i className="ri-edit-line mr-1"></i>
                  Bearbeiten
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {filteredContents.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <i className="ri-file-text-line text-4xl mb-2"></i>
            <div>Keine Inhalte vorhanden</div>
            <div className="text-sm">Erstellen Sie neue Inhalte über die Sektions-Karten oben</div>
          </div>
        )}
      </div>

      {/* Content Editor Modal */}
      {showEditor && editingContent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">
                  {editingContent.id ? 'Inhalt bearbeiten' : 'Neuen Inhalt erstellen'}
                </h3>
                <button
                  onClick={() => setShowEditor(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Seite</label>
                    <input
                      type="text"
                      value={editingContent.page}
                      readOnly
                      className="w-full border rounded-lg px-3 py-2 bg-gray-50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Sektion</label>
                    <input
                      type="text"
                      value={editingContent.section}
                      readOnly
                      className="w-full border rounded-lg px-3 py-2 bg-gray-50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Inhaltstyp</label>
                    <input
                      type="text"
                      value={CONTENT_TYPES.find(t => t.id === editingContent.content_type)?.name || editingContent.content_type}
                      readOnly
                      className="w-full border rounded-lg px-3 py-2 bg-gray-50"
                    />
                  </div>
                </div>

                {editingContent.content_type.includes('image') ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Bild-URL</label>
                      <input
                        type="url"
                        value={editingContent.image_url || ''}
                        onChange={(e) => setEditingContent({
                          ...editingContent,
                          image_url: e.target.value,
                          content_value: e.target.value
                        })}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="https://..."
                      />
                    </div>
                    
                    {editingContent.image_url && (
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="text-sm font-medium mb-2">Vorschau:</div>
                        <img
                          src={editingContent.image_url}
                          alt="Preview"
                          className="max-w-full h-auto max-h-64 object-contain rounded border"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium mb-1">Inhalt</label>
                    <textarea
                      value={editingContent.content_value}
                      onChange={(e) => setEditingContent({
                        ...editingContent,
                        content_value: e.target.value
                      })}
                      className="w-full border rounded-lg px-3 py-2 h-32"
                      placeholder="Geben Sie den Inhalt ein..."
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={saveContent}
                    className="flex-1 bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors cursor-pointer"
                  >
                    <i className="ri-save-line mr-2"></i>
                    Speichern
                  </button>
                  <button
                    onClick={() => setShowEditor(false)}
                    className="bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Folder Manager Modal */}
      {showFolderManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Bildordner verwalten</h3>
                <button
                  onClick={() => setShowFolderManager(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              {/* New Folder Form */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-bold mb-4">Neuen Ordner erstellen</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Ordnername</label>
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="z.B. Hero-Bilder"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Übergeordneter Ordner</label>
                    <select
                      value={selectedParentFolder}
                      onChange={(e) => setSelectedParentFolder(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      <option value="">Hauptordner</option>
                      {folders.map(folder => (
                        <option key={folder.id} value={folder.id}>{folder.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Beschreibung</label>
                  <input
                    type="text"
                    value={newFolderDescription}
                    onChange={(e) => setNewFolderDescription(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Beschreibung des Ordners"
                  />
                </div>
                
                <button
                  onClick={createFolder}
                  disabled={!newFolderName.trim()}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="ri-folder-add-line mr-2"></i>
                  Ordner erstellen
                </button>
              </div>

              {/* Existing Folders */}
              <div>
                <h4 className="font-bold mb-4">Vorhandene Ordner ({folders.length})</h4>
                <div className="space-y-2">
                  {folders.map(folder => (
                    <div key={folder.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-lg">
                          <i className="ri-folder-line text-blue-600"></i>
                        </div>
                        <div>
                          <div className="font-medium">{folder.name}</div>
                          {folder.description && (
                            <div className="text-sm text-gray-600">{folder.description}</div>
                          )}
                          <div className="text-xs text-gray-500">
                            Erstellt: {new Date(folder.created_at).toLocaleDateString('de-DE')}
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => deleteFolder(folder.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors cursor-pointer"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  ))}
                </div>
                
                {folders.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <i className="ri-folder-line text-4xl mb-2"></i>
                    <div>Keine Ordner vorhanden</div>
                    <div className="text-sm">Erstellen Sie Ihren ersten Ordner oben</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
