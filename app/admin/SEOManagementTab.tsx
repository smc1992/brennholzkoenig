
'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

interface SEOMetadata {
  id: string;
  page_path: string;
  title: string;
  description: string;
  keywords: string;
  og_title: string;
  og_description: string;
  og_image: string;
  twitter_title: string;
  twitter_description: string;
  twitter_image: string;
  canonical_url: string;
  robots: string;
  priority: number;
  change_frequency: string;
  schema_markup: any;
}

interface SEOImage {
  id: string;
  image_url: string;
  alt_text: string;
  title_text: string;
  caption: string;
  page_path: string;
  image_type: string;
  is_active: boolean;
}

export default function SEOManagementTab() {
  const [activeTab, setActiveTab] = useState('pages');
  const [seoPages, setSeoPages] = useState<SEOMetadata[]>([]);
  const [seoImages, setSeoImages] = useState<SEOImage[]>([]);
  const [selectedPageData, setSelectedPageData] = useState<SEOMetadata | null>(null);
  const [selectedImage, setSelectedImage] = useState<SEOImage | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState('');
  const [loading, setLoading] = useState(false);
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const predefinedPages = [
    { path: '/', name: 'Startseite' },
    { path: '/shop', name: 'Shop' },
    { path: '/ueber-uns', name: 'Über uns' },
    { path: '/kontakt', name: 'Kontakt' },
    { path: '/konto', name: 'Kundenkonto' },
    { path: '/warenkorb', name: 'Warenkorb' },
    { path: '/checkout', name: 'Checkout' },
    { path: '/agb', name: 'AGB' },
    { path: '/datenschutz', name: 'Datenschutz' },
    { path: '/impressum', name: 'Impressum' }
  ];

  const imageTypes = [
    { value: 'hero', label: 'Hero Bilder' },
    { value: 'product', label: 'Produktbilder' },
    { value: 'content', label: 'Content Bilder' },
    { value: 'logo', label: 'Logos' },
    { value: 'banner', label: 'Banner' },
    { value: 'icon', label: 'Icons' }
  ];

  useEffect(() => {
    loadSEOData();
  }, []);

  const loadSEOData = async () => {
    try {
      const { data: pages } = await supabase
        .from('seo_metadata')
        .select('*')
        .order('page_path');

      const { data: images } = await supabase
        .from('seo_images')
        .select('*')
        .order('page_path');

      setSeoPages(pages || []);
      setSeoImages(images || []);
    } catch (error: unknown) {
      console.error('Fehler beim Laden der SEO-Daten:', error);
    }
  };

  const saveSEOPage = async (data: Partial<SEOMetadata>) => {
    setLoading(true);
    try {
      if (selectedPageData?.id) {
        await supabase
          .from('seo_metadata')
          .update(data)
          .eq('id', selectedPageData.id);
      } else {
        await supabase
          .from('seo_metadata')
          .insert([data]);
      }

      await loadSEOData();
      setIsEditing(false);
      setSelectedPageData(null);
      setNotification('SEO-Daten erfolgreich gespeichert!');
      setTimeout(() => setNotification(''), 3000);
    } catch (error: unknown) {
      console.error('Fehler beim Speichern:', error);
    }
    setLoading(false);
  };

  const saveSEOImage = async (data: Partial<SEOImage>) => {
    setLoading(true);
    try {
      if (selectedImage?.id) {
        await supabase
          .from('seo_images')
          .update(data)
          .eq('id', selectedImage.id);
      } else {
        await supabase
          .from('seo_images')
          .insert([data]);
      }

      await loadSEOData();
      setIsEditing(false);
      setSelectedImage(null);
      setNotification('Bild-SEO erfolgreich gespeichert!');
      setTimeout(() => setNotification(''), 3000);
    } catch (error: unknown) {
      console.error('Fehler beim Speichern:', error);
    }
    setLoading(false);
  };

  const generateSitemap = async () => {
    setLoading(true);
    try {
      // Trigger sitemap regeneration
      await fetch('/sitemap.xml');
      setNotification('Sitemap erfolgreich regeneriert!');
      setTimeout(() => setNotification(''), 3000);
    } catch (error: unknown) {
      console.error('Fehler beim Generieren der Sitemap:', error);
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">SEO Management</h2>
        <button
          onClick={generateSitemap}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          <i className="ri-refresh-line mr-2"></i>
          Sitemap regenerieren
        </button>
      </div>

      {notification && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {notification}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('pages')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pages'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <i className="ri-pages-line mr-2"></i>
            Seiten-SEO
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'images'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <i className="ri-image-line mr-2"></i>
            Bild-SEO
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tools'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <i className="ri-tools-line mr-2"></i>
            SEO-Tools
          </button>
        </nav>
      </div>

      {/* Seiten-SEO Tab */}
      {activeTab === 'pages' && (
        <div className="space-y-6">
          {!isEditing ? (
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Seiten-SEO verwalten</h3>
                <button
                  onClick={() => {
                    setSelectedPageData(null);
                    setIsEditing(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <i className="ri-add-line mr-2"></i>
                  Neue Seite
                </button>
              </div>

              <div className="grid gap-4">
                {predefinedPages.map((page) => {
                  const seoData = seoPages.find((p) => p.page_path === page.path);
                  return (
                    <div key={page.path} className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h4 className="font-semibold text-lg">{page.name}</h4>
                            <span className="ml-2 text-sm text-gray-500">({page.path})</span>
                            {seoData ? (
                              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                Konfiguriert
                              </span>
                            ) : (
                              <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                Nicht konfiguriert
                              </span>
                            )}
                          </div>
                          {seoData && (
                            <div className="text-sm text-gray-600">
                              <p>
                                <strong>Title:</strong> {seoData.title || 'Nicht gesetzt'}
                              </p>
                              <p>
                                <strong>Description:</strong>{' '}
                                {seoData.description
                                  ? seoData.description.length > 100
                                    ? seoData.description.substring(0, 100) + '...'
                                    : seoData.description
                                  : 'Nicht gesetzt'}
                              </p>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setSelectedPageData(seoData || {
                              id: '',
                              page_path: page.path,
                              title: '',
                              description: '',
                              keywords: '',
                              og_title: '',
                              og_description: '',
                              og_image: '',
                              twitter_title: '',
                              twitter_description: '',
                              twitter_image: '',
                              canonical_url: '',
                              robots: 'index,follow',
                              priority: 0.5,
                              change_frequency: 'monthly',
                              schema_markup: null
                            });
                            setIsEditing(true);
                          }}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          <i className="ri-edit-line mr-1"></i>
                          Bearbeiten
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <SEOPageEditor
              page={selectedPageData}
              onSave={saveSEOPage}
              onCancel={() => {
                setIsEditing(false);
                setSelectedPageData(null);
              }}
              loading={loading}
            />
          )}
        </div>
      )}

      {/* Bild-SEO Tab */}
      {activeTab === 'images' && (
        <div className="space-y-6">
          {!isEditing ? (
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Bild-SEO verwalten</h3>
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setIsEditing(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <i className="ri-add-line mr-2"></i>
                  Neues Bild
                </button>
              </div>

              <div className="grid gap-4">
                {imageTypes.map((type) => {
                  const typeImages = seoImages.filter((img) => img.image_type === type.value);
                  return (
                    <div key={type.value} className="bg-white p-4 rounded-lg border border-gray-200">
                      <h4 className="font-semibold mb-3 flex items-center">
                        <i className="ri-image-line mr-2"></i>
                        {type.label} ({typeImages.length})
                      </h4>
                      <div className="grid gap-2">
                        {typeImages.map((image) => (
                          <div key={image.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{image.alt_text || 'Kein Alt-Text'}</p>
                              <p className="text-xs text-gray-500">{image.page_path || 'Keine Seite zugeordnet'}</p>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedImage(image);
                                setIsEditing(true);
                              }}
                              className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                            >
                              <i className="ri-edit-line"></i>
                            </button>
                          </div>
                        ))}
                        {typeImages.length === 0 && (
                          <p className="text-gray-500 text-sm">Keine Bilder vom Typ {type.label} vorhanden</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <SEOImageEditor
              image={selectedImage}
              onSave={saveSEOImage}
              onCancel={() => {
                setIsEditing(false);
                setSelectedImage(null);
              }}
              loading={loading}
            />
          )}
        </div>
      )}

      {/* SEO-Tools Tab */}
      {activeTab === 'tools' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">SEO-Tools & Analyse</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="font-semibold mb-4 flex items-center">
                <i className="ri-search-line mr-2"></i>
                Sitemap Status
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Letzte Aktualisierung:</span>
                  <span className="text-green-600">Heute</span>
                </div>
                <div className="flex justify-between">
                  <span>Anzahl Seiten:</span>
                  <span>{predefinedPages.length + seoPages.length}</span>
                </div>
                <button
                  onClick={generateSitemap}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Sitemap neu generieren
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="font-semibold mb-4 flex items-center">
                <i className="ri-bar-chart-line mr-2"></i>
                SEO-Statistiken
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Konfigurierte Seiten:</span>
                  <span>{seoPages.length}/{predefinedPages.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bilder mit Alt-Text:</span>
                  <span>{seoImages.filter((img) => img.alt_text).length}/{seoImages.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fehlende Descriptions:</span>
                  <span className="text-red-600">
                    {predefinedPages.length - seoPages.filter((p) => p.description).length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="font-semibold mb-4 flex items-center">
              <i className="ri-shield-check-line mr-2"></i>
              SEO-Schnellaktionen
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                <i className="ri-file-text-line text-2xl text-blue-600 mb-2"></i>
                <h5 className="font-medium">Meta-Tags prüfen</h5>
                <p className="text-sm text-gray-600">Alle Meta-Tags validieren</p>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                <i className="ri-image-line text-2xl text-green-600 mb-2"></i>
                <h5 className="font-medium">Bilder optimieren</h5>
                <p className="text-sm text-gray-600">Alt-Texte automatisch generieren</p>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                <i className="ri-global-line text-2xl text-purple-600 mb-2"></i>
                <h5 className="font-medium">Schema Markup</h5>
                <p className="text-sm text-gray-600">Strukturierte Daten prüfen</p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// SEO Page Editor Component
function SEOPageEditor({
  page,
  onSave,
  onCancel,
  loading
}: {
  page: SEOMetadata | null;
  onSave: (data: Partial<SEOMetadata>) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [formData, setFormData] = useState({
    page_path: page?.page_path || '',
    title: page?.title || '',
    description: page?.description || '',
    keywords: page?.keywords || '',
    og_title: page?.og_title || '',
    og_description: page?.og_description || '',
    og_image: page?.og_image || '',
    twitter_title: page?.twitter_title || '',
    twitter_description: page?.twitter_description || '',
    twitter_image: page?.twitter_image || '',
    canonical_url: page?.canonical_url || '',
    robots: page?.robots || 'index,follow',
    priority: page?.priority || 0.5,
    change_frequency: page?.change_frequency || 'monthly'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          {page?.id ? 'SEO-Daten bearbeiten' : 'Neue SEO-Seite erstellen'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Abbrechen
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seitenpfad
          </label>
          <input
            type="text"
            value={formData.page_path}
            onChange={(e) => setFormData({ ...formData, page_path: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="/beispiel"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seitentitel
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Seitentitel für SEO"
            maxLength={60}
          />
          <p className="text-xs text-gray-500 mt-1">{formData.title.length}/60 Zeichen</p>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Meta-Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Beschreibung der Seite für Suchmaschinen"
            maxLength={160}
          />
          <p className="text-xs text-gray-500 mt-1">{formData.description.length}/160 Zeichen</p>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Keywords (Komma-getrennt)
          </label>
          <input
            type="text"
            value={formData.keywords}
            onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="brennholz, kaminholz, ofenholz"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Open Graph Titel
          </label>
          <input
            type="text"
            value={formData.og_title}
            onChange={(e) => setFormData({ ...formData, og_title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Titel für Facebook/Social Media"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Open Graph Beschreibung
          </label>
          <textarea
            value={formData.og_description}
            onChange={(e) => setFormData({ ...formData, og_description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={2}
            placeholder="Beschreibung für Social Media"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Open Graph Bild URL
          </label>
          <input
            type="url"
            value={formData.og_image}
            onChange={(e) => setFormData({ ...formData, og_image: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Robots
          </label>
          <select
            value={formData.robots}
            onChange={(e) => setFormData({ ...formData, robots: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="index,follow">Index, Follow</option>
            <option value="index,nofollow">Index, No Follow</option>
            <option value="noindex,follow">No Index, Follow</option>
            <option value="noindex,nofollow">No Index, No Follow</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priorität
          </label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="1.0">1.0 (Höchste)</option>
            <option value="0.9">0.9 (Sehr hoch)</option>
            <option value="0.8">0.8 (Hoch)</option>
            <option value="0.7">0.7 (Normal-hoch)</option>
            <option value="0.5">0.5 (Normal)</option>
            <option value="0.3">0.3 (Niedrig)</option>
            <option value="0.1">0.1 (Sehr niedrig)</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Speichern...' : 'Speichern'}
        </button>
      </div>
    </form>
  );
}

// SEO Image Editor Component
function SEOImageEditor({
  image,
  onSave,
  onCancel,
  loading
}: {
  image: SEOImage | null;
  onSave: (data: Partial<SEOImage>) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [formData, setFormData] = useState({
    image_url: image?.image_url || '',
    alt_text: image?.alt_text || '',
    title_text: image?.title_text || '',
    caption: image?.caption || '',
    page_path: image?.page_path || '',
    image_type: image?.image_type || 'content',
    is_active: image?.is_active ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          {image?.id ? 'Bild-SEO bearbeiten' : 'Neues Bild-SEO erstellen'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Abbrechen
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bild-URL
          </label>
          <input
            type="url"
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://example.com/image.jpg"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Alt-Text *
          </label>
          <input
            type="text"
            value={formData.alt_text}
            onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Beschreibung des Bildes für Screenreader"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title-Text
          </label>
          <input
            type="text"
            value={formData.title_text}
            onChange={(e) => setFormData({ ...formData, title_text: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Titel beim Hover über das Bild"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seitenpfad
          </label>
          <input
            type="text"
            value={formData.page_path}
            onChange={(e) => setFormData({ ...formData, page_path: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="/shop oder /ueber-uns"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bild-Typ
          </label>
          <select
            value={formData.image_type}
            onChange={(e) => setFormData({ ...formData, image_type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="hero">Hero Bild</option>
            <option value="product">Produktbild</option>
            <option value="content">Content Bild</option>
            <option value="logo">Logo</option>
            <option value="banner">Banner</option>
            <option value="icon">Icon</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bildunterschrift
          </label>
          <textarea
            value={formData.caption}
            onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={2}
            placeholder="Optionale Bildunterschrift"
          />
        </div>

        <div className="md:col-span-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <span className="ml-2 text-sm text-gray-700">Aktiv</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Speichern...' : 'Speichern'}
        </button>
      </div>
    </form>
  );
}
