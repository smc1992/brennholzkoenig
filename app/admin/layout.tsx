import { Suspense } from 'react'

// Einfaches Admin Layout ohne Auth-Prüfung - Middleware übernimmt die Authentifizierung
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="admin-layout min-h-screen bg-gray-100">
      {/* Admin Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 flex items-center justify-center bg-[#C04020] rounded-lg">
                <i className="ri-admin-line text-white text-lg"></i>
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#1A1A1A]">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Brennholzkönig Verwaltung</p>
              </div>
            </div>
            
            {/* Performance Indicator */}
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Middleware-geschützt</span>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1">
        <Suspense fallback={
          <div className="p-6">
            <div className="animate-pulse space-y-6">
              {/* Loading Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                ))}
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Loading Indicator */}
            <div className="fixed bottom-4 right-4">
              <div className="bg-[#C04020] text-white px-4 py-2 rounded-lg shadow-lg flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                <span className="text-sm font-medium">Lade Dashboard...</span>
              </div>
            </div>
          </div>
        }>
          {children}
        </Suspense>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span>© 2024 Brennholzkönig</span>
            <span>•</span>
            <span>Admin Dashboard v2.0</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Middleware-Authentifizierung aktiv</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Metadata für bessere SEO und Performance
export const metadata = {
  title: 'Admin Dashboard - Brennholzkönig',
  description: 'Verwaltungsbereich für Brennholzkönig',
  robots: 'noindex, nofollow', // Admin-Bereich nicht indexieren
}