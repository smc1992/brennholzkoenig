import Link from 'next/link';

export default function ProductNotFound() {
  return (
    <div className="min-h-screen bg-pergament flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mb-8">
          <i className="ri-search-line text-6xl text-[#C04020] mb-4"></i>
          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-4">
            Produkt nicht gefunden
          </h1>
          <p className="text-gray-600 mb-8">
            Das gesuchte Produkt existiert nicht oder ist nicht mehr verfügbar.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/shop"
            className="inline-block bg-[#C04020] text-white px-6 py-3 rounded-lg hover:bg-[#A03318] transition-colors font-medium"
          >
            <i className="ri-arrow-left-line mr-2"></i>
            Zurück zum Shop
          </Link>
          
          <div>
            <Link 
              href="/"
              className="text-[#C04020] hover:text-[#A03318] transition-colors"
            >
              Zur Startseite
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}