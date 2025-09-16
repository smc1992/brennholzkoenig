
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Kontakt - Brennholz König | Premium Brennholz Beratung',
  description: 'Kontaktieren Sie Brennholzkönig für Premium Brennholz. Persönliche Beratung, schnelle Lieferung. Tel: +49 176 71085234 | Eiterfeld-Großentaft, Deutschland',
  keywords: 'Brennholz Kontakt, Brennholz Beratung, Brennholzkönig, Eiterfeld-Großentaft, Brennholz kaufen, Kaminholz bestellen',
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
