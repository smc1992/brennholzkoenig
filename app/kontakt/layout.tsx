
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Kontakt - Brennholz König | Premium Brennholz Beratung',
  description: 'Kontaktieren Sie Brennholhandel Vey für Premium Brennholz. Persönliche Beratung, schnelle Lieferung. Tel: 0561-43071895 | Buttlar, Deutschland',
  keywords: 'Brennholz Kontakt, Brennholz Beratung, Brennholhandel Vey, Buttlar, Brennholz kaufen, Kaminholz bestellen',
  openGraph: {
    title: 'Kontakt - Brennholz König | Premium Brennholz Beratung',
    description: 'Kontaktieren Sie uns für Premium Brennholz. Persönliche Beratung und schnelle Lieferung.',
    type: 'website',
    locale: 'de_DE',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#C04020',
  colorScheme: 'light',
};

export default function KontaktLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
