'use client';

import React from 'react';

interface LocalKeywordOptimizerProps {
  cityName: string;
  postalCodes?: string[];
  serviceAreas?: string[];
  localKeywords?: string[];
  children: React.ReactNode;
  className?: string;
}

// Lokale Keyword-Variationen für bessere SEO
const generateLocalKeywords = (cityName: string, postalCodes?: string[], serviceAreas?: string[]) => {
  const baseKeywords = [
    `Brennholz ${cityName}`,
    `Kaminholz ${cityName}`,
    `Holz kaufen ${cityName}`,
    `Brennholz liefern ${cityName}`,
    `Kaminholz bestellen ${cityName}`,
    `Brennholz Händler ${cityName}`,
    `Ofenholz ${cityName}`,
    `Feuerholz ${cityName}`,
    `Brennholz Service ${cityName}`,
    `Holzlieferung ${cityName}`
  ];

  // PLZ-spezifische Keywords hinzufügen
  if (postalCodes && postalCodes.length > 0) {
    postalCodes.forEach(plz => {
      baseKeywords.push(
        `Brennholz ${plz}`,
        `Kaminholz ${plz}`,
        `Holzlieferung ${plz}`
      );
    });
  }

  // Servicegebiet-spezifische Keywords
  if (serviceAreas && serviceAreas.length > 0) {
    serviceAreas.forEach(area => {
      baseKeywords.push(
        `Brennholz ${area}`,
        `Kaminholz ${area}`,
        `Holz kaufen ${area}`
      );
    });
  }

  return baseKeywords;
};

// Lokale Modifikatoren für natürliche Keyword-Integration
const localModifiers = [
  'in der Region',
  'vor Ort',
  'regional',
  'lokal',
  'in Ihrer Nähe',
  'aus der Umgebung',
  'direkt zu Ihnen',
  'in Ihrem Gebiet'
];

// Qualitäts- und Service-Keywords
const qualityKeywords = [
  'Premium',
  'hochwertig',
  'trocken',
  'kammergetrocknet',
  'ofenfertig',
  'scheitholz',
  'hartholz',
  'buche',
  'eiche',
  'birke'
];

const LocalKeywordOptimizer: React.FC<LocalKeywordOptimizerProps> = ({
  cityName,
  postalCodes,
  serviceAreas,
  localKeywords,
  children,
  className = ''
}) => {
  const generatedKeywords = generateLocalKeywords(cityName, postalCodes, serviceAreas);
  const allKeywords = [...generatedKeywords, ...(localKeywords || [])];

  return (
    <div className={`local-keyword-optimized ${className}`}>
      {/* Versteckte Keywords für SEO (nicht sichtbar für Nutzer) */}
      <div className="sr-only" aria-hidden="true">
        <span>{allKeywords.join(', ')}</span>
        <span>{qualityKeywords.map(keyword => `${keyword} Brennholz ${cityName}`).join(', ')}</span>
        <span>{localModifiers.map(modifier => `Brennholz ${modifier} ${cityName}`).join(', ')}</span>
      </div>

      {/* Sichtbarer Content */}
      {children}

      {/* Lokale Keyword-Integration als strukturierte Daten */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": `Brennholz Service ${cityName}`,
            "description": `Premium Brennholz und Kaminholz Lieferung in ${cityName} und Umgebung`,
            "serviceType": "Brennholz Lieferung",
            "areaServed": {
              "@type": "City",
              "name": cityName,
              "postalCode": postalCodes?.join(', ') || undefined
            },
            "keywords": allKeywords.slice(0, 10).join(', '), // Top 10 Keywords
            "offers": {
              "@type": "Offer",
              "description": `Brennholz Lieferung in ${cityName}`,
              "areaServed": serviceAreas?.map(area => ({
                "@type": "Place",
                "name": area
              })) || undefined
            }
          })
        }}
      />
    </div>
  );
};

export default LocalKeywordOptimizer;