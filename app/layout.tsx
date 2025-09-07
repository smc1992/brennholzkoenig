import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
// Importiere die kompilierte Tailwind CSS Datei
import './output.css';
import './tailwind-safelist.css';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CookieBanner from '@/components/CookieBanner';
import GoogleAnalytics from '../components/GoogleAnalytics';
import FacebookPixel from '../components/FacebookPixel';
import PushNotifications from '@/components/PushNotifications';
import GoogleAdsTracking from '../components/GoogleAdsTracking';
// PWA functionality removed
import AnalyticsTracker from '@/components/AnalyticsTracker';
import { QueryProvider } from '@/components/QueryProvider';
import PerformanceMonitor from '@/components/PerformanceMonitor';
import DataPreloader from '@/components/DataPreloader';
import ConditionalLayout from '../components/ConditionalLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Brennholz König - Premium Brennholz direkt vom Erzeuger',
    template: '%s | Brennholz König'
  },
  description: 'Hochwertiges Brennholz aus nachhaltiger Forstwirtschaft. Kammergetrocknet, ofenfertig und direkt zu Ihnen geliefert.',
  keywords: 'brennholz, kaminholz, ofenholz, brennholz kaufen, kammergetrocknet',
  authors: [{ name: 'Brennholz König' }],
  creator: 'Brennholz König',
  publisher: 'Brennholz König',
  applicationName: 'Brennholz König',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NODE_ENV === 'production' ? 'https://brennholz-koenig.de' : 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    url: 'https://brennholz-koenig.de',
    siteName: 'Brennholz König',
    title: 'Brennholz König - Premium Brennholz direkt vom Erzeuger',
    description: 'Hochwertiges Brennholz aus nachhaltiger Forstwirtschaft. Kammergetrocknet und direkt geliefert.',
    images: [
      {
        url: 'https://readdy.ai/api/search-image?query=Premium%20stacked%20firewood%20logs%20in%20forest%20setting%20with%20warm%20sunlight%20filtering%20through%20trees%2C%20natural%20wood%20texture%2C%20sustainable%20forestry%2C%20high%20quality%20dried%20wood%20for%20fireplace%2C%20rustic%20outdoor%20atmosphere%2C%20professional%20photography&width=1200&height=630&seq=og-default&orientation=landscape',
        width: 1200,
        height: 630,
        alt: 'Brennholz König - Premium Brennholz',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Brennholz König - Premium Brennholz direkt vom Erzeuger',
    description: 'Hochwertiges Brennholz aus nachhaltiger Forstwirtschaft. Kammergetrocknet und direkt geliefert.',
    images: ['https://readdy.ai/api/search-image?query=Premium%20stacked%20firewood%20logs%20in%20forest%20setting%20with%20warm%20sunlight%20filtering%20through%20trees%2C%20natural%20wood%20texture%2C%20sustainable%20forestry%2C%20high%20quality%20dried%20wood%20for%20fireplace%2C%20rustic%20outdoor%20atmosphere%2C%20professional%20photography&width=1200&height=630&seq=twitter-default&orientation=landscape'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ]
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  colorScheme: 'light',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" className="h-full">
      <head>
        <link href="https://cdn.jsdelivr.net/npm/remixicon@4.5.0/fonts/remixicon.css" rel="stylesheet" />
      </head>
      <body className={`${inter.className} min-h-dvh bg-pergament text-tiefschwarz antialiased`}>
        <QueryProvider>
          <DataPreloader />
          <CookieBanner />
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
          <GoogleAnalytics />
          <FacebookPixel pixelId="123456789012345" />
          <GoogleAdsTracking />
          <AnalyticsTracker />
          <PerformanceMonitor />
          <PushNotifications />
        </QueryProvider>
      </body>
    </html>
  )
}