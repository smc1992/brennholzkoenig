
'use client';

export default function ShopInfo() {
  return (
    <section className="py-16 bg-[#F5F0E0]">
      <div className="container mx-auto px-4">
        
        {/* Service Information */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center bg-white rounded-xl p-8 shadow-lg">
            <div className="w-16 h-16 flex items-center justify-center bg-[#C04020]/10 rounded-full mx-auto mb-6">
              <i className="ri-truck-line text-3xl text-[#C04020]"></i>
            </div>
            <h3 className="text-xl font-bold text-[#1A1A1A] mb-4">Günstige Lieferung</h3>
            <p className="text-gray-700 leading-relaxed">
              Ab 3 Schüttraummeter liefern wir für nur 43,50€ in einem Umkreis von 150km um Fulda. 
              Kleinere Mengen gegen höheren Aufpreis möglich.
            </p>
          </div>
          
          <div className="text-center bg-white rounded-xl p-8 shadow-lg">
            <div className="w-16 h-16 flex items-center justify-center bg-[#C04020]/10 rounded-full mx-auto mb-6">
              <i className="ri-award-line text-3xl text-[#C04020]"></i>
            </div>
            <h3 className="text-xl font-bold text-[#1A1A1A] mb-4">Premium Qualität</h3>
            <p className="text-gray-700 leading-relaxed">
              27 Jahre Erfahrung in der Brennholzproduktion. Alle Hölzer werden sorgfältig getrocknet 
              und kontrolliert. Restfeuchte unter 18% garantiert.
            </p>
          </div>
          
          <div className="text-center bg-white rounded-xl p-8 shadow-lg">
            <div className="w-16 h-16 flex items-center justify-center bg-[#C04020]/10 rounded-full mx-auto mb-6">
              <i className="ri-customer-service-line text-3xl text-[#C04020]"></i>
            </div>
            <h3 className="text-xl font-bold text-[#1A1A1A] mb-4">Persönliche Beratung</h3>
            <p className="text-gray-700 leading-relaxed">
              Unsere Brennholz-Experten beraten Sie gerne bei der Auswahl des richtigen Holzes 
              für Ihren Ofen oder Kamin. Rufen Sie uns an!
            </p>
          </div>
        </div>

        {/* Purchase Information */}
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-[#1A1A1A] mb-6">So funktioniert Ihre Bestellung</h3>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-12 h-12 flex items-center justify-center bg-[#C04020] text-white rounded-full font-bold text-lg mr-4 flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1A1A1A] mb-2">Produkte auswählen</h4>
                    <p className="text-gray-700">Wählen Sie Ihr gewünschtes Brennholz und die Menge aus unserem Sortiment.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-12 h-12 flex items-center justify-center bg-[#C04020] text-white rounded-full font-bold text-lg mr-4 flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1A1A1A] mb-2">Bestellung aufgeben</h4>
                    <p className="text-gray-700">Kontaktieren Sie uns telefonisch oder per E-Mail für die finale Bestellbestätigung.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-12 h-12 flex items-center justify-center bg-[#C04020] text-white rounded-full font-bold text-lg mr-4 flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1A1A1A] mb-2">Lieferung erhalten</h4>
                    <p className="text-gray-700">Wir liefern Ihr Brennholz direkt zu Ihnen nach Hause. Lieferzeit: 1-3 Wochen.</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <button className="w-full md:w-auto bg-[#C04020] text-white px-8 py-4 rounded-lg font-bold hover:bg-[#A03318] transition-colors whitespace-nowrap cursor-pointer">
                  <div className="w-5 h-5 flex items-center justify-center mr-2 inline-block">
                    <i className="ri-phone-line"></i>
                  </div>
                  Jetzt anrufen: 0661 / 123 456 78
                </button>
                <button className="w-full md:w-auto bg-white text-[#C04020] border-2 border-[#C04020] px-8 py-4 rounded-lg font-bold hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer ml-0 md:ml-4">
                  <div className="w-5 h-5 flex items-center justify-center mr-2 inline-block">
                    <i className="ri-mail-line"></i>
                  </div>
                  E-Mail senden
                </button>
              </div>
            </div>

            <div>
              <div 
                className="aspect-square rounded-2xl bg-cover bg-center bg-no-repeat shadow-lg"
                style={{
                  backgroundImage: `url('https://static.readdy.ai/image/5cb98375ce345c7331a1619afba21cba/fc6bd73633df28293b3a47852f59e15a.webp')`
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h3 className="text-3xl font-bold text-[#1A1A1A] text-center mb-12">Häufige Fragen zu unserem Shop</h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h4 className="font-bold text-[#1A1A1A] mb-3 flex items-center">
                  <div className="w-6 h-6 flex items-center justify-center mr-3">
                    <i className="ri-question-line text-[#C04020]"></i>
                  </div>
                  Was ist ein Schüttraummeter?
                </h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Ein Schüttraummeter (SRM) ist ein Raummaß für geschüttetes Brennholz. 
                  Es entspricht einem Kubikmeter (1m³) geschüttetem Holz mit Zwischenräumen.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h4 className="font-bold text-[#1A1A1A] mb-3 flex items-center">
                  <div className="w-6 h-6 flex items-center justify-center mr-3">
                    <i className="ri-question-line text-[#C04020]"></i>
                  </div>
                  Wie wird die Qualität sichergestellt?
                </h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Jede Holzlieferung wird vor dem Versand kontrolliert. Wir messen die Restfeuchte 
                  und prüfen die Qualität. Bei Problemen tauschen wir die Ware kostenlos aus.
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h4 className="font-bold text-[#1A1A1A] mb-3 flex items-center">
                  <div className="w-6 h-6 flex items-center justify-center mr-3">
                    <i className="ri-question-line text-[#C04020]"></i>
                  </div>
                  Was kostet die Lieferung?
                </h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Die Lieferung kostet 43,50€ ab einer Bestellung von 3 Schüttraummeter. 
                  Bei kleineren Mengen können höhere Lieferkosten anfallen.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h4 className="font-bold text-[#1A1A1A] mb-3 flex items-center">
                  <div className="w-6 h-6 flex items-center justify-center mr-3">
                    <i className="ri-question-line text-[#C04020]"></i>
                  </div>
                  Kann ich das Holz vor Kauf besichtigen?
                </h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Gerne können Sie unser Lager besuchen und das Holz vor dem Kauf begutachten. 
                  Vereinbaren Sie einfach einen Termin mit uns.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
