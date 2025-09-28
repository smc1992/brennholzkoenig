'use client';

import { useState } from 'react';

interface LocalLandmarksSectionProps {
  cityName: string;
  landmarks?: {
    name: string;
    description: string;
    imageUrl?: string;
    distance?: string;
    relevance?: string;
  }[];
}

export default function LocalLandmarksSection({ 
  cityName, 
  landmarks = [] 
}: LocalLandmarksSectionProps) {
  const [selectedLandmark, setSelectedLandmark] = useState<number | null>(null);

  // Fallback-Wahrzeichen für bessere Local SEO wenn keine spezifischen Daten vorhanden
  const defaultLandmarks = [
    {
      name: `Stadtzentrum ${cityName}`,
      description: `Das historische Zentrum von ${cityName} mit seinen charakteristischen Gebäuden und der lebendigen Atmosphäre. Hier liefern wir besonders gerne unser Premium-Brennholz für gemütliche Abende.`,
      imageUrl: undefined,
      distance: "Zentrale Lage",
      relevance: "Hauptliefergebiet für Brennholz"
    },
    {
      name: `Wohngebiete ${cityName}`,
      description: `Die ruhigen Wohnviertel von ${cityName} mit ihren Einfamilienhäusern und Gärten. Perfekt für unsere Brennholz-Lieferungen direkt vor die Haustür.`,
      imageUrl: undefined,
      distance: "Stadtgebiet",
      relevance: "Beliebtes Liefergebiet"
    },
    {
      name: `Umgebung ${cityName}`,
      description: `Die malerische Umgebung von ${cityName} mit Wäldern und Naturgebieten. Hier stammt unser nachhaltiges Brennholz aus regionaler Forstwirtschaft.`,
      imageUrl: undefined,
      distance: "Umland",
      relevance: "Nachhaltige Holzgewinnung"
    }
  ];

  const displayLandmarks = landmarks.length > 0 ? landmarks : defaultLandmarks;

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-pergament to-wood-100">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-700 mb-4">
            Brennholz-Service in {cityName}
          </h2>
          <p className="text-lg text-wood-800 max-w-3xl mx-auto">
            Entdecken Sie, warum wir der bevorzugte Brennholz-Lieferant in {cityName} und Umgebung sind. 
            Lokale Expertise trifft auf erstklassigen Service.
          </p>
        </div>

        {/* Landmarks Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {displayLandmarks.map((landmark, index) => (
            <div 
              key={index}
              className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 cursor-pointer transform hover:scale-105 ${
                selectedLandmark === index ? 'ring-2 ring-primary-500' : ''
              }`}
              onClick={() => setSelectedLandmark(selectedLandmark === index ? null : index)}
            >
              {/* Landmark Image */}
              <div className="relative h-48 bg-gradient-to-br from-wood-100 to-wood-200">
                {landmark.imageUrl ? (
                  <img 
                    src={landmark.imageUrl} 
                    alt={landmark.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-wood-800">
                      <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm font-medium">{landmark.name}</p>
                    </div>
                  </div>
                )}
                
                {/* Distance Badge */}
                {landmark.distance && (
                  <div className="absolute top-3 right-3 bg-primary-700 text-white px-2 py-1 rounded-full text-xs font-medium">
                    {landmark.distance}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-primary-700 mb-2">
                  {landmark.name}
                </h3>
                
                <p className="text-wood-800 text-sm mb-3 line-clamp-3">
                  {landmark.description}
                </p>

                {landmark.relevance && (
                  <div className="flex items-center text-xs text-gray-600">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {landmark.relevance}
                  </div>
                )}

                {/* Expand Indicator */}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-gray-600 text-sm">
                    {selectedLandmark === index ? 'Weniger anzeigen' : 'Mehr erfahren'}
                  </span>
                  <svg 
                    className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${
                      selectedLandmark === index ? 'rotate-180' : ''
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expanded Content */}
              {selectedLandmark === index && (
                <div className="px-6 pb-6 border-t border-gray-200">
                  <div className="pt-4">
                    <h4 className="font-semibold text-primary-700 mb-2">
                      Warum wir hier besonders gerne liefern:
                    </h4>
                    <ul className="text-sm text-wood-800 space-y-1">
                      <li className="flex items-start">
                        <span className="text-primary-600 mr-2">•</span>
                        Kurze Anfahrtswege für frische Lieferungen
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary-600 mr-2">•</span>
                        Lokale Expertise und Ortskenntnis
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary-600 mr-2">•</span>
                        Flexible Lieferzeiten nach Ihren Wünschen
                      </li>
                      <li className="flex items-start">
                        <span className="text-gray-600 mr-2">•</span>
                        Persönlicher Service von Ihrem lokalen Team
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Local Service Highlights */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-primary-700 mb-4">
              Ihr lokaler Brennholz-Experte in {cityName}
            </h3>
            <p className="text-wood-800">
              Wir kennen {cityName} wie unsere Westentasche und wissen genau, 
              was unsere Kunden vor Ort brauchen.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-wood-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <h4 className="font-semibold text-primary-700 mb-2">Lokale Präsenz</h4>
              <p className="text-sm text-wood-800">
                Wir sind fest in {cityName} verwurzelt und kennen jeden Winkel der Stadt.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-wood-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                </svg>
              </div>
              <h4 className="font-semibold text-primary-700 mb-2">Regionales Holz</h4>
              <p className="text-sm text-wood-800">
                Unser Brennholz stammt aus den Wäldern rund um {cityName}.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-wood-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h4 className="font-semibold text-primary-700 mb-2">Schnelle Lieferung</h4>
              <p className="text-sm text-wood-800">
                Kurze Wege bedeuten schnelle Lieferung direkt zu Ihnen nach {cityName}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}