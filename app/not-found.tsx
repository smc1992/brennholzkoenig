
import Link from 'next/link';
import { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  themeColor: '#C04020',
  colorScheme: 'light'
};

export const metadata: Metadata = {
  title: '404 - Seite nicht gefunden | Brennholz König',
  description: 'Die angeforderte Seite konnte nicht gefunden werden. Kehren Sie zur Startseite zurück oder durchsuchen Sie unser Brennholz-Sortiment.'
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <img
            src="https://readdy.ai/api/search-image?query=warm%20cozy%20fireplace%20with%20burning%20logs%2C%20soft%20orange%20glow%2C%20rustic%20wooden%20cabin%20interior%2C%20peaceful%20winter%20evening%20atmosphere%2C%20professional%20photography%20style%2C%20warm%20lighting%2C%20no%20people&width=400&height=300&seq=404-illustration&orientation=landscape"
            alt="Gemütlicher Kamin"
            className="w-full max-w-md mx-auto rounded-lg shadow-lg object-cover"
          />
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h1 className="text-8xl font-bold text-orange-600 mb-4">404</h1>
          <h2 className="text-3xl font-semibold text-gray-800 mb-4">
            Seite nicht gefunden
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Die Seite, die Sie suchen, existiert nicht oder wurde verschoben. 
            Wie ein Feuer ohne Holz - hier ist nichts zu finden.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors whitespace-nowrap"
          >
            <i className="ri-home-line w-5 h-5 flex items-center justify-center mr-2"></i>
            Zur Startseite
          </Link>
          
          <Link
            href="/shop"
            className="inline-flex items-center px-6 py-3 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors whitespace-nowrap"
          >
            <i className="ri-shopping-bag-line w-5 h-5 flex items-center justify-center mr-2"></i>
            Zum Shop
          </Link>
          
          <Link
            href="/kontakt"
            className="inline-flex items-center px-6 py-3 border-2 border-orange-600 text-orange-600 font-medium rounded-lg hover:bg-orange-600 hover:text-white transition-colors whitespace-nowrap"
          >
            <i className="ri-mail-line w-5 h-5 flex items-center justify-center mr-2"></i>
            Kontakt
          </Link>
        </div>

        {/* Popular Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Beliebte Seiten
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <Link
              href="/shop"
              className="text-orange-600 hover:text-orange-700 hover:underline"
            >
              Brennholz Shop
            </Link>
            <Link
              href="/ueber-uns"
              className="text-orange-600 hover:text-orange-700 hover:underline"
            >
              Über uns
            </Link>
            <Link
              href="/blog"
              className="text-orange-600 hover:text-orange-700 hover:underline"
            >
              Blog & Tipps
            </Link>
            <Link
              href="/konto"
              className="text-orange-600 hover:text-orange-700 hover:underline"  
            >
              Mein Konto
            </Link>
          </div>
        </div>

        {/* Search Suggestion */}
        <div className="mt-8 p-6 bg-white rounded-lg shadow-sm">
          <div className="flex items-center justify-center mb-3">
            <i className="ri-lightbulb-line w-6 h-6 flex items-center justify-center text-amber-500 mr-2"></i>
            <span className="font-medium text-gray-800">Tipp</span>
          </div>
          <p className="text-gray-600">
            Nutzen Sie unsere Suche oder kontaktieren Sie uns direkt. 
            Wir helfen Ihnen gerne bei der Auswahl des richtigen Brennholzes!
          </p>
        </div>
      </div>
    </div>
  );
}
