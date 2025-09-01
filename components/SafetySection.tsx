
'use client';

export default function SafetySection() {
  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-white to-[#F5F0E0]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#1A1A1A] mb-6" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
            SAUBERES HEIZEN MIT <span className="text-[#2C5545]">VERANTWORTUNG</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
            Wir nehmen die Bedenken bezüglich Umwelt und Gesundheit ernst. Deshalb setzen wir auf modernste Technologie, 
            premium Brennholz und verantwortungsvolles Heizen für maximale Sicherheit und minimale Emissionen.
          </p>
        </div>

        {/* Modern Technology Solutions */}
        <div className="bg-white rounded-2xl p-6 md:p-10 shadow-xl mb-8 md:mb-12">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <div className="inline-flex items-center bg-[#D4A520] text-[#1A1A1A] px-4 md:px-6 py-2 md:py-3 rounded-full font-bold text-sm md:text-base mb-4 md:mb-6">
                <i className="ri-leaf-line mr-2 md:mr-3 text-lg md:text-xl"></i>
                MODERNE BRENNTECHNOLOGIE
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-[#1A1A1A] mb-4 md:mb-6" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                85% WENIGER EMISSIONEN durch moderne Öfen
              </h3>
              <ul className="space-y-3 md:space-y-4 text-sm md:text-base text-gray-700">
                <li className="flex items-start">
                  <i className="ri-check-line text-[#2C5545] mr-3 mt-1 flex-shrink-0 text-lg"></i>
                  <span><strong>Moderne Kaminöfen</strong> mit Sekundärverbrennung reduzieren Feinstaub um bis zu 85%</span>
                </li>
                <li className="flex items-start">
                  <i className="ri-check-line text-[#2C5545] mr-3 mt-1 flex-shrink-0 text-lg"></i>
                  <span><strong>BImSchV Stufe 2 Zertifizierung</strong> garantiert strengste Emissionsgrenzwerte</span>
                </li>
                <li className="flex items-start">
                  <i className="ri-check-line text-[#2C5545] mr-3 mt-1 flex-shrink-0 text-lg"></i>
                  <span><strong>Automatische Luftzufuhr</strong> sorgt für optimale, saubere Verbrennung</span>
                </li>
                <li className="flex items-start">
                  <i className="ri-check-line text-[#2C5545] mr-3 mt-1 flex-shrink-0 text-lg"></i>
                  <span><strong>Rußfilter und Katalysatoren</strong> in Premium-Öfen eliminieren 95% der Schadstoffe</span>
                </li>
              </ul>
            </div>
            <div className="relative">
              <img 
                src="https://readdy.ai/api/search-image?query=Modern%20clean%20burning%20wood%20stove%20with%20secondary%20combustion%20technology%2C%20sleek%20contemporary%20design%2C%20glass%20front%20showing%20clean%20flames%2C%20minimal%20emissions%2C%20advanced%20fireplace%20technology%20in%20bright%20modern%20living%20room%2C%20professional%20product%20photography&width=600&height=500&seq=modern-stove-tech&orientation=landscape"
                alt="Moderne emissionsarme Brenntechnologie"
                className="rounded-xl shadow-lg object-cover object-top w-full h-80 md:h-96"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 md:p-4">
                <p className="text-xs md:text-sm font-bold text-[#2C5545]">BImSchV Stufe 2 zertifiziert • 85% weniger Emissionen</p>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Wood Quality */}
        <div className="bg-gradient-to-r from-[#F5F0E0] to-white rounded-2xl p-6 md:p-10 shadow-xl mb-8 md:mb-12 border border-[#D4A520]/20">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="relative lg:order-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <div className="relative">
                  <img 
                    src="https://readdy.ai/api/search-image?query=Premium%20dried%20beech%20firewood%20split%20logs%20with%20moisture%20meter%20showing%2020%20percent%20humidity%2C%20perfectly%20seasoned%20hardwood%2C%20professional%20wood%20preparation%2C%20clean%20simple%20background%20highlighting%20the%20wood%20quality%20measurement&width=400&height=350&seq=scheitholz-20-percent&orientation=landscape"
                    alt="Buche Scheitholz mit 20% Restfeuchte"
                    className="rounded-xl shadow-lg object-cover object-top w-full h-60 md:h-72"
                  />
                  <div className="absolute top-4 left-4 bg-[#D4A520] text-[#1A1A1A] px-3 py-2 rounded-lg font-bold text-xs">
                    <i className="ri-temp-hot-line mr-1"></i>
                    20% Restfeuchte
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-2">
                    <p className="text-xs font-bold text-[#2C5545]">Buche Scheitholz</p>
                  </div>
                </div>
                <div className="relative">
                  <img 
                    src="https://readdy.ai/api/search-image?query=Premium%20dried%20square%20timber%20kantholz%20with%20moisture%20meter%20showing%206%20percent%20humidity%2C%20perfectly%20seasoned%20rectangular%20wood%20pieces%2C%20professional%20wood%20preparation%2C%20clean%20simple%20background%20highlighting%20the%20wood%20quality%20measurement&width=400&height=350&seq=kantholz-6-percent&orientation=landscape"
                    alt="Industrieholz Buche mit 6% Restfeuchte"
                    className="rounded-xl shadow-lg object-cover object-top w-full h-60 md:h-72"
                  />
                  <div className="absolute top-4 left-4 bg-[#2C5545] text-white px-3 py-2 rounded-lg font-bold text-xs">
                    <i className="ri-temp-hot-line mr-1"></i>
                    6-8% Restfeuchte
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-2">
                    <p className="text-xs font-bold text-[#2C5545]">Industrieholz Buche</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="inline-flex items-center bg-[#D4A520] text-[#1A1A1A] px-4 md:px-6 py-2 md:py-3 rounded-full font-bold text-sm md:text-base mb-4 md:mb-6">
                <i className="ri-award-line mr-2 md:mr-3 text-lg md:text-xl"></i>
                PREMIUM HOLZQUALITÄT
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-[#1A1A1A] mb-4 md:mb-6" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                PERFEKTE TROCKNUNG = SAUBERE VERBRENNUNG
              </h3>

              {/* Gegenüberstellung */}
              <div className="mb-6 md:mb-8">
                <h4 className="text-lg md:text-xl font-bold text-[#1A1A1A] mb-4">Unsere Holzqualitäten im Vergleich:</h4>
                <div className="space-y-4">
                  <div className="bg-white/80 rounded-lg p-4 border-l-4 border-[#2C5545]">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-bold text-[#2C5545]">Industrieholz Buche</h5>
                      <span className="text-xs bg-[#2C5545] text-white px-2 py-1 rounded">6-8% Feuchtigkeit</span>
                    </div>
                    <p className="text-sm text-gray-700">70% höherer Heizwert: Weniger Holz nötig = weniger Emissionen insgesamt</p>
                  </div>
                  <div className="bg-white/80 rounded-lg p-4 border-l-4 border-[#D4A520]">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-bold text-[#D4A520]">Buche Scheitholz</h5>
                      <span className="text-xs bg-[#D4A520] text-white px-2 py-1 rounded">20% Feuchtigkeit</span>
                    </div>
                    <p className="text-sm text-gray-700">Bewährte Qualität für zuverlässiges Heizen</p>
                  </div>
                </div>
              </div>

              <ul className="space-y-3 md:space-y-4 text-sm md:text-base text-gray-700">

                <li className="flex items-start">
                  <i className="ri-check-line text-[#D4A520] mr-3 mt-1 flex-shrink-0 text-lg"></i>
                  <span><strong>Hartholz aus nachhaltiger Forstwirtschaft:</strong> CO₂-neutraler Kreislauf durch Aufforstung</span>
                </li>
                <li className="flex items-start">
                  <i className="ri-check-line text-[#D4A520] mr-3 mt-1 flex-shrink-0 text-lg"></i>
                  <span><strong>Laborgeprüfte Qualität:</strong> Jede Charge wird auf Schadstoffe und Feuchtigkeit getestet</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Environmental Responsibility */}
        <div className="bg-white rounded-2xl p-6 md:p-10 shadow-xl mb-8 md:mb-12">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <div className="inline-flex items-center bg-[#D4A520] text-[#1A1A1A] px-4 md:px-6 py-2 md:py-3 rounded-full font-bold text-sm md:text-base mb-4 md:mb-6">
                <i className="ri-plant-line mr-2 md:mr-3 text-lg md:text-xl"></i>
                KLIMASCHUTZ
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-[#1A1A1A] mb-4 md:mb-6" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                ECHTE KLIMANEUTRALITÄT durch nachhaltigen Kreislauf
              </h3>
              <ul className="space-y-3 md:space-y-4 text-sm md:text-base text-gray-700">
                <li className="flex items-start">
                  <i className="ri-check-line text-[#2C5545] mr-3 mt-1 flex-shrink-0 text-lg"></i>
                  <span><strong>FSC-zertifizierte Forstwirtschaft:</strong> Für jeden gefällten Baum werden 3 neue gepflanzt</span>
                </li>
                <li className="flex items-start">
                  <i className="ri-check-line text-[#2C5545] mr-3 mt-1 flex-shrink-0 text-lg"></i>
                  <span><strong>Regionale Beschaffung:</strong> 95% weniger Transport-CO₂ als importierte Brennstoffe</span>
                </li>
                <li className="flex items-start">
                  <i className="ri-check-line text-[#2C5545] mr-3 mt-1 flex-shrink-0 text-lg"></i>
                  <span><strong>Kreislaufwirtschaft:</strong> Holz speichert beim Wachsen exakt das CO₂, das beim Verbrennen freigesetzt wird</span>
                </li>
                <li className="flex items-start">
                  <i className="ri-check-line text-[#2C5545] mr-3 mt-1 flex-shrink-0 text-lg"></i>
                  <span><strong>65% weniger CO₂</strong> als fossile Heizungen über den gesamten Lebenszyklus</span>
                </li>
              </ul>
            </div>
            <div className="relative">
              <img 
                src="https://readdy.ai/api/search-image?query=Sustainable%20forest%20management%20with%20young%20trees%20being%20planted%2C%20reforestation%20project%20showing%20cycle%20of%20growth%20and%20renewal%2C%20forest%20workers%20planting%20saplings%2C%20green%20forest%20sustainability%2C%20environmental%20responsibility%20in%20forestry&width=600&height=500&seq=sustainable-forestry&orientation=landscape"
                alt="Nachhaltige Forstwirtschaft und Aufforstung"
                className="rounded-xl shadow-lg object-cover object-top w-full h-80 md:h-96"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 md:p-4">
                <p className="text-xs md:text-sm font-bold text-[#2C5545]">FSC-zertifiziert • 3 neue Bäume pro gefälltem Baum</p>
              </div>
            </div>
          </div>
        </div>

        {/* Health & Safety Guidelines */}
        <div className="bg-gradient-to-r from-[#F5F0E0] to-white text-[#1A1A1A] rounded-2xl p-6 md:p-10 shadow-xl mb-8 md:mb-12 border border-[#D4A520]/20">
          <div className="text-center mb-8 md:mb-10">
            <div className="inline-flex items-center bg-[#C04020] text-white px-4 md:px-6 py-2 md:py-3 rounded-full font-bold text-sm md:text-base mb-4 md:mb-6">
              <i className="ri-shield-check-line mr-2 md:mr-3 text-lg md:text-xl"></i>
              GESUNDHEITSSCHUTZ
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-[#1A1A1A] mb-4" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
              RICHTIG HEIZEN FÜR MAXIMALE SICHERHEIT
            </h3>
            <p className="text-base md:text-lg text-gray-700 max-w-3xl mx-auto">
              Mit der richtigen Technik und unserem Premium-Brennholz reduzieren Sie Emissionen um bis zu 90%
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <div className="text-center bg-white rounded-xl p-4 md:p-6 shadow-md">
              <div className="w-12 md:w-16 h-12 md:h-16 flex items-center justify-center bg-[#C04020] rounded-full mx-auto mb-3 md:mb-4">
                <i className="ri-fire-line text-white text-lg md:text-2xl"></i>
              </div>
              <h4 className="font-bold text-[#1A1A1A] mb-2 text-sm md:text-base">Richtiges Anzünden</h4>
              <p className="text-xs md:text-sm text-gray-600">Von oben anzünden reduziert Rauchentwicklung um 80%</p>
            </div>

            <div className="text-center bg-white rounded-xl p-4 md:p-6 shadow-md">
              <div className="w-12 md:w-16 h-12 md:h-16 flex items-center justify-center bg-[#C04020] rounded-full mx-auto mb-3 md:mb-4">
                <i className="ri-temp-hot-line text-white text-lg md:text-2xl"></i>
              </div>
              <h4 className="font-bold text-[#1A1A1A] mb-2 text-sm md:text-base">Heißes Brennen</h4>
              <p className="text-xs md:text-sm text-gray-600">Über 690°C Brenntemperatur eliminiert Schadstoffe</p>
            </div>

            <div className="text-center bg-white rounded-xl p-4 md:p-6 shadow-md">
              <div className="w-12 md:w-16 h-12 md:h-16 flex items-center justify-center bg-[#C04020] rounded-full mx-auto mb-3 md:mb-4">
                <i className="ri-leaf-line text-white text-lg md:text-2xl"></i>
              </div>
              <h4 className="font-bold text-[#1A1A1A] mb-2 text-sm md:text-base">Optimale Belüftung</h4>
              <p className="text-xs md:text-sm text-gray-600">Richtige Luftzufuhr für vollständige Verbrennung</p>
            </div>

            <div className="text-center bg-white rounded-xl p-4 md:p-6 shadow-md">
              <div className="w-12 md:w-16 h-12 md:h-16 flex items-center justify-center bg-[#C04020] rounded-full mx-auto mb-3 md:mb-4">
                <i className="ri-tools-line text-white text-lg md:text-2xl"></i>
              </div>
              <h4 className="font-bold text-[#1A1A1A] mb-2 text-sm md:text-base">Regelmäßige Wartung</h4>
              <p className="text-xs md:text-sm text-gray-600">Sauberer Ofen = 95% weniger schädliche Emissionen</p>
            </div>
          </div>
        </div>

        {/* Scientific backing */}
        <div className="mt-8 md:mt-12 text-center">
          <div className="inline-flex items-center bg-gray-100 text-gray-700 px-4 md:px-6 py-2 md:py-3 rounded-full text-xs md:text-sm">
            <i className="ri-file-text-line mr-2 text-base md:text-lg"></i>
            <span>Basierend auf aktuellen Studien des Umweltbundesamts und der Fachagentur Nachwachsende Rohstoffe</span>
          </div>
        </div>
      </div>
    </section>
  );
}
