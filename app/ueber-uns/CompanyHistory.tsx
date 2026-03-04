
'use client';

export default function CompanyHistory() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-[#1A1A1A] mb-8 text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
            UNSERE <span className="text-[#C04020]">GESCHICHTE</span>
          </h2>

          <div className="space-y-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-[#C04020] mb-4">1977 - Die Anfänge</h3>
                <p className="text-gray-700 mb-4" style={{ fontFamily: 'Barlow, sans-serif' }}>
                  Klaus Brennholzkönig gründet das Unternehmen mit einer einfachen Vision: 
                  Den Menschen in der Region Fulda das beste Brennholz zu liefern. Mit einem 
                  alten Traktor und viel Herzblut beginnt die Geschichte des Brennholzkönigs.
                </p>
                <p className="text-gray-700" style={{ fontFamily: 'Barlow, sans-serif' }}>
                  Bereits in den ersten Jahren etabliert sich der Ruf für außergewöhnliche 
                  Qualität und zuverlässigen Service.
                </p>
              </div>
              <img 
                src="https://readdy.ai/api/search-image?query=Vintage%20black%20and%20white%20photo%20of%201970s%20German%20lumber%20worker%20with%20old%20tractor%2C%20traditional%20forestry%20equipment%2C%20historical%20timber%20yard%20scene%2C%20authentic%20documentary%20style%20photography&width=600&height=400&seq=history-1977&orientation=landscape"
                alt="Gründung 1977"
                className="rounded-lg shadow-lg object-cover object-top h-64"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <img 
                src="https://readdy.ai/api/search-image?query=1990s%20German%20family%20timber%20business%20expansion%2C%20modern%20wood%20processing%20equipment%2C%20family%20members%20working%20together%2C%20professional%20forestry%20operation%2C%20growth%20and%20success&width=600&height=400&seq=history-1990s&orientation=landscape"
                alt="Expansion 1990er"
                className="rounded-lg shadow-lg object-cover object-top h-64 md:order-first"
              />
              <div>
                <h3 className="text-2xl font-bold text-[#C04020] mb-4">1990er - Wachstum & Expansion</h3>
                <p className="text-gray-700 mb-4" style={{ fontFamily: 'Barlow, sans-serif' }}>
                  Die Familie wächst und das Unternehmen expandiert. Moderne Trocknungsanlagen 
                  werden installiert und der Lieferradius auf 150km erweitert. Die nächste 
                  Generation steigt ins Unternehmen ein.
                </p>
                <p className="text-gray-700" style={{ fontFamily: 'Barlow, sans-serif' }}>
                  Der Kundenstamm wächst auf über 5.000 zufriedene Haushalte an.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-[#C04020] mb-4">Heute - Tradition trifft Innovation</h3>
                <p className="text-gray-700 mb-4" style={{ fontFamily: 'Barlow, sans-serif' }}>
                  Mit über 10.000 Kunden sind wir der führende Brennholzhändler der Region. 
                  Modernste Trocknungstechnologie garantiert 70% höheren Heizwert bei 
                  gleichzeitig nachhaltiger Forstwirtschaft.
                </p>
                <p className="text-gray-700" style={{ fontFamily: 'Barlow, sans-serif' }}>
                  27 Jahre Erfahrung kombiniert mit innovativen Verfahren - das ist unser Erfolgsrezept.
                </p>
              </div>
              <img 
                src="https://readdy.ai/api/search-image?query=Modern%20German%20timber%20facility%20today%2C%20state-of-the-art%20wood%20drying%20equipment%2C%20sustainable%20forestry%20operation%2C%20professional%20industrial%20setting%2C%20high-tech%20wood%20processing&width=600&height=400&seq=history-today&orientation=landscape"
                alt="Heute"
                className="rounded-lg shadow-lg object-cover object-top h-64"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
