'use client';

import { useEffect, useState, useRef } from 'react';

interface LocalServiceArea {
  name: string;
  category: string;
  title: string;
  description: string;
  badge: string;
  cta_text?: string;
}

interface LocalServiceBenefit {
  title: string;
  description: string;
}

interface LocalServiceSectionProps {
  cityName: string;
  title?: string;
  subtitle?: string;
  description?: string;
  serviceAreas?: LocalServiceArea[];
  expertiseTitle?: string;
  expertiseDescription?: string;
  expertiseBenefits?: LocalServiceBenefit[];
  localRootedTitle?: string;
  localRootedDescription?: string;
  expertiseImageUrl?: string;
  compact?: boolean;
  maxAreas?: number;
}

export default function LocalServiceSection({
  cityName,
  title = `Brennholz-Service in ${cityName}`,
  subtitle = `Entdecken Sie, warum wir der bevorzugte Brennholz-Lieferant in ${cityName} und Umgebung sind. Lokale Expertise trifft auf erstklassigen Service.`,
  description = '',
  serviceAreas = [
    {
      name: `Stadtzentrum ${cityName}`,
      category: 'Zentrale Lage',
      title: `Stadtzentrum ${cityName}`,
      description: `Das historische Zentrum von ${cityName} mit seinen charakteristischen Gebäuden und der lebendigen Atmosphäre. Hier liefern wir besonders gerne unser Premium-Brennholz für gemütliche Abende.`,
      badge: 'Hauptliefergebiet für Brennholz',
      cta_text: 'Mehr erfahren'
    },
    {
      name: `Wohngebiete ${cityName}`,
      category: 'Stadtgebiet',
      title: `Wohngebiete ${cityName}`,
      description: `Die ruhigen Wohnviertel von ${cityName} mit ihren Einfamilienhäusern und Gärten. Perfekt für unsere Brennholz-Lieferungen direkt vor die Haustür.`,
      badge: 'Beliebtes Liefergebiet',
      cta_text: 'Mehr erfahren'
    },
    {
      name: `Umgebung ${cityName}`,
      category: 'Umland',
      title: `Umgebung ${cityName}`,
      description: `Die malerische Umgebung von ${cityName} mit Wäldern und Naturgebieten. Hier stammt unser nachhaltiges Brennholz aus regionaler Forstwirtschaft.`,
      badge: 'Nachhaltige Holzgewinnung',
      cta_text: 'Mehr erfahren'
    }
  ],
  expertiseTitle = `Ihr lokaler Brennholz-Experte in ${cityName}`,
  expertiseDescription = `Wir kennen ${cityName} wie unsere Westentasche und wissen genau, was unsere Kunden vor Ort brauchen.`,
  expertiseBenefits = [
    {
      title: 'Lokale Präsenz',
      description: `Wir sind fest in ${cityName} verwurzelt und kennen jeden Winkel der Stadt.`
    },
    {
      title: 'Regionales Holz',
      description: `Unser Brennholz stammt aus den Wäldern rund um ${cityName}.`
    },
    {
      title: 'Schnelle Lieferung',
      description: `Kurze Wege bedeuten schnelle Lieferung direkt zu Ihnen nach ${cityName}.`
    }
  ],
  localRootedTitle = `Lokal verwurzelt in ${cityName}`,
  localRootedDescription = `Seit Jahren vertrauen Kunden in ${cityName} auf unsere Qualität und unseren Service.`
  ,expertiseImageUrl,
  compact = true,
  maxAreas = 3
}: LocalServiceSectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const safeServiceAreasBase = Array.isArray(serviceAreas) ? serviceAreas : [];
  const safeServiceAreas = safeServiceAreasBase.slice(0, Math.max(0, maxAreas));
  const safeExpertiseBenefits = Array.isArray(expertiseBenefits) ? expertiseBenefits : [];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="py-20 px-4 bg-gradient-to-b from-wood-50 to-pergament"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="inline-flex items-center bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            LOKALER SERVICE
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-primary-700 mb-6">
            {title}
          </h2>
          
          {!compact && (
            <p className="text-xl text-wood-800 max-w-4xl mx-auto leading-relaxed">
              {subtitle}
            </p>
          )}
          
          {description && !compact && (
            <div className="mt-6 prose prose-lg max-w-4xl mx-auto text-wood-700"
                 dangerouslySetInnerHTML={{ __html: description }} />
          )}
        </div>

        {/* Service Areas */}
        <div className={`grid md:grid-cols-3 gap-8 mb-16 transition-all duration-1000 delay-300 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          {safeServiceAreas.map((area, index) => (
            <div 
              key={index}
              className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group"
            >
              {/* Category Badge */}
              <div className="inline-flex items-center bg-wood-100 text-wood-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                {area.category}
              </div>
              
              {/* Area Badge */}
              <div className="inline-flex items-center bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-xs font-medium mb-4 ml-2">
                {area.badge}
              </div>
              
              <h3 className="text-xl font-bold text-primary-700 mb-4 group-hover:text-primary-600 transition-colors">
                {area.title}
              </h3>
              
  <p className="text-wood-700 leading-relaxed mb-6">
    {area.description}
  </p>
  
            </div>
          ))}
        </div>

        {!compact && (
        <div className={`bg-white rounded-3xl shadow-xl p-8 lg:p-12 transition-all duration-1000 delay-500 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div>
              <div className="inline-flex items-center bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                LOKALE EXPERTISE
              </div>
              
              <h3 className="text-3xl md:text-4xl font-bold text-primary-700 mb-6">
                {expertiseTitle}
              </h3>
              
              <p className="text-xl text-wood-800 mb-8 leading-relaxed">
                {expertiseDescription}
              </p>
              
              {/* Benefits */}
              <div className="space-y-6">
                {safeExpertiseBenefits.map((benefit, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary-700 mb-2">{benefit.title}</h4>
                      <p className="text-wood-700">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Visual Element */}
            <div className="relative">
              {expertiseImageUrl ? (
                <div className="relative overflow-hidden rounded-2xl shadow-lg">
                  <img src={expertiseImageUrl} alt="Lokale Expertise" className="w-full h-96 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              ) : (
                <div className="bg-gradient-to-br from-wood-50 via-pergament to-wood-100 rounded-2xl p-8 text-center relative border border-wood-200 shadow-medium">
                  <div className="relative z-10">
                    <div className="w-24 h-24 bg-gradient-to-br from-brennholz-rot to-primary-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-strong">
                      <svg className="w-12 h-12 text-pergament" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h4 className="text-2xl font-bold text-brennholz-rot mb-4 font-heading">
                      {localRootedTitle}
                    </h4>
                    <p className="text-holz-braun font-medium leading-relaxed">
                      {localRootedDescription}
                    </p>
                    <div className="flex justify-center mt-6 space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full opacity-60"></div>
                      <div className="w-2 h-2 bg-flammen-orange rounded-full opacity-60"></div>
                      <div className="w-2 h-2 bg-gold rounded-full opacity-60"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        )}
      </div>
    </section>
  );
}