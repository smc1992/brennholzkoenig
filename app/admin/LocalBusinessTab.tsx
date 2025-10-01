'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface LocalBusinessSettings {
  id?: string;
  company_name: string;
  company_description: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_website: string;
  business_hours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  service_areas: string[];
  price_range: string;
  payment_methods: string[];
  currencies_accepted: string[];
  latitude?: number;
  longitude?: number;
  google_maps_url?: string;
  google_my_business_id?: string;
}

export default function LocalBusinessTab() {
  const [settings, setSettings] = useState<LocalBusinessSettings>({
    company_name: 'Brennholzkönig',
    company_description: '',
    company_address: 'Frankfurter Straße 3, 36419 Buttlar',
    company_phone: '+49 36961 123456',
    company_email: 'info@brennholz-koenig.de',
    company_website: 'https://brennholz-koenig.de',
    business_hours: {
      monday: '08:00-18:00',
      tuesday: '08:00-18:00',
      wednesday: '08:00-18:00',
      thursday: '08:00-18:00',
      friday: '08:00-18:00',
      saturday: '08:00-16:00',
      sunday: 'closed'
    },
    service_areas: ['Thüringen', 'Hessen', 'Bayern'],
    price_range: '€€',
    payment_methods: ['Barzahlung', 'Überweisung', 'PayPal', 'Kreditkarte'],
    currencies_accepted: ['EUR']
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState('');
  const [activeSection, setActiveSection] = useState('basic');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('local_business_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          ...data,
          business_hours: typeof data.business_hours === 'string' 
            ? JSON.parse(data.business_hours) 
            : data.business_hours
        });
      }
    } catch (error) {
      console.error('Error loading local business settings:', error);
      setNotification('Fehler beim Laden der Einstellungen');
      setTimeout(() => setNotification(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('local_business_settings')
        .upsert({
          ...settings,
          business_hours: settings.business_hours
        });

      if (error) throw error;

      setNotification('Local Business-Einstellungen erfolgreich gespeichert!');
      setTimeout(() => setNotification(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setNotification('Fehler beim Speichern der Einstellungen');
      setTimeout(() => setNotification(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const updateBusinessHours = (day: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      business_hours: {
        ...prev.business_hours,
        [day]: value
      }
    }));
  };

  const addServiceArea = () => {
    setSettings(prev => ({
      ...prev,
      service_areas: [...prev.service_areas, '']
    }));
  };

  const updateServiceArea = (index: number, value: string) => {
    setSettings(prev => ({
      ...prev,
      service_areas: prev.service_areas.map((area, i) => i === index ? value : area)
    }));
  };

  const removeServiceArea = (index: number) => {
    setSettings(prev => ({
      ...prev,
      service_areas: prev.service_areas.filter((_, i) => i !== index)
    }));
  };

  const addPaymentMethod = () => {
    setSettings(prev => ({
      ...prev,
      payment_methods: [...prev.payment_methods, '']
    }));
  };

  const updatePaymentMethod = (index: number, value: string) => {
    setSettings(prev => ({
      ...prev,
      payment_methods: prev.payment_methods.map((method, i) => i === index ? value : method)
    }));
  };

  const removePaymentMethod = (index: number) => {
    setSettings(prev => ({
      ...prev,
      payment_methods: prev.payment_methods.filter((_, i) => i !== index)
    }));
  };

  const generateStructuredData = () => {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": settings.company_name,
      "description": settings.company_description,
      "url": settings.company_website,
      "telephone": settings.company_phone,
      "email": settings.company_email,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": settings.company_address.split(',')[0]?.trim(),
        "addressLocality": settings.company_address.split(',')[1]?.trim()?.split(' ')[1],
        "postalCode": settings.company_address.split(',')[1]?.trim()?.split(' ')[0],
        "addressCountry": "DE"
      },
      "areaServed": settings.service_areas.map(area => ({
        "@type": "State",
        "name": area
      })),
      "priceRange": settings.price_range,
      "paymentAccepted": settings.payment_methods,
      "currenciesAccepted": settings.currencies_accepted,
      "openingHours": Object.entries(settings.business_hours)
        .filter(([_, hours]) => hours !== 'closed')
        .map(([day, hours]) => `${day.charAt(0).toUpperCase() + day.slice(1)} ${hours}`)
    };

    return JSON.stringify(structuredData, null, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Local Business SEO</h2>
        <p className="text-gray-600">
          Verwalten Sie Ihre Unternehmensdaten für lokale Suchmaschinenoptimierung und strukturierte Daten.
        </p>
      </div>

      {/* Notification */}
      {notification && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{notification}</p>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'basic', name: 'Grunddaten', icon: '🏢' },
              { id: 'contact', name: 'Kontakt', icon: '📞' },
              { id: 'hours', name: 'Öffnungszeiten', icon: '🕒' },
              { id: 'service', name: 'Service-Gebiete', icon: '📍' },
              { id: 'payment', name: 'Zahlungsmethoden', icon: '💳' },
              { id: 'schema', name: 'Schema Preview', icon: '🔍' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeSection === tab.id
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Basic Information */}
          {activeSection === 'basic' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Grunddaten</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Firmenname
                  </label>
                  <input
                    type="text"
                    value={settings.company_name}
                    onChange={(e) => setSettings(prev => ({ ...prev, company_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={settings.company_website}
                    onChange={(e) => setSettings(prev => ({ ...prev, company_website: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unternehmensbeschreibung
                </label>
                <textarea
                  value={settings.company_description}
                  onChange={(e) => setSettings(prev => ({ ...prev, company_description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Beschreiben Sie Ihr Unternehmen für lokale SEO..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preisklasse
                </label>
                <select
                  value={settings.price_range}
                  onChange={(e) => setSettings(prev => ({ ...prev, price_range: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="€">€ (Günstig)</option>
                  <option value="€€">€€ (Moderat)</option>
                  <option value="€€€">€€€ (Gehoben)</option>
                  <option value="€€€€">€€€€ (Premium)</option>
                </select>
              </div>
            </div>
          )}

          {/* Contact Information */}
          {activeSection === 'contact' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Kontaktdaten</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefonnummer
                  </label>
                  <input
                    type="tel"
                    value={settings.company_phone}
                    onChange={(e) => setSettings(prev => ({ ...prev, company_phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-Mail-Adresse
                  </label>
                  <input
                    type="email"
                    value={settings.company_email}
                    onChange={(e) => setSettings(prev => ({ ...prev, company_email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Geschäftsadresse
                </label>
                <input
                  type="text"
                  value={settings.company_address}
                  onChange={(e) => setSettings(prev => ({ ...prev, company_address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Straße, PLZ Ort"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Diese Adresse wird für Local Business Schema und NAP-Konsistenz verwendet.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Google Maps URL (optional)
                  </label>
                  <input
                    type="url"
                    value={settings.google_maps_url || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, google_maps_url: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="https://maps.google.com/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Google My Business ID (optional)
                  </label>
                  <input
                    type="text"
                    value={settings.google_my_business_id || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, google_my_business_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Business Hours */}
          {activeSection === 'hours' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Öffnungszeiten</h3>
              
              <div className="space-y-4">
                {Object.entries(settings.business_hours).map(([day, hours]) => (
                  <div key={day} className="flex items-center space-x-4">
                    <div className="w-24">
                      <label className="block text-sm font-medium text-gray-700 capitalize">
                        {day === 'monday' ? 'Montag' :
                         day === 'tuesday' ? 'Dienstag' :
                         day === 'wednesday' ? 'Mittwoch' :
                         day === 'thursday' ? 'Donnerstag' :
                         day === 'friday' ? 'Freitag' :
                         day === 'saturday' ? 'Samstag' : 'Sonntag'}
                      </label>
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={hours}
                        onChange={(e) => updateBusinessHours(day, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="08:00-18:00 oder 'closed'"
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Format-Hinweise:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Öffnungszeiten: "08:00-18:00" (24-Stunden-Format)</li>
                  <li>• Geschlossen: "closed"</li>
                  <li>• Mittagspause: "08:00-12:00,14:00-18:00"</li>
                </ul>
              </div>
            </div>
          )}

          {/* Service Areas */}
          {activeSection === 'service' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Service-Gebiete</h3>
                <button
                  onClick={addServiceArea}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  + Gebiet hinzufügen
                </button>
              </div>
              
              <div className="space-y-3">
                {settings.service_areas.map((area, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={area}
                      onChange={(e) => updateServiceArea(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="z.B. Thüringen, Hessen, Bayern..."
                    />
                    <button
                      onClick={() => removeServiceArea(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Methods */}
          {activeSection === 'payment' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Zahlungsmethoden</h3>
                <button
                  onClick={addPaymentMethod}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  + Methode hinzufügen
                </button>
              </div>
              
              <div className="space-y-3">
                {settings.payment_methods.map((method, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={method}
                      onChange={(e) => updatePaymentMethod(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="z.B. Barzahlung, Überweisung, PayPal..."
                    />
                    <button
                      onClick={() => removePaymentMethod(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Akzeptierte Währungen
                </label>
                <input
                  type="text"
                  value={(settings.currencies_accepted && Array.isArray(settings.currencies_accepted)) ? settings.currencies_accepted.join(', ') : ''}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    currencies_accepted: e.target.value.split(',').map(c => c.trim()) 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="EUR, USD (kommagetrennt)"
                />
              </div>
            </div>
          )}

          {/* Schema Preview */}
          {activeSection === 'schema' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Schema.org Preview</h3>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Generierte strukturierte Daten:</h4>
                <pre className="text-sm text-gray-700 overflow-x-auto whitespace-pre-wrap">
                  {generateStructuredData()}
                </pre>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Verwendung:</h4>
                <p className="text-sm text-blue-800">
                  Diese strukturierten Daten werden automatisch auf allen Stadtseiten eingefügt und 
                  helfen Suchmaschinen dabei, Ihr Unternehmen besser zu verstehen und in lokalen 
                  Suchergebnissen anzuzeigen.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Speichern...' : 'Einstellungen speichern'}
        </button>
      </div>
    </div>
  );
}