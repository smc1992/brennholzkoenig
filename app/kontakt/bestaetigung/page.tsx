import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Kontaktanfrage erfolgreich versendet',
  description: 'Ihre Kontaktanfrage wurde erfolgreich übermittelt. Wir melden uns schnellstmöglich bei Ihnen.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function KontaktBestaetigung() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F0E0] via-white to-[#F5F0E0] py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <i className="ri-check-line text-4xl text-green-600"></i>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4">
            Vielen Dank für Ihre Anfrage!
          </h1>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Ihre Kontaktanfrage wurde erfolgreich übermittelt. Unser Team wird sich schnellstmöglich bei Ihnen melden.
          </p>
        </div>

        {/* Information Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Response Time Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="ri-time-line text-xl text-blue-600"></i>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">
                  Antwortzeit
                </h3>
                <p className="text-gray-600">
                  Wir antworten in der Regel innerhalb von <strong>24 Stunden</strong> auf Ihre Anfrage.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Info Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-[#C04020]/10 rounded-lg flex items-center justify-center">
                  <i className="ri-phone-line text-xl text-[#C04020]"></i>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">
                  Dringende Anfragen
                </h3>
                <p className="text-gray-600">
                  Bei dringenden Fragen erreichen Sie uns auch telefonisch unter{' '}
                  <a href="tel:+4912345678901" className="text-[#C04020] font-medium hover:underline">
                    +49 123 456 78901
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 mb-8">
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6 text-center">
            Wie geht es weiter?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#C04020] text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                1
              </div>
              <h3 className="font-semibold text-[#1A1A1A] mb-2">Prüfung</h3>
              <p className="text-gray-600 text-sm">
                Wir prüfen Ihre Anfrage und bereiten eine passende Antwort vor.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-[#C04020] text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                2
              </div>
              <h3 className="font-semibold text-[#1A1A1A] mb-2">Kontakt</h3>
              <p className="text-gray-600 text-sm">
                Wir melden uns per E-Mail oder Telefon bei Ihnen zurück.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-[#C04020] text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                3
              </div>
              <h3 className="font-semibold text-[#1A1A1A] mb-2">Lösung</h3>
              <p className="text-gray-600 text-sm">
                Gemeinsam finden wir die beste Lösung für Ihr Anliegen.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-[#C04020] text-white font-medium rounded-lg hover:bg-[#A03318] transition-colors duration-200 w-full sm:w-auto"
          >
            <i className="ri-home-line mr-2"></i>
            Zur Startseite
          </Link>
          
          <Link
            href="/shop"
            className="inline-flex items-center justify-center px-6 py-3 bg-white text-[#C04020] font-medium rounded-lg border-2 border-[#C04020] hover:bg-[#C04020] hover:text-white transition-colors duration-200 w-full sm:w-auto"
          >
            <i className="ri-shopping-bag-line mr-2"></i>
            Zum Shop
          </Link>
        </div>

        {/* Additional Help */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm mb-4">
            Haben Sie weitere Fragen oder möchten Sie eine neue Anfrage stellen?
          </p>
          <Link
            href="/kontakt"
            className="text-[#C04020] font-medium hover:underline"
          >
            Neue Kontaktanfrage senden
          </Link>
        </div>
      </div>
    </div>
  );
}