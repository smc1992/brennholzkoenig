'use client';

import { useState } from 'react';

interface ServiceArea {
  name: string;
  postalCodes: string[];
  deliveryTime: string;
  specialNotes?: string;
  landmarks?: string[];
  neighborhoods?: string[];
}

interface DatabaseServiceArea {
  id: string;
  name: string;
  description: string;
  postal_codes: string[];
  delivery_time: string;
}

interface ServiceAreaDetailsSectionProps {
  cityName: string;
  serviceAreas?: DatabaseServiceArea[];
  postalCodes?: string[];
}

export default function ServiceAreaDetailsSection({ 
  cityName, 
  serviceAreas = [],
  postalCodes = []
}: ServiceAreaDetailsSectionProps) {
  const [selectedArea, setSelectedArea] = useState<number | null>(null);

  // Fallback-Servicegebiete basierend auf der Stadt
  const defaultServiceAreas: ServiceArea[] = [
    {
      name: `${cityName} Zentrum`,
      postalCodes: (postalCodes && Array.isArray(postalCodes) && postalCodes.length > 0) ? [postalCodes[0]] : ['12345'],
      deliveryTime: 'Gleicher Tag möglich',
      specialNotes: 'Bevorzugtes Liefergebiet mit flexiblen Zeiten',
      landmarks: ['Rathaus', 'Hauptbahnhof', 'Marktplatz'],
      neighborhoods: ['Altstadt', 'Fußgängerzone', 'Geschäftsviertel']
    },
    {
      name: `${cityName} Nord`,
      postalCodes: (postalCodes && Array.isArray(postalCodes) && postalCodes.length > 1) ? [postalCodes[1]] : ['12346'],
      deliveryTime: 'Innerhalb 24 Stunden',
      specialNotes: 'Ruhige Wohngebiete mit Einfamilienhäusern',
      landmarks: ['Nordpark', 'Sportzentrum'],
      neighborhoods: ['Neubaugebiet', 'Villenviertel', 'Familienstraßen']
    },
    {
      name: `${cityName} Süd`,
      postalCodes: (postalCodes && Array.isArray(postalCodes) && postalCodes.length > 2) ? [postalCodes[2]] : ['12347'],
      deliveryTime: 'Innerhalb 24 Stunden',
      specialNotes: 'Gemischte Wohn- und Gewerbegebiete',
      landmarks: ['Industriegebiet', 'Einkaufszentrum'],
      neighborhoods: ['Gewerbepark', 'Wohnsiedlung', 'Einzelhandel']
    },
    {
      name: `${cityName} Umland`,
      postalCodes: (postalCodes && Array.isArray(postalCodes) && postalCodes.length > 3) ? postalCodes.slice(3) : ['12348', '12349'],
      deliveryTime: '1-2 Werktage',
      specialNotes: 'Ländliche Gebiete und Außenbezirke',
      landmarks: ['Waldgebiete', 'Landwirtschaft'],
      neighborhoods: ['Dörfer', 'Einzelhöfe', 'Naturgebiete']
    }
  ];

  // Konvertiere Database-Format zu Component-Format
  const convertedServiceAreas: ServiceArea[] = serviceAreas.map(area => ({
    name: area.name,
    postalCodes: area.postal_codes,
    deliveryTime: area.delivery_time,
    specialNotes: area.description,
    landmarks: [], // Wird aus description extrahiert oder leer gelassen
    neighborhoods: [] // Wird aus description extrahiert oder leer gelassen
  }));

  const displayAreas = convertedServiceAreas.length > 0 ? convertedServiceAreas : defaultServiceAreas;

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-pergament to-wood-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-700 mb-4">
            Unsere Servicegebiete in {cityName}
          </h2>
          <p className="text-lg text-wood-800 max-w-3xl mx-auto">
            Wir liefern hochwertiges Brennholz in alle Stadtteile von {cityName} und Umgebung. 
            Entdecken Sie unsere detaillierten Liefergebiete und -zeiten.
          </p>
        </div>

        {/* Service Area Overview Map */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <h3 className="text-2xl font-bold text-primary-700 mb-6 text-center">
            Liefergebiete auf einen Blick
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {displayAreas.map((area, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer ${
                  selectedArea === index 
                    ? 'border-primary-500 bg-wood-50' 
                    : 'border-gray-200 hover:border-primary-300'
                }`}
                onClick={() => setSelectedArea(selectedArea === index ? null : index)}
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-wood-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-primary-700 mb-1">{area.name}</h4>
                  <p className="text-sm text-wood-800">{area.deliveryTime}</p>
                  <div className="text-xs text-gray-600 mt-2">
                    {area.postalCodes.join(', ')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Area Information */}
          {selectedArea !== null && (
            <div className="bg-wood-50 rounded-xl p-6 border border-gray-200">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xl font-bold text-primary-700 mb-4">
                    {displayAreas[selectedArea].name}
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-primary-700">Lieferzeit: </span>
                      <span className="text-wood-800">{displayAreas[selectedArea].deliveryTime}</span>
                    </div>
                    
                    <div>
                      <span className="font-medium text-primary-700">Postleitzahlen: </span>
                      <span className="text-wood-800">{displayAreas[selectedArea].postalCodes.join(', ')}</span>
                    </div>
                    
                    {displayAreas[selectedArea].specialNotes && (
                      <div>
                        <span className="font-medium text-primary-700">Besonderheiten: </span>
                        <span className="text-wood-800">{displayAreas[selectedArea].specialNotes}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  {displayAreas[selectedArea].landmarks && (
                    <div className="mb-4">
                      <h5 className="font-medium text-primary-700 mb-2">Bekannte Orte:</h5>
                      <div className="flex flex-wrap gap-2">
                        {displayAreas[selectedArea].landmarks!.map((landmark, idx) => (
                          <span 
                            key={idx}
                            className="bg-white px-3 py-1 rounded-full text-sm text-wood-800 border border-gray-200"
                          >
                            {landmark}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {displayAreas[selectedArea].neighborhoods && (
                    <div>
                      <h5 className="font-medium text-primary-700 mb-2">Stadtteile:</h5>
                      <div className="flex flex-wrap gap-2">
                        {displayAreas[selectedArea].neighborhoods!.map((neighborhood, idx) => (
                          <span 
                            key={idx}
                            className="bg-wood-100 px-3 py-1 rounded-full text-sm text-wood-800"
                          >
                            {neighborhood}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Delivery Information Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-primary-700 mb-3 text-center">
              Schnelle Lieferung
            </h3>
            <p className="text-wood-800 text-center">
              In {cityName} Zentrum liefern wir oft noch am selben Tag. 
              Alle anderen Gebiete erreichen wir innerhalb von 24-48 Stunden.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-primary-700 mb-3 text-center">
              Lokale Expertise
            </h3>
            <p className="text-wood-800 text-center">
              Unsere Fahrer kennen {cityName} wie ihre Westentasche und finden 
              immer den besten Weg zu Ihnen.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-primary-700 mb-3 text-center">
              Flexible Zeiten
            </h3>
            <p className="text-wood-800 text-center">
              Wir passen uns Ihrem Zeitplan an und liefern auch außerhalb 
              der regulären Geschäftszeiten.
            </p>
          </div>
        </div>

        {/* Postal Code Checker */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-white">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">
              Prüfen Sie Ihr Liefergebiet in {cityName}
            </h3>
            <p className="text-wood-100 mb-6">
              Geben Sie Ihre Postleitzahl ein, um genaue Lieferzeiten und -kosten zu erfahren.
            </p>
            
            <div className="max-w-md mx-auto flex gap-3">
              <input 
                type="text" 
                placeholder="Ihre PLZ eingeben..."
                className="flex-1 px-4 py-3 rounded-lg text-primary-700 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <button className="bg-white text-primary-700 px-6 py-3 rounded-lg font-semibold hover:bg-wood-50 transition-colors duration-300">
                Prüfen
              </button>
            </div>
            
            <p className="text-sm text-gray-200 mt-4">
              Alle Postleitzahlen in {cityName}: {postalCodes.length > 0 ? postalCodes.join(', ') : 'Wird geladen...'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}