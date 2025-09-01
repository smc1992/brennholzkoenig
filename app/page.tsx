import HeroSection from '@/components/HeroSection';
import USPSection from '@/components/USPSection';
import QualifierSection from '@/components/QualifierSection';
import TrustSection from '../components/TrustSection';
import TestimonialSection from '@/components/TestimonialSection';
import CostCalculatorSection from '@/components/CostCalculatorSection';
import ComparisonSection from '@/components/ComparisonSection';
import ProcessSection from '@/components/ProcessSection';
import SafetySection from '@/components/SafetySection';
import OptimizedProductSection from '../components/OptimizedProductSection';
import RegionSection from '@/components/RegionSection';
import SEOMetadata from '../components/SEOMetadata';
import { createServerSupabase } from '@/lib/supabase-server';

export default async function Home() {
  const startTime = Date.now();
  
  // Server-Side Product Preloading für Homepage
  const supabase = createServerSupabase();
  let products = [];
  let error = null;
  
  try {
    const { data, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .eq('in_stock', true)
      .limit(3)
      .order('id');
    
    if (fetchError) throw fetchError;
    products = data || [];
  } catch (err: any) {
    error = err.message;
    console.error('Homepage: Fehler beim Laden der Produkte:', err);
  }
  
  const loadTime = Date.now() - startTime;
  console.log(`🏠 Homepage products preloaded in ${loadTime}ms: { productCount: ${products.length}, loadTime: ${loadTime}, hasError: ${!!error} }`);
  return (
    <>
      <SEOMetadata 
        pageSlug="/"
        defaultTitle="Brennholz König - Premium Brennholz & Kaminholz online kaufen"
        defaultDescription="Bestellen Sie hochwertiges Brennholz und Kaminholz beim Brennholz König. Schnelle Lieferung, faire Preise und erstklassige Qualität für Ihren Kamin und Ofen."
      />
      <div className="min-h-dvh bg-pergament w-full">
        <HeroSection />
        <USPSection />
        <QualifierSection />
        <TrustSection />
        <TestimonialSection />
        <CostCalculatorSection />
        <ComparisonSection />
        <ProcessSection />
        <SafetySection />
        <OptimizedProductSection 
          initialProducts={products}
          loadTime={loadTime}
          error={error}
        />
        <RegionSection />
      </div>
    </>
  );
}
