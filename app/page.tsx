'use client';

import HeroSection from '@/components/HeroSection';
import USPSection from '@/components/USPSection';
import QualifierSection from '@/components/QualifierSection';
import TrustSection from '../components/TrustSection';
import Link from 'next/link';
import TestimonialSection from '@/components/TestimonialSection';
import CostCalculatorSection from '@/components/CostCalculatorSection';
import ComparisonSection from '@/components/ComparisonSection';
import ProcessSection from '@/components/ProcessSection';
import SafetySection from '@/components/SafetySection';
import OptimizedProductSection from '../components/OptimizedProductSection';
import RegionSection from '@/components/RegionSection';
import SEOMetadata from '../components/SEOMetadata';
import VideoSection from '@/components/VideoSection';
export default function Home() {
  const startTime = Date.now();
  
  // Client-Side - Products werden von den Komponenten selbst geladen
  const products: any[] = [];
  const error = null;
  
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
        <VideoSection />
        {/* Schnellzugriff zum Shop */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link
              href="/shop"
              className="bg-[#C04020] hover:bg-[#A03318] text-white px-6 py-3 rounded-lg font-bold transition-colors text-center"
            >
              Zum Shop
            </Link>
            <Link
              href="/shop"
              className="bg-white border border-gray-200 hover:border-[#C04020] hover:text-[#C04020] text-gray-900 px-6 py-3 rounded-lg font-bold transition-colors text-center"
            >
              Alle Produkte ansehen
            </Link>
          </div>
        </div>
        <USPSection />
        {/* Produkte weiter nach oben platzieren */}
        <OptimizedProductSection 
          initialProducts={products}
          loadTime={loadTime}
          error={error}
        />
        <QualifierSection />
        <TrustSection />
        <TestimonialSection />
        <CostCalculatorSection />
        <ComparisonSection />
        <ProcessSection />
        <SafetySection />
        <RegionSection />
      </div>
    </>
  );
}
