'use client';

import { useState } from 'react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'delivery' | 'quality' | 'pricing' | 'local' | 'service';
}

interface LocalFAQSectionProps {
  cityName: string;
  customFAQs?: FAQItem[];
}

export default function LocalFAQSection({ 
  cityName, 
  customFAQs = [] 
}: LocalFAQSectionProps) {
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Stadtspezifische FAQ-Inhalte für bessere Local SEO
  const defaultFAQs: FAQItem[] = [
    {
      id: '1',
      question: `Wie schnell können Sie Brennholz nach ${cityName} liefern?`,
      answer: `Wir liefern in der Regel innerhalb von 24-48 Stunden nach ${cityName}. Für das Stadtzentrum von ${cityName} ist oft sogar eine Lieferung am selben Tag möglich. Unsere lokalen Fahrer kennen alle Straßen und Wege in ${cityName} und können daher sehr flexible Lieferzeiten anbieten.`,
      category: 'delivery'
    },
    {
      id: '2',
      question: `Welche Stadtteile von ${cityName} beliefern Sie?`,
      answer: `Wir beliefern alle Stadtteile von ${cityName} sowie die umliegenden Gemeinden. Dazu gehören das Zentrum, alle Wohngebiete und auch die Außenbezirke von ${cityName}. Gerne können Sie uns Ihre genaue Adresse mitteilen, damit wir Ihnen eine präzise Lieferzeit nennen können.`,
      category: 'local'
    },
    {
      id: '3',
      question: `Stammt Ihr Brennholz aus der Region um ${cityName}?`,
      answer: `Ja, unser Brennholz stammt größtenteils aus den Wäldern rund um ${cityName}. Wir arbeiten mit lokalen Forstwirten zusammen und achten auf kurze Transportwege. Das garantiert nicht nur Frische und Qualität, sondern unterstützt auch die regionale Wirtschaft um ${cityName}.`,
      category: 'quality'
    },
    {
      id: '4',
      question: `Gibt es Mengenrabatte für Kunden in ${cityName}?`,
      answer: `Selbstverständlich! Für größere Bestellungen in ${cityName} bieten wir attraktive Mengenrabatte. Ab 3 Raummetern erhalten Sie bereits einen Rabatt, und bei regelmäßigen Bestellungen können wir Ihnen als ${cityName}-Kunde besondere Konditionen anbieten.`,
      category: 'pricing'
    },
    {
      id: '5',
      question: `Können Sie das Brennholz in ${cityName} auch stapeln?`,
      answer: `Ja, gerne stapeln wir Ihr Brennholz an dem von Ihnen gewünschten Ort in ${cityName}. Unsere Mitarbeiter kennen sich mit den örtlichen Gegebenheiten aus und können das Holz auch in schwer zugänglichen Bereichen Ihres Grundstücks ordentlich stapeln.`,
      category: 'service'
    },
    {
      id: '6',
      question: `Welche Zahlungsmöglichkeiten gibt es in ${cityName}?`,
      answer: `In ${cityName} bieten wir alle gängigen Zahlungsmethoden an: Barzahlung bei Lieferung, Überweisung, EC-Karte und auch PayPal. Für Stammkunden in ${cityName} ist auch eine Zahlung auf Rechnung möglich.`,
      category: 'service'
    },
    {
      id: '7',
      question: `Gibt es in ${cityName} auch Notfall-Lieferungen?`,
      answer: `Ja, für Notfälle bieten wir auch in ${cityName} Express-Lieferungen an. Wenn Ihnen das Brennholz unerwartet ausgeht, versuchen wir eine Lieferung noch am selben Tag zu organisieren. Als lokaler Anbieter in ${cityName} sind wir flexibel und kundenorientiert.`,
      category: 'delivery'
    },
    {
      id: '8',
      question: `Welche Holzarten sind in ${cityName} besonders beliebt?`,
      answer: `In ${cityName} sind besonders Buche und Eiche sehr beliebt, da sie lange brennen und eine schöne Glut entwickeln. Birke wird gerne zum Anheizen verwendet. Wir beraten Sie gerne, welche Holzart für Ihren Kamin oder Ofen in ${cityName} am besten geeignet ist.`,
      category: 'quality'
    }
  ];

  const allFAQs = customFAQs.length > 0 ? customFAQs : defaultFAQs;
  
  const categories = [
    { id: 'all', name: 'Alle Fragen', icon: '📋' },
    { id: 'delivery', name: 'Lieferung', icon: '🚚' },
    { id: 'quality', name: 'Qualität', icon: '🌳' },
    { id: 'pricing', name: 'Preise', icon: '💰' },
    { id: 'local', name: `${cityName} spezifisch`, icon: '📍' },
    { id: 'service', name: 'Service', icon: '🛠️' }
  ];

  const filteredFAQs = activeCategory === 'all' 
    ? allFAQs 
    : allFAQs.filter(faq => faq.category === activeCategory);

  const toggleFAQ = (id: string) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-wood-50 to-pergament">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-700 mb-4">
            Häufige Fragen zu Brennholz in {cityName}
          </h2>
          <p className="text-lg text-wood-800 max-w-3xl mx-auto">
            Hier finden Sie Antworten auf die wichtigsten Fragen rund um unseren 
            Brennholz-Service in {cityName} und Umgebung.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCategory === category.id
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'bg-white text-primary-600 hover:bg-wood-50 border border-gray-200'
              }`}
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFAQs.map((faq) => (
            <div 
              key={faq.id}
              className="bg-white rounded-lg shadow-md border border-gray-200"
            >
              <button
                onClick={() => toggleFAQ(faq.id)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-wood-50 transition-colors duration-200"
              >
                <h3 className="text-lg font-semibold text-primary-700 pr-4">
                  {faq.question}
                </h3>
                <div className="flex items-center space-x-2">
                  {/* Category Badge */}
                  <span className="px-2 py-1 bg-gray-100 text-primary-600 text-xs rounded-full">
                    {categories.find(cat => cat.id === faq.category)?.icon}
                  </span>
                  {/* Expand Icon */}
                  <svg 
                    className={`w-5 h-5 text-primary-600 transform transition-transform duration-200 ${
                      openFAQ === faq.id ? 'rotate-180' : ''
                    }`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              
              {openFAQ === faq.id && (
                <div className="px-6 pb-4 border-t border-gray-200">
                  <div className="pt-4">
                    <p className="text-wood-800 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Weitere Fragen zu unserem Service in {cityName}?
            </h3>
            <p className="text-wood-100 mb-6">
              Unser lokales Team in {cityName} hilft Ihnen gerne weiter. 
              Kontaktieren Sie uns für eine persönliche Beratung.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-primary-700 px-6 py-3 rounded-lg font-semibold hover:bg-wood-50 transition-colors duration-300">
                📞 Jetzt anrufen
              </button>
              <button className="bg-primary-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-400 transition-colors duration-300">
                ✉️ E-Mail schreiben
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center bg-white rounded-lg shadow-lg p-4">
            <div className="text-2xl font-bold text-primary-700">24h</div>
            <div className="text-sm text-wood-800">Durchschnittliche Antwortzeit</div>
          </div>
          <div className="text-center bg-white rounded-lg shadow-lg p-4">
            <div className="text-2xl font-bold text-primary-700">98%</div>
            <div className="text-sm text-wood-800">Zufriedenheitsrate in {cityName}</div>
          </div>
          <div className="text-center bg-white rounded-lg shadow-lg p-4">
            <div className="text-2xl font-bold text-primary-700">5+</div>
            <div className="text-sm text-wood-800">Jahre Erfahrung in {cityName}</div>
          </div>
          <div className="text-center bg-white rounded-lg shadow-lg p-4">
            <div className="text-2xl font-bold text-primary-700">500+</div>
            <div className="text-sm text-wood-800">Zufriedene Kunden</div>
          </div>
        </div>
      </div>
    </section>
  );
}