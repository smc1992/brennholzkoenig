'use client';

import React from 'react';

interface LocalContentEnhancerProps {
  cityName: string;
  postalCodes?: string[];
  serviceAreas?: string[];
  originalContent: string;
  contentType?: 'title' | 'description' | 'text';
}

// Lokale Phrasen und Modifikatoren
const localPhrases = {
  title: [
    'in {city}',
    'für {city}',
    '{city} und Umgebung',
    'Region {city}',
    'Raum {city}'
  ],
  description: [
    'in {city} und der Region',
    'für Kunden in {city}',
    'direkt nach {city}',
    'im Raum {city}',
    'in {city} und Umkreis'
  ],
  text: [
    'hier in {city}',
    'in unserer Region {city}',
    'vor Ort in {city}',
    'in {city} und den umliegenden Gemeinden',
    'regional in {city}'
  ]
};

// Brennholz-spezifische lokale Begriffe
const firewoodLocalTerms = [
  'regionaler Anbieter',
  'lokaler Brennholzhändler',
  'aus der Region',
  'heimisches Holz',
  'regionale Qualität',
  'vor Ort produziert',
  'aus nachhaltiger Forstwirtschaft der Region',
  'lokale Lieferung',
  'direkter Service'
];

const LocalContentEnhancer: React.FC<LocalContentEnhancerProps> = ({
  cityName,
  postalCodes,
  serviceAreas,
  originalContent,
  contentType = 'text'
}) => {
  
  const enhanceContent = (content: string): string => {
    let enhancedContent = content;
    
    // Lokale Phrasen basierend auf Content-Typ hinzufügen
    const phrases = localPhrases[contentType] || localPhrases.text;
    
    // Zufällige lokale Phrase auswählen
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    const localPhrase = randomPhrase.replace('{city}', cityName);
    
    // Content je nach Typ erweitern
    switch (contentType) {
      case 'title':
        // Titel mit lokaler Phrase erweitern
        if (!content.toLowerCase().includes(cityName.toLowerCase())) {
          enhancedContent = `${content} ${localPhrase}`;
        }
        break;
        
      case 'description':
        // Beschreibung mit lokaler Relevanz erweitern
        if (!content.toLowerCase().includes(cityName.toLowerCase())) {
          enhancedContent = `${content} ${localPhrase}`;
        }
        break;
        
      case 'text':
        // Text mit lokalen Begriffen anreichern
        const sentences = content.split('. ');
        if (sentences.length > 1 && !content.toLowerCase().includes(cityName.toLowerCase())) {
          // Lokale Phrase in den zweiten Satz einfügen
          sentences[1] = `${sentences[1]} ${localPhrase}`;
          enhancedContent = sentences.join('. ');
        }
        break;
    }
    
    return enhancedContent;
  };

  const enhancedContent = enhanceContent(originalContent);

  return (
    <>
      {contentType === 'title' ? (
        <span dangerouslySetInnerHTML={{ __html: enhancedContent }} />
      ) : contentType === 'description' ? (
        <p dangerouslySetInnerHTML={{ __html: enhancedContent }} />
      ) : (
        <div dangerouslySetInnerHTML={{ __html: enhancedContent }} />
      )}
      
      {/* Versteckte lokale Keywords für SEO */}
      <div className="sr-only" aria-hidden="true">
        <span>
          {firewoodLocalTerms.map(term => `${term} ${cityName}`).join(', ')}
        </span>
        {postalCodes && (
          <span>
            {postalCodes.map(plz => `Brennholz ${plz}, Kaminholz ${plz}, Holzlieferung ${plz}`).join(', ')}
          </span>
        )}
        {serviceAreas && (
          <span>
            {serviceAreas.map(area => `Brennholz ${area}, Holzservice ${area}`).join(', ')}
          </span>
        )}
      </div>
    </>
  );
};

export default LocalContentEnhancer;