'use client';

import { useState, useEffect } from 'react';

interface SeasonalEvent {
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
}

// Datenbank-Interface für die neuen Props
interface DatabaseSeasonalEvent {
  title: string;
  description: string;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  month: number;
  type: 'festival' | 'market' | 'tradition' | 'weather' | 'special_offer';
  icon: string;
  relevant_products?: string[];
  special_offer?: {
    discount: number;
    description: string;
    valid_until: string;
  };
}

interface SeasonalEventsSectionProps {
  cityName: string;
  customEvents?: SeasonalEvent[];
  seasonalEvents?: DatabaseSeasonalEvent[];
}

export default function SeasonalEventsSection({ 
  cityName, 
  customEvents = [],
  seasonalEvents = []
}: SeasonalEventsSectionProps) {
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedSeason, setSelectedSeason] = useState<string>('current');

  // Fallback saisonale Events für bessere lokale Relevanz
  const defaultEvents: SeasonalEvent[] = [
    {
      id: '1',
      title: `Frühjahrsputz in ${cityName}`,
      description: `Die traditionelle Frühjahrsputz-Zeit in ${cityName} ist die perfekte Gelegenheit, den Garten winterfest zu machen und sich mit frischem Brennholz für die nächste Saison einzudecken.`,
      season: 'spring',
      month: 3,
      type: 'tradition',
      icon: '🌸',
      relevantProducts: ['Anmachholz', 'Kaminholz'],
      specialOffer: {
        discount: 10,
        description: 'Frühjahrs-Rabatt auf alle Bestellungen',
        validUntil: '31.05.'
      }
    },
    {
      id: '2',
      title: `Stadtfest ${cityName}`,
      description: `Während des großen Stadtfests in ${cityName} sorgen wir für gemütliche Lagerfeuer-Atmosphäre. Perfekt für gesellige Abende im Freien.`,
      season: 'summer',
      month: 7,
      type: 'festival',
      icon: '🎪',
      relevantProducts: ['Grillholz', 'Lagerfeuerholz']
    },
    {
      id: '3',
      title: `Herbstmarkt ${cityName}`,
      description: `Der traditionelle Herbstmarkt in ${cityName} läutet die Heizsaison ein. Jetzt ist die beste Zeit, sich mit qualitativem Brennholz einzudecken.`,
      season: 'autumn',
      month: 10,
      type: 'market',
      icon: '🍂',
      relevantProducts: ['Buche', 'Eiche', 'Birke'],
      specialOffer: {
        discount: 15,
        description: 'Herbst-Aktion: Früh bestellen und sparen',
        validUntil: '30.11.'
      }
    },
    {
      id: '4',
      title: `Weihnachtsmarkt ${cityName}`,
      description: `Die gemütliche Weihnachtszeit in ${cityName} wird noch schöner mit dem warmen Schein eines Kaminfeuers. Sorgen Sie für die perfekte Atmosphäre.`,
      season: 'winter',
      month: 12,
      type: 'festival',
      icon: '🎄',
      relevantProducts: ['Kaminholz', 'Anmachholz'],
      specialOffer: {
        discount: 20,
        description: 'Weihnachts-Special: Gemütlichkeit zum Sparpreis',
        validUntil: '24.12.'
      }
    },
    {
      id: '5',
      title: `Kältewelle in ${cityName}`,
      description: `Bei den typischen Kältewellen im Winter ist ${cityName} auf zuverlässige Heizung angewiesen. Unser Express-Service sorgt für warme Stuben.`,
      season: 'winter',
      month: 1,
      type: 'weather',
      icon: '❄️',
      relevantProducts: ['Express-Lieferung', 'Hartholz']
    },
    {
      id: '6',
      title: `Osterfeuer ${cityName}`,
      description: `Das traditionelle Osterfeuer in ${cityName} und den umliegenden Gemeinden benötigt hochwertiges Brennholz für ein perfektes Feuer.`,
      season: 'spring',
      month: 4,
      type: 'tradition',
      icon: '🔥',
      relevantProducts: ['Osterfeuer-Holz', 'Anmachholz']
    },
    {
      id: '7',
      title: `Grillsaison ${cityName}`,
      description: `Die Grillsaison in ${cityName} beginnt! Unser spezielles Grillholz sorgt für den perfekten Geschmack bei Ihren Gartenfesten.`,
      season: 'summer',
      month: 5,
      type: 'tradition',
      icon: '🔥',
      relevantProducts: ['Grillholz', 'Räucherholz']
    },
    {
      id: '8',
      title: `Erntedankfest ${cityName}`,
      description: `Zum Erntedankfest in ${cityName} feiern wir die Verbundenheit zur Natur. Unser regional geschlagenes Holz ist Teil dieser Tradition.`,
      season: 'autumn',
      month: 9,
      type: 'tradition',
      icon: '🌾',
      relevantProducts: ['Regionales Holz', 'Buche']
    }
  ];

  // Konvertiere Datenbank-Daten zu Komponenten-Format
  const convertedEvents: SeasonalEvent[] = seasonalEvents.map((event, index) => ({
    id: (index + 1).toString(),
    title: event.title,
    description: event.description,
    season: event.season,
    month: event.month,
    type: event.type,
    icon: event.icon,
    relevantProducts: event.relevant_products,
    specialOffer: event.special_offer ? {
      discount: event.special_offer.discount,
      description: event.special_offer.description,
      validUntil: event.special_offer.valid_until
    } : undefined
  }));

  // Verwende editierbare Daten falls vorhanden, sonst Fallback zu Standard-Daten
  const allEvents = convertedEvents.length > 0 ? convertedEvents : 
                    customEvents.length > 0 ? customEvents : defaultEvents;

  const getCurrentSeason = (month: number): string => {
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
  };

  const getSeasonName = (season: string): string => {
    const names = {
      spring: 'Frühling',
      summer: 'Sommer',
      autumn: 'Herbst',
      winter: 'Winter'
    };
    return names[season as keyof typeof names] || season;
  };

  const getSeasonColor = (season: string): string => {
    const colors = {
      spring: 'bg-green-100 text-green-700',
      summer: 'bg-yellow-100 text-yellow-700',
      autumn: 'bg-orange-100 text-orange-700',
      winter: 'bg-blue-100 text-blue-700'
    };
    return colors[season as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const getFilteredEvents = () => {
    if (selectedSeason === 'current') {
      const currentSeasonName = getCurrentSeason(currentMonth);
      return allEvents.filter(event => 
        event.season === currentSeasonName || 
        Math.abs(event.month - currentMonth) <= 1
      );
    }
    if (selectedSeason === 'all') return allEvents;
    return allEvents.filter(event => event.season === selectedSeason);
  };

  const getEventTypeIcon = (type: string): string => {
    const icons = {
      festival: '🎉',
      market: '🏪',
      tradition: '🏛️',
      weather: '🌤️',
      special_offer: '💰'
    };
    return icons[type as keyof typeof icons] || '📅';
  };

  const isEventCurrent = (event: SeasonalEvent): boolean => {
    return Math.abs(event.month - currentMonth) <= 1;
  };

  const seasons = [
    { id: 'current', name: 'Aktuell', icon: '📅' },
    { id: 'spring', name: 'Frühling', icon: '🌸' },
    { id: 'summer', name: 'Sommer', icon: '☀️' },
    { id: 'autumn', name: 'Herbst', icon: '🍂' },
    { id: 'winter', name: 'Winter', icon: '❄️' },
    { id: 'all', name: 'Alle', icon: '🗓️' }
  ];

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-white to-wood-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-700 mb-4">
            Saisonale Highlights in {cityName}
          </h2>
          <p className="text-lg text-wood-800 max-w-3xl mx-auto">
            Das ganze Jahr über begleiten wir Sie mit passenden Brennholz-Angeboten 
            zu den besonderen Ereignissen und Traditionen in {cityName}.
          </p>
        </div>

        {/* Current Month Indicator */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center bg-wood-100 rounded-full px-6 py-3">
            <span className="text-2xl mr-3">📅</span>
            <span className="text-primary-700 font-semibold">
              Aktuell: {new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Season Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {seasons.map((season) => (
            <button
              key={season.id}
              onClick={() => setSelectedSeason(season.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedSeason === season.id
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'bg-white text-primary-600 hover:bg-wood-50 border border-gray-200'
              }`}
            >
              <span className="mr-2">{season.icon}</span>
              {season.name}
            </button>
          ))}
        </div>

        {/* Events Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {getFilteredEvents().map((event) => (
            <div 
              key={event.id}
              className={`bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border-l-4 ${
                isEventCurrent(event) ? 'border-primary-500' : 'border-gray-200'
              }`}
            >
              {/* Event Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <span className="text-3xl mr-3">{event.icon}</span>
                  <div>
                    <h3 className="text-lg font-bold text-primary-700">{event.title}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeasonColor(event.season)}`}>
                        {getSeasonName(event.season)}
                      </span>
                      <span className="text-xs text-gray-600">
                        {getEventTypeIcon(event.type)} {new Date(2024, event.month - 1).toLocaleDateString('de-DE', { month: 'long' })}
                      </span>
                    </div>
                  </div>
                </div>
                {isEventCurrent(event) && (
                  <div className="bg-primary-500 text-white text-xs px-2 py-1 rounded-full">
                    Aktuell
                  </div>
                )}
              </div>

              {/* Event Description */}
              <p className="text-wood-800 text-sm leading-relaxed mb-4">
                {event.description}
              </p>

              {/* Relevant Products */}
              {event.relevantProducts && event.relevantProducts.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-primary-700 mb-2">Passende Produkte:</h4>
                  <div className="flex flex-wrap gap-1">
                    {event.relevantProducts.map((product, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-wood-50 text-primary-600 text-xs rounded"
                      >
                        {product}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Special Offer */}
              {event.specialOffer && (
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-4 text-white">
                  <div className="flex items-center mb-2">
                    <span className="text-lg mr-2">🎁</span>
                    <span className="font-semibold">{event.specialOffer.discount}% Rabatt</span>
                  </div>
                  <p className="text-sm text-wood-100 mb-2">
                    {event.specialOffer.description}
                  </p>
                  <p className="text-xs text-gray-200">
                    Gültig bis {event.specialOffer.validUntil}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Seasonal Tips */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-6 text-center">
            Saisonale Tipps für {cityName}
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-white bg-opacity-20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌸</span>
              </div>
              <h4 className="font-semibold mb-2">Frühling</h4>
              <p className="text-wood-100 text-sm">
                Jetzt für die nächste Saison bevorraten und von Frühjahrspreisen profitieren
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-white bg-opacity-20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">☀️</span>
              </div>
              <h4 className="font-semibold mb-2">Sommer</h4>
              <p className="text-wood-100 text-sm">
                Grillholz und Lagerfeuer-Holz für gesellige Abende im Freien
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-white bg-opacity-20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🍂</span>
              </div>
              <h4 className="font-semibold mb-2">Herbst</h4>
              <p className="text-wood-100 text-sm">
                Hauptsaison für Brennholz-Bestellungen - rechtzeitig eindecken
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-white bg-opacity-20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">❄️</span>
              </div>
              <h4 className="font-semibold mb-2">Winter</h4>
              <p className="text-wood-100 text-sm">
                Express-Service für spontane Bestellungen bei Kältewellen
              </p>
            </div>
          </div>
        </div>

        {/* Local Weather Integration */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-primary-700 mb-6 text-center">
            Wetter-Service für {cityName}
          </h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌡️</span>
              </div>
              <h4 className="font-semibold text-primary-700 mb-2">Temperatur-Alarm</h4>
              <p className="text-wood-800 text-sm">
                Bei Kältewellen unter -5°C bieten wir Express-Lieferungen an
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌨️</span>
              </div>
              <h4 className="font-semibold text-primary-700 mb-2">Schnee-Service</h4>
              <p className="text-wood-800 text-sm">
                Auch bei Schnee liefern wir zuverlässig in alle Stadtteile
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔥</span>
              </div>
              <h4 className="font-semibold text-primary-700 mb-2">Heiz-Tipps</h4>
              <p className="text-wood-800 text-sm">
                Persönliche Beratung für optimales Heizen je nach Wetterlage
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}