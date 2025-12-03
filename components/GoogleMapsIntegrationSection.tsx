'use client';

import { useState } from 'react';
// SVG Icons als Komponenten
const MapPinIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const TruckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM21 17a2 2 0 11-4 0 2 2 0 014 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PhoneIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

interface GoogleMapsIntegrationSectionProps {
  cityName: string;
  contactAddress?: string;
  contactPhone?: string;
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
  markers?: Array<{ lat: number; lng: number; type?: string; title?: string; description?: string }>;
}

interface DeliveryRoute {
  name: string;
  areas: string[];
  estimatedTime: string;
  distance: string;
  description: string;
}

export default function GoogleMapsIntegrationSection({ 
  cityName, 
  contactAddress,
  contactPhone,
  centerLat,
  centerLng,
  zoom,
  markers = []
}: GoogleMapsIntegrationSectionProps) {
  const [activeTab, setActiveTab] = useState<'map' | 'routes' | 'contact'>('map');

  // Fallback-Routen basierend auf der Stadt
  const getDeliveryRoutes = (): DeliveryRoute[] => {
    return [
      {
        name: `${cityName} Zentrum`,
        areas: [`${cityName} Innenstadt`, `${cityName} Altstadt`, `${cityName} Zentrum`],
        estimatedTime: '30-45 Min',
        distance: '5-10 km',
        description: `Schnelle Lieferung ins Zentrum von ${cityName} mit optimierten Routen.`
      },
      {
        name: `${cityName} Nord`,
        areas: [`${cityName}-Nord`, `${cityName} Nordstadt`, 'Nördliche Stadtteile'],
        estimatedTime: '45-60 Min',
        distance: '10-15 km',
        description: `Zuverlässige Belieferung der nördlichen Gebiete von ${cityName}.`
      },
      {
        name: `${cityName} Süd`,
        areas: [`${cityName}-Süd`, `${cityName} Südstadt`, 'Südliche Stadtteile'],
        estimatedTime: '45-60 Min',
        distance: '10-15 km',
        description: `Effiziente Lieferung in die südlichen Bereiche von ${cityName}.`
      },
      {
        name: 'Umland',
        areas: [`Umgebung ${cityName}`, 'Nachbargemeinden', 'Landkreis'],
        estimatedTime: '60-90 Min',
        distance: '15-25 km',
        description: `Lieferservice auch ins Umland von ${cityName} verfügbar.`
      }
    ];
  };

  const deliveryRoutes = getDeliveryRoutes();

  // Google Maps Embed URL generieren
  const getMapEmbedUrl = () => {
    const query = contactAddress ? 
      encodeURIComponent(contactAddress) : 
      encodeURIComponent(`Brennholz ${cityName}`);
    const z = zoom || 12;
    return `https://www.google.com/maps/embed/v1/search?key=YOUR_API_KEY&q=${query}&zoom=${z}`;
  };

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-pergament to-wood-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-700 mb-6">
            Standort & Liefergebiete in {cityName}
          </h2>
          <p className="text-xl text-wood-800 max-w-3xl mx-auto">
            Finden Sie uns vor Ort und entdecken Sie unsere Lieferrouten für {cityName} und Umgebung
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center mb-12 bg-white rounded-2xl shadow-lg p-2">
          <button
            onClick={() => setActiveTab('map')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'map'
                ? 'bg-primary-600 text-white shadow-lg'
                : 'text-primary-600 hover:bg-wood-50'
            }`}
          >
            <MapPinIcon className="w-5 h-5" />
            Standortkarte
          </button>
          <button
            onClick={() => setActiveTab('routes')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'routes'
                ? 'bg-primary-600 text-white shadow-lg'
                : 'text-primary-600 hover:bg-wood-50'
            }`}
          >
            <TruckIcon className="w-5 h-5" />
            Lieferrouten
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'contact'
                ? 'bg-primary-600 text-white shadow-lg'
                : 'text-primary-600 hover:bg-wood-50'
            }`}
          >
            <PhoneIcon className="w-5 h-5" />
            Kontakt & Anfahrt
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Standortkarte Tab */}
          {activeTab === 'map' && (
            <div className="p-8">
              <h3 className="text-2xl font-bold text-primary-700 mb-6">
                Unser Standort in {cityName}
              </h3>
              
              {/* Map Placeholder */}
              <div className="bg-wood-100 rounded-xl h-96 flex items-center justify-center mb-6">
                <div className="text-center">
                  <MapPinIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-wood-800 text-lg font-semibold">
                    Interaktive Karte von {cityName}
                  </p>
                  <p className="text-gray-600 mt-2">
                    Google Maps Integration wird hier angezeigt
                  </p>
                  <div className="mt-3 text-sm text-gray-700">
                    {typeof centerLat === 'number' && typeof centerLng === 'number' && (
                      <p>Center: {centerLat.toFixed(5)}, {centerLng.toFixed(5)} • Zoom: {zoom || 12}</p>
                    )}
                    {markers.length > 0 && (
                      <p>Marker: {markers.length}</p>
                    )}
                  </div>
                  <div className="mt-4 p-4 bg-white rounded-lg shadow-sm">
                    <p className="text-sm text-wood-800">
                      <strong>Hinweis:</strong> Für die vollständige Google Maps Integration 
                      wird ein Google Maps API-Schlüssel benötigt.
                    </p>
                  </div>
                </div>
              </div>

              {/* Standort-Informationen */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-wood-50 rounded-xl p-6">
                  <h4 className="text-xl font-bold text-primary-700 mb-4">
                    Brennholz König {cityName}
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPinIcon className="w-5 h-5 text-wood-800 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-primary-700">Adresse:</p>
                        <p className="text-wood-800">
                          {contactAddress || `Musterstraße 123, ${cityName}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <PhoneIcon className="w-5 h-5 text-wood-800 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-primary-700">Telefon:</p>
                        <p className="text-wood-800">
                          {contactPhone || '+49 (0) 123 456789'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-wood-50 rounded-xl p-6">
                  <h4 className="text-xl font-bold text-primary-700 mb-4">
                    Öffnungszeiten
                  </h4>
                  <div className="space-y-2 text-wood-800">
                    <div className="flex justify-between">
                      <span>Montag - Freitag:</span>
                      <span className="font-semibold">8:00 - 18:00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Samstag:</span>
                      <span className="font-semibold">8:00 - 16:00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sonntag:</span>
                      <span className="font-semibold">Geschlossen</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Lieferrouten Tab */}
          {activeTab === 'routes' && (
            <div className="p-8">
              <h3 className="text-2xl font-bold text-primary-700 mb-6">
                Unsere Lieferrouten in {cityName}
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                {deliveryRoutes.map((route, index) => (
                  <div key={index} className="bg-wood-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="bg-primary-600 text-white rounded-full p-3 flex-shrink-0">
                        <TruckIcon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-primary-700 mb-2">
                          {route.name}
                        </h4>
                        <p className="text-wood-800 mb-4">
                          {route.description}
                        </p>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2">
                            <ClockIcon className="w-4 h-4 text-gray-600" />
                            <span className="text-sm text-wood-800">
                              Lieferzeit: <strong>{route.estimatedTime}</strong>
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPinIcon className="w-4 h-4 text-gray-600" />
                            <span className="text-sm text-wood-800">
                              Entfernung: <strong>{route.distance}</strong>
                            </span>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-primary-700 mb-2">
                            Abgedeckte Gebiete:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {route.areas.map((area, areaIndex) => (
                              <span
                                key={areaIndex}
                                className="bg-white px-3 py-1 rounded-full text-sm text-wood-800 border border-wood-200"
                              >
                                {area}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Lieferhinweise */}
              <div className="mt-8 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
                <h4 className="text-xl font-bold mb-4">
                  Wichtige Lieferhinweise für {cityName}
                </h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-semibold mb-2">Lieferzeiten:</h5>
                    <ul className="space-y-1 text-sm opacity-90">
                      <li>• Montag bis Freitag: 8:00 - 17:00 Uhr</li>
                      <li>• Samstag: 8:00 - 15:00 Uhr</li>
                      <li>• Terminvereinbarung möglich</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-semibold mb-2">Besondere Services:</h5>
                    <ul className="space-y-1 text-sm opacity-90">
                      <li>• Anlieferung bis vor die Haustür</li>
                      <li>• Stapelservice auf Wunsch</li>
                      <li>• Expresslieferung verfügbar</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Kontakt & Anfahrt Tab */}
          {activeTab === 'contact' && (
            <div className="p-8">
              <h3 className="text-2xl font-bold text-primary-700 mb-6">
                Kontakt & Anfahrt nach {cityName}
              </h3>
              
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Kontaktinformationen */}
                <div className="space-y-6">
                  <div className="bg-wood-50 rounded-xl p-6">
                    <h4 className="text-xl font-bold text-primary-700 mb-4">
                      Direkter Kontakt
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <PhoneIcon className="w-5 h-5 text-wood-800" />
                        <div>
                          <p className="font-semibold text-primary-700">Telefon:</p>
                          <p className="text-wood-800">
                            {contactPhone || '+49 (0) 123 456789'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-wood-800" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        <div>
                          <p className="font-semibold text-primary-700">E-Mail:</p>
                          <p className="text-wood-800">info@brennholz-koenig.de</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-wood-50 rounded-xl p-6">
                    <h4 className="text-xl font-bold text-primary-700 mb-4">
                      Anfahrt mit dem Auto
                    </h4>
                    <div className="space-y-3 text-wood-800">
                      <p>
                        <strong>Aus Richtung Norden:</strong><br />
                        A1 bis Ausfahrt {cityName}-Nord, dann B123 folgen
                      </p>
                      <p>
                        <strong>Aus Richtung Süden:</strong><br />
                        A2 bis Ausfahrt {cityName}-Süd, dann Richtung Zentrum
                      </p>
                      <p>
                        <strong>Parkplätze:</strong><br />
                        Kostenlose Parkplätze direkt vor Ort verfügbar
                      </p>
                    </div>
                  </div>
                </div>

                {/* Zusätzliche Informationen */}
                <div className="space-y-6">
                  <div className="bg-wood-50 rounded-xl p-6">
                    <h4 className="text-xl font-bold text-primary-700 mb-4">
                      Öffentliche Verkehrsmittel
                    </h4>
                    <div className="space-y-3 text-wood-800">
                      <p>
                        <strong>Bus:</strong><br />
                        Linie 15, 23 - Haltestelle "{cityName} Gewerbegebiet"
                      </p>
                      <p>
                        <strong>Bahn:</strong><br />
                        Bahnhof {cityName}, dann Bus Linie 15 (10 Min)
                      </p>
                      <p>
                        <strong>Fußweg:</strong><br />
                        Vom Bahnhof ca. 15 Minuten zu Fuß
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
                    <h4 className="text-xl font-bold mb-4">
                      Beratung vor Ort
                    </h4>
                    <p className="mb-4 opacity-90">
                      Besuchen Sie uns in {cityName} für eine persönliche Beratung. 
                      Unsere Experten helfen Ihnen bei der Auswahl des richtigen Brennholzes.
                    </p>
                    <button className="bg-white text-primary-700 px-6 py-3 rounded-lg font-semibold hover:bg-wood-50 transition-colors">
                      Termin vereinbaren
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
