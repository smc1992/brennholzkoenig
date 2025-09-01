
import { createServerSupabase } from '@/lib/supabase-server'
import ShopHero from './ShopHero';
import RealtimeProductGrid from '../../components/RealtimeProductGrid';
import ShopInfo from './ShopInfo';
import SEOMetadata from '../../components/SEOMetadata';
import { Suspense } from 'react';

// Server-side Shop mit SSR-Performance-Optimierung
export default async function ShopPage() {
  const supabase = createServerSupabase()
  
  try {
    // Server-side Produktdaten vorladen für bessere Performance
    const startTime = Date.now()
    
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('id', { ascending: true })
    
    const loadTime = Date.now() - startTime
    
    console.log(`🛍️ Shop products preloaded in ${loadTime}ms:`, {
      productCount: products?.length || 0,
      loadTime,
      hasError: !!error
    })
    
    return (
      <>
        <SEOMetadata 
          title="Premium Brennholz Shop - Buche, Eiche, Birke kaufen | Brennholzkönig"
          description="Entdecken Sie unser Premium Brennholz-Sortiment: Buche, Eiche, Birke und mehr. Kammergetrocknet auf 6-8% Restfeuchte. Sofort lieferbar in Rhön-Grabfeld und Umgebung."
          keywords={['Brennholz Shop', 'Brennholz kaufen', 'Buche Brennholz', 'Eiche Brennholz', 'Birke Brennholz', 'Kaminholz bestellen', 'trocken', '6-8% Restfeuchte', 'Rhön-Grabfeld']}
          url="https://brennholzkoenig.de/shop"
          image="https://readdy.ai/api/search-image?query=Premium%20firewood%20shop%20display%20with%20neatly%20stacked%20beech%20and%20spruce%20wood%20logs%2C%20professional%20wooden%20warehouse%20interior%2C%20warm%20ambient%20lighting%2C%20rustic%20wooden%20shelves%20filled%20with%20different%20types%20of%20firewood%2C%20cozy%20atmosphere%2C%20high%20quality%20wood%20products%20presentation&width=1200&height=630&seq=shop-seo-image&orientation=landscape"
        />
        

        
        <div>
          <ShopHero />
          <Suspense fallback={
            <div className="container mx-auto px-4 py-8">
              <div className="text-center">
                <div className="animate-spin w-12 h-12 border-4 border-[#C04020] border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Produkte werden geladen...</p>
              </div>
            </div>
          }>
            <RealtimeProductGrid 
              initialProducts={products || []} 
              loadTime={loadTime}
              error={error?.message || null}
            />
          </Suspense>
          <ShopInfo />
        </div>
      </>
    );
  } catch (error) {
    console.error('Shop page error:', error)
    
    // Fallback bei Server-Fehlern
    return (
      <>
        <SEOMetadata 
          title="Premium Brennholz Shop - Buche, Eiche, Birke kaufen | Brennholzkönig"
          description="Entdecken Sie unser Premium Brennholz-Sortiment: Buche, Eiche, Birke und mehr. Kammergetrocknet auf 6-8% Restfeuchte. Sofort lieferbar in Rhön-Grabfeld und Umgebung."
          keywords={['Brennholz Shop', 'Brennholz kaufen', 'Buche Brennholz', 'Eiche Brennholz', 'Birke Brennholz', 'Kaminholz bestellen', 'trocken', '6-8% Restfeuchte', 'Rhön-Grabfeld']}
          url="https://brennholzkoenig.de/shop"
          image="https://readdy.ai/api/search-image?query=Premium%20firewood%20shop%20display%20with%20neatly%20stacked%20beech%20and%20spruce%20wood%20logs%2C%20professional%20wooden%20warehouse%20interior%2C%20warm%20ambient%20lighting%2C%20rustic%20wooden%20shelves%20filled%20with%20different%20types%20of%20firewood%2C%20cozy%20atmosphere%2C%20high%20quality%20wood%20products%20presentation&width=1200&height=630&seq=shop-seo-image&orientation=landscape"
        />
        <div>
          <ShopHero />
          <RealtimeProductGrid 
            initialProducts={[]} 
            loadTime={0}
            error="Server-Fehler beim Laden der Produkte"
          />
          <ShopInfo />
        </div>
      </>
    );
  }
}