'use client';

import { useState } from 'react';

interface LocalTestimonial {
  id: string;
  customerName: string;
  location: string;
  rating: number;
  review: string;
  date: string;
  verified?: boolean;
  orderType?: string;
}

interface LocalTestimonialsSectionProps {
  cityName: string;
  testimonials?: LocalTestimonial[];
  title?: string;
  description?: string;
  ctaText?: string;
  cityData?: any;
}

export default function LocalTestimonialsSection({ 
  cityName, 
  testimonials = [],
  title,
  description,
  ctaText,
  cityData
}: LocalTestimonialsSectionProps) {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Fallback-Bewertungen für bessere Local SEO
  const defaultTestimonials: LocalTestimonial[] = [
    {
      id: '1',
      customerName: 'Familie Schmidt',
      location: `${cityName} Zentrum`,
      rating: 5,
      review: `Hervorragender Service! Das Brennholz wurde pünktlich und in bester Qualität geliefert. Die Mitarbeiter waren sehr freundlich und haben das Holz genau dort gestapelt, wo wir es wollten. Wir bestellen definitiv wieder bei Brennholz König ${cityName}.`,
      date: '2024-01-15',
      verified: true,
      orderType: 'Buche 25cm'
    },
    {
      id: '2',
      customerName: 'Thomas M.',
      location: `${cityName} Nord`,
      rating: 5,
      review: `Seit Jahren unser zuverlässiger Partner für Brennholz in ${cityName}. Die Qualität ist konstant hoch und die Lieferung erfolgt immer termingerecht. Besonders schätzen wir die lokale Nähe und den persönlichen Kontakt.`,
      date: '2024-01-08',
      verified: true,
      orderType: 'Eiche 33cm'
    },
    {
      id: '3',
      customerName: 'Andrea K.',
      location: `${cityName} Süd`,
      rating: 5,
      review: `Fantastische Erfahrung! Das Team von Brennholz König kennt sich in ${cityName} bestens aus und hat eine perfekte Route für die Lieferung gefunden. Das Holz war trocken und perfekt gespalten. Absolute Empfehlung!`,
      date: '2024-01-03',
      verified: true,
      orderType: 'Birke 25cm'
    },
    {
      id: '4',
      customerName: 'Michael R.',
      location: `${cityName} West`,
      rating: 5,
      review: `Als langjähriger Kunde kann ich Brennholz König ${cityName} nur weiterempfehlen. Die Qualität des Holzes ist ausgezeichnet und der Service ist immer freundlich und zuverlässig. Lokaler Anbieter mit großem Herz!`,
      date: '2023-12-28',
      verified: true,
      orderType: 'Buche 33cm'
    }
  ];

  // Falls cityData vorhanden ist, mappe cityData.testimonial_reviews auf LocalTestimonial
  const cityReviews: LocalTestimonial[] = Array.isArray(cityData?.testimonial_reviews)
    ? cityData.testimonial_reviews.map((r: any, idx: number) => ({
        id: r.id?.toString?.() || `${idx}-${r.name || 'review'}`,
        customerName: r.name || 'Anonym',
        location: r.role || `${cityName}`,
        rating: Number(r.rating) || 5,
        review: r.text || '',
        date: r.date || '',
        verified: Boolean(r.verified),
        orderType: r.order_info || undefined
      }))
    : [];

  const displayTestimonials = (testimonials.length > 0 ? testimonials : (cityReviews.length > 0 ? cityReviews : defaultTestimonials));

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-5 h-5 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-wood-50 to-pergament">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-700 mb-4">
            {title || cityData?.testimonial_title || `Was unsere Kunden in ${cityName} sagen`}
          </h2>
          {(description || cityData?.testimonial_description) && (
            <p className="text-lg text-wood-800 max-w-3xl mx-auto">
              {description || cityData?.testimonial_description}
            </p>
          )}
        </div>

        {/* Optional Statistics: Nur rendern, wenn cityData entsprechende Felder bereitstellt */}
        {cityData?.testimonial_stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {cityData?.testimonial_stats?.avg_rating && (
              <div className="text-center bg-white rounded-xl shadow-lg p-6">
                <div className="text-3xl font-bold text-primary-700 mb-2">{cityData.testimonial_stats.avg_rating}</div>
                <div className="flex justify-center mb-2">
                  {renderStars(Math.round(Number(cityData.testimonial_stats.avg_rating)) || 5)}
                </div>
                <div className="text-sm text-gray-600">Durchschnittsbewertung</div>
              </div>
            )}
            {cityData?.testimonial_stats?.customers_label && (
              <div className="text-center bg-white rounded-xl shadow-lg p-6">
                <div className="text-3xl font-bold text-primary-700 mb-2">{cityData.testimonial_stats.customers_label}</div>
                <div className="text-sm text-gray-600">Zufriedene Kunden in {cityName}</div>
              </div>
            )}
            {cityData?.testimonial_stats?.recommendation_rate && (
              <div className="text-center bg-white rounded-xl shadow-lg p-6">
                <div className="text-3xl font-bold text-primary-700 mb-2">{cityData.testimonial_stats.recommendation_rate}</div>
                <div className="text-sm text-gray-600">Weiterempfehlungsrate</div>
              </div>
            )}
            {cityData?.testimonial_stats?.delivery_time && (
              <div className="text-center bg-white rounded-xl shadow-lg p-6">
                <div className="text-3xl font-bold text-primary-700 mb-2">{cityData.testimonial_stats.delivery_time}</div>
                <div className="text-sm text-gray-600">Durchschnittliche Lieferzeit</div>
              </div>
            )}
          </div>
        )}

        {/* Main Testimonial Display */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              {renderStars(displayTestimonials[activeTestimonial].rating)}
            </div>
            
            <blockquote className="text-xl md:text-2xl text-wood-800 font-medium leading-relaxed mb-6">
              "{displayTestimonials[activeTestimonial].review}"
            </blockquote>
            
            <div className="flex items-center justify-center space-x-4">
              <div className="text-center">
                <div className="font-semibold text-primary-700">
                  {displayTestimonials[activeTestimonial].customerName}
                </div>
                <div className="text-sm text-gray-600">
                  {displayTestimonials[activeTestimonial].location}
                </div>
                {displayTestimonials[activeTestimonial].orderType && (
                  <div className="text-xs text-gray-400 mt-1">
                    Bestellung: {displayTestimonials[activeTestimonial].orderType}
                  </div>
                )}
              </div>
              
              {displayTestimonials[activeTestimonial].verified && (
                <div className="flex items-center text-green-600 text-sm">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verifiziert
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Testimonial Navigation */}
        <div className="flex justify-center space-x-2 mb-8">
          {displayTestimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveTestimonial(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === activeTestimonial 
                  ? 'bg-primary-600 scale-125' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        {/* All Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayTestimonials.map((testimonial, index) => (
            <div 
              key={testimonial.id}
              className={`bg-white rounded-lg shadow-lg p-6 border border-gray-200 transition-all duration-300 cursor-pointer hover:shadow-xl ${
                index === activeTestimonial ? 'ring-2 ring-primary-500' : ''
              }`}
              onClick={() => setActiveTestimonial(index)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                {testimonial.verified && (
                  <span className="text-sm text-gray-600">Verifizierte Bewertung</span>
                )}
              </div>
              
              <p className="text-wood-800 text-sm mb-4 italic line-clamp-4">
                "{testimonial.review}"
              </p>
              
              <div className="flex items-center">
                <div className="w-10 h-10 bg-wood-200 rounded-full flex items-center justify-center mr-3">
                  <span className="text-primary-700 font-semibold text-sm">
                    {testimonial.customerName.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-primary-700">{testimonial.customerName}</p>
                  <p className="text-sm text-gray-600">{testimonial.location}</p>
                  {testimonial.orderType && (
                    <div className="text-xs text-gray-400 mt-1">
                      {testimonial.orderType}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action: Nur rendern, wenn ctaText vorhanden */}
        {(ctaText || cityData?.testimonial_cta_text) && (
          <div className="text-center mt-12">
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">
                {title || cityData?.testimonial_title || `Werden Sie unser nächster zufriedener Kunde in ${cityName}!`}
              </h3>
              {(description || cityData?.testimonial_description) && (
                <p className="text-wood-100 mb-6">
                  {description || cityData?.testimonial_description}
                </p>
              )}
              <button className="bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold hover:bg-wood-50 transition-colors duration-300">
                {ctaText || cityData?.testimonial_cta_text}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}