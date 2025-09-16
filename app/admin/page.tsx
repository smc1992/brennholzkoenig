
import { createServerSupabase, adminQueries } from '@/lib/supabase-server'
import AdminDashboardClient from './AdminDashboardClient'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import QuickRepliesTab from './QuickRepliesTab'

// Server-side Admin Dashboard mit Supabase SSR-Optimierung
export default async function AdminPage() {
  const supabase = createServerSupabase()
  
  try {
    // Supabase-empfohlene Session-Prüfung
    const { data: { session }, error } = await supabase.auth.getSession()
    
    // Redirect zu Login wenn keine Session
    if (!session || error) {
      redirect('/admin/login')
    }
    
    // Server-side Daten parallel vorladen für bessere Performance
    const [statsData, batchData] = await Promise.all([
      adminQueries.getAdminStats(),
      adminQueries.getBatchData()
    ])
    
    // Admin-User-Daten laden
    let adminUser = null
    if (session?.user?.email) {
      const { user } = await adminQueries.validateAdminUser(session.user.email)
      adminUser = user
      
      // Redirect wenn kein Admin-Zugriff
      if (!user) {
        redirect('/admin/login?error=access_denied')
      }
    }
    
    console.log(`📊 Dashboard data preloaded:`, {
      statsLoadTime: statsData.loadTime,
      batchLoadTime: batchData.loadTime,
      totalProducts: statsData.products,
      totalOrders: statsData.orders,
      totalCategories: statsData.categories
    })
    
    return (
      <div className="p-6">
        {/* Performance Info Banner */}
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 flex items-center justify-center bg-green-500 rounded-full">
                <i className="ri-rocket-line text-white"></i>
              </div>
              <div>
                <h3 className="font-semibold text-green-900">Performance-Optimiert</h3>
                <p className="text-sm text-green-700">
                  Dashboard mit Server-Side Rendering geladen in {(statsData.loadTime + batchData.loadTime).toFixed(0)}ms
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-green-700">
              <div className="flex items-center space-x-1">
                <i className="ri-database-line"></i>
                <span>Stats: {statsData.loadTime.toFixed(0)}ms</span>
              </div>
              <div className="flex items-center space-x-1">
                <i className="ri-stack-line"></i>
                <span>Data: {batchData.loadTime.toFixed(0)}ms</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Server-side geladene Statistiken */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Produkte</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">{statsData.products}</p>
              </div>
              <div className="w-12 h-12 flex items-center justify-center bg-blue-100 rounded-lg">
                <i className="ri-stack-line text-2xl text-blue-600"></i>
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-green-600">
              <i className="ri-arrow-up-line mr-1"></i>
              <span>Server-side geladen</span>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bestellungen</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">{statsData.orders}</p>
              </div>
              <div className="w-12 h-12 flex items-center justify-center bg-green-100 rounded-lg">
                <i className="ri-shopping-cart-line text-2xl text-green-600"></i>
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-green-600">
              <i className="ri-arrow-up-line mr-1"></i>
              <span>Server-side geladen</span>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Kategorien</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">{statsData.categories}</p>
              </div>
              <div className="w-12 h-12 flex items-center justify-center bg-purple-100 rounded-lg">
                <i className="ri-folder-line text-2xl text-purple-600"></i>
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-green-600">
              <i className="ri-arrow-up-line mr-1"></i>
              <span>Server-side geladen</span>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Performance</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">{(statsData.loadTime + batchData.loadTime).toFixed(0)}ms</p>
              </div>
              <div className="w-12 h-12 flex items-center justify-center bg-orange-100 rounded-lg">
                <i className="ri-speed-line text-2xl text-orange-600"></i>
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-green-600">
              <i className="ri-rocket-line mr-1"></i>
              <span>SSR optimiert</span>
            </div>
          </div>
        </div>
        
        {/* Client-side Dashboard mit vorgeladenen Daten */}
        <Suspense fallback={
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-32"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        }>
          <AdminDashboardClient 
            initialStats={statsData}
            initialBatchData={batchData}
            adminUser={adminUser}
          />
        </Suspense>
      </div>
    )
    
  } catch (error) {
    console.error('Failed to load admin dashboard:', error)
    
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 flex items-center justify-center bg-red-500 rounded-full">
              <i className="ri-error-warning-line text-white"></i>
            </div>
            <div>
              <h3 className="font-semibold text-red-900">Dashboard-Fehler</h3>
              <p className="text-sm text-red-700">
                Das Dashboard konnte nicht geladen werden. Bitte versuchen Sie es erneut.
              </p>
            </div>
          </div>
          
          <div className="mt-4">
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <i className="ri-refresh-line mr-2"></i>
              Seite neu laden
            </button>
          </div>
        </div>
      </div>
    )
  }
}

// Metadata für bessere Performance
export const metadata = {
  title: 'Dashboard - Brennholzkönig Admin',
  description: 'Admin Dashboard mit Server-Side Rendering',
}

// Revalidation für bessere Performance
export const revalidate = 60 // 1 Minute
