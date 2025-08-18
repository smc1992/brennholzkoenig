
'use client';

import SEOMetadata from '../../components/SEOMetadata';

export default function DatenschutzPage() {
  return (
    <>
      <SEOMetadata 
        title="Datenschutzerklärung - Brennholzkönig"
        description="Datenschutzerklärung gemäß DSGVO von Brennholzkönig. Erfahren Sie, wie wir Ihre Daten schützen und verarbeiten."
        keywords={['Datenschutz', 'DSGVO', 'Brennholzkönig', 'Datenschutzerklärung', 'Privacy']}
        pageSlug="/datenschutz"
      />

      <div className="min-h-screen bg-[#F5F0E0]">
        {/* Header */}
        <section className="bg-gradient-to-r from-[#C04020] to-[#A03318] text-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 flex items-center justify-center bg-white/20 rounded-full mr-4">
                  <i className="ri-shield-check-line text-2xl"></i>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black" style={{ fontFamily: 'Inter, sans-serif' }}>
                  DATENSCHUTZ
                </h1>
              </div>
              <p className="text-xl md:text-2xl text-white/90 font-light">
                Datenschutzerklärung gemäß DSGVO
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">

                {/* Einleitung */}
                <div className="mb-12">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-blue-900 mb-3">
                      Ihre Privatsphäre ist uns wichtig
                    </h2>
                    <p className="text-blue-800 leading-relaxed">
                      Mit dieser Datenschutzerklärung informieren wir Sie über die Art, den Umfang und Zweck der 
                      Verarbeitung von personenbezogenen Daten auf unserer Website brennholzkoenig.de. 
                      Diese Datenschutzerklärung gilt auch für unsere mobilen Anwendungen und Services.
                    </p>
                  </div>
                </div>

                {/* Verantwortlicher */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6 flex items-center">
                    <div className="w-8 h-8 flex items-center justify-center bg-[#C04020] rounded-full mr-3">
                      <i className="ri-user-line text-white"></i>
                    </div>
                    1. Verantwortlicher
                  </h2>

                  <div className="bg-[#F5F0E0] rounded-xl p-6">
                    <p className="text-gray-700">
                      <strong>Thorsten Vey</strong><br />
                      Brennholzhandel<br />
                      Frankfurter Straße 3<br />
                      36419 Buttlar<br />
                      Deutschland<br /><br />
                      <strong>Telefon:</strong> 0176-22572100<br />
                      <strong>E-Mail:</strong> info@brennholz-koenig.de<br />
                      <strong>Website:</strong> www.brennholzkoenig.de
                    </p>
                  </div>
                </div>

                {/* Erhebung personenbezogener Daten */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6 flex items-center">
                    <div className="w-8 h-8 flex items-center justify-center bg-green-600 rounded-full mr-3">
                      <i className="ri-database-line text-white"></i>
                    </div>
                    2. Erhebung personenbezogener Daten
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-[#1A1A1A] mb-3">2.1 Allgemeine Nutzung der Website</h3>
                      <p className="text-gray-700 leading-relaxed mb-4">
                        Bei jedem Zugriff auf unsere Website werden automatisch folgende Daten erhoben:
                      </p>
                      <ul className="text-gray-700 space-y-2">
                        <li className="flex items-start">
                          <div className="w-2 h-2 bg-[#C04020] rounded-full mr-3 mt-2 flex-shrink-0"></div>
                          IP-Adresse des zugreifenden Rechners
                        </li>
                        <li className="flex items-start">
                          <div className="w-2 h-2 bg-[#C04020] rounded-full mr-3 mt-2 flex-shrink-0"></div>
                          Datum und Uhrzeit des Zugriffs
                        </li>
                        <li className="flex items-start">
                          <div className="w-2 h-2 bg-[#C04020] rounded-full mr-3 mt-2 flex-shrink-0"></div>
                          Name und URL der abgerufenen Datei
                        </li>
                        <li className="flex items-start">
                          <div className="w-2 h-2 bg-[#C04020] rounded-full mr-3 mt-2 flex-shrink-0"></div>
                          Website, von der aus der Zugriff erfolgt (Referrer-URL)
                        </li>
                        <li className="flex items-start">
                          <div className="w-2 h-2 bg-[#C04020] rounded-full mr-3 mt-2 flex-shrink-0"></div>
                          Verwendeter Browser und ggf. das Betriebssystem
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-[#1A1A1A] mb-3">2.2 Bestellprozess</h3>
                      <p className="text-gray-700 leading-relaxed mb-4">
                        Zur Abwicklung Ihrer Bestellung erheben wir folgende Daten:
                      </p>
                      <ul className="text-gray-700 space-y-2">
                        <li className="flex items-start">
                          <div className="w-2 h-2 bg-green-600 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                          Vor- und Nachname
                        </li>
                        <li className="flex items-start">
                          <div className="w-2 h-2 bg-green-600 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                          Lieferadresse (Straße, Hausnummer, PLZ, Ort)
                        </li>
                        <li className="flex items-start">
                          <div className="w-2 h-2 bg-green-600 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                          E-Mail-Adresse
                        </li>
                        <li className="flex items-start">
                          <div className="w-2 h-2 bg-green-600 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                          Telefonnummer
                        </li>
                        <li className="flex items-start">
                          <div className="w-2 h-2 bg-green-600 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                          Bestellte Produkte und Mengen
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Zweck der Datenverarbeitung */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6 flex items-center">
                    <div className="w-8 h-8 flex items-center justify-center bg-blue-600 rounded-full mr-3">
                      <i className="ri-target-line text-white"></i>
                    </div>
                    3. Zweck der Datenverarbeitung
                  </h2>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-blue-900 mb-3">Vertragserfüllung</h3>
                      <ul className="text-blue-800 space-y-2 text-sm">
                        <li>• Bestellabwicklung</li>
                        <li>• Lieferung der Produkte</li>
                        <li>• Kundenservice</li>
                        <li>• Rechnungsstellung</li>
                      </ul>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-green-900 mb-3">Rechtliche Verpflichtungen</h3>
                      <ul className="text-green-800 space-y-2 text-sm">
                        <li>• Aufbewahrung von Rechnungen</li>
                        <li>• Steuerrechtliche Dokumentation</li>
                        <li>• Handelsrechtliche Archivierung</li>
                        <li>• Verbraucherschutz</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Rechtsgrundlagen */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6 flex items-center">
                    <div className="w-8 h-8 flex items-center justify-center bg-purple-600 rounded-full mr-3">
                      <i className="ri-scales-line text-white"></i>
                    </div>
                    4. Rechtsgrundlagen
                  </h2>

                  <div className="space-y-6">
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-purple-900 mb-3">Art. 6 Abs. 1 lit. b DSGVO</h3>
                      <p className="text-purple-800">
                        Verarbeitung zur Erfüllung eines Vertrags oder zur Durchführung vorvertraglicher Maßnahmen
                      </p>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-yellow-900 mb-3">Art. 6 Abs. 1 lit. c DSGVO</h3>
                      <p className="text-yellow-800">
                        Verarbeitung zur Erfüllung rechtlicher Verpflichtungen (z.B. steuerrechtliche Aufbewahrungspflichten)
                      </p>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-orange-900 mb-3">Art. 6 Abs. 1 lit. f DSGVO</h3>
                      <p className="text-orange-800">
                        Verarbeitung zur Wahrung berechtigter Interessen (z.B. Website-Sicherheit, Betrugsschutz)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Speicherdauer */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6 flex items-center">
                    <div className="w-8 h-8 flex items-center justify-center bg-red-600 rounded-full mr-3">
                      <i className="ri-time-line text-white"></i>
                    </div>
                    5. Speicherdauer
                  </h2>

                  <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-bold text-red-900 mb-2">Kundendaten</h3>
                        <p className="text-red-800 text-sm">
                          Werden für die Dauer der Geschäftsbeziehung plus gesetzliche Aufbewahrungsfristen (i.d.R. 10 Jahre) gespeichert
                        </p>
                      </div>
                      <div>
                        <h3 className="font-bold text-red-900 mb-2">Server-Log-Dateien</h3>
                        <p className="text-red-800 text-sm">
                          Werden nach 30 Tagen automatisch gelöscht
                        </p>
                      </div>
                      <div>
                        <h3 className="font-bold text-red-900 mb-2">Marketing-Daten</h3>
                        <p className="text-red-800 text-sm">
                          Werden nach Widerruf der Einwilligung oder nach 3 Jahren ohne Aktivität gelöscht
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ihre Rechte */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6 flex items-center">
                    <div className="w-8 h-8 flex items-center justify-center bg-[#C04020] rounded-full mr-3">
                      <i className="ri-user-settings-line text-white"></i>
                    </div>
                    6. Ihre Rechte
                  </h2>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-bold text-gray-900 mb-2">Auskunftsrecht (Art. 15 DSGVO)</h3>
                        <p className="text-gray-700 text-sm">
                          Sie haben das Recht, Auskunft über Ihre gespeicherten Daten zu erhalten
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-bold text-gray-900 mb-2">Berichtigungsrecht (Art. 16 DSGVO)</h3>
                        <p className="text-gray-700 text-sm">
                          Sie können die Berichtigung unrichtiger Daten verlangen
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-bold text-gray-900 mb-2">Löschungsrecht (Art. 17 DSGVO)</h3>
                        <p className="text-gray-700 text-sm">
                          Sie können die Löschung Ihrer Daten verlangen
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-bold text-gray-900 mb-2">Einschränkungsrecht (Art. 18 DSGVO)</h3>
                        <p className="text-gray-700 text-sm">
                          Sie können die Einschränkung der Verarbeitung verlangen
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-bold text-gray-900 mb-2">Datenübertragbarkeit (Art. 20 DSGVO)</h3>
                        <p className="text-gray-700 text-sm">
                          Sie können Ihre Daten in strukturiertem Format erhalten
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-bold text-gray-900 mb-2">Widerspruchsrecht (Art. 21 DSGVO)</h3>
                        <p className="text-gray-700 text-sm">
                          Sie können der Verarbeitung Ihrer Daten widersprechen
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cookies */}
                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">6. Cookies und Tracking-Technologien</h2>

                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Verwendete Cookies</h3>
                    <p className="text-gray-700 mb-4">
                      Unsere Website verwendet verschiedene Arten von Cookies und ähnliche Technologien. 
                      Sie können Ihre Cookie-Einstellungen jederzeit über unseren Cookie-Banner anpassen.
                    </p>
                  </div>

                  <div className="grid gap-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <h4 className="font-semibold text-green-900 mb-2">
                        <i className="ri-shield-check-line mr-2"></i>
                        Funktionale Cookies (Erforderlich)
                      </h4>
                      <p className="text-green-800 text-sm mb-3">
                        Diese Cookies sind für die grundlegende Funktionalität der Website erforderlich.
                      </p>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• Session-Management und Authentifizierung</li>
                        <li>• Warenkorb-Funktionalität</li>
                        <li>• Sicherheitsfeatures und CSRF-Schutz</li>
                        <li>• Cookie-Einstellungen speichern</li>
                      </ul>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h4 className="font-semibold text-blue-900 mb-2">
                        <i className="ri-bar-chart-line mr-2"></i>
                        Analytische Cookies (Optional)
                      </h4>
                      <p className="text-blue-800 text-sm mb-3">
                        Helfen uns zu verstehen, wie Besucher mit der Website interagieren.
                      </p>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• <strong>Google Analytics GA4:</strong> Anonymisierte Nutzungsstatistiken</li>
                        <li>• <strong>Google Tag Manager:</strong> Verwaltung von Tracking-Codes</li>
                        <li>• <strong>Interne Analyse:</strong> Seitenaufrufe und Klick-Tracking</li>
                        <li>• <strong>Speicherdauer:</strong> 26 Monate (GA4), Session-basiert (intern)</li>
                      </ul>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                      <h4 className="font-semibold text-purple-900 mb-2">
                        <i className="ri-advertisement-line mr-2"></i>
                        Marketing Cookies (Optional)
                      </h4>
                      <p className="text-purple-800 text-sm mb-3">
                        Werden verwendet, um personalisierte Werbung anzuzeigen.
                      </p>
                      <ul className="text-sm text-purple-700 space-y-1">
                        <li>• <strong>Google Ads:</strong> Conversion-Tracking und Remarketing</li>
                        <li>• <strong>Google Tag Manager:</strong> Marketing-Tags verwalten</li>
                        <li>• <strong>Speicherdauer:</strong> Bis zu 540 Tage</li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <h4 className="font-semibold text-amber-900 mb-2">Externe Dienste und Technologien</h4>
                    <ul className="text-sm text-amber-800 space-y-1">
                      <li>• <strong>Google Fonts:</strong> Schriftarten von Google (DSGVO-konform eingebunden)</li>
                      <li>• <strong>Supabase:</strong> Datenbank, Authentifizierung und Backend-Services</li>
                      <li>• <strong>Remix Icons:</strong> Icon-Bibliothek</li>
                      <li>• <strong>Next.js:</strong> Website-Framework von Vercel</li>
                    </ul>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-800 mb-3">Ihre Rechte bezüglich Cookies</h4>
                    <p className="text-gray-700 mb-4">
                      Sie haben folgende Möglichkeiten bezüglich der Verwendung von Cookies:
                    </p>
                    <ul className="text-gray-700 space-y-2">
                      <li>• Cookie-Einstellungen über unseren Cookie-Banner anpassen</li>
                      <li>• Cookies in Ihren Browser-Einstellungen deaktivieren</li>
                      <li>• Bereits gesetzte Cookies löschen</li>
                      <li>• Widerspruch gegen Google Analytics: <a href="https://tools.google.com/dlpage/gaoptout" className="text-amber-600 hover:underline" target="_blank" rel="noopener">Browser-Add-on installieren</a></li>
                    </ul>
                  </div>
                </section>

                {/* Google Analytics und Tag Manager */}
                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">7. Google Analytics und Tag Manager</h2>
                  <p className="text-gray-700 mb-4">
                    Diese Website nutzt Google Analytics GA4 und Google Tag Manager, Webanalysedienste der Google LLC ("Google").
                  </p>

                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">Datenverarbeitung</h3>
                    <ul className="text-gray-700 space-y-2">
                      <li>• <strong>Anbieter:</strong> Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA</li>
                      <li>• <strong>Zweck:</strong> Analyse des Nutzerverhaltens, Webseitenoptimierung</li>
                      <li>• <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. a DSGVO (Einwilligung)</li>
                      <li>• <strong>Datenübertragung:</strong> USA (angemessenes Schutzniveau durch Adequacy Decision)</li>
                      <li>• <strong>IP-Anonymisierung:</strong> Aktiviert (anonymizeIP)</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Gesammelte Daten</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Anonymisierte IP-Adresse</li>
                      <li>• Seitenaufrufe und Verweildauer</li>
                      <li>• Browser und Betriebssystem</li>
                      <li>• Referrer-URL</li>
                      <li>• Demographische Merkmale (falls aktiviert)</li>
                    </ul>
                  </div>
                </section>

                {/* Kontakt bei Datenschutzfragen */}
                <div className="bg-gradient-to-r from-[#C04020] to-[#A03318] rounded-2xl p-8 text-white text-center">
                  <h3 className="text-2xl font-bold mb-4">Datenschutz-Kontakt</h3>
                  <p className="text-white/90 mb-6">
                    Bei Fragen zum Datenschutz oder zur Ausübung Ihrer Rechte kontaktieren Sie uns:
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a
                      href="mailto:info@brennholz-koenig.de"
                      className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-mail-line mr-2"></i>
                      info@brennholz-koenig.de
                    </a>
                    <a
                      href="tel:+4917622572100"
                      className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-phone-line mr-2"></i>
                      0176-22572100
                    </a>
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/20">
                    <p className="text-white/80 text-sm">
                      <strong>Beschwerderecht:</strong> Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde 
                      über die Verarbeitung Ihrer personenbezogenen Daten zu beschweren.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>
      </div>
    </>

  );
}
