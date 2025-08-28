'use client';

import HeroSection from '@/components/HeroSection';
import USPSection from '@/components/USPSection';
import QualifierSection from '@/components/QualifierSection';
import TrustSection from '../components/TrustSection';
import TestimonialSection from '@/components/TestimonialSection';
import CostCalculatorSection from '@/components/CostCalculatorSection';
import ComparisonSection from '@/components/ComparisonSection';
import ProcessSection from '@/components/ProcessSection';
import SafetySection from '@/components/SafetySection';
import ProductSection from '@/components/ProductSection';
import RegionSection from '@/components/RegionSection';
import SEOMetadata from '../components/SEOMetadata';

export default function Home() {
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
        <ProductSection />
        <RegionSection />
      </div>
    </>
  );
}
