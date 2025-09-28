'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import CityImageUploader from '@/components/CityImageUploader';

interface CityPage {
  id: string;
  slug: string;
  city_name: string;
  meta_title: string;
  meta_description: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image_url: string;
  city_image_url?: string;
  content_section_1_title?: string;
  content_section_1_text?: string;
  content_section_2_title?: string;
  content_section_2_text?: string;
  content_section_3_title?: string;
  content_section_3_text?: string;
  local_keywords: string[];
  postal_codes: string[];
  contact_phone: string;
  contact_email: string;
  contact_address: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Button/CTA Configuration
  primary_cta_text?: string;
  primary_cta_url?: string;
  secondary_cta_text?: string;
  secondary_cta_url?: string;
  contact_phone_display?: string;
  contact_whatsapp_url?: string;
  shop_url?: string;
  contact_url?: string;
  calculator_cta_text?: string;
  testimonial_cta_text?: string;
  process_cta_text?: string;
  hero_cta_text?: string;
  hero_secondary_cta_text?: string;
  custom_buttons?: any[];
  // Section-specific Images
  testimonial_section_image_url?: string;
  process_section_image_url?: string;
  expertise_section_image_url?: string;
  qualifier_section_image_url?: string;
  local_partnerships_image_url?: string;
  sustainability_section_image_url?: string;
  content_section_2_image_url?: string;
  content_section_3_image_url?: string;
  
  // Local FAQ Section - Editierbare FAQ-Inhalte
  local_faqs?: {
    id: string;
    question: string;
    answer: string;
    category: 'delivery' | 'quality' | 'pricing' | 'local' | 'service';
  }[];
  
  // Service Area Details - Editierbare Servicegebiete
  service_areas?: {
    name: string;
    postalCodes: string[];
    deliveryTime: string;
    specialNotes?: string;
    landmarks?: string[];
    neighborhoods?: string[];
  }[];
  
  // Extended Delivery Info - Editierbare Lieferzonen
  delivery_zones?: {
    id: string;
    name: string;
    areas: string[];
    deliveryTime: string;
    fee: number;
    minOrder?: number;
    specialNotes?: string;
    postalCodes: string[];
  }[];
  
  // Delivery Routes - Editierbare Lieferrouten
  delivery_routes?: {
    id: string;
    name: string;
    days: string[];
    timeSlots: string[];
    zones: string[];
  }[];
  
  // Seasonal Events - Editierbare saisonale Events
  seasonal_events?: {
    id: string;
    title: string;
    description: string;
    season: 'spring' | 'summer' | 'autumn' | 'winter';
    month: number;
    type: 'festival' | 'market' | 'tradition' | 'weather' | 'special_offer';
    icon: string;
    relevantProducts?: string[];
    specialOffer?: {
      discount: number;
      description: string;
      validUntil: string;
    };
  }[];
}

export default function CityPagesTab() {
  const [cityPages, setCityPages] = useState<CityPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState<CityPage | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Leere Vorlage für neue Seite
  const emptyPage: Omit<CityPage, 'id' | 'created_at' | 'updated_at'> = {
    slug: '',
    city_name: '',
    meta_title: '',
    meta_description: '',
    hero_title: '',
    hero_subtitle: '',
    hero_image_url: '',
    city_image_url: '',
    content_section_1_title: '',
    content_section_1_text: '',
    content_section_2_title: '',
    content_section_2_text: '',
    content_section_3_title: '',
    content_section_3_text: '',
    local_keywords: [],
    postal_codes: [],
    contact_phone: '',
    contact_email: '',
    contact_address: '',
    is_active: true,
    // Button/CTA Configuration defaults
    primary_cta_text: 'Jetzt bestellen',
    primary_cta_url: '/shop',
    secondary_cta_text: 'Kostenlose Beratung',
    secondary_cta_url: 'tel:+4917671085234',
    contact_phone_display: '+49 176 71085234',
    contact_whatsapp_url: 'https://wa.me/4917671085234',
    shop_url: '/shop',
    contact_url: '/kontakt',
    calculator_cta_text: 'Jetzt Premium-Qualität bestellen',
    testimonial_cta_text: 'Jetzt Premium-Qualität bestellen',
    process_cta_text: 'Jetzt bestellen & sparen',
    hero_cta_text: 'Jetzt bestellen',
    hero_secondary_cta_text: 'Kostenlose Beratung',
    custom_buttons: [],
    // Section-specific Images defaults
    testimonial_section_image_url: '',
    process_section_image_url: '',
    expertise_section_image_url: '',
    qualifier_section_image_url: '',
    local_partnerships_image_url: '',
    sustainability_section_image_url: '',
    content_section_2_image_url: '',
    content_section_3_image_url: '',
    // Local SEO Fields defaults
    local_faqs: [],
    service_areas: [],
    delivery_zones: [],
    delivery_routes: [],
    seasonal_events: []
  };

  useEffect(() => {
    loadCityPages();
  }, []);

  const loadCityPages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('city_pages')
        .select('*')
        .order('city_name');

      if (error) throw error;
      setCityPages(data || []);
    } catch (error) {
      console.error('Fehler beim Laden der Städte-Seiten:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (pageData: Omit<CityPage, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('🔄 Speichere Daten:', pageData);
      console.log('📝 Content Section 1 Title:', pageData.content_section_1_title);
      console.log('📝 Content Section 1 Text:', pageData.content_section_1_text);
      
      if (editingPage) {
        // Update
        console.log('✏️ Update für Seite:', editingPage.id);
        const { error } = await supabase
          .from('city_pages')
          .update(pageData)
          .eq('id', editingPage.id);

        if (error) {
          console.error('❌ Supabase Update Error:', error);
          throw error;
        }
        console.log('✅ Update erfolgreich');
      } else {
        // Insert
        console.log('➕ Neue Seite erstellen');
        const { error } = await supabase
          .from('city_pages')
          .insert([pageData]);

        if (error) {
          console.error('❌ Supabase Insert Error:', error);
          throw error;
        }
        console.log('✅ Insert erfolgreich');
      }

      await loadCityPages();
      setShowForm(false);
      setEditingPage(null);
      console.log('🎉 Speichern komplett abgeschlossen');
    } catch (error) {
      console.error('❌ Fehler beim Speichern:', error);
      alert('Fehler beim Speichern der Seite: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Städte-Seite löschen möchten?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('city_pages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadCityPages();
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen der Seite');
    }
  };

  const filteredPages = cityPages.filter(page =>
    page.city_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (showForm) {
    return <CityPageForm
      page={editingPage}
      onSave={handleSave}
      onCancel={() => {
        setShowForm(false);
        setEditingPage(null);
      }}
    />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Städte-Landingpages</h2>
          <p className="text-gray-600">Verwalten Sie stadtspezifische Landingpages für lokales SEO</p>
        </div>
        <button
          onClick={() => {
            setEditingPage(null);
            setShowForm(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-[#C04020] text-white rounded-lg hover:bg-[#A03318] transition-colors"
        >
          <i className="ri-add-line mr-2"></i>
          Neue Städte-Seite
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <i className="ri-search-line text-gray-400"></i>
        </div>
        <input
          type="text"
          placeholder="Nach Stadt oder Slug suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C04020]"></div>
        </div>
      )}

      {/* City Pages List */}
      {!loading && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stadt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Erstellt
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPages.map((page) => (
                  <tr key={page.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{page.city_name}</div>
                      <div className="text-sm text-gray-500">{page.meta_title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">/{page.slug}</code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        page.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {page.is_active ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(page.created_at).toLocaleDateString('de-DE')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setEditingPage(page);
                            setShowForm(true);
                          }}
                          className="text-[#C04020] hover:text-[#A03318] p-1"
                          title="Bearbeiten"
                        >
                          <i className="ri-edit-line"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(page.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Löschen"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                        <a
                          href={`/${page.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Vorschau"
                        >
                          <i className="ri-external-link-line"></i>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPages.length === 0 && !loading && (
            <div className="text-center py-12">
              <i className="ri-map-pin-line text-4xl text-gray-400 mb-4"></i>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Städte-Seiten gefunden</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery ? 'Keine Seiten entsprechen Ihrer Suche.' : 'Erstellen Sie Ihre erste Städte-Landingpage.'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => {
                    setEditingPage(null);
                    setShowForm(true);
                  }}
                  className="inline-flex items-center px-4 py-2 bg-[#C04020] text-white rounded-lg hover:bg-[#A03318] transition-colors"
                >
                  <i className="ri-add-line mr-2"></i>
                  Erste Städte-Seite erstellen
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Form Component
function CityPageForm({ 
  page, 
  onSave, 
  onCancel 
}: { 
  page: CityPage | null; 
  onSave: (data: Omit<CityPage, 'id' | 'created_at' | 'updated_at'>) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState(() => {
    if (page) {
      return {
        slug: page.slug,
        city_name: page.city_name,
        meta_title: page.meta_title,
        meta_description: page.meta_description,
        hero_title: page.hero_title,
        hero_subtitle: page.hero_subtitle,
        hero_image_url: page.hero_image_url,
        city_image_url: page.city_image_url || '',
        content_section_1_title: page.content_section_1_title || '',
        content_section_1_text: page.content_section_1_text || '',
        content_section_2_title: page.content_section_2_title || '',
        content_section_2_text: page.content_section_2_text || '',
        content_section_3_title: page.content_section_3_title || '',
        content_section_3_text: page.content_section_3_text || '',
        local_keywords: page.local_keywords,
        postal_codes: page.postal_codes,
        contact_phone: page.contact_phone,
        contact_email: page.contact_email,
        contact_address: page.contact_address,
        is_active: page.is_active,
        // Button/CTA Configuration
        primary_cta_text: page.primary_cta_text || 'Jetzt bestellen',
        primary_cta_url: page.primary_cta_url || '/shop',
        secondary_cta_text: page.secondary_cta_text || 'Kostenlose Beratung',
        secondary_cta_url: page.secondary_cta_url || 'tel:+4917671085234',
        contact_phone_display: page.contact_phone_display || '+49 176 71085234',
        contact_whatsapp_url: page.contact_whatsapp_url || 'https://wa.me/4917671085234',
        shop_url: page.shop_url || '/shop',
        contact_url: page.contact_url || '/kontakt',
        calculator_cta_text: page.calculator_cta_text || 'Jetzt Premium-Qualität bestellen',
        testimonial_cta_text: page.testimonial_cta_text || 'Jetzt Premium-Qualität bestellen',
        process_cta_text: page.process_cta_text || 'Jetzt bestellen & sparen',
        hero_cta_text: page.hero_cta_text || 'Jetzt bestellen',
        hero_secondary_cta_text: page.hero_secondary_cta_text || 'Kostenlose Beratung',
        custom_buttons: page.custom_buttons || [],
        // Section-specific Images
        testimonial_section_image_url: page.testimonial_section_image_url || '',
        process_section_image_url: page.process_section_image_url || '',
        expertise_section_image_url: page.expertise_section_image_url || '',
        qualifier_section_image_url: page.qualifier_section_image_url || '',
        local_partnerships_image_url: page.local_partnerships_image_url || '',
        sustainability_section_image_url: page.sustainability_section_image_url || '',
        content_section_2_image_url: page.content_section_2_image_url || '',
        content_section_3_image_url: page.content_section_3_image_url || '',
        // Local SEO Fields
        local_faqs: page.local_faqs || [],
        service_areas: page.service_areas || [],
        delivery_zones: page.delivery_zones || [],
        delivery_routes: page.delivery_routes || [],
        seasonal_events: page.seasonal_events || []
      };
    }
    return {
      slug: '',
      city_name: '',
      meta_title: '',
      meta_description: '',
      hero_title: '',
      hero_subtitle: '',
      hero_image_url: '',
      city_image_url: '',
      content_section_1_title: '',
      content_section_1_text: '',
      content_section_2_title: '',
      content_section_2_text: '',
      content_section_3_title: '',
      content_section_3_text: '',
      local_keywords: [],
      postal_codes: [],
      contact_phone: '',
      contact_email: '',
      contact_address: '',
      is_active: true,
      // Button/CTA Configuration defaults
      primary_cta_text: 'Jetzt bestellen',
      primary_cta_url: '/shop',
      secondary_cta_text: 'Kostenlose Beratung',
      secondary_cta_url: 'tel:+4917671085234',
      contact_phone_display: '+49 176 71085234',
      contact_whatsapp_url: 'https://wa.me/4917671085234',
      shop_url: '/shop',
      contact_url: '/kontakt',
      calculator_cta_text: 'Jetzt Premium-Qualität bestellen',
      testimonial_cta_text: 'Jetzt Premium-Qualität bestellen',
      process_cta_text: 'Jetzt bestellen & sparen',
      hero_cta_text: 'Jetzt bestellen',
      hero_secondary_cta_text: 'Kostenlose Beratung',
      custom_buttons: [],
      // Section-specific Images defaults
      testimonial_section_image_url: '',
      process_section_image_url: '',
      expertise_section_image_url: '',
      qualifier_section_image_url: '',
      local_partnerships_image_url: '',
      sustainability_section_image_url: '',
      content_section_2_image_url: '',
      content_section_3_image_url: ''
    };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const generateSlug = (cityName: string) => {
    return cityName
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {page ? 'Städte-Seite bearbeiten' : 'Neue Städte-Seite'}
          </h2>
          <p className="text-gray-600">
            {page ? `Bearbeiten Sie die Landingpage für ${page.city_name}` : 'Erstellen Sie eine neue stadtspezifische Landingpage'}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <i className="ri-close-line text-xl"></i>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grunddaten */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Grunddaten</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stadt-Name *
              </label>
              <input
                type="text"
                required
                value={formData.city_name}
                onChange={(e) => {
                  const cityName = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    city_name: cityName,
                    slug: prev.slug || generateSlug(cityName)
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                placeholder="z.B. Stuttgart"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL-Slug *
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-l-lg">
                  /
                </span>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                  placeholder="stuttgart"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="h-4 w-4 text-[#C04020] focus:ring-[#C04020] border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                Seite ist aktiv
              </label>
            </div>
          </div>

          {/* SEO */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">SEO</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta-Titel *
              </label>
              <input
                type="text"
                required
                value={formData.meta_title}
                onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                placeholder="Brennholz in Stuttgart kaufen | Brennholzkönig"
              />
              <p className="text-xs text-gray-500 mt-1">Empfohlen: 50-60 Zeichen</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta-Beschreibung *
              </label>
              <textarea
                required
                rows={3}
                value={formData.meta_description}
                onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                placeholder="Hochwertiges Brennholz in Stuttgart und Umgebung. Schnelle Lieferung, faire Preise..."
              />
              <p className="text-xs text-gray-500 mt-1">Empfohlen: 150-160 Zeichen</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lokale Keywords (kommagetrennt)
              </label>
              <input
                type="text"
                value={formData.local_keywords.join(', ')}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  local_keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                placeholder="brennholz stuttgart, kaminholz stuttgart, holz lieferung"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Postleitzahlen (kommagetrennt)
              </label>
              <input
                type="text"
                value={formData.postal_codes.join(', ')}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  postal_codes: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                placeholder="70173, 70174, 70176, 70178"
              />
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Hero-Bereich</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hero-Titel *
              </label>
              <input
                type="text"
                required
                value={formData.hero_title}
                onChange={(e) => setFormData(prev => ({ ...prev, hero_title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                placeholder="Brennholz in Stuttgart"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hero-Untertitel
              </label>
              <input
                type="text"
                value={formData.hero_subtitle}
                onChange={(e) => setFormData(prev => ({ ...prev, hero_subtitle: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                placeholder="Hochwertig, trocken und schnell geliefert"
              />
            </div>
          </div>


        </div>

        {/* Content Sections - Stadtbeschreibung */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Stadtbeschreibung</h3>
          
          {/* Content Section 1 */}
          <div className="space-y-3 p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900">Sektion 1 - Lokale Expertise</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Überschrift
              </label>
              <input
                type="text"
                value={formData.content_section_1_title || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, content_section_1_title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                placeholder="z.B. Lokale Expertise für [Stadt]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fließtext
              </label>
              <textarea
                rows={6}
                value={formData.content_section_1_text || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, content_section_1_text: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                placeholder="Beschreibung der lokalen Besonderheiten, Tradition und Qualität..."
              />
            </div>
          </div>

          {/* Content Section 2 */}
          <div className="space-y-3 p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900">Sektion 2 - Regionale Qualität</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Überschrift
              </label>
              <input
                type="text"
                value={formData.content_section_2_title || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, content_section_2_title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                placeholder="z.B. Brennholz für [Stadt] - Tradition aus dem Herzen [Region]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fließtext
              </label>
              <textarea
                rows={6}
                value={formData.content_section_2_text || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, content_section_2_text: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                placeholder="Beschreibung der regionalen Herkunft, Liefergebiete und Service..."
              />
            </div>
          </div>

          {/* Content Section 3 */}
          <div className="space-y-3 p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900">Sektion 3 - Nachhaltigkeit & Umwelt</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Überschrift
              </label>
              <input
                type="text"
                value={formData.content_section_3_title || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, content_section_3_title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                placeholder="z.B. Nachhaltige Forstwirtschaft in [Region]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fließtext
              </label>
              <textarea
                rows={6}
                value={formData.content_section_3_text || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, content_section_3_text: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                placeholder="Beschreibung der nachhaltigen Forstwirtschaft, Umweltschutz und lokalen Vorteile..."
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Kontaktinformationen</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefon
              </label>
              <input
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                placeholder="+49 711 123456"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-Mail
              </label>
              <input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                placeholder="stuttgart@brennholzkoenig.de"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse
              </label>
              <input
                type="text"
                value={formData.contact_address}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_address: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                placeholder="Musterstraße 123, 70173 Stuttgart"
              />
            </div>
          </div>
        </div>

        {/* Button/CTA Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Button & CTA Konfiguration</h3>
          <p className="text-sm text-gray-600">Konfigurieren Sie stadtspezifische Button-Texte und Links</p>
          
          {/* Primary & Secondary CTAs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-800">Haupt-CTA</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Haupt-Button Text
                </label>
                <input
                  type="text"
                  value={formData.primary_cta_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, primary_cta_text: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                  placeholder="Jetzt bestellen"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Haupt-Button URL
                </label>
                <input
                  type="text"
                  value={formData.primary_cta_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, primary_cta_url: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                  placeholder="/shop"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-800">Sekundär-CTA</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sekundär-Button Text
                </label>
                <input
                  type="text"
                  value={formData.secondary_cta_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, secondary_cta_text: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                  placeholder="Kostenlose Beratung"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sekundär-Button URL
                </label>
                <input
                  type="text"
                  value={formData.secondary_cta_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, secondary_cta_url: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                  placeholder="tel:+4917671085234"
                />
              </div>
            </div>
          </div>

          {/* Contact & Navigation URLs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefon Anzeige
              </label>
              <input
                type="text"
                value={formData.contact_phone_display}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_phone_display: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                placeholder="+49 176 71085234"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp URL
              </label>
              <input
                type="url"
                value={formData.contact_whatsapp_url}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_whatsapp_url: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                placeholder="https://wa.me/4917671085234"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shop URL
              </label>
              <input
                type="text"
                value={formData.shop_url}
                onChange={(e) => setFormData(prev => ({ ...prev, shop_url: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                placeholder="/shop"
              />
            </div>
          </div>

          {/* Section-specific CTA Texts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kostenrechner CTA Text
              </label>
              <input
                type="text"
                value={formData.calculator_cta_text}
                onChange={(e) => setFormData(prev => ({ ...prev, calculator_cta_text: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                placeholder="Jetzt Premium-Qualität bestellen"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Testimonial CTA Text
              </label>
              <input
                type="text"
                value={formData.testimonial_cta_text}
                onChange={(e) => setFormData(prev => ({ ...prev, testimonial_cta_text: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                placeholder="Jetzt Premium-Qualität bestellen"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prozess CTA Text
              </label>
              <input
                type="text"
                value={formData.process_cta_text}
                onChange={(e) => setFormData(prev => ({ ...prev, process_cta_text: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                placeholder="Jetzt bestellen & sparen"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hero CTA Text
              </label>
              <input
                type="text"
                value={formData.hero_cta_text}
                onChange={(e) => setFormData(prev => ({ ...prev, hero_cta_text: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                placeholder="Jetzt bestellen"
              />
            </div>
          </div>
        </div>

        {/* All Images */}
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Bildverwaltung</h3>
            <p className="text-sm text-gray-600">Verwalten Sie alle stadtspezifischen Bilder zentral</p>
          </div>
          
          {/* Main Images */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-800">Hauptbilder</h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CityImageUploader
                currentImageUrl={formData.hero_image_url}
                onImageUploaded={(url) => setFormData(prev => ({ ...prev, hero_image_url: url }))}
                label="Hero-Bild"
                placeholder="Hauptbild für Hero-Sektion"
                citySlug={formData.slug}
                sectionType="hero"
              />
              
              <CityImageUploader
                currentImageUrl={formData.city_image_url}
                onImageUploaded={(url) => setFormData(prev => ({ ...prev, city_image_url: url }))}
                label="Stadt-Bild"
                placeholder="Stadtansicht für Content-Bereiche"
                citySlug={formData.slug}
                sectionType="city-main"
              />
            </div>
          </div>
          
          {/* Section Images */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-800">Sektions-spezifische Bilder</h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CityImageUploader
              currentImageUrl={formData.testimonial_section_image_url}
              onImageUploaded={(url) => setFormData(prev => ({ ...prev, testimonial_section_image_url: url }))}
              label="Testimonial-Sektion Bild"
              placeholder="Bild für Kundenbewertungen"
              citySlug={formData.slug}
              sectionType="testimonial"
            />
            
            <CityImageUploader
              currentImageUrl={formData.process_section_image_url}
              onImageUploaded={(url) => setFormData(prev => ({ ...prev, process_section_image_url: url }))}
              label="Prozess-Sektion Bild"
              placeholder="Bild für Bestellprozess"
              citySlug={formData.slug}
              sectionType="process"
            />
            
            <CityImageUploader
              currentImageUrl={formData.expertise_section_image_url}
              onImageUploaded={(url) => setFormData(prev => ({ ...prev, expertise_section_image_url: url }))}
              label="Expertise-Sektion Bild"
              placeholder="Bild für Fachkompetenz"
              citySlug={formData.slug}
              sectionType="expertise"
            />
            
            <CityImageUploader
              currentImageUrl={formData.qualifier_section_image_url}
              onImageUploaded={(url) => setFormData(prev => ({ ...prev, qualifier_section_image_url: url }))}
              label="Qualifier-Sektion Bild"
              placeholder="Bild für Qualitätsmerkmale"
              citySlug={formData.slug}
              sectionType="qualifier"
            />
            
            <CityImageUploader
              currentImageUrl={formData.local_partnerships_image_url}
              onImageUploaded={(url) => setFormData(prev => ({ ...prev, local_partnerships_image_url: url }))}
              label="Lokale Partnerschaften Bild"
              placeholder="Bild für lokale Partner"
              citySlug={formData.slug}
              sectionType="partnerships"
            />
            
            <CityImageUploader
              currentImageUrl={formData.sustainability_section_image_url}
              onImageUploaded={(url) => setFormData(prev => ({ ...prev, sustainability_section_image_url: url }))}
              label="Nachhaltigkeit-Sektion Bild"
              placeholder="Bild für Nachhaltigkeit"
              citySlug={formData.slug}
              sectionType="sustainability"
            />
            
            <CityImageUploader
              currentImageUrl={formData.content_section_2_image_url}
              onImageUploaded={(url) => setFormData(prev => ({ ...prev, content_section_2_image_url: url }))}
              label="Content-Bereich 2 Bild"
              placeholder="Bild für zweiten Inhaltsbereich"
              citySlug={formData.slug}
              sectionType="content-2"
            />
            
            <CityImageUploader
               currentImageUrl={formData.content_section_3_image_url}
               onImageUploaded={(url) => setFormData(prev => ({ ...prev, content_section_3_image_url: url }))}
               label="Content-Bereich 3 Bild"
               placeholder="Bild für dritten Inhaltsbereich"
               citySlug={formData.slug}
               sectionType="content-3"
             />
             </div>
           </div>
         </div>

        {/* Local SEO Bereiche */}
        <div className="space-y-8">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Local SEO Inhalte</h3>
          
          {/* Local FAQ Section */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-800">Lokale FAQs</h4>
            <div className="space-y-3">
              {formData.local_faqs.map((faq, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Frage
                      </label>
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => {
                          const newFaqs = [...formData.local_faqs];
                          newFaqs[index] = { ...faq, question: e.target.value };
                          setFormData(prev => ({ ...prev, local_faqs: newFaqs }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                        placeholder="Wie schnell können Sie Brennholz nach [Stadt] liefern?"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kategorie
                      </label>
                      <select
                        value={faq.category}
                        onChange={(e) => {
                          const newFaqs = [...formData.local_faqs];
                          newFaqs[index] = { ...faq, category: e.target.value as any };
                          setFormData(prev => ({ ...prev, local_faqs: newFaqs }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                      >
                        <option value="delivery">Lieferung</option>
                        <option value="quality">Qualität</option>
                        <option value="pricing">Preise</option>
                        <option value="local">Lokal</option>
                        <option value="service">Service</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Antwort
                    </label>
                    <textarea
                      rows={3}
                      value={faq.answer}
                      onChange={(e) => {
                        const newFaqs = [...formData.local_faqs];
                        newFaqs[index] = { ...faq, answer: e.target.value };
                        setFormData(prev => ({ ...prev, local_faqs: newFaqs }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                      placeholder="Wir liefern Brennholz in [Stadt] normalerweise innerhalb von 2-3 Werktagen..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newFaqs = formData.local_faqs.filter((_, i) => i !== index);
                      setFormData(prev => ({ ...prev, local_faqs: newFaqs }));
                    }}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    <i className="ri-delete-bin-line mr-1"></i>
                    FAQ entfernen
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newFaq = {
                    id: Date.now().toString(),
                    question: '',
                    answer: '',
                    category: 'local' as const
                  };
                  setFormData(prev => ({ ...prev, local_faqs: [...prev.local_faqs, newFaq] }));
                }}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                <i className="ri-add-line mr-1"></i>
                FAQ hinzufügen
              </button>
            </div>
          </div>

          {/* Service Areas */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-800">Servicegebiete</h4>
            <div className="space-y-3">
              {formData.service_areas.map((area, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gebiet Name
                      </label>
                      <input
                        type="text"
                        value={area.name}
                        onChange={(e) => {
                          const newAreas = [...formData.service_areas];
                          newAreas[index] = { ...area, name: e.target.value };
                          setFormData(prev => ({ ...prev, service_areas: newAreas }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                        placeholder="Stuttgart Zentrum"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lieferzeit
                      </label>
                      <input
                        type="text"
                        value={area.deliveryTime}
                        onChange={(e) => {
                          const newAreas = [...formData.service_areas];
                          newAreas[index] = { ...area, deliveryTime: e.target.value };
                          setFormData(prev => ({ ...prev, service_areas: newAreas }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                        placeholder="1-2 Werktage"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Postleitzahlen (kommagetrennt)
                      </label>
                      <input
                        type="text"
                        value={area.postalCodes.join(', ')}
                        onChange={(e) => {
                          const newAreas = [...formData.service_areas];
                          newAreas[index] = { ...area, postalCodes: e.target.value.split(',').map(p => p.trim()).filter(p => p) };
                          setFormData(prev => ({ ...prev, service_areas: newAreas }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                        placeholder="70173, 70174, 70176"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sehenswürdigkeiten (kommagetrennt)
                      </label>
                      <input
                        type="text"
                        value={area.landmarks?.join(', ') || ''}
                        onChange={(e) => {
                          const newAreas = [...formData.service_areas];
                          newAreas[index] = { ...area, landmarks: e.target.value.split(',').map(l => l.trim()).filter(l => l) };
                          setFormData(prev => ({ ...prev, service_areas: newAreas }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                        placeholder="Schlossplatz, Königstraße"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Besondere Hinweise
                    </label>
                    <textarea
                      rows={2}
                      value={area.specialNotes || ''}
                      onChange={(e) => {
                        const newAreas = [...formData.service_areas];
                        newAreas[index] = { ...area, specialNotes: e.target.value };
                        setFormData(prev => ({ ...prev, service_areas: newAreas }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                      placeholder="Besondere Lieferbedingungen oder Hinweise..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newAreas = formData.service_areas.filter((_, i) => i !== index);
                      setFormData(prev => ({ ...prev, service_areas: newAreas }));
                    }}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    <i className="ri-delete-bin-line mr-1"></i>
                    Servicegebiet entfernen
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newArea = {
                    name: '',
                    postalCodes: [],
                    deliveryTime: '',
                    specialNotes: '',
                    landmarks: [],
                    neighborhoods: []
                  };
                  setFormData(prev => ({ ...prev, service_areas: [...prev.service_areas, newArea] }));
                }}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                <i className="ri-add-line mr-1"></i>
                Servicegebiet hinzufügen
              </button>
            </div>
          </div>

          {/* Delivery Zones */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-800">Lieferzonen</h4>
            <div className="space-y-3">
              {formData.delivery_zones.map((zone, index) => (
                <div key={zone.id || index} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Zone Name
                      </label>
                      <input
                        type="text"
                        value={zone.name}
                        onChange={(e) => {
                          const newZones = [...formData.delivery_zones];
                          newZones[index] = { ...zone, name: e.target.value };
                          setFormData(prev => ({ ...prev, delivery_zones: newZones }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                        placeholder="Zone 1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Liefergebühr (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={zone.fee}
                        onChange={(e) => {
                          const newZones = [...formData.delivery_zones];
                          newZones[index] = { ...zone, fee: parseFloat(e.target.value) || 0 };
                          setFormData(prev => ({ ...prev, delivery_zones: newZones }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mindestbestellung (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={zone.minOrder || ''}
                        onChange={(e) => {
                          const newZones = [...formData.delivery_zones];
                          newZones[index] = { ...zone, minOrder: parseFloat(e.target.value) || undefined };
                          setFormData(prev => ({ ...prev, delivery_zones: newZones }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                        placeholder="100.00"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gebiete (kommagetrennt)
                      </label>
                      <input
                        type="text"
                        value={zone.areas.join(', ')}
                        onChange={(e) => {
                          const newZones = [...formData.delivery_zones];
                          newZones[index] = { ...zone, areas: e.target.value.split(',').map(a => a.trim()).filter(a => a) };
                          setFormData(prev => ({ ...prev, delivery_zones: newZones }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                        placeholder="Stuttgart-Mitte, Stuttgart-Nord"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lieferzeit
                      </label>
                      <input
                        type="text"
                        value={zone.deliveryTime}
                        onChange={(e) => {
                          const newZones = [...formData.delivery_zones];
                          newZones[index] = { ...zone, deliveryTime: e.target.value };
                          setFormData(prev => ({ ...prev, delivery_zones: newZones }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                        placeholder="1-2 Werktage"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newZones = formData.delivery_zones.filter((_, i) => i !== index);
                      setFormData(prev => ({ ...prev, delivery_zones: newZones }));
                    }}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    <i className="ri-delete-bin-line mr-1"></i>
                    Lieferzone entfernen
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newZone = {
                    id: Date.now().toString(),
                    name: '',
                    areas: [],
                    deliveryTime: '',
                    fee: 0,
                    minOrder: undefined,
                    specialNotes: '',
                    postalCodes: []
                  };
                  setFormData(prev => ({ ...prev, delivery_zones: [...prev.delivery_zones, newZone] }));
                }}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                <i className="ri-add-line mr-1"></i>
                Lieferzone hinzufügen
              </button>
            </div>
          </div>

          {/* Seasonal Events */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-800">Saisonale Events</h4>
            <div className="space-y-3">
              {formData.seasonal_events.map((event, index) => (
                <div key={event.id || index} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Event Titel
                      </label>
                      <input
                        type="text"
                        value={event.title}
                        onChange={(e) => {
                          const newEvents = [...formData.seasonal_events];
                          newEvents[index] = { ...event, title: e.target.value };
                          setFormData(prev => ({ ...prev, seasonal_events: newEvents }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                        placeholder="Frühjahrsputz in [Stadt]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Jahreszeit
                      </label>
                      <select
                        value={event.season}
                        onChange={(e) => {
                          const newEvents = [...formData.seasonal_events];
                          newEvents[index] = { ...event, season: e.target.value as any };
                          setFormData(prev => ({ ...prev, seasonal_events: newEvents }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                      >
                        <option value="spring">Frühling</option>
                        <option value="summer">Sommer</option>
                        <option value="autumn">Herbst</option>
                        <option value="winter">Winter</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Event Typ
                      </label>
                      <select
                        value={event.type}
                        onChange={(e) => {
                          const newEvents = [...formData.seasonal_events];
                          newEvents[index] = { ...event, type: e.target.value as any };
                          setFormData(prev => ({ ...prev, seasonal_events: newEvents }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                      >
                        <option value="festival">Festival</option>
                        <option value="market">Markt</option>
                        <option value="tradition">Tradition</option>
                        <option value="weather">Wetter</option>
                        <option value="special_offer">Sonderangebot</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Beschreibung
                    </label>
                    <textarea
                      rows={3}
                      value={event.description}
                      onChange={(e) => {
                        const newEvents = [...formData.seasonal_events];
                        newEvents[index] = { ...event, description: e.target.value };
                        setFormData(prev => ({ ...prev, seasonal_events: newEvents }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                      placeholder="Beschreibung des saisonalen Events..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newEvents = formData.seasonal_events.filter((_, i) => i !== index);
                      setFormData(prev => ({ ...prev, seasonal_events: newEvents }));
                    }}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    <i className="ri-delete-bin-line mr-1"></i>
                    Event entfernen
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newEvent = {
                    id: Date.now().toString(),
                    title: '',
                    description: '',
                    season: 'spring' as const,
                    month: 3,
                    type: 'festival' as const,
                    icon: 'ri-calendar-line',
                    relevantProducts: [],
                    specialOffer: undefined
                  };
                  setFormData(prev => ({ ...prev, seasonal_events: [...prev.seasonal_events, newEvent] }));
                }}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                <i className="ri-add-line mr-1"></i>
                Event hinzufügen
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[#C04020] text-white rounded-lg hover:bg-[#A03318] transition-colors"
          >
            {page ? 'Speichern' : 'Erstellen'}
          </button>
        </div>
      </form>
    </div>
  );
}