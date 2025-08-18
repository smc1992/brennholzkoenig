'use client';

export default function QualityPromise() {
  return (
    <section className="py-16 bg-[#1A1A1A] text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
            UNSER <span className="text-[#D4A520]">QUALITÄTSVERSPRECHEN</span>
          </h2>
          <p className="text-xl max-w-3xl mx-auto" style={{ fontFamily: 'Barlow, sans-serif' }}>
            27 Jahre Erfahrung haben uns gelehrt: Nur mit kompromissloser Qualität 
            können wir unseren Kunden die beste Wärme bieten.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 flex items-center justify-center bg-[#C04020] rounded-full mx-auto mb-4">
              <i className="ri-leaf-line text-white text-2xl"></i>
            </div>
            <h3 className="text-lg font-bold mb-3">Nachhaltige Beschaffung</h3>
            <p className="text-gray-200 text-sm" style={{ fontFamily: 'Barlow, sans-serif' }}>100% regional, FSC-zertifiziert</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 flex items-center justify-center bg-[#C04020] rounded-full mx-auto mb-4">
              <i className="ri-temp-hot-line text-white text-2xl"></i>
            </div>
            <h3 className="text-lg font-bold mb-3">Optimale Trocknung</h3>
            <p className="text-gray-200 text-sm" style={{ fontFamily: 'Barlow, sans-serif' }}>6 % Restfeuchte garantiert</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 flex items-center justify-center bg-[#C04020] rounded-full mx-auto mb-4">
              <i className="ri-shield-check-line text-white text-2xl"></i>
            </div>
            <h3 className="text-lg font-bold mb-3">Qualitätskontrolle</h3>
            <p className="text-gray-200 text-sm" style={{ fontFamily: 'Barlow, sans-serif' }}>Jede Lieferung wird geprüft</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 flex items-center justify-center bg-[#C04020] rounded-full mx-auto mb-4">
              <i className="ri-customer-service-line text-white text-2xl"></i>
            </div>
            <h3 className="text-lg font-bold mb-3">Persönlicher Service</h3>
            <p className="text-gray-200 text-sm" style={{ fontFamily: 'Barlow, sans-serif' }}>Beratung und Support vor Ort</p>
          </div>
        </div>

        <div className="mt-12 bg-white/10 backdrop-blur-sm rounded-xl p-8">
          <h3 className="text-2xl font-bold mb-6 text-center">Unsere Qualitätsgarantie</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-bold text-[#D4A520] mb-3">✓ 70% höherer Heizwert</h4>
              <p className="text-gray-200 mb-4" style={{ fontFamily: 'Barlow, sans-serif' }}>Durch optimierte Trocknung und Holzauswahl erreichen wir deutlich bessere Brennwerte als handelsübliches Holz.</p>
              
              <h4 className="font-bold text-[#D4A520] mb-3">✓ Königliche Sauberkeit</h4>
              <p className="text-gray-200 mb-4" style={{ fontFamily: 'Barlow, sans-serif' }}>Unser Holz ist frei von Schmutz, Steinen und Fremdstoffen. Sauber gespalten und sortiert.</p>
            </div>
            <div>
              <h4 className="font-bold text-[#D4A520] mb-3">✓ Termingerechte Lieferung</h4>
              <p className="text-gray-200 mb-4" style={{ fontFamily: 'Barlow, sans-serif' }}>Pünktlichkeit ist für uns selbstverständlich. Bei Verzögerungen erhalten Sie 10% Rabatt.</p>
              
              <h4 className="font-bold text-[#D4A520] mb-3">✓ 100% Zufriedenheitsgarantie</h4>
              <p className="text-gray-200 mb-4" style={{ fontFamily: 'Barlow, sans-serif' }}>Nicht zufrieden? Wir nehmen das Holz zurück und erstatten den vollen Betrag.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}