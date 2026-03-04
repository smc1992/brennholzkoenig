'use client';

export default function ThorstensStory() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
            <div className="md:pr-8">
              <h2 className="text-4xl md:text-5xl font-black text-[#1A1A1A] mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
                THORSTEN VEY – <span className="text-[#C04020]">DER MANN HINTER DEM HOLZ</span>
              </h2>
              <p className="text-lg text-gray-700 mb-6" style={{ fontFamily: 'Barlow, sans-serif' }}>
                Wer bei uns Brennholz bestellt, bekommt mehr als nur gut getrocknete Scheite. 
                Er bekommt echtes Handwerk, Herzblut – und das alles von einem, der sein Metier wirklich lebt.
              </p>
              <p className="text-gray-700 mb-6" style={{ fontFamily: 'Barlow, sans-serif' }}>
                Thorsten ist nicht einfach nur Händler. Er ist Holzkenner, Anpacker, Lkw-Fahrer, 
                Mechaniker und Kundenberater in einer Person.
              </p>
            </div>
            <div className="flex justify-center md:justify-start md:pl-8">
              <img 
                src="https://static.readdy.ai/image/5cb98375ce345c7331a1619afba21cba/2e2387727d4e5ec0540b56b3ddfd823f.webp"
                alt="Thorsten Vey - Der Brennholzkönig"
                className="rounded-lg shadow-lg object-cover object-top h-80 w-80 flex-shrink-0"
              />
            </div>
          </div>
          
          <div className="h-24"></div>

          <div className="bg-[#F5F0E0] rounded-xl p-8 mb-16 mt-8 md:mt-48">
            <h3 className="text-2xl font-bold text-[#C04020] mb-6 text-center">Was Thorsten besonders macht</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-[#C04020] rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="ri-eye-line text-white text-xl"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1A1A1A] mb-2">Geschulter Blick für Qualität</h4>
                    <p className="text-gray-700 text-sm" style={{ fontFamily: 'Barlow, sans-serif' }}>
                      Thorsten begutachtet jede Lieferung persönlich und kennt die Besonderheiten jeder Holzart.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-[#C04020] rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="ri-tools-line text-white text-xl"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1A1A1A] mb-2">Echtes Handwerk</h4>
                    <p className="text-gray-700 text-sm" style={{ fontFamily: 'Barlow, sans-serif' }}>
                      Sauber verarbeitet, ordentlich gestapelt und pünktlich ausgeliefert - alles aus einer Hand.
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-[#C04020] rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="ri-truck-line text-white text-xl"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1A1A1A] mb-2">Persönliche Auslieferung</h4>
                    <p className="text-gray-700 text-sm" style={{ fontFamily: 'Barlow, sans-serif' }}>
                      Am liebsten fährt er selbst – mit einem Lächeln im Gesicht und einer ordentlichen Portion Diesel im Blut.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-[#C04020] rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="ri-chat-smile-line text-white text-xl"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1A1A1A] mb-2">Echte Freude am Kontakt</h4>
                    <p className="text-gray-700 text-sm" style={{ fontFamily: 'Barlow, sans-serif' }}>
                      Thorsten nimmt sich die Zeit, erklärt verständlich und berät mit echter Leidenschaft.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <blockquote className="text-xl md:text-2xl text-[#C04020] font-bold mb-6 italic" style={{ fontFamily: 'Barlow, sans-serif' }}>
              "Seine robuste Art trifft auf eine echte Leidenschaft für gutes Holz."
            </blockquote>
            <p className="text-gray-700 max-w-3xl mx-auto" style={{ fontFamily: 'Barlow, sans-serif' }}>
              Thorsten kennt die Besonderheiten jeder Holzart, weiß genau, wie man Brennholz richtig lagert, 
              wie viel Restfeuchte es haben darf – und wie man das vor Ort beim Kunden fachgerecht misst.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}