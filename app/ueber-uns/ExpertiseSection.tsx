'use client';

export default function ExpertiseSection() {
  return (
    <section className="py-16 bg-[#1A1A1A] text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
              ECHTE <span className="text-[#D4A520]">EXPERTISE</span>
            </h2>
            <p className="text-xl text-gray-200" style={{ fontFamily: 'Barlow, sans-serif' }}>
              Auch beim Thema Kamin ist Thorsten der richtige Ansprechpartner
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
            <div>
              <h3 className="text-2xl font-bold text-[#C04020] mb-6">Fragen, die Thorsten täglich beantwortet:</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-[#D4A520] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <i className="ri-question-line text-black text-sm"></i>
                  </div>
                  <p className="text-gray-200" style={{ fontFamily: 'Barlow, sans-serif' }}>
                    Welches Holz eignet sich wofür?
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-[#D4A520] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <i className="ri-question-line text-black text-sm"></i>
                  </div>
                  <p className="text-gray-200" style={{ fontFamily: 'Barlow, sans-serif' }}>
                    Wie heizt man effizient?
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-[#D4A520] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <i className="ri-question-line text-black text-sm"></i>
                  </div>
                  <p className="text-gray-200" style={{ fontFamily: 'Barlow, sans-serif' }}>
                    Wie viel Restfeuchte darf das Holz haben?
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-[#D4A520] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <i className="ri-question-line text-black text-sm"></i>
                  </div>
                  <p className="text-gray-200" style={{ fontFamily: 'Barlow, sans-serif' }}>
                    Was sollte man besser lassen?
                  </p>
                </div>
              </div>
            </div>
            
            <img 
              src="https://readdy.ai/api/search-image?query=German%20firewood%20expert%20measuring%20wood%20moisture%20content%20with%20professional%20device%2C%20hands-on%20expertise%20demonstration%2C%20timber%20yard%20setting%2C%20authentic%20craftsmanship%20documentation%2C%20technical%20knowledge%20in%20action&width=600&height=400&seq=thorsten-expertise&orientation=landscape"
              alt="Thorsten bei der Qualitätskontrolle"
              className="rounded-lg shadow-lg object-cover object-top h-64"
            />
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-[#D4A520] mb-6">Thorsens Versprechen</h3>
              <blockquote className="text-xl italic mb-6" style={{ fontFamily: 'Barlow, sans-serif' }}>
                "Ich nehme mir die Zeit, erkläre verständlich – und das mit echter Freude am Kontakt. 
                Denn nur wenn Sie verstehen, wie Sie richtig heizen, haben wir beide etwas davon."
              </blockquote>
              <div className="flex justify-center">
                <div className="w-16 h-1 bg-[#C04020]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}