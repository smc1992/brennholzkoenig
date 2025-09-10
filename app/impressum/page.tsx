
'use client';

import SEOMetadata from '../../components/SEOMetadata';

export default function ImpressumPage() {
  return (
    <>

      <SEOMetadata 
        title="Impressum - Brennholzkönig"
        description="Impressum und Angaben gemäß § 5 DDG von Brennholzkönig - Ihr Premium Brennholz-Lieferant in Rhön-Grabfeld."
        keywords={['Impressum', 'Brennholzkönig', 'Thorsten Vey', 'Buttlar', 'Kontakt']}
        url="https://brennholzkoenig.de/impressum"
      />

      <div className="min-h-screen bg-[#F5F0E0)">
        {/* Header */}
        <section className="bg-gradient-to-r from-[#C04020] to-[#A03318] text-white py-16 mt-16 md:mt-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 flex items-center justify-center bg-white/20 rounded-full mr-4">
                  <i className="ri-file-text-line text-2xl"></i>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black" style={{ fontFamily: 'Inter, sans-serif' }}>
                  IMPRESSUM
                </h1>
              </div>
              <p className="text-xl md:text-2xl text-white/90 font-light">
                Angaben gemäß § 5 DDG
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">

                {/* Unternehmensangaben */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6 flex items-center">
                    <div className="w-8 h-8 flex items-center justify-center bg-[#C04020] rounded-full mr-3">
                      <i className="ri-building-line text-white"></i>
                    </div>
                    Angaben gemäß § 5 DDG
                  </h2>

                  <div className="bg-[#F5F0E0] rounded-xl p-6">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Firmenname</h3>
                        <p className="text-gray-700 mb-2">
                          <strong>Thorsten Vey</strong><br />
                          Brennholzhandel
                        </p>

                        <h4 className="text-lg font-bold text-[#1A1A1A] mb-3 mt-6">Anschrift</h4>
                        <p className="text-gray-700">
                          Frankfurter Straße 3<br />
                          36419 Buttlar<br />
                          Deutschland
                        </p>
                      </div>

                      <div>
                        <h4 className="text-lg font-bold text-[#1A1A1A] mb-3">Kontakt</h4>
                        <p className="text-gray-700 mb-4">
                          <strong>Telefon:</strong> +49 176 71085234<br />
                          <strong>E-Mail:</strong> info@brennholz-koenig.de<br />
                          <strong>Website:</strong> www.brennholzkoenig.de
                        </p>

                        <h4 className="text-lg font-bold text-[#1A1A1A] mb-3">Geschäftszeiten</h4>
                        <p className="text-gray-700">
                          Montag - Freitag: 8:00 - 18:00 Uhr<br />
                          Samstag: 9:00 - 16:00 Uhr<br />
                          Sonntag: Nach Vereinbarung
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rechtliche Angaben */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6 flex items-center">
                    <div className="w-8 h-8 flex items-center justify-center bg-blue-600 rounded-full mr-3">
                      <i className="ri-scales-line text-white"></i>
                    </div>
                    Rechtliche Angaben
                  </h2>

                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-blue-900 mb-3">Umsatzsteuer-Identifikationsnummer</h3>
                      <p className="text-blue-800">
                        <strong>USt-IdNr.:</strong> DE200789994
                      </p>
                    </div>


                  </div>
                </div>

                {/* Verantwortlichkeit */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6 flex items-center">
                    <div className="w-8 h-8 flex items-center justify-center bg-purple-600 rounded-full mr-3">
                      <i className="ri-user-star-line text-white"></i>
                    </div>
                    Verantwortlich für den Inhalt
                  </h2>

                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                    <p className="text-purple-800">
                      <strong>Thorsten Vey</strong><br />
                      Brennholzhandel<br />
                      Frankfurter Straße 3<br />
                      36419 Buttlar<br />
                      Deutschland
                    </p>
                  </div>
                </div>

                {/* Haftungsausschluss */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6 flex items-center">
                    <div className="w-8 h-8 flex items-center justify-center bg-orange-600 rounded-full mr-3">
                      <i className="ri-shield-line text-white"></i>
                    </div>
                    Haftungsausschluss
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-[#1A1A1A] mb-3">Haftung für Inhalte</h3>
                      <p className="text-gray-700 leading-relaxed">
                        Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach den 
                        allgemeinen Gesetzen verantwortlich. Wir sind jedoch nicht 
                        unter der Verpflichtung, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach 
                        Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-[#1A1A1A] mb-3">Haftung für Links</h3>
                      <p className="text-gray-700 leading-relaxed">
                        Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. 
                        Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der 
                        verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-[#1A1A1A] mb-3">Urheberrecht</h3>
                      <p className="text-gray-700 leading-relaxed">
                        Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen 
                        Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der 
                        Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Online-Streitbeilegung */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6 flex items-center">
                    <div className="w-8 h-8 flex items-center justify-center bg-yellow-600 rounded-full mr-3">
                      <i className="ri-scales-3-line text-white"></i>
                    </div>
                    Streitbeilegung
                  </h2>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-yellow-900 mb-3">Online-Streitbeilegung (OS)</h3>
                    <p className="text-yellow-800 leading-relaxed">
                      Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: 
                      <br />
                      <a 
                        href="https://ec.europa.eu/consumers/odr/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                      >
                        https://ec.europa.eu/consumers/odr/
                      </a>
                    </p>
                    <p className="text-yellow-800 mt-4">
                      Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer 
                      Verbraucherschlichtungsstelle teilzunehmen.
                    </p>
                  </div>
                </div>

                {/* Kontakt-CTA */}
                <div className="bg-gradient-to-r from-[#C04020] to-[#A03318] rounded-2xl p-8 text-white text-center">
                  <h3 className="text-2xl font-bold mb-4">Haben Sie Fragen?</h3>
                  <p className="text-white/90 mb-6">
                    Kontaktieren Sie uns bei rechtlichen Fragen oder Anliegen
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a
                      href="tel:+4917671085234"
                      className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-phone-line mr-2"></i>
                      +49 176 71085234
                    </a>
                    <a
                      href="mailto:info@brennholz-koenig.de"
                      className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-mail-line mr-2"></i>
                      E-Mail senden
                    </a>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>
      </div>
    </>)
}
