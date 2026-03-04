'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAdminRoute) {
    // Admin-Bereich: Nur Content ohne Header/Footer
    return <>{children}</>;
  }

  // Normale Seiten: Mit Header und Footer
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}