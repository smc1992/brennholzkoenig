
'use client';

import { CityButton } from '@/components/ui/CityButton';

interface TestimonialReview {
  id: string;
  name: string;
  initials: string;
  role: string;
  order_info: string;
  rating: number;
  review: string;
  date: string;
  verified: boolean;
}

interface TestimonialSectionProps {
  cityData?: any;
  badgeText?: string;
  title?: string;
  description?: string;
  reviews?: TestimonialReview[];
}

export default function TestimonialSection({ 
  cityData,
  badgeText = "ECHTE KUNDENSTIMMEN",
  title = "DAS SAGEN UNSERE KUNDEN",
  description = "Über 6.847 zufriedene Familien heizen bereits mit unserem Premium-Brennholz. Lesen Sie echte Bewertungen von verified Kunden.",
  reviews = []
}: TestimonialSectionProps) {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-white to-[#F5F0E0]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <div className="inline-flex items-center bg-[#D4A520] text-[#1A1A1A] px-4 sm:px-6 py-2 sm:py-3 rounded-full font-bold text-sm sm:text-base mb-6 sm:mb-8">
            <i className="ri-star-line mr-2"></i>
            {badgeText}
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-[#1A1A1A] mb-4 sm:mb-6" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
            {title.includes('KUNDEN') ? (
              <>
                {title.split('KUNDEN')[0]}<span className="text-[#C04020]">KUNDEN</span>
              </>
            ) : (
              title
            )}
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed mb-8 sm:mb-12" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
            {description}
          </p>
          {/* Kunden Ambiente Bild */}
          <div className="max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-2xl mb-8 sm:mb-12">
            <img 
              src={cityData?.testimonial_section_image_url || "https://static.readdy.ai/image/5cb98375ce345c7331a1619afba21cba/255afa48d4769354fa7fedfea18b5f4b.webp"}
              alt="Zufriedene Kunden um den warmen Kamin"
              className="w-full h-32 sm:h-48 lg:h-64 object-cover object-center"
            />
          </div>
        </div>
        {/* Testimonials Grid - Mobile optimiert */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 max-w-7xl mx-auto mb-8 sm:mb-12 lg:mb-16">
          {reviews.length > 0 ? (
            reviews.slice(0, 3).map((review, index) => (
              <div key={review.id} className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100">
                <div className="flex items-start mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#C04020] rounded-full flex items-center justify-center text-white font-bold mr-4 flex-shrink-0">
                    {review.initials}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-[#1A1A1A] text-base sm:text-lg">{review.name}</h4>
                    <p className="text-xs sm:text-sm text-gray-600">{review.role} • {review.order_info}</p>
                    <div className="flex mt-1">
                      {[...Array(review.rating)].map((_, i) => (
                        <i key={i} className="ri-star-fill text-[#D4A520] text-sm sm:text-base"></i>
                      ))}
                    </div>
                  </div>
                </div>
                <blockquote className="text-sm sm:text-base text-gray-700 italic mb-4 sm:mb-6 leading-relaxed">
                  "{review.review}"
                </blockquote>
                <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
                  <span>{review.date}</span>
                  {review.verified && (
                    <span className="flex items-center text-green-600 font-medium">
                      <i className="ri-check-line mr-1"></i>
                      Verifiziert
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            // Fallback zu statischen Testimonials wenn keine dynamischen Daten vorhanden
            <>
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100">
                <div className="flex items-start mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#C04020] rounded-full flex items-center justify-center text-white font-bold mr-4 flex-shrink-0">
                    MH
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-[#1A1A1A] text-base sm:text-lg">Markus Hoffmann</h4>
                    <p className="text-xs sm:text-sm text-gray-600">Hausbesitzer • 8 SRM bestellt</p>
                    <div className="flex mt-1">
                      {[...Array(5)].map((_, i) => (
                        <i key={i} className="ri-star-fill text-[#D4A520] text-sm sm:text-base"></i>
                      ))}
                    </div>
                  </div>
                </div>
                <blockquote className="text-sm sm:text-base text-gray-700 italic mb-4 sm:mb-6 leading-relaxed">
                  "Endlich kein Dreck mehr in der Wohnung! Das Industrieholz ist so sauber und gleichmäßig. Meine Frau ist begeistert - keine Rinde, kein Schmutz, aber trotzdem 1.200€ weniger als vorher."
                </blockquote>
                <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
                  <span>Vor 3 Wochen</span>
                  <span className="flex items-center text-green-600 font-medium">
                    <i className="ri-check-line mr-1"></i>
                    Verifiziert
                  </span>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100">
                <div className="flex items-start mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#C04020] rounded-full flex items-center justify-center text-white font-bold mr-4 flex-shrink-0">
                    SK
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-[#1A1A1A] text-base sm:text-lg">Sarah Klein</h4>
                    <p className="text-xs sm:text-sm text-gray-600">Pensionärin • 5 SRM bestellt</p>
                    <div className="flex mt-1">
                      {[...Array(5)].map((_, i) => (
                        <i key={i} className="ri-star-fill text-[#D4A520] text-sm sm:text-base"></i>
                      ))}
                    </div>
                  </div>
                </div>
                <blockquote className="text-sm sm:text-base text-gray-700 italic mb-4 sm:mb-6 leading-relaxed">
                  "Mit 73 Jahren ist mir das Holz schleppen schwer geworden. Diese rechteckigen Stücke lassen sich so viel einfacher stapeln und tragen. Und ich spare 900€ pro Winter!"
                </blockquote>
                <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
                  <span>Vor 5 Tagen</span>
                  <span className="flex items-center text-green-600 font-medium">
                    <i className="ri-check-line mr-1"></i>
                    Verifiziert
                  </span>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 md:col-span-2 lg:col-span-1">
                <div className="flex items-start mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#C04020] rounded-full flex items-center justify-center text-white font-bold mr-4 flex-shrink-0">
                    TB
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-[#1A1A1A] text-base sm:text-lg">Thomas Bauer</h4>
                    <p className="text-xs sm:text-sm text-gray-600">Landwirt • 12 SRM bestellt</p>
                    <div className="flex mt-1">
                      {[...Array(5)].map((_, i) => (
                        <i key={i} className="ri-star-fill text-[#D4A520] text-sm sm:text-base"></i>
                      ))}
                    </div>
                  </div>
                </div>
                <blockquote className="text-sm sm:text-base text-gray-700 italic mb-4 sm:mb-6 leading-relaxed">
                  "Ich heize 3 Gebäude und brauche viel Holz. Dieses Industrieholz brennt genauso gut wie teures Buchenholz, kostet aber die Hälfte. Wirtschaftlich unschlagbar!"
                </blockquote>
                <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
                  <span>Vor 1 Woche</span>
                  <span className="flex items-center text-green-600 font-medium">
                    <i className="ri-check-line mr-1"></i>
                    Verifiziert
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
        {/* Weitere Testimonials für Mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto mb-8 sm:mb-12">
          <div className="bg-gradient-to-r from-[#F5F0E0] to-white rounded-xl p-4 sm:p-6 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#D4A520] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                AW
              </div>
              <div className="min-w-0">
                <div className="flex items-center mb-1">
                  <span className="text-sm font-bold text-[#1A1A1A] mr-2">Anna Weber</span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <i key={i} className="ri-star-fill text-[#D4A520] text-xs"></i>
                    ))}
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-700 leading-tight">
                  "Beste Entscheidung! Kein Ungeziefer mehr im Holzschuppen und 800€ gespart."
                </p>
                <p className="text-xs text-gray-500 mt-1">vor 1 Woche</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-[#F5F0E0] to-white rounded-xl p-4 sm:p-6 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#D4A520] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                PR
              </div>
              <div className="min-w-0">
                <div className="flex items-center mb-1">
                  <span className="text-sm font-bold text-[#1A1A1A] mr-2">Peter Richter</span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <i key={i} className="ri-star-fill text-[#D4A520] text-xs"></i>
                    ))}
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-700 leading-tight">
                  "Pünktliche Lieferung, sauberes Holz, faire Preise. Absolut empfehlenswert!"
                </p>
                <p className="text-xs text-gray-500 mt-1">vor 4 Tagen</p>
              </div>
            </div>
          </div>
        </div>
        {/* Statistics - Mobile optimiert */}
        <div className="bg-gradient-to-r from-[#F5F0E0] to-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 shadow-2xl max-w-6xl mx-auto mb-8 sm:mb-12">
          <div className="text-center mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#1A1A1A] mb-2 sm:mb-4" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
              BEWERTUNGSSTATISTIK
            </h3>
            <p className="text-sm sm:text-base lg:text-lg text-gray-700">Basierend auf 2.847 verifizierten Kundenbewertungen</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            <div className="text-center bg-white rounded-xl p-4 sm:p-6 shadow-lg">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#C04020] mb-2">4.9</div>
              <div className="flex justify-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className="ri-star-fill text-[#D4A520] text-base sm:text-lg"></i>
                ))}
              </div>
              <p className="text-xs sm:text-sm font-bold text-gray-700">Durchschnitt</p>
            </div>
            <div className="text-center bg-white rounded-xl p-4 sm:p-6 shadow-lg">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#C04020] mb-2">97%</div>
              <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center bg-[#C04020] rounded-full mx-auto mb-2">
                <i className="ri-thumb-up-fill text-white text-xs sm:text-sm"></i>
              </div>
              <p className="text-xs sm:text-sm font-bold text-gray-700">Würden wieder kaufen</p>
            </div>
            <div className="text-center bg-white rounded-xl p-4 sm:p-6 shadow-lg">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#D4A520] mb-2">94%</div>
              <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center bg-[#D4A520] rounded-full mx-auto mb-2">
                <i className="ri-heart-fill text-white text-xs sm:text-sm"></i>
              </div>
              <p className="text-xs sm:text-sm font-bold text-gray-700">Empfehlen uns weiter</p>
            </div>
            <div className="text-center bg-white rounded-xl p-4 sm:p-6 shadow-lg">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#C04020] mb-2">691€</div>
              <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center bg-[#C04020] rounded-full mx-auto mb-2">
                <i className="ri-money-euro-circle-fill text-white text-xs sm:text-sm"></i>
              </div>
              <p className="text-xs sm:text-sm font-bold text-gray-700">Durchschnittliche Ersparnis</p>
            </div>
          </div>
        </div>
        {/* CTA Section - Mobile optimiert */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-[#C04020] to-[#A03318] rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 shadow-2xl max-w-5xl mx-auto">
            <div className="text-center">
              <h3 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-black text-white mb-3 sm:mb-4 lg:mb-6" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                AUCH SIE SPAREN BIS ZU 721€ JÄHRLICH
              </h3>
              <p className="text-base sm:text-lg lg:text-xl text-white/90 mb-6 sm:mb-8 lg:mb-10">
                Schließen Sie sich über 6.000 zufriedenen Familien an
              </p>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center max-w-3xl mx-auto">
                <CityButton
                  type="testimonial"
                  cityData={cityData}
                  className="testimonial-button-override px-6 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base lg:text-lg transition-all duration-300 whitespace-nowrap cursor-pointer shadow-2xl transform hover:scale-105 w-full sm:w-auto inline-block text-center"
                >
                  <i className="ri-award-line mr-2 sm:mr-3"></i>
                  <span className="hidden sm:inline">{cityData?.testimonial_cta_text || 'Jetzt Premium-Qualität bestellen'}</span>
                  <span className="sm:hidden">Premium bestellen</span>
                </CityButton>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 lg:gap-12 mt-4 sm:mt-6">
                <div className="flex items-center text-white/90 text-xs sm:text-sm lg:text-base">
                  <i className="ri-phone-line mr-2"></i>
                  Kostenlose Beratung
                </div>
                <div className="flex items-center text-white/90 text-xs sm:text-sm lg:text-base">
                  <i className="ri-truck-line mr-2"></i>
                  Schnelle Lieferung
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
