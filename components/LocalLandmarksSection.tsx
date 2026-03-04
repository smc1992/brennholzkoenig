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
  const normalized = (landmarks || []).map((l: any) => ({
    name: l.name,
    description: l.description,
    imageUrl: l.imageUrl || l.image_url,
    distance: l.distance,
    relevance: l.relevance
  }));
  const [selectedLandmark, setSelectedLandmark] = useState<number | null>(null);
  // Wenn keine echten Wahrzeichen übergeben werden, rendere diese Sektion nicht,
  // um doppelte, nicht editierbare Inhalte zu vermeiden.
  const displayLandmarks = normalized.length > 0 ? normalized : [];

  if (displayLandmarks.length === 0) {
    return null;
  }

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-pergament to-wood-100">
      <div className="max-w-7xl mx-auto">
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

        {/* Entfernt: Duplizierte Local Service Highlights (nicht editierbar) */}
      </div>
    </section>
  );
}
