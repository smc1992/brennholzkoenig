'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import CityImageUploader from '../../components/CityImageUploader';

// Utility function to clear corrupted Supabase cookies
const clearSupabaseCookies = () => {
  try {
    // Clear all Supabase-related cookies
    const cookies = document.cookie.split(';');
    cookies.forEach(cookie => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      if (name.includes('supabase') || name.includes('sb-')) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      }
    });
    
    // Clear localStorage and sessionStorage
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    Object.keys(sessionStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
    
    console.log('Supabase cookies and storage cleared due to parsing error');
  } catch (error) {
    console.error('Error clearing Supabase cookies:', error);
  }
};

// Create Supabase client with error handling
const createSafeSupabaseClient = () => {
  try {
    return createClientComponentClient();
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    // If there's a cookie parsing error, clear cookies and try again
    if (error instanceof Error && error.message.includes('cookie')) {
      clearSupabaseCookies();
      try {
        return createClientComponentClient();
      } catch (retryError) {
        console.error('Error creating Supabase client after cookie reset:', retryError);
        throw retryError;
      }
    }
    throw error;
  }
};

interface CityPage {
  id?: string;
  city_name: string;
  slug: string;
  meta_title: string;
  meta_description: string;
  local_keywords: string[];
  postal_codes: string[];
  hero_title: string;
  hero_subtitle: string;
  hero_cta_text: string;
  hero_image_url: string;
  city_image_url: string;
  content_section_1_main_title: string;
  content_section_1_subtitle: string;
  content_section_1_title: string;
  content_section_1_content: string;
  content_section_2_title: string;
  content_section_2_content: string;
  content_section_3_title: string;
  content_section_3_content: string;
  qualifier_badge_text: string;
  qualifier_title: string;
  qualifier_description: string;
  qualifier_suitable_for: string[];
  qualifier_not_suitable_for: string[];
  qualifier_image_url: string;
  local_service_title: string;
  local_service_subtitle: string;
  local_service_description: string;
  local_service_areas: Array<{
    name: string;
    category: string;
    title: string;
    description: string;
    badge: string;
    cta_text?: string;
  }>;
  local_service_expertise_title: string;
  local_service_expertise_description: string;
  local_service_expertise_benefits: Array<{
    title: string;
    description: string;
  }>;
  local_service_rooted_title: string;
  local_service_rooted_description: string;
  testimonial_badge_text: string;
  testimonial_title: string;
  testimonial_description: string;
  testimonial_image_url: string;
  testimonial_reviews: Array<{
    name: string;
    initials: string;
    role: string;
    order_info: string;
    rating: number;
    text: string;
    date: string;
    verified: boolean;
  }>;
  local_landmarks: Array<{
    name: string;
    category: string;
    distance: string;
    description: string;
    image_url: string;
  }>;
  service_area_details_title: string;
  service_area_details_radius: string;
  service_area_details_description: string;
  service_area_details_highlights: string[];
  extended_delivery_info_title: string;
  extended_delivery_info_description: string;
  extended_delivery_info_special_notes: string[];
  cost_calculator_cta_text: string;
  process_cta_text: string;
  process_image_url: string;
  local_faqs: Array<{
    question: string;
    answer: string;
  }>;
  local_partnerships: Array<{
    name: string;
    type: string;
    description: string;
    logo_url: string;
    website_url: string;
    founded_year: number;
  }>;
  seasonal_events: Array<{
    title: string;
    season: string;
    type: string;
    description: string;
  }>;
  google_maps_center_lat: number;
  google_maps_center_lng: number;
  google_maps_zoom: number;
  google_maps_markers: Array<{
    lat: number;
    lng: number;
    type: string;
    title: string;
    description: string;
  }>;
  contact_phone: string;
  contact_email: string;
  contact_address: string;
  primary_cta_text: string;
  secondary_cta_text: string;
  phone_display: string;
  whatsapp_url: string;
  shop_url: string;
  testimonial_cta_text: string;
  expertise_image_url: string;
  regional_quality_image_url: string;
  sustainability_image_url: string;
  content_section_2_image_url: string;
  content_section_3_image_url: string;
  local_partnerships_image_url: string;
  service_areas: Array<{
    name: string;
    delivery_time: string;
    postal_codes: string[];
    landmarks: string[];
    special_notes: string;
  }>;
  delivery_zones: Array<{
    zone_name: string;
    delivery_fee: number;
    minimum_order: number;
    areas: string[];
    delivery_time: string;
  }>;
  delivery_routes: Array<{
    name: string;
    days: string[];
    time_slots: string[];
    zones: string[];
  }>;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function CityPagesTab() {
  const [cityPages, setCityPages] = useState<CityPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<CityPage | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supabase, setSupabase] = useState<any>(null);

  // Initialize Supabase client safely
  useEffect(() => {
    try {
      const client = createSafeSupabaseClient();
      setSupabase(client);
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error);
      setError('Fehler beim Initialisieren der Verbindung. Bitte laden Sie die Seite neu.');
    }
  }, []);

  useEffect(() => {
    if (supabase) {
      loadCityPages();
    }
  }, [supabase]);

  const loadCityPages = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const { data, error } = await supabase
        .from('city_pages')
        .select('*')
        .order('city_name');

      if (error) throw error;
      setCityPages(data || []);
    } catch (error) {
      console.error('Fehler beim Laden der Stadtseiten:', error);
      setError('Fehler beim Laden der Stadtseiten. Bitte versuchen Sie es erneut.');
      
      // If it's a cookie-related error, try to reset and reload
      if (error instanceof Error && (error.message.includes('cookie') || error.message.includes('JSON'))) {
        clearSupabaseCookies();
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (page: CityPage) => {
    setSelectedPage(page);
    setIsEditing(true);
  };

  const handleCreate = () => {
    setSelectedPage({
      city_name: '',
      slug: '',
      meta_title: '',
      meta_description: '',
      local_keywords: [],
      postal_codes: [],
      hero_title: '',
      hero_subtitle: '',
      hero_cta_text: 'Jetzt bestellen',
      hero_image_url: '',
      city_image_url: '',
      content_section_1_main_title: 'Lokale Expertise für {city_name}',
      content_section_1_subtitle: 'Entdecken Sie die Tradition und Qualität unseres regionalen Brennholzes in {city_name} und Umgebung',
      content_section_1_title: 'Lokale Expertise',
      content_section_1_content: '',
      content_section_2_title: 'Regionale Qualität',
      content_section_2_content: '',
      content_section_3_title: 'Nachhaltigkeit & Umwelt',
      content_section_3_content: '',
      qualifier_badge_text: 'Qualität',
      qualifier_title: 'Unser Brennholz ist ideal für',
      qualifier_description: '',
      qualifier_suitable_for: [],
      qualifier_not_suitable_for: [],
      qualifier_image_url: '',
      local_service_title: 'Brennholz-Service in {city_name}',
      local_service_subtitle: 'Entdecken Sie, warum wir der bevorzugte Brennholz-Lieferant in {city_name} und Umgebung sind. Lokale Expertise trifft auf erstklassigen Service.',
      local_service_description: '',
      local_service_areas: [
        {
          name: 'Stadtzentrum {city_name}',
          category: 'Zentrale Lage',
          title: 'Stadtzentrum {city_name}',
          description: 'Das historische Zentrum von {city_name} mit seinen charakteristischen Gebäuden und der lebendigen Atmosphäre. Hier liefern wir besonders gerne unser Premium-Brennholz für gemütliche Abende.',
          badge: 'Hauptliefergebiet für Brennholz',
          cta_text: 'Mehr erfahren'
        },
        {
          name: 'Wohngebiete {city_name}',
          category: 'Stadtgebiet',
          title: 'Wohngebiete {city_name}',
          description: 'Die ruhigen Wohnviertel von {city_name} mit ihren Einfamilienhäusern und Gärten. Perfekt für unsere Brennholz-Lieferungen direkt vor die Haustür.',
          badge: 'Beliebtes Liefergebiet',
          cta_text: 'Mehr erfahren'
        },
        {
          name: 'Umgebung {city_name}',
          category: 'Umland',
          title: 'Umgebung {city_name}',
          description: 'Die malerische Umgebung von {city_name} mit Wäldern und Naturgebieten. Hier stammt unser nachhaltiges Brennholz aus regionaler Forstwirtschaft.',
          badge: 'Nachhaltige Holzgewinnung',
          cta_text: 'Mehr erfahren'
        }
      ],
      local_service_expertise_title: 'Ihr lokaler Brennholz-Experte in {city_name}',
      local_service_expertise_description: 'Wir kennen {city_name} wie unsere Westentasche und wissen genau, was unsere Kunden vor Ort brauchen.',
      local_service_expertise_benefits: [
        {
          title: 'Lokale Präsenz',
          description: 'Wir sind fest in {city_name} verwurzelt und kennen jeden Winkel der Stadt.'
        },
        {
          title: 'Regionales Holz',
          description: 'Unser Brennholz stammt aus den Wäldern rund um {city_name}.'
        },
        {
          title: 'Schnelle Lieferung',
          description: 'Kurze Wege bedeuten schnelle Lieferung direkt zu Ihnen nach {city_name}.'
        }
      ],
      local_service_rooted_title: 'Lokal verwurzelt in {city_name}',
      local_service_rooted_description: 'Seit Jahren vertrauen Kunden in {city_name} auf unsere Qualität und unseren Service.',
      testimonial_badge_text: 'Kundenbewertungen',
      testimonial_title: 'Was unsere Kunden sagen',
      testimonial_description: '',
      testimonial_image_url: '',
      testimonial_reviews: [],
      local_landmarks: [],
      service_area_details_title: 'Unser Liefergebiet',
      service_area_details_radius: '25 km',
      service_area_details_description: '',
      service_area_details_highlights: [],
      extended_delivery_info_title: 'Lieferinformationen',
      extended_delivery_info_description: '',
      extended_delivery_info_special_notes: [],
      cost_calculator_cta_text: 'Preis berechnen',
      process_cta_text: 'Jetzt bestellen',
      process_image_url: '',
      local_faqs: [],
      local_partnerships: [],
      seasonal_events: [],
      google_maps_center_lat: 0,
      google_maps_center_lng: 0,
      google_maps_zoom: 12,
      google_maps_markers: [],
      contact_phone: '',
      contact_email: '',
      contact_address: '',
      primary_cta_text: 'Jetzt bestellen',
      secondary_cta_text: 'Mehr erfahren',
      phone_display: '',
      whatsapp_url: '',
      shop_url: '',
      testimonial_cta_text: 'Bewertung abgeben',
      expertise_image_url: '',
      regional_quality_image_url: '',
      sustainability_image_url: '',
      content_section_2_image_url: '',
      content_section_3_image_url: '',
      local_partnerships_image_url: '',
      service_areas: [],
      delivery_zones: [],
      delivery_routes: [],
      is_active: true
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!supabase) {
      setError('Keine Verbindung zur Datenbank. Bitte laden Sie die Seite neu.');
      return;
    }

    if (!confirm('Sind Sie sicher, dass Sie diese Stadtseite löschen möchten?')) return;

    try {
      setError(null);
      const { error } = await supabase
        .from('city_pages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadCityPages();
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      setError('Fehler beim Löschen. Bitte versuchen Sie es erneut.');
      
      // If it's a cookie-related error, try to reset and reload
      if (error instanceof Error && (error.message.includes('cookie') || error.message.includes('JSON') || error.message.includes('parse'))) {
        clearSupabaseCookies();
        setError('Authentifizierungsfehler erkannt. Die Seite wird neu geladen...');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Lädt...</div>;
  }

  if (isEditing) {
    return (
      <CityPageForm
        page={selectedPage}
        onSave={async (pageData) => {
          if (!supabase) {
            setError('Keine Verbindung zur Datenbank. Bitte laden Sie die Seite neu.');
            return;
          }

          try {
            setError(null);
            if (pageData.id) {
              const { error } = await supabase
                .from('city_pages')
                .update(pageData)
                .eq('id', pageData.id);
              if (error) throw error;
            } else {
              const { error } = await supabase
                .from('city_pages')
                .insert([pageData]);
              if (error) throw error;
            }
            await loadCityPages();
            setIsEditing(false);
            setSelectedPage(null);
          } catch (error) {
            console.error('Fehler beim Speichern:', error);
            setError('Fehler beim Speichern. Bitte versuchen Sie es erneut.');
            
            // If it's a cookie-related error, try to reset and reload
            if (error instanceof Error && (error.message.includes('cookie') || error.message.includes('JSON') || error.message.includes('parse'))) {
              clearSupabaseCookies();
              setError('Authentifizierungsfehler erkannt. Die Seite wird neu geladen...');
              setTimeout(() => {
                window.location.reload();
              }, 2000);
            }
          }
        }}
        onCancel={() => {
          setIsEditing(false);
          setSelectedPage(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Stadtseiten verwalten</h2>
        <button
          onClick={handleCreate}
          className="bg-[#C04020] text-white px-4 py-2 rounded-lg hover:bg-[#A03318] transition-colors"
        >
          Neue Stadtseite erstellen
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setError(null)}
                  className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stadt</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cityPages.map((page) => (
              <tr key={page.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{page.city_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{page.slug}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    page.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {page.is_active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleEdit(page)}
                    className="text-[#C04020] hover:text-[#A03318]"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => handleDelete(page.id!)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Löschen
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CityPageForm({ page, onSave, onCancel }: {
  page: CityPage | null;
  onSave: (page: CityPage) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<CityPage>(page || {
    city_name: '',
    slug: '',
    meta_title: '',
    meta_description: '',
    local_keywords: [],
    postal_codes: [],
    hero_title: '',
    hero_subtitle: '',
    hero_cta_text: 'Jetzt bestellen',
    hero_image_url: '',
    city_image_url: '',
    content_section_1_main_title: 'Lokale Expertise für {city_name}',
    content_section_1_subtitle: 'Entdecken Sie die Tradition und Qualität unseres regionalen Brennholzes in {city_name} und Umgebung',
    content_section_1_title: 'Lokale Expertise',
    content_section_1_content: '',
    content_section_2_title: 'Regionale Qualität',
    content_section_2_content: '',
    content_section_3_title: 'Nachhaltigkeit & Umwelt',
    content_section_3_content: '',
    qualifier_badge_text: 'Qualität',
    qualifier_title: 'Unser Brennholz ist ideal für',
    qualifier_description: '',
    qualifier_suitable_for: [],
    qualifier_not_suitable_for: [],
    qualifier_image_url: '',
    local_service_title: 'Brennholz-Service in {city_name}',
    local_service_subtitle: 'Entdecken Sie, warum wir der bevorzugte Brennholz-Lieferant in {city_name} und Umgebung sind. Lokale Expertise trifft auf erstklassigen Service.',
    local_service_description: '',
    local_service_areas: [
      {
        name: 'Stadtzentrum {city_name}',
        category: 'Zentrale Lage',
        title: 'Stadtzentrum {city_name}',
        description: 'Das historische Zentrum von {city_name} mit seinen charakteristischen Gebäuden und der lebendigen Atmosphäre. Hier liefern wir besonders gerne unser Premium-Brennholz für gemütliche Abende.',
        badge: 'Hauptliefergebiet für Brennholz',
        cta_text: 'Mehr erfahren'
      },
      {
        name: 'Wohngebiete {city_name}',
        category: 'Stadtgebiet',
        title: 'Wohngebiete {city_name}',
        description: 'Die ruhigen Wohnviertel von {city_name} mit ihren Einfamilienhäusern und Gärten. Perfekt für unsere Brennholz-Lieferungen direkt vor die Haustür.',
        badge: 'Beliebtes Liefergebiet',
        cta_text: 'Mehr erfahren'
      },
      {
        name: 'Umgebung {city_name}',
        category: 'Umland',
        title: 'Umgebung {city_name}',
        description: 'Die malerische Umgebung von {city_name} mit Wäldern und Naturgebieten. Hier stammt unser nachhaltiges Brennholz aus regionaler Forstwirtschaft.',
        badge: 'Nachhaltige Holzgewinnung',
        cta_text: 'Mehr erfahren'
      }
    ],
    local_service_expertise_title: 'Ihr lokaler Brennholz-Experte in {city_name}',
    local_service_expertise_description: 'Wir kennen {city_name} wie unsere Westentasche und wissen genau, was unsere Kunden vor Ort brauchen.',
    local_service_expertise_benefits: [
      {
        title: 'Lokale Präsenz',
        description: 'Wir sind fest in {city_name} verwurzelt und kennen jeden Winkel der Stadt.'
      },
      {
        title: 'Regionales Holz',
        description: 'Unser Brennholz stammt aus den Wäldern rund um {city_name}.'
      },
      {
        title: 'Schnelle Lieferung',
        description: 'Kurze Wege bedeuten schnelle Lieferung direkt zu Ihnen nach {city_name}.'
      }
    ],
    local_service_rooted_title: 'Lokal verwurzelt in {city_name}',
    local_service_rooted_description: 'Seit Jahren vertrauen Kunden in {city_name} auf unsere Qualität und unseren Service.',
    testimonial_badge_text: 'Kundenbewertungen',
    testimonial_title: 'Was unsere Kunden sagen',
    testimonial_description: '',
    testimonial_image_url: '',
    testimonial_reviews: [],
    local_landmarks: [],
    service_area_details_title: 'Unser Liefergebiet',
    service_area_details_radius: '25 km',
    service_area_details_description: '',
    service_area_details_highlights: [],
    extended_delivery_info_title: 'Lieferinformationen',
    extended_delivery_info_description: '',
    extended_delivery_info_special_notes: [],
    cost_calculator_cta_text: 'Preis berechnen',
    process_cta_text: 'Jetzt bestellen',
    process_image_url: '',
    local_faqs: [],
    local_partnerships: [],
    seasonal_events: [],
    google_maps_center_lat: 0,
    google_maps_center_lng: 0,
    google_maps_zoom: 12,
    google_maps_markers: [],
    contact_phone: '',
    contact_email: '',
    contact_address: '',
    primary_cta_text: 'Jetzt bestellen',
    secondary_cta_text: 'Mehr erfahren',
    phone_display: '',
    whatsapp_url: '',
    shop_url: '',
    testimonial_cta_text: 'Bewertung abgeben',
    expertise_image_url: '',
    regional_quality_image_url: '',
    sustainability_image_url: '',
    content_section_2_image_url: '',
    content_section_3_image_url: '',
    local_partnerships_image_url: '',
    service_areas: [],
    delivery_zones: [],
    delivery_routes: [],
    is_active: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {page?.id ? 'Stadtseite bearbeiten' : 'Neue Stadtseite erstellen'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-600 hover:text-gray-900"
        >
          Zurück zur Übersicht
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Grunddaten */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">1. Grunddaten</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stadtname</label>
              <input
                type="text"
                value={formData.city_name}
                onChange={(e) => setFormData(prev => ({ ...prev, city_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">URL Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="mr-2"
                />
                Seite aktiv
              </label>
            </div>
          </div>
        </div>

        {/* 2. SEO */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">2. SEO</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Meta Titel</label>
              <input
                type="text"
                value={formData.meta_title}
                onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Meta Beschreibung</label>
              <textarea
                value={formData.meta_description}
                onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                rows={3}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lokale Keywords (kommagetrennt)</label>
              <input
                type="text"
                value={(formData.local_keywords || []).join(', ')}
                onChange={(e) => setFormData(prev => ({ ...prev, local_keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                placeholder="z.B. Brennholz München, Kaminholz München, Holz liefern München"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Postleitzahlen (kommagetrennt)</label>
              <input
                type="text"
                value={(formData.postal_codes || []).join(', ')}
                onChange={(e) => setFormData(prev => ({ ...prev, postal_codes: e.target.value.split(',').map(p => p.trim()).filter(p => p) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                placeholder="z.B. 80331, 80333, 80335"
              />
            </div>
          </div>
        </div>

        {/* 3. Hero-Bereich */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">3. Hero-Bereich</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hero Titel</label>
              <input
                type="text"
                value={formData.hero_title}
                onChange={(e) => setFormData(prev => ({ ...prev, hero_title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hero Untertitel</label>
              <textarea
                value={formData.hero_subtitle}
                onChange={(e) => setFormData(prev => ({ ...prev, hero_subtitle: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hero CTA Text</label>
              <input
                type="text"
                value={formData.hero_cta_text}
                onChange={(e) => setFormData(prev => ({ ...prev, hero_cta_text: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hero Bild URL</label>
              <CityImageUploader
                currentImageUrl={formData.hero_image_url}
                onImageUploaded={(url) => setFormData(prev => ({ ...prev, hero_image_url: url }))}
                label="Hero Hintergrundbild"
                placeholder="URL eingeben oder Bild hochladen"
                citySlug={formData.slug}
                sectionType="hero"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stadt Bild URL</label>
              <input
                type="url"
                value={formData.city_image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, city_image_url: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* 5. Content Section 1 (Lokale Expertise) - Vollständig editierbar */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">4. Content Section 1 - Lokale Expertise (Direkt nach Hero)</h3>
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">Vollständig editierbare Sektion</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Diese Sektion wird direkt nach dem Hero-Bereich angezeigt. Sie können Titel, Inhalt und Bild vollständig anpassen.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Hauptüberschrift der Sektion */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hauptüberschrift der Sektion
                <span className="text-xs text-gray-500 ml-2">(große Überschrift über der gesamten Sektion)</span>
              </label>
              <input
                type="text"
                value={formData.content_section_1_main_title}
                onChange={(e) => setFormData({ ...formData, content_section_1_main_title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="z.B. Lokale Expertise für {city_name}"
              />
            </div>

            {/* Unterüberschrift der Sektion */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unterüberschrift der Sektion
                <span className="text-xs text-gray-500 ml-2">(kleinere Beschreibung unter der Hauptüberschrift)</span>
              </label>
              <input
                type="text"
                value={formData.content_section_1_subtitle}
                onChange={(e) => setFormData({ ...formData, content_section_1_subtitle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="z.B. Entdecken Sie die Tradition und Qualität unseres regionalen Brennholzes in {city_name} und Umgebung"
              />
            </div>

            {/* Content-Box Titel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titel der Content-Box
                <span className="text-xs text-gray-500 ml-2">(wird in der weißen Box links angezeigt)</span>
              </label>
              <input
                type="text"
                value={formData.content_section_1_title}
                onChange={(e) => setFormData(prev => ({ ...prev, content_section_1_title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                placeholder="z.B. Brennholz für Fulda - Tradition aus dem Herzen Hessens"
              />
            </div>
            
            {/* Content-Box Fließtext */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fließtext der Content-Box
                <span className="text-xs text-gray-500 ml-2">(Hauptinhalt der weißen Box)</span>
              </label>
              <textarea
                value={formData.content_section_1_content}
                onChange={(e) => setFormData(prev => ({ ...prev, content_section_1_content: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                rows={8}
                placeholder="Beschreibung der lokalen Expertise, Tradition und Qualität..."
              />
            </div>
            
            {/* Bild Upload mit CityImageUploader */}
            <div>
              <CityImageUploader
                currentImageUrl={formData.city_image_url}
                onImageUploaded={(imageUrl: string) => setFormData(prev => ({ ...prev, city_image_url: imageUrl }))}
                label="Stadtbild / Expertise-Bild (rechts neben dem Text)"
                placeholder="Bild für die Lokale Expertise Sektion"
                citySlug={formData.slug}
                sectionType="expertise"
              />
            </div>
          </div>
        </div>

        {/* 5. Lokaler Service Section */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">5. Lokaler Service Section</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Titel</label>
              <input
                type="text"
                value={formData.local_service_title}
                onChange={(e) => setFormData(prev => ({ ...prev, local_service_title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                placeholder="Brennholz-Service in {city_name}"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Untertitel</label>
              <textarea
                value={formData.local_service_subtitle}
                onChange={(e) => setFormData(prev => ({ ...prev, local_service_subtitle: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                rows={2}
                placeholder="Entdecken Sie, warum wir der bevorzugte Brennholz-Lieferant in {city_name} und Umgebung sind..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Beschreibung (optional)</label>
              <textarea
                value={formData.local_service_description}
                onChange={(e) => setFormData(prev => ({ ...prev, local_service_description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                rows={3}
              />
            </div>
            
            {/* Service Areas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service-Bereiche</label>
              {(formData.local_service_areas || []).map((area, index) => (
                <div key={index} className="border p-4 rounded-lg mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Name"
                      value={area.name}
                      onChange={(e) => {
                        const newAreas = [...formData.local_service_areas];
                        newAreas[index].name = e.target.value;
                        setFormData(prev => ({ ...prev, local_service_areas: newAreas }));
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Kategorie"
                      value={area.category}
                      onChange={(e) => {
                        const newAreas = [...formData.local_service_areas];
                        newAreas[index].category = e.target.value;
                        setFormData(prev => ({ ...prev, local_service_areas: newAreas }));
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Titel"
                      value={area.title}
                      onChange={(e) => {
                        const newAreas = [...formData.local_service_areas];
                        newAreas[index].title = e.target.value;
                        setFormData(prev => ({ ...prev, local_service_areas: newAreas }));
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Badge"
                      value={area.badge}
                      onChange={(e) => {
                        const newAreas = [...formData.local_service_areas];
                        newAreas[index].badge = e.target.value;
                        setFormData(prev => ({ ...prev, local_service_areas: newAreas }));
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                    />
                  </div>
                  <textarea
                    placeholder="Beschreibung"
                    value={area.description}
                    onChange={(e) => {
                      const newAreas = [...formData.local_service_areas];
                      newAreas[index].description = e.target.value;
                      setFormData(prev => ({ ...prev, local_service_areas: newAreas }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent mb-2"
                    rows={3}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newAreas = formData.local_service_areas.filter((_, i) => i !== index);
                      setFormData(prev => ({ ...prev, local_service_areas: newAreas }));
                    }}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Service-Bereich entfernen
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newAreas = [...(formData.local_service_areas || []), {
                    name: '',
                    category: '',
                    title: '',
                    description: '',
                    badge: '',
                  }];
                  setFormData(prev => ({ ...prev, local_service_areas: newAreas }));
                }}
                className="text-[#C04020] hover:text-[#A03318] text-sm"
              >
                + Service-Bereich hinzufügen
              </button>
            </div>

            {/* Expertise Section */}
            <div className="border-t pt-4">
              <h4 className="text-md font-semibold text-gray-800 mb-3">Lokale Expertise</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expertise Titel</label>
                <input
                  type="text"
                  value={formData.local_service_expertise_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, local_service_expertise_title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                  placeholder="Ihr lokaler Brennholz-Experte in {city_name}"
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Expertise Beschreibung</label>
                <textarea
                  value={formData.local_service_expertise_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, local_service_expertise_description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                  rows={2}
                  placeholder="Wir kennen {city_name} wie unsere Westentasche..."
                />
              </div>
              
              {/* Expertise Benefits */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Expertise Vorteile</label>
                {(formData.local_service_expertise_benefits || []).map((benefit, index) => (
                  <div key={index} className="border p-3 rounded-lg mb-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                      <input
                        type="text"
                        placeholder="Titel"
                        value={benefit.title}
                        onChange={(e) => {
                          const newBenefits = [...formData.local_service_expertise_benefits];
                          newBenefits[index].title = e.target.value;
                          setFormData(prev => ({ ...prev, local_service_expertise_benefits: newBenefits }));
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newBenefits = formData.local_service_expertise_benefits.filter((_, i) => i !== index);
                          setFormData(prev => ({ ...prev, local_service_expertise_benefits: newBenefits }));
                        }}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Entfernen
                      </button>
                    </div>
                    <textarea
                      placeholder="Beschreibung"
                      value={benefit.description}
                      onChange={(e) => {
                        const newBenefits = [...formData.local_service_expertise_benefits];
                        newBenefits[index].description = e.target.value;
                        setFormData(prev => ({ ...prev, local_service_expertise_benefits: newBenefits }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                      rows={2}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newBenefits = [...(formData.local_service_expertise_benefits || []), {
                      title: '',
                      description: ''
                    }];
                    setFormData(prev => ({ ...prev, local_service_expertise_benefits: newBenefits }));
                  }}
                  className="text-[#C04020] hover:text-[#A03318] text-sm"
                >
                  + Vorteil hinzufügen
                </button>
              </div>
            </div>

            {/* Local Service Rooted Section */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">Lokale Verwurzelung</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Titel</label>
                <input
                  type="text"
                  value={formData.local_service_rooted_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, local_service_rooted_title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C04020]"
                  placeholder="z.B. Lokal verwurzelt in {city_name}"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Beschreibung</label>
                <textarea
                  value={formData.local_service_rooted_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, local_service_rooted_description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C04020]"
                  placeholder="z.B. Seit Jahren vertrauen Kunden in {city_name} auf unsere Qualität und unseren Service."
                />
              </div>
            </div>
          </div>
        </div>

        {/* 7. Testimonial Section entfernt */}

        {/* 6. Extended Delivery Info Section */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">6. Extended Delivery Info Section</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Titel</label>
              <input
                type="text"
                value={formData.extended_delivery_info_title}
                onChange={(e) => setFormData(prev => ({ ...prev, extended_delivery_info_title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Beschreibung</label>
              <textarea
                value={formData.extended_delivery_info_description}
                onChange={(e) => setFormData(prev => ({ ...prev, extended_delivery_info_description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Besondere Hinweise (kommagetrennt)</label>
              <input
                type="text"
                value={(formData.extended_delivery_info_special_notes || []).join(', ')}
                onChange={(e) => setFormData(prev => ({ ...prev, extended_delivery_info_special_notes: e.target.value.split(',').map(item => item.trim()).filter(item => item) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
              />
            </div>

            {/* Lieferzonen (integriert aus Sektion 16) */}
            <div className="pt-6 border-t">
              <h4 className="text-md font-semibold text-gray-800 mb-3">Lieferzonen</h4>
              <div className="space-y-4">
                {formData.delivery_zones.map((zone, index) => (
                  <div key={index} className="border p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <input
                        type="text"
                        placeholder="Zonenname"
                        value={zone.zone_name}
                        onChange={(e) => {
                          const newZones = [...formData.delivery_zones];
                          newZones[index].zone_name = e.target.value;
                          setFormData(prev => ({ ...prev, delivery_zones: newZones }));
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                      />
                      <input
                        type="number"
                        placeholder="Liefergebühr"
                        value={zone.delivery_fee}
                        onChange={(e) => {
                          const newZones = [...formData.delivery_zones];
                          newZones[index].delivery_fee = parseFloat(e.target.value) || 0;
                          setFormData(prev => ({ ...prev, delivery_zones: newZones }));
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                      />
                      <input
                        type="number"
                        placeholder="Mindestbestellung"
                        value={zone.minimum_order}
                        onChange={(e) => {
                          const newZones = [...formData.delivery_zones];
                          newZones[index].minimum_order = parseFloat(e.target.value) || 0;
                          setFormData(prev => ({ ...prev, delivery_zones: newZones }));
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                      />
                      <input
                        type="text"
                        placeholder="Lieferzeit"
                        value={zone.delivery_time}
                        onChange={(e) => {
                          const newZones = [...formData.delivery_zones];
                          newZones[index].delivery_time = e.target.value;
                          setFormData(prev => ({ ...prev, delivery_zones: newZones }));
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Gebiete (kommagetrennt)"
                      value={(zone.areas || []).join(', ')}
                      onChange={(e) => {
                        const newZones = [...formData.delivery_zones];
                        newZones[index].areas = e.target.value.split(',').map(area => area.trim()).filter(area => area);
                        setFormData(prev => ({ ...prev, delivery_zones: newZones }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent mb-2"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newZones = formData.delivery_zones.filter((_, i) => i !== index);
                        setFormData(prev => ({ ...prev, delivery_zones: newZones }));
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      Lieferzone entfernen
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newZone = {
                      zone_name: '',
                      delivery_fee: 0,
                      minimum_order: 0,
                      areas: [],
                      delivery_time: ''
                    };
                    setFormData(prev => ({ ...prev, delivery_zones: [...prev.delivery_zones, newZone] }));
                  }}
                  className="px-4 py-2 bg-[#C04020] text-white rounded-lg hover:bg-[#A03318]"
                >
                  Lieferzone hinzufügen
                </button>
              </div>
            </div>

            {/* Lieferrouten Editor */}
            <div className="pt-6 border-t">
              <h4 className="text-md font-semibold text-gray-800 mb-3">Lieferrouten</h4>
              <div className="space-y-4">
                {formData.delivery_routes.map((route, index) => (
                  <div key={index} className="border p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <input
                        type="text"
                        placeholder="Routenname"
                        value={route.name || ''}
                        onChange={(e) => {
                          const newRoutes = [...(formData.delivery_routes || [])];
                          newRoutes[index] = { ...newRoutes[index], name: e.target.value };
                          setFormData(prev => ({ ...prev, delivery_routes: newRoutes }));
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                      />
                      <input
                        type="text"
                        placeholder="Liefertage (kommagetrennt)"
                        value={(route.days || []).join(', ')}
                        onChange={(e) => {
                          const newRoutes = [...(formData.delivery_routes || [])];
                          newRoutes[index] = { ...newRoutes[index], days: e.target.value.split(',').map(d => d.trim()).filter(Boolean) };
                          setFormData(prev => ({ ...prev, delivery_routes: newRoutes }));
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                      />
                      <input
                        type="text"
                        placeholder="Zeitfenster (kommagetrennt)"
                        value={(route.time_slots || []).join(', ')}
                        onChange={(e) => {
                          const newRoutes = [...(formData.delivery_routes || [])];
                          newRoutes[index] = { ...newRoutes[index], time_slots: e.target.value.split(',').map(t => t.trim()).filter(Boolean) };
                          setFormData(prev => ({ ...prev, delivery_routes: newRoutes }));
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                      />
                    </div>

                    <label className="block text-sm font-medium text-gray-700 mb-2">Zugehörige Zonen (kommagetrennt, Namen)</label>
                    <input
                      type="text"
                      placeholder="Zonen-Namen (z. B. Nord, Ost)"
                      value={(route.zones || []).join(', ')}
                      onChange={(e) => {
                        const newRoutes = [...(formData.delivery_routes || [])];
                        newRoutes[index] = { ...newRoutes[index], zones: e.target.value.split(',').map(z => z.trim()).filter(Boolean) };
                        setFormData(prev => ({ ...prev, delivery_routes: newRoutes }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent mb-2"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        const newRoutes = (formData.delivery_routes || []).filter((_, i) => i !== index);
                        setFormData(prev => ({ ...prev, delivery_routes: newRoutes }));
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      Route entfernen
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    const newRoute = { name: '', days: [], time_slots: [], zones: [] };
                    setFormData(prev => ({ ...prev, delivery_routes: [...(prev.delivery_routes || []), newRoute] }));
                  }}
                  className="px-4 py-2 bg-[#C04020] text-white rounded-lg hover:bg-[#A03318]"
                >
                  Route hinzufügen
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 7. Local Landmarks Section (deaktiviert) */}
        <div className="bg-white p-6 rounded-lg border hidden">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">7. Local Landmarks Section</h3>
          <div className="space-y-4">
            {(formData.local_landmarks || []).map((landmark, index) => (
              <div key={index} className="border p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Name"
                    value={landmark.name}
                    onChange={(e) => {
                      const newLandmarks = [...formData.local_landmarks];
                      newLandmarks[index].name = e.target.value;
                      setFormData(prev => ({ ...prev, local_landmarks: newLandmarks }));
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Kategorie"
                    value={landmark.category}
                    onChange={(e) => {
                      const newLandmarks = [...formData.local_landmarks];
                      newLandmarks[index].category = e.target.value;
                      setFormData(prev => ({ ...prev, local_landmarks: newLandmarks }));
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Entfernung"
                    value={landmark.distance}
                    onChange={(e) => {
                      const newLandmarks = [...formData.local_landmarks];
                      newLandmarks[index].distance = e.target.value;
                      setFormData(prev => ({ ...prev, local_landmarks: newLandmarks }));
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                  />
                  <input
                    type="url"
                    placeholder="Bild URL"
                    value={landmark.image_url}
                    onChange={(e) => {
                      const newLandmarks = [...formData.local_landmarks];
                      newLandmarks[index].image_url = e.target.value;
                      setFormData(prev => ({ ...prev, local_landmarks: newLandmarks }));
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                  />
                </div>
                <textarea
                  placeholder="Beschreibung"
                  value={landmark.description}
                  onChange={(e) => {
                    const newLandmarks = [...formData.local_landmarks];
                    newLandmarks[index].description = e.target.value;
                    setFormData(prev => ({ ...prev, local_landmarks: newLandmarks }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent mb-2"
                  rows={2}
                />
                <button
                  type="button"
                  onClick={() => {
                    const newLandmarks = formData.local_landmarks.filter((_, i) => i !== index);
                    setFormData(prev => ({ ...prev, local_landmarks: newLandmarks }));
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  Landmark entfernen
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const newLandmark = {
                  name: '',
                  category: '',
                  distance: '',
                  description: '',
                  image_url: ''
                };
                setFormData(prev => ({ ...prev, local_landmarks: [...prev.local_landmarks, newLandmark] }));
              }}
              className="px-4 py-2 bg-[#C04020] text-white rounded-lg hover:bg-[#A03318]"
            >
              Landmark hinzufügen
            </button>
          </div>
        </div>

        {/* 8. Content Section 2 (Regionale Qualität) */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">8. Content Section 2 - Regionale Qualität</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Titel</label>
              <input
                type="text"
                value={formData.content_section_2_title}
                onChange={(e) => setFormData(prev => ({ ...prev, content_section_2_title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Inhalt</label>
              <textarea
                value={formData.content_section_2_content}
                onChange={(e) => setFormData(prev => ({ ...prev, content_section_2_content: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Regionale Qualität Bild URL</label>
              <input
                type="url"
                value={formData.regional_quality_image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, regional_quality_image_url: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content Section 2 Bild URL</label>
              <input
                type="url"
                value={formData.content_section_2_image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, content_section_2_image_url: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* 9. Service Area Details Section */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">9. Service Area Details Section</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Titel</label>
              <input
                type="text"
                value={formData.service_area_details_title}
                onChange={(e) => setFormData(prev => ({ ...prev, service_area_details_title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Radius</label>
              <input
                type="text"
                value={formData.service_area_details_radius}
                onChange={(e) => setFormData(prev => ({ ...prev, service_area_details_radius: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Beschreibung</label>
              <textarea
                value={formData.service_area_details_description}
                onChange={(e) => setFormData(prev => ({ ...prev, service_area_details_description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Highlights (kommagetrennt)</label>
              <input
                  type="text"
                  value={(formData.service_area_details_highlights || []).join(', ')}
                  onChange={(e) => setFormData(prev => ({ ...prev, service_area_details_highlights: e.target.value.split(',').map(item => item.trim()).filter(item => item) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                />
            </div>
          </div>
        </div>

        

        {/* 11. Kostenrechner Section */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">11. Kostenrechner Section</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CTA Text</label>
              <input
                type="text"
                value={formData.cost_calculator_cta_text}
                onChange={(e) => setFormData(prev => ({ ...prev, cost_calculator_cta_text: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* 12. Prozess Section */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">12. Prozess Section</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CTA Text</label>
              <input
                type="text"
                value={formData.process_cta_text}
                onChange={(e) => setFormData(prev => ({ ...prev, process_cta_text: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prozess Bild URL</label>
              <input
                type="url"
                value={formData.process_image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, process_image_url: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* 13. Content Section 3 (Nachhaltigkeit) */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">13. Content Section 3 - Nachhaltigkeit</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Titel</label>
              <input
                type="text"
                value={formData.content_section_3_title}
                onChange={(e) => setFormData(prev => ({ ...prev, content_section_3_title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Inhalt</label>
              <textarea
                value={formData.content_section_3_content}
                onChange={(e) => setFormData(prev => ({ ...prev, content_section_3_content: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nachhaltigkeit Bild URL</label>
              <input
                type="url"
                value={formData.sustainability_image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, sustainability_image_url: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content Section 3 Bild URL</label>
              <input
                type="url"
                value={formData.content_section_3_image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, content_section_3_image_url: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* 14. Lokale FAQs */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">14. Lokale FAQs</h3>
          <div className="space-y-4">
            {(formData.local_faqs || []).map((faq, index) => (
              <div key={index} className="border p-4 rounded-lg">
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Frage"
                    value={faq.question}
                    onChange={(e) => {
                      const newFaqs = [...formData.local_faqs];
                      newFaqs[index].question = e.target.value;
                      setFormData(prev => ({ ...prev, local_faqs: newFaqs }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                  />
                  <textarea
                    placeholder="Antwort"
                    value={faq.answer}
                    onChange={(e) => {
                      const newFaqs = [...formData.local_faqs];
                      newFaqs[index].answer = e.target.value;
                      setFormData(prev => ({ ...prev, local_faqs: newFaqs }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                    rows={3}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newFaqs = formData.local_faqs.filter((_, i) => i !== index);
                      setFormData(prev => ({ ...prev, local_faqs: newFaqs }));
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    FAQ entfernen
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const newFaq = { question: '', answer: '' };
                setFormData(prev => ({ ...prev, local_faqs: [...prev.local_faqs, newFaq] }));
              }}
              className="px-4 py-2 bg-[#C04020] text-white rounded-lg hover:bg-[#A03318]"
            >
              FAQ hinzufügen
            </button>
          </div>
        </div>

        {/* 15. Servicegebiete */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">15. Servicegebiete</h3>
          <div className="space-y-4">
            {formData.service_areas.map((area, index) => (
              <div key={index} className="border p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Name"
                    value={area.name}
                    onChange={(e) => {
                      const newAreas = [...formData.service_areas];
                      newAreas[index].name = e.target.value;
                      setFormData(prev => ({ ...prev, service_areas: newAreas }));
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Lieferzeit"
                    value={area.delivery_time}
                    onChange={(e) => {
                      const newAreas = [...formData.service_areas];
                      newAreas[index].delivery_time = e.target.value;
                      setFormData(prev => ({ ...prev, service_areas: newAreas }));
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                  />
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Postleitzahlen (kommagetrennt)"
                    value={(area.postal_codes || []).join(', ')}
                    onChange={(e) => {
                      const newAreas = [...formData.service_areas];
                      newAreas[index].postal_codes = e.target.value.split(',').map(code => code.trim()).filter(code => code);
                      setFormData(prev => ({ ...prev, service_areas: newAreas }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Sehenswürdigkeiten (kommagetrennt)"
                    value={(area.landmarks || []).join(', ')}
                    onChange={(e) => {
                      const newAreas = [...formData.service_areas];
                      newAreas[index].landmarks = e.target.value.split(',').map(landmark => landmark.trim()).filter(landmark => landmark);
                      setFormData(prev => ({ ...prev, service_areas: newAreas }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                  />
                  <textarea
                    placeholder="Besondere Hinweise"
                    value={area.special_notes}
                    onChange={(e) => {
                      const newAreas = [...formData.service_areas];
                      newAreas[index].special_notes = e.target.value;
                      setFormData(prev => ({ ...prev, service_areas: newAreas }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                    rows={2}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newAreas = formData.service_areas.filter((_, i) => i !== index);
                    setFormData(prev => ({ ...prev, service_areas: newAreas }));
                  }}
                  className="text-red-600 hover:text-red-800 mt-2"
                >
                  Servicegebiet entfernen
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const newArea = {
                  name: '',
                  delivery_time: '',
                  postal_codes: [],
                  landmarks: [],
                  special_notes: ''
                };
                setFormData(prev => ({ ...prev, service_areas: [...prev.service_areas, newArea] }));
              }}
              className="px-4 py-2 bg-[#C04020] text-white rounded-lg hover:bg-[#A03318]"
            >
              Servicegebiet hinzufügen
            </button>
          </div>
        </div>

        {/* 16. Lieferzonen entfernt – in Sektion 6 integriert */}

        {/* 17. Saisonale Events */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">17. Saisonale Events</h3>
          <div className="space-y-4">
            {(formData.seasonal_events || []).map((event, index) => (
              <div key={index} className="border p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Titel"
                    value={event.title}
                    onChange={(e) => {
                      const newEvents = [...formData.seasonal_events];
                      newEvents[index].title = e.target.value;
                      setFormData(prev => ({ ...prev, seasonal_events: newEvents }));
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Jahreszeit"
                    value={event.season}
                    onChange={(e) => {
                      const newEvents = [...formData.seasonal_events];
                      newEvents[index].season = e.target.value;
                      setFormData(prev => ({ ...prev, seasonal_events: newEvents }));
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Typ"
                    value={event.type}
                    onChange={(e) => {
                      const newEvents = [...formData.seasonal_events];
                      newEvents[index].type = e.target.value;
                      setFormData(prev => ({ ...prev, seasonal_events: newEvents }));
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                  />
                </div>
                <textarea
                  placeholder="Beschreibung"
                  value={event.description}
                  onChange={(e) => {
                    const newEvents = [...formData.seasonal_events];
                    newEvents[index].description = e.target.value;
                    setFormData(prev => ({ ...prev, seasonal_events: newEvents }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent mb-2"
                  rows={3}
                />
                <button
                  type="button"
                  onClick={() => {
                    const newEvents = formData.seasonal_events.filter((_, i) => i !== index);
                    setFormData(prev => ({ ...prev, seasonal_events: newEvents }));
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  Event entfernen
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const newEvent = {
                  title: '',
                  season: '',
                  type: '',
                  description: ''
                };
                setFormData(prev => ({ ...prev, seasonal_events: [...prev.seasonal_events, newEvent] }));
              }}
              className="px-4 py-2 bg-[#C04020] text-white rounded-lg hover:bg-[#A03318]"
            >
              Event hinzufügen
            </button>
          </div>
        </div>

        {/* 18. Lokale Partnerschaften */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">18. Lokale Partnerschaften</h3>
          <div className="space-y-4">
            {(formData.local_partnerships || []).map((partnership, index) => (
              <div key={index} className="border p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Name"
                    value={partnership.name}
                    onChange={(e) => {
                      const newPartnerships = [...formData.local_partnerships];
                      newPartnerships[index].name = e.target.value;
                      setFormData(prev => ({ ...prev, local_partnerships: newPartnerships }));
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Typ"
                    value={partnership.type}
                    onChange={(e) => {
                      const newPartnerships = [...formData.local_partnerships];
                      newPartnerships[index].type = e.target.value;
                      setFormData(prev => ({ ...prev, local_partnerships: newPartnerships }));
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                  />
                  <input
                    type="url"
                    placeholder="Logo URL"
                    value={partnership.logo_url}
                    onChange={(e) => {
                      const newPartnerships = [...formData.local_partnerships];
                      newPartnerships[index].logo_url = e.target.value;
                      setFormData(prev => ({ ...prev, local_partnerships: newPartnerships }));
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                  />
                  <input
                    type="url"
                    placeholder="Website URL"
                    value={partnership.website_url}
                    onChange={(e) => {
                      const newPartnerships = [...formData.local_partnerships];
                      newPartnerships[index].website_url = e.target.value;
                      setFormData(prev => ({ ...prev, local_partnerships: newPartnerships }));
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Gründungsjahr"
                    value={partnership.founded_year}
                    onChange={(e) => {
                      const newPartnerships = [...formData.local_partnerships];
                      newPartnerships[index].founded_year = parseInt(e.target.value) || 0;
                      setFormData(prev => ({ ...prev, local_partnerships: newPartnerships }));
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                  />
                </div>
                <textarea
                  placeholder="Beschreibung"
                  value={partnership.description}
                  onChange={(e) => {
                    const newPartnerships = [...formData.local_partnerships];
                    newPartnerships[index].description = e.target.value;
                    setFormData(prev => ({ ...prev, local_partnerships: newPartnerships }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent mb-2"
                  rows={3}
                />
                <button
                  type="button"
                  onClick={() => {
                    const newPartnerships = formData.local_partnerships.filter((_, i) => i !== index);
                    setFormData(prev => ({ ...prev, local_partnerships: newPartnerships }));
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  Partnerschaft entfernen
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const newPartnership = {
                  name: '',
                  type: '',
                  description: '',
                  logo_url: '',
                  website_url: '',
                  founded_year: 0
                };
                setFormData(prev => ({ ...prev, local_partnerships: [...prev.local_partnerships, newPartnership] }));
              }}
              className="px-4 py-2 bg-[#C04020] text-white rounded-lg hover:bg-[#A03318]"
            >
              Partnerschaft hinzufügen
            </button>
          </div>
        </div>

        {/* 19. Google Maps Integration */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">19. Google Maps Integration</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Zentrum Breitengrad</label>
                <input
                  type="number"
                  step="any"
                  value={formData.google_maps_center_lat}
                  onChange={(e) => setFormData(prev => ({ ...prev, google_maps_center_lat: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Zentrum Längengrad</label>
                <input
                  type="number"
                  step="any"
                  value={formData.google_maps_center_lng}
                  onChange={(e) => setFormData(prev => ({ ...prev, google_maps_center_lng: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Zoom Level</label>
                <input
                  type="number"
                  value={formData.google_maps_zoom}
                  onChange={(e) => setFormData(prev => ({ ...prev, google_maps_zoom: parseInt(e.target.value) || 10 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <h4 className="text-md font-medium text-gray-900 mb-2">Marker</h4>
              {(formData.google_maps_markers || []).map((marker, index) => (
                <div key={index} className="border p-4 rounded-lg mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input
                      type="number"
                      step="any"
                      placeholder="Breitengrad"
                      value={marker.lat}
                      onChange={(e) => {
                        const newMarkers = [...formData.google_maps_markers];
                        newMarkers[index].lat = parseFloat(e.target.value) || 0;
                        setFormData(prev => ({ ...prev, google_maps_markers: newMarkers }));
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                    />
                    <input
                      type="number"
                      step="any"
                      placeholder="Längengrad"
                      value={marker.lng}
                      onChange={(e) => {
                        const newMarkers = [...formData.google_maps_markers];
                        newMarkers[index].lng = parseFloat(e.target.value) || 0;
                        setFormData(prev => ({ ...prev, google_maps_markers: newMarkers }));
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Typ"
                      value={marker.type}
                      onChange={(e) => {
                        const newMarkers = [...formData.google_maps_markers];
                        newMarkers[index].type = e.target.value;
                        setFormData(prev => ({ ...prev, google_maps_markers: newMarkers }));
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Titel"
                      value={marker.title}
                      onChange={(e) => {
                        const newMarkers = [...formData.google_maps_markers];
                        newMarkers[index].title = e.target.value;
                        setFormData(prev => ({ ...prev, google_maps_markers: newMarkers }));
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                    />
                  </div>
                  <textarea
                    placeholder="Beschreibung"
                    value={marker.description}
                    onChange={(e) => {
                      const newMarkers = [...formData.google_maps_markers];
                      newMarkers[index].description = e.target.value;
                      setFormData(prev => ({ ...prev, google_maps_markers: newMarkers }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent mb-2"
                    rows={2}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newMarkers = formData.google_maps_markers.filter((_, i) => i !== index);
                      setFormData(prev => ({ ...prev, google_maps_markers: newMarkers }));
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    Marker entfernen
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newMarker = {
                    lat: 0,
                    lng: 0,
                    type: '',
                    title: '',
                    description: ''
                  };
                  setFormData(prev => ({ ...prev, google_maps_markers: [...prev.google_maps_markers, newMarker] }));
                }}
                className="px-4 py-2 bg-[#C04020] text-white rounded-lg hover:bg-[#A03318]"
              >
                Marker hinzufügen
              </button>
            </div>
          </div>
        </div>

        {/* 20. Kontaktinformationen & CTAs */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">20. Kontaktinformationen & CTAs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
              <input
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">E-Mail</label>
              <input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
              <input
                type="text"
                value={formData.contact_address}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_address: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Primärer CTA Text</label>
              <input
                type="text"
                value={formData.primary_cta_text}
                onChange={(e) => setFormData(prev => ({ ...prev, primary_cta_text: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sekundärer CTA Text</label>
              <input
                type="text"
                value={formData.secondary_cta_text}
                onChange={(e) => setFormData(prev => ({ ...prev, secondary_cta_text: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Telefon Anzeige</label>
              <input
                type="text"
                value={formData.phone_display}
                onChange={(e) => setFormData(prev => ({ ...prev, phone_display: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp URL</label>
              <input
                type="url"
                value={formData.whatsapp_url}
                onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_url: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Shop URL</label>
              <input
                type="url"
                value={formData.shop_url}
                onChange={(e) => setFormData(prev => ({ ...prev, shop_url: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Testimonial CTA Text</label>
              <input
                type="text"
                value={formData.testimonial_cta_text}
                onChange={(e) => setFormData(prev => ({ ...prev, testimonial_cta_text: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Aktionen */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-[#C04020] text-white rounded-lg hover:bg-[#A03318]"
          >
            {page?.id ? 'Speichern' : 'Erstellen'}
          </button>
        </div>
      </form>
    </div>
  );
}