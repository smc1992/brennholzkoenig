'use client';

import { useState } from 'react';

interface DeliveryZone {
  id: string;
  name: string;
  areas: string[];
  deliveryTime: string;
  fee: number;
  minOrder?: number;
  specialNotes?: string;
  postalCodes: string[];
}

interface DeliveryRoute {
  id: string;
  name: string;
  days: string[];
  timeSlots: string[];
  zones: string[];
}

// Datenbank-Interfaces für die neuen Props
interface DatabaseDeliveryZone {
  name: string;
  areas: string[];
  delivery_time: string;
  fee: number;
  min_order?: number;
  special_notes?: string;
  postal_codes: string[];
}

interface DatabaseDeliveryRoute {
  name: string;
  days: string[];
  time_slots: string[];
  zones: string[];
}

interface ExtendedDeliveryInfoSectionProps {
  cityName: string;
  title?: string;
  description?: string;
  customZones?: DeliveryZone[];
  customRoutes?: DeliveryRoute[];
  deliveryZones?: Array<DatabaseDeliveryZone | any>;
  deliveryRoutes?: DatabaseDeliveryRoute[];
  maxZones?: number;
  maxRoutes?: number;
}

export default function ExtendedDeliveryInfoSection({ 
  cityName,
  title,
  description,
  customZones = [],
  customRoutes = [],
  deliveryZones = [],
  deliveryRoutes = [],
  maxZones,
  maxRoutes
}: ExtendedDeliveryInfoSectionProps) {
  const [activeTab, setActiveTab] = useState<'zones' | 'routes'>('zones');

  // Fallback-Lieferzonen für bessere lokale Relevanz
  const defaultZones: DeliveryZone[] = [
    {
      id: '1',
      name: `${cityName} Zentrum`,
      areas: ['Altstadt', 'Innenstadt', 'Bahnhofsviertel', 'Fußgängerzone'],
      deliveryTime: 'Gleicher Tag möglich',
      fee: 0,
      minOrder: 0.5,
      specialNotes: 'Lieferung ab 0,5 Raummeter möglich (42,50€ Liefergebühr)',
      postalCodes: ['12345', '12346']
    },
    {
      id: '2',
      name: `${cityName} Nord`,
      areas: ['Nordstadt', 'Industriegebiet Nord', 'Neubaugebiet', 'Wohnpark Nord'],
      deliveryTime: '24-48 Stunden',
      fee: 15,
      minOrder: 1,
      specialNotes: 'Lieferung bis vor die Haustür',
      postalCodes: ['12347', '12348']
    },
    {
      id: '3',
      name: `${cityName} Süd`,
      areas: ['Südstadt', 'Villengebiet', 'Einfamilienhaussiedlung', 'Gewerbegebiet Süd'],
      deliveryTime: '24-48 Stunden',
      fee: 15,
      minOrder: 1,
      specialNotes: 'Stapelservice verfügbar',
      postalCodes: ['12349', '12350']
    },
    {
      id: '4',
      name: `${cityName} Ost`,
      areas: ['Oststadt', 'Neubaugebiet Ost', 'Gewerbepark', 'Wohnsiedlung Am Park'],
      deliveryTime: '48 Stunden',
      fee: 20,
      minOrder: 1.5,
      specialNotes: 'Anlieferung auch am Wochenende',
      postalCodes: ['12351', '12352']
    },
    {
      id: '5',
      name: `${cityName} West`,
      areas: ['Weststadt', 'Altbaugebiet', 'Studentenviertel', 'Kulturviertel'],
      deliveryTime: '48 Stunden',
      fee: 20,
      minOrder: 1.5,
      specialNotes: 'Enge Straßen - Kleinfahrzeug verfügbar',
      postalCodes: ['12353', '12354']
    },
    {
      id: '6',
      name: `Umland ${cityName}`,
      areas: ['Nachbargemeinden', 'Dörfer im Umkreis', 'Landkreis', 'Außenbezirke'],
      deliveryTime: '2-3 Werktage',
      fee: 35,
      minOrder: 2,
      specialNotes: 'Mindestbestellmenge 2 Raummeter',
      postalCodes: ['12355', '12356', '12357']
    }
  ];

  // Fallback-Lieferrouten
  const defaultRoutes: DeliveryRoute[] = [
    {
      id: '1',
      name: 'Zentrum-Route',
      days: ['Montag', 'Mittwoch', 'Freitag'],
      timeSlots: ['08:00-12:00', '13:00-17:00'],
      zones: ['1']
    },
    {
      id: '2',
      name: 'Nord-Süd-Route',
      days: ['Dienstag', 'Donnerstag'],
      timeSlots: ['08:00-12:00', '13:00-17:00'],
      zones: ['2', '3']
    },
    {
      id: '3',
      name: 'Ost-West-Route',
      days: ['Mittwoch', 'Samstag'],
      timeSlots: ['09:00-13:00', '14:00-18:00'],
      zones: ['4', '5']
    },
    {
      id: '4',
      name: 'Umland-Route',
      days: ['Donnerstag', 'Samstag'],
      timeSlots: ['08:00-16:00'],
      zones: ['6']
    }
  ];

  // Konvertiere Datenbank-Daten zu Komponenten-Format (unterstützt mehrere Feldnamen)
  const convertedZones: DeliveryZone[] = deliveryZones.map((zone: any, index: number) => ({
    id: (index + 1).toString(),
    name: zone.name ?? zone.zone_name ?? `Zone ${(index + 1).toString()}`,
    areas: Array.isArray(zone.areas) ? zone.areas : [],
    deliveryTime: zone.delivery_time ?? zone.deliveryTime ?? '',
    fee: zone.fee ?? zone.delivery_fee ?? 0,
    minOrder: zone.min_order ?? zone.minimum_order ?? 0,
    specialNotes: zone.special_notes ?? zone.specialNotes ?? undefined,
    postalCodes: Array.isArray(zone.postal_codes) ? zone.postal_codes : []
  }));

  const convertedRoutes: DeliveryRoute[] = deliveryRoutes.map((route, index) => ({
    id: (index + 1).toString(),
    name: route.name,
    days: Array.isArray(route.days) ? route.days : [],
    timeSlots: Array.isArray(route.time_slots) ? route.time_slots : [],
    zones: Array.isArray(route.zones) ? route.zones : []
  }));

  // Verwende editierbare Daten falls vorhanden, sonst Fallback zu Standard-Daten
  const allZonesBase = convertedZones.length > 0 ? convertedZones : 
                      customZones.length > 0 ? customZones : defaultZones;
  const allRoutesBase = convertedRoutes.length > 0 ? convertedRoutes : 
                       customRoutes.length > 0 ? customRoutes : defaultRoutes;

  const allZones = typeof maxZones === 'number' ? allZonesBase.slice(0, Math.max(0, maxZones)) : allZonesBase;
  const allRoutes = typeof maxRoutes === 'number' ? allRoutesBase.slice(0, Math.max(0, maxRoutes)) : allRoutesBase;


  const getRouteForZone = (zoneId: string) => {
    return allRoutes.find(route => route.zones.includes(zoneId));
  };

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-wood-50 to-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-700 mb-4">
            {title ? title : `Lieferservice in ${cityName}`}
          </h2>
          <p className="text-lg text-wood-800 max-w-3xl mx-auto">
            {description ? description : `Detaillierte Informationen zu unseren Lieferzonen, Routen und Konditionen 
            in ${cityName} und Umgebung.`}
          </p>
        </div>

        {/* Tab Navigation (Kostenrechner entfernt) */}
        <div className="flex flex-wrap justify-center mb-8 bg-white rounded-xl shadow-lg p-2">
          {[
            { id: 'zones', name: 'Lieferzonen', icon: '📍' },
            { id: 'routes', name: 'Lieferrouten', icon: '🚚' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'text-wood-800 hover:bg-wood-50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>

        {/* Zones Tab */}
        {activeTab === 'zones' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allZones.map((zone) => (
              <div 
                key={zone.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-200"
              >
                {/* Zone Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-primary-700">{zone.name}</h3>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    zone.fee === 0 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {zone.fee === 0 ? 'Kostenlos' : `${zone.fee}€`}
                  </div>
                </div>

                {/* Delivery Time */}
                <div className="flex items-center mb-3">
                  <span className="text-gray-600 mr-2">⏰</span>
                  <span className="text-wood-800 font-medium">{zone.deliveryTime}</span>
                </div>

                {/* Min Order */}
                <div className="flex items-center mb-3">
                  <span className="text-gray-600 mr-2">📦</span>
                  <span className="text-wood-800">
                    Ab {zone.minOrder || 0} Raummeter
                  </span>
                </div>

                {/* Areas */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-primary-700 mb-2">Stadtteile:</h4>
                  <div className="flex flex-wrap gap-1">
                    {zone.areas && Array.isArray(zone.areas) && zone.areas.slice(0, 3).map((area, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-wood-50 text-wood-800 text-xs rounded"
                      >
                        {area}
                      </span>
                    ))}
                    {zone.areas && zone.areas.length > 3 && (
                      <span className="px-2 py-1 bg-wood-50 text-wood-800 text-xs rounded">
                        +{zone.areas.length - 3} weitere
                      </span>
                    )}
                  </div>
                </div>

                {/* Special Notes */}
                {zone.specialNotes && (
                  <div className="bg-wood-50 rounded-lg p-3">
                    <p className="text-sm text-wood-800">
                      💡 {zone.specialNotes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Routes Tab */}
        {activeTab === 'routes' && (
          <div className="space-y-6">
            {allRoutes.map((route) => (
              <div 
                key={route.id}
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
              >
                <div className="grid md:grid-cols-4 gap-6">
                  {/* Route Info */}
                  <div>
                    <h3 className="text-xl font-bold text-primary-700 mb-2">{route.name}</h3>
                    <div className="flex items-center text-wood-800">
                      <span className="mr-2">🚚</span>
                      <span>Lieferroute</span>
                    </div>
                  </div>

                  {/* Days */}
                  <div>
                    <h4 className="font-semibold text-primary-700 mb-2">Liefertage</h4>
                    <div className="space-y-1">
                      {route.days.map((day, index) => (
                        <div key={index} className="text-sm text-wood-800">
                          📅 {day}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div>
                    <h4 className="font-semibold text-primary-700 mb-2">Zeitfenster</h4>
                    <div className="space-y-1">
                      {route.timeSlots.map((slot, index) => (
                        <div key={index} className="text-sm text-wood-800">
                          ⏰ {slot}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Zones */}
                  <div>
                    <h4 className="font-semibold text-primary-700 mb-2">Lieferzonen</h4>
                    <div className="space-y-1">
                      {route.zones.map((zoneId) => {
                        const zone = allZones.find(z => z.id === zoneId);
                        return zone ? (
                          <div key={zoneId} className="text-sm text-wood-800">
                            📍 {zone.name}
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}


        {/* Service Features */}
        <div className="mt-12 grid md:grid-cols-4 gap-6">
          <div className="text-center bg-white rounded-lg shadow-lg p-6">
            <div className="text-3xl mb-3">🚚</div>
            <h4 className="font-semibold text-primary-700 mb-2">Flexible Lieferung</h4>
            <p className="text-sm text-wood-800">Anpassung an Ihre Wünsche</p>
          </div>
          
          <div className="text-center bg-white rounded-lg shadow-lg p-6">
            <div className="text-3xl mb-3">📱</div>
            <h4 className="font-semibold text-primary-700 mb-2">Live-Tracking</h4>
            <p className="text-sm text-wood-800">Verfolgen Sie Ihre Lieferung</p>
          </div>
          
          <div className="text-center bg-white rounded-lg shadow-lg p-6">
            <div className="text-3xl mb-3">🏠</div>
            <h4 className="font-semibold text-primary-700 mb-2">Bis zur Haustür</h4>
            <p className="text-sm text-wood-800">Bequeme Anlieferung</p>
          </div>
          
          <div className="text-center bg-white rounded-lg shadow-lg p-6">
            <div className="text-3xl mb-3">⚡</div>
            <h4 className="font-semibold text-primary-700 mb-2">Express möglich</h4>
            <p className="text-sm text-wood-800">Schnelle Notfall-Lieferung</p>
          </div>
        </div>
      </div>
    </section>
  );
}