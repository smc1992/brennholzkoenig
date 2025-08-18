
'use client';

import SEOMetadata from '../../components/SEOMetadata';

export default function AGBPage() {
  return (
    <>
      <SEOMetadata 
        title="AGB - Allgemeine Geschäftsbedingungen - Brennholzkönig"
        description="Allgemeine Geschäftsbedingungen von Brennholzkönig. Rechtliche Bestimmungen für den Kauf von Premium Brennholz."
        keywords={['AGB', 'Geschäftsbedingungen', 'Brennholzkönig', 'Rechtliches', 'Kaufbedingungen']}
        pageSlug="/agb"
      />

      <div className="min-h-screen bg-[#F5F0E0]">
        {/* Header */}
        <section className="bg-gradient-to-r from-[#C04020] to-[#A03318] text-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 flex items-center justify-center bg-white/20 rounded-full mr-4">
                  <i className="ri-contract-line text-2xl"></i>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black" style={{ fontFamily: 'Inter, sans-serif' }}>
                  AGB
                </h1>
              </div>
              <p className="text-xl md:text-2xl text-white/90 font-light">
                Allgemeine Geschäftsbedingungen
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
                      Gültigkeitsbereich
                    </h2>
                    <p className="text-blue-800 leading-relaxed">
                      Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge zwischen 
                      Brennholzkönig (Thorsten Müller) und unseren Kunden über die Lieferung von Brennholz 
                      und verwandten Produkten. Abweichende Bedingungen des Kunden werden nicht anerkannt, 
                      es sei denn, wir haben ihrer Geltung ausdrücklich schriftlich zugestimmt.
                    </p>
                  </div>
                </div>

                {/* Vertragsabschluss */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6 flex items-center">
                    <div className="w-8 h-8 flex items-center justify-center bg-[#C04020] rounded-full mr-3">
                      <i className="ri-handshake-line text-white"></i>
                    </div>
                    § 1 Vertragsabschluss
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-[#1A1A1A] mb-3">1.1 Bestellvorgang</h3>
                      <p className="text-gray-700 leading-relaxed">
                        Durch das Absenden einer Bestellung über unsere Website oder telefonisch geben Sie ein 
                        verbindliches Angebot zum Abschluss eines Kaufvertrages ab. Der Kaufvertrag kommt durch 
                        unsere Auftragsbestätigung (per E-Mail oder telefonisch) zustande.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-bold text-[#1A1A1A] mb-3">1.2 Mindestbestellmenge</h3>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-800">
                          <strong>Wichtiger Hinweis:</strong> Die Mindestbestellmenge beträgt 3 Schüttraummeter (SRM). 
                          Kleinere Mengen können nicht geliefert werden.
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-bold text-[#1A1A1A] mb-3">1.3 Verfügbarkeit</h3>
                      <p className="text-gray-700 leading-relaxed">
                        Alle Angebote sind freibleibend und nur solange der Vorrat reicht. Wir behalten uns vor, 
                        Bestellungen bei nicht verfügbaren Produkten abzulehnen.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Preise und Zahlung */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6 flex items-center">
                    <div className="w-8 h-8 flex items-center justify-center bg-green-600 rounded-full mr-3">
                      <i className="ri-money-euro-circle-line text-white"></i>
                    </div>
                    § 2 Preise und Zahlung
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-[#1A1A1A] mb-3">2.1 Preise</h3>
                      <p className="text-gray-700 leading-relaxed mb-4">
                        Es gelten die zum Zeitpunkt der Bestellung angezeigten Preise inklusive der gesetzlichen 
                        Mehrwertsteuer. Zusätzlich fallen Lieferkosten an, die vor Vertragsabschluss ausgewiesen werden.
                      </p>
                      
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-bold text-green-900 mb-2">Mengenrabatte</h4>
                        <ul className="text-green-800 text-sm space-y-1">
                          <li>• 3-9 SRM: Standardpreis</li>
                          <li>• 10-19 SRM: 5% Mengenrabatt</li>
                          <li>• 20-49 SRM: 8% Mengenrabatt</li>
                          <li>• ab 50 SRM: 12% Mengenrabatt</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-bold text-[#1A1A1A] mb-3">2.2 Zahlung</h3>
                      <p className="text-gray-700 leading-relaxed">
                        Die Zahlung erfolgt ausschließlich in bar bei Lieferung. Unser Fahrer führt entsprechendes 
                        Wechselgeld mit. Sie erhalten eine ordnungsgemäße Rechnung vor Ort.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lieferung */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6 flex items-center">
                    <div className="w-8 h-8 flex items-center justify-center bg-blue-600 rounded-full mr-3">
                      <i className="ri-truck-line text-white"></i>
                    </div>
                    § 3 Lieferung
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-[#1A1A1A] mb-3">3.1 Lieferzeiten</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-bold text-blue-900 mb-2">Standard-Lieferung</h4>
                          <p className="text-blue-800 text-sm">
                            1-3 Wochen nach Auftragsbestätigung<br />
                            Lieferkosten: €43,50
                          </p>
                        </div>
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <h4 className="font-bold text-orange-900 mb-2">Express-Lieferung</h4>
                          <p className="text-orange-800 text-sm">
                            24-48 Stunden nach Auftragsbestätigung<br />
                            Lieferkosten: €139,00
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-bold text-[#1A1A1A] mb-3">3.2 Liefergebiet</h3>
                      <p className="text-gray-700 leading-relaxed">
                        Wir liefern im Umkreis von 50 km um Bad Neustadt a.d.Saale. Für größere Entfernungen 
                        können zusätzliche Transportkosten anfallen.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-bold text-[#1A1A1A] mb-3">3.3 Lieferbedingungen</h3>
                      <ul className="text-gray-700 space-y-2">
                        <li className="flex items-start">
                          <div className="w-2 h-2 bg-[#C04020] rounded-full mr-3 mt-2 flex-shrink-0"></div>
                          Die Lieferung erfolgt frei Bordsteinkante
                        </li>
                        <li className="flex items-start">
                          <div className="w-2 h-2 bg-[#C04020] rounded-full mr-3 mt-2 flex-shrink-0"></div>
                          Der Lieferort muss für Lastkraftwagen zugänglich sein
                        </li>
                        <li className="flex items-start">
                          <div className="w-2 h-2 bg-[#C04020] rounded-full mr-3 mt-2 flex-shrink-0"></div>
                          Eine erwachsene Person muss zur Annahme der Lieferung anwesend sein
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Produktqualität */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6 flex items-center">
                    <div className="w-8 h-8 flex items-center justify-center bg-purple-600 rounded-full mr-3">
                      <i className="ri-award-line text-white"></i>
                    </div>
                    § 4 Produktqualität und Gewährleistung
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-[#1A1A1A] mb-3">4.1 Qualitätsstandards</h3>
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h4 className="font-bold text-purple-900 mb-2">Unser Qualitätsversprechen</h4>
                        <ul className="text-purple-800 text-sm space-y-1">
                          <li>• Kammergetrocknet auf unter 20% Restfeuchte</li>
                          <li>• Saubere Lagerung ohne Schimmel oder Fäulnis</li>
                          <li>• Einheitliche Scheitlängen (25-33 cm)</li>
                          <li>• Nachhaltiger Anbau aus regionalen Wäldern</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-bold text-[#1A1A1A] mb-3">4.2 Reklamationen</h3>
                      <p className="text-gray-700 leading-relaxed">
                        Offensichtliche Mängel sind unverzüglich, spätestens binnen einer Woche nach Lieferung, 
                        schriftlich anzuzeigen. Versteckte Mängel sind binnen einer Woche nach Entdeckung zu rügen.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Haftung */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6 flex items-center">
                    <div className="w-8 h-8 flex items-center justify-center bg-red-600 rounded-full mr-3">
                      <i className="ri-shield-line text-white"></i>
                    </div>
                    § 5 Haftung
                  </h2>
                  
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-bold text-red-900 mb-2">5.1 Haftungsausschluss</h3>
                        <p className="text-red-800 text-sm leading-relaxed">
                          Wir haften nur bei Vorsatz und grober Fahrlässigkeit. Die Haftung für leichte Fahrlässigkeit 
                          ist ausgeschlossen, soweit nicht Schäden aus der Verletzung des Lebens, des Körpers oder der 
                          Gesundheit oder aus der Verletzung wesentlicher Vertragspflichten resultieren.
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="font-bold text-red-900 mb-2">5.2 Sachschäden</h3>
                        <p className="text-red-800 text-sm leading-relaxed">
                          Sachschäden durch unsachgemäße Lagerung oder Verwendung des Brennholzes sind von unserer 
                          Haftung ausgeschlossen. Dies gilt insbesondere für Schäden durch Feuchtigkeit, Schädlinge 
                          oder unsachgemäße Verbrennung.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Eigentumsvorbehalt */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6 flex items-center">
                    <div className="w-8 h-8 flex items-center justify-center bg-yellow-600 rounded-full mr-3">
                      <i className="ri-key-line text-white"></i>
                    </div>
                    § 6 Eigentumsvorbehalt
                  </h2>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                    <p className="text-yellow-800 leading-relaxed">
                      Die gelieferte Ware bleibt bis zur vollständigen Bezahlung unser Eigentum. 
                      Bei Zahlungsverzug oder anderen Vertragsverletzungen sind wir berechtigt, 
                      die Ware zurückzunehmen.
                    </p>
                  </div>
                </div>

                {/* Datenschutz */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6 flex items-center">
                    <div className="w-8 h-8 flex items-center justify-center bg-indigo-600 rounded-full mr-3">
                      <i className="ri-shield-check-line text-white"></i>
                    </div>
                    § 7 Datenschutz
                  </h2>
                  
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
                    <p className="text-indigo-800 leading-relaxed">
                      Ihre personenbezogenen Daten werden ausschließlich zur Vertragsabwicklung verwendet. 
                      Weitere Informationen finden Sie in unserer 
                      <a href="/datenschutz" className="text-blue-600 hover:text-blue-800 underline cursor-pointer ml-1">
                        Datenschutzerklärung
                      </a>.
                    </p>
                  </div>
                </div>

                {/* Schlussbestimmungen */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6 flex items-center">
                    <div className="w-8 h-8 flex items-center justify-center bg-gray-600 rounded-full mr-3">
                      <i className="ri-file-text-line text-white"></i>
                    </div>
                    § 8 Schlussbestimmungen
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-[#1A1A1A] mb-3">8.1 Änderungen der AGB</h3>
                      <p className="text-gray-700 leading-relaxed">
                        Wir behalten uns vor, diese AGB zu ändern. Die Änderungen werden Ihnen rechtzeitig 
                        vor ihrem Inkrafttreten mitgeteilt.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-bold text-[#1A1A1A] mb-3">8.2 Gerichtsstand und anwendbares Recht</h3>
                      <p className="text-gray-700 leading-relaxed">
                        Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts. Gerichtsstand ist 
                        Bad Neustadt a.d.Saale, soweit gesetzlich zulässig.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-bold text-[#1A1A1A] mb-3">8.3 Salvatorische Klausel</h3>
                      <p className="text-gray-700 leading-relaxed">
                        Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die 
                        Wirksamkeit der übrigen Bestimmungen unberührt.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Kontakt */}
                <div className="bg-gradient-to-r from-[#C04020] to-[#A03318] rounded-2xl p-8 text-white text-center">
                  <h3 className="text-2xl font-bold mb-4">Fragen zu unseren AGB?</h3>
                  <p className="text-white/90 mb-6">
                    Bei Unklarheiten oder Fragen zu unseren Geschäftsbedingungen helfen wir gerne weiter
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a
                      href="tel:+4917622572100"
                      className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-phone-line mr-2"></i>
                      0176-22572100
                    </a>
                    <a
                      href="mailto:info@brennholz-koenig.de"
                      className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-mail-line mr-2"></i>
                      E-Mail senden
                    </a>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-white/20">
                    <p className="text-white/80 text-sm">
                      <strong>Thorsten Vey</strong><br />
                      Brennholzhandel<br />
                      Frankfurter Straße 3<br />
                      36419 Buttlar<br />
                      Deutschland<br /><br />
                      <strong>Stand der AGB:</strong> Januar 2024 | 
                      <a href="/widerrufsrecht" className="text-white hover:text-white/80 underline cursor-pointer ml-2">
                        Zum Widerrufsrecht
                      </a>
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
