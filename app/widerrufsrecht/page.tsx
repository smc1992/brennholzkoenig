'use client';

import SEOMetadata from '../../components/SEOMetadata';

export default function WiderrufsrechtPage() {
  return (
    <>
      <SEOMetadata 
        title="Widerrufsrecht - Brennholzkönig"
        description="Widerrufsrecht und Widerrufsbelehrung für Verbraucher beim Kauf von Brennholz bei Brennholzkönig. Verbraucherschutz nach deutschem Recht."
        keywords={['Widerrufsrecht', 'Widerruf', 'Brennholzkönig', 'Verbraucherschutz', 'Rückgabe']}
        url="https://brennholzkoenig.de/widerrufsrecht"
      />

      <div className="min-h-screen bg-[#F5F0E0]">
        {/* Header */}
        <section className="bg-gradient-to-r from-[#C04020] to-[#A03318] text-white py-12 sm:py-16 mt-16 md:mt-20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-4xl">
              <div className="flex items-start sm:items-center mb-4 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/20 rounded-full mr-3 sm:mr-4 flex-shrink-0 mt-1 sm:mt-0">
                  <i className="ri-arrow-go-back-line text-lg sm:text-2xl"></i>
                </div>
                <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight min-w-0" style={{ fontFamily: 'Inter, sans-serif' }}>
                  WIDERRUFSRECHT
                </h1>
              </div>
              <p className="text-base sm:text-xl md:text-2xl text-white/90 font-light leading-relaxed">
                Verbraucherschutz und Widerrufsbelehrung
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
                
                {/* Wichtiger Hinweis */}
                <div className="mb-12">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 flex items-center justify-center bg-red-600 rounded-full mr-3">
                        <i className="ri-alert-line text-white"></i>
                      </div>
                      <h2 className="text-xl font-bold text-red-900">
                        Wichtiger Hinweis zum Widerrufsrecht
                      </h2>
                    </div>
                    <p className="text-red-800 leading-relaxed">
                      <strong>Das Widerrufsrecht erlischt bei Brennholz vorzeitig</strong>, wenn die Lieferung 
                      bereits erfolgt ist und Sie der Lieferung zugestimmt haben. Dies ist gesetzlich in 
                      § 356 Abs. 5 BGB geregelt, da es sich um verderbliche Waren handelt, die schnell ihre 
                      Beschaffenheit verlieren können.
                    </p>
                  </div>
                </div>

                {/* Widerrufsbelehrung */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6 flex items-center">
                    <div className="w-8 h-8 flex items-center justify-center bg-[#C04020] rounded-full mr-3">
                      <i className="ri-file-text-line text-white"></i>
                    </div>
                    Widerrufsbelehrung
                  </h2>
                  
                  <div className="bg-[#F5F0E0] rounded-xl p-8">
                    <h3 className="text-xl font-bold text-[#1A1A1A] mb-4">Widerrufsrecht</h3>
                    
                    <p className="text-gray-700 leading-relaxed mb-6">
                      Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.
                    </p>
                    
                    <p className="text-gray-700 leading-relaxed mb-6">
                      Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem Sie oder ein von Ihnen benannter 
                      Dritter, der nicht der Beförderer ist, die Waren in Besitz genommen haben bzw. hat.
                    </p>
                    
                    <p className="text-gray-700 leading-relaxed mb-6">
                      Um Ihr Widerrufsrecht auszuüben, müssen Sie uns:
                    </p>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                      <p className="text-blue-800">
                        <strong>Brennholzkönig</strong><br />
                        Thorsten Vey<br />
                        Frankfurter Straße 3<br />
                        36419 Buttlar<br />
                        Deutschland<br /><br />
                        <strong>Telefon:</strong> +49 176 71085234<br />
                        <strong>E-Mail:</strong> info@brennholz-koenig.de
                      </p>
                    </div>
                    
                    <p className="text-gray-700 leading-relaxed mb-6">
                      mittels einer eindeutigen Erklärung (z.B. ein mit der Post versandter Brief, 
                      Telefax oder E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. 
                      Sie können dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht 
                      vorgeschrieben ist.
                    </p>
                    
                    <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Widerrufsfrist</h3>
                    <p className="text-gray-700 leading-relaxed">
                      Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung 
                      des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.
                    </p>
                  </div>
                </div>

                {/* Folgen des Widerrufs */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6 flex items-center">
                    <div className="w-8 h-8 flex items-center justify-center bg-green-600 rounded-full mr-3">
                      <i className="ri-information-line text-white"></i>
                    </div>
                    Folgen des Widerrufs
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-green-900 mb-3">Rückzahlung</h3>
                      <p className="text-green-800 leading-relaxed">
                        Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen 
                        erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, 
                        die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns angebotene, 
                        günstigste Standardlieferung gewählt haben), unverzüglich und spätestens binnen vierzehn 
                        Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags 
                        bei uns eingegangen ist.
                      </p>
                    </div>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-yellow-900 mb-3">Rücksendekosten</h3>
                      <p className="text-yellow-800 leading-relaxed">
                        Sie haben die unmittelbaren Kosten der Rücksendung der Waren zu tragen. 
                        Die Kosten werden auf höchstens etwa 150 Euro geschätzt.
                      </p>
                    </div>
                    
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-orange-900 mb-3">Wertersatz</h3>
                      <p className="text-orange-800 leading-relaxed">
                        Sie müssen für einen etwaigen Wertverlust der Waren nur aufkommen, wenn dieser 
                        Wertverlust auf einen zur Prüfung der Beschaffenheit, Eigenschaften und Funktionsweise 
                        der Waren nicht notwendigen Umgang mit ihnen zurückzuführen ist.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ausschluss des Widerrufsrechts */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6 flex items-center">
                    <div className="w-8 h-8 flex items-center justify-center bg-red-600 rounded-full mr-3">
                      <i className="ri-close-circle-line text-white"></i>
                    </div>
                    Ausschluss des Widerrufsrechts
                  </h2>
                  
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-red-900 mb-4">
                      Das Widerrufsrecht besteht nicht bei:
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="w-6 h-6 flex items-center justify-center bg-red-600 rounded-full mr-3 mt-1 flex-shrink-0">
                          <i className="ri-close-line text-white text-sm"></i>
                        </div>
                        <div>
                          <h4 className="font-bold text-red-900">Bereits geliefertes Brennholz</h4>
                          <p className="text-red-800 text-sm">
                            Verträgen zur Lieferung von Waren, die schnell verderben können oder deren 
                            Verfallsdatum schnell überschritten würde (§ 356 Abs. 1 Nr. 2 BGB).
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="w-6 h-6 flex items-center justify-center bg-red-600 rounded-full mr-3 mt-1 flex-shrink-0">
                          <i className="ri-close-line text-white text-sm"></i>
                        </div>
                        <div>
                          <h4 className="font-bold text-red-900">Individuell angefertigte Waren</h4>
                          <p className="text-red-800 text-sm">
                            Verträgen zur Lieferung von Waren, die nach Kundenspezifikation angefertigt 
                            wurden oder eindeutig auf die persönlichen Bedürfnisse zugeschnitten sind.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="w-6 h-6 flex items-center justify-center bg-red-600 rounded-full mr-3 mt-1 flex-shrink-0">
                          <i className="ri-close-line text-white text-sm"></i>
                        </div>
                        <div>
                          <h4 className="font-bold text-red-900">Bereits begonnene Dienstleistungen</h4>
                          <p className="text-red-800 text-sm">
                            Verträgen über die Erbringung von Dienstleistungen, wenn der Unternehmer 
                            mit der Ausführung der Dienstleistung mit ausdrücklicher Zustimmung des 
                            Verbrauchers vor Ablauf der Widerrufsfrist begonnen hat.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Muster-Widerrufsformular */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6 flex items-center">
                    <div className="w-8 h-8 flex items-center justify-center bg-blue-600 rounded-full mr-3">
                      <i className="ri-file-download-line text-white"></i>
                    </div>
                    Muster-Widerrufsformular
                  </h2>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <p className="text-blue-800 mb-4">
                      (Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück.)
                    </p>
                    
                    <div className="bg-white border border-blue-300 rounded-lg p-6 font-mono text-sm">
                      <p className="mb-4">
                        <strong>An:</strong><br />
                        Thorsten Vey<br />
                        Brennholzhandel<br />
                        Frankfurter Straße 3<br />
                        36419 Buttlar<br />
                        E-Mail: info@brennholz-koenig.de
                      </p>
                      
                      <p className="mb-4">
                        <strong>Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren (*)/ die Erbringung der folgenden Dienstleistung (*)</strong>
                      </p>
                      
                      <p className="mb-4">
                        _________________________________________________<br />
                        _________________________________________________
                      </p>
                      
                      <p className="mb-4">
                        <strong>Bestellt am (*)/erhalten am (*):</strong><br />
                        _________________________________________________
                      </p>
                      
                      <p className="mb-4">
                        <strong>Name des/der Verbraucher(s):</strong><br />
                        _________________________________________________
                      </p>
                      
                      <p className="mb-4">
                        <strong>Anschrift des/der Verbraucher(s):</strong><br />
                        _________________________________________________<br />
                        _________________________________________________<br />
                        _________________________________________________
                      </p>
                      
                      <p>
                        <strong>Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier):</strong><br />
                        _________________________________________________
                      </p>
                      
                      <p className="mt-4">
                        <strong>Datum:</strong><br />
                        _________________________________________________
                      </p>
                      
                      <p className="text-xs text-gray-600 mt-4">
                        (*) Unzutreffendes streichen.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Kontakt für Widerruf */}
                <div className="bg-gradient-to-r from-[#C04020] to-[#A03318] rounded-2xl p-8 text-white text-center">
                  <h3 className="text-2xl font-bold mb-4">Widerruf einreichen</h3>
                  <p className="text-white/90 mb-6">
                    Nutzen Sie diese Kontaktmöglichkeiten für Ihren Widerruf
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
                      href="tel:+4917671085234"
                      className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-phone-line mr-2"></i>
                      +49 176 71085234
                    </a>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-white/20">
                    <p className="text-white/80 text-sm">
                      <strong>Postanschrift für schriftlichen Widerruf:</strong><br />
                      Thorsten Vey, Brennholzhandel, Frankfurter Straße 3, 36419 Buttlar
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
