import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-pergament flex items-center justify-center px-4">
      <div className="text-center max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-wood-800 mb-4">404</h1>
          <h2 className="text-3xl font-semibold text-primary-700 mb-6">
            Stadt nicht gefunden
          </h2>
          <p className="text-lg text-wood-800 mb-8">
            Die gesuchte Städte-Landingpage existiert nicht oder ist nicht verfügbar.
            Möglicherweise wurde die URL falsch eingegeben oder die Seite wurde entfernt.
          </p>
        </div>

        <div className="space-y-4">
          <Link 
            href="/"
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Zur Startseite
          </Link>
          
          <div className="mt-6">
            <p className="text-wood-800 mb-4">Oder besuchen Sie eine unserer verfügbaren Städte:</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link 
                href="/stuttgart"
                className="bg-white border border-gray-300 hover:border-primary-500 text-primary-700 px-4 py-2 rounded-md transition-colors duration-200"
              >
                Stuttgart
              </Link>
              <Link 
                href="/muenchen"
                className="bg-white border border-gray-300 hover:border-primary-500 text-primary-700 px-4 py-2 rounded-md transition-colors duration-200"
              >
                München
              </Link>
              <Link 
                href="/hamburg"
                className="bg-white border border-gray-300 hover:border-primary-500 text-primary-700 px-4 py-2 rounded-md transition-colors duration-200"
              >
                Hamburg
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 p-6 bg-white rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-wood-800 mb-3">
            Ihre Stadt ist nicht dabei?
          </h3>
          <p className="text-wood-800 mb-4">
            Kontaktieren Sie uns gerne - wir prüfen, ob wir auch in Ihr Gebiet liefern können.
          </p>
          <Link 
            href="/kontakt"
            className="inline-block border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300"
          >
            Kontakt aufnehmen
          </Link>
        </div>
      </div>
    </div>
  );
}