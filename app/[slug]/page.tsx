import { Metadata, ResolvingMetadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import CityLandingClient from './CityLandingClient';
import { notFound } from 'next/navigation';

const getSupabase = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
};

export async function generateStaticParams() {
    const supabase = getSupabase();
    const { data: cities } = await supabase
        .from('city_pages')
        .select('slug')
        .eq('is_active', true);

    if (!cities) return [];

    return cities.map((city) => ({
        slug: String(city.slug),
    }));
}

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> },
    parent: ResolvingMetadata
): Promise<Metadata> {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;
    const supabase = getSupabase();
    const { data: cityPage } = await supabase
        .from('city_pages')
        .select('meta_title, meta_description, local_keywords')
        .eq('slug', slug)
        .single();

    if (!cityPage) {
        return {
            title: 'Stadt nicht gefunden - Brennholz König',
            robots: { index: false, follow: false }
        };
    }

    // Also query seo_metadata for fallback/overrides
    const { data: seoData } = await supabase
        .from('seo_metadata')
        .select('title, description, keywords, canonical_url, robots_directive')
        .eq('page_path', `/${slug}`)
        .single();

    const title = seoData?.title || cityPage.meta_title || `Brennholz Lieferung nach ${slug}`;
    const description = seoData?.description || cityPage.meta_description;
    const keywords = seoData?.keywords || cityPage.local_keywords?.join(', ');

    const canonical = seoData?.canonical_url || `https://brennholz-koenig.de/${slug}`;

    // Parse robots directive if it exists
    let robotsObj: any = { index: true, follow: true };
    if (seoData?.robots_directive) {
        const parts = seoData.robots_directive.toLowerCase().split(',').map((p: string) => p.trim());
        robotsObj = {
            index: parts.includes('index'),
            follow: parts.includes('follow'),
            noimageindex: parts.includes('noimageindex')
        };
    }

    return {
        title,
        description,
        keywords,
        alternates: {
            canonical: canonical,
        },
        robots: robotsObj,
        openGraph: {
            title,
            description,
            url: canonical,
            type: 'website',
        }
    };
}

export default async function CityPage({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;
    const supabase = getSupabase();

    const { data: cityPage } = await supabase
        .from('city_pages')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

    if (!cityPage) {
        notFound();
    }

    const { data: businessData } = await supabase
        .from('local_business_settings')
        .select('*')
        .single();

    // Structured Data für Local SEO
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: 'Brennholz König',
        image: 'https://brennholz-koenig.de/logo.png',
        '@id': `https://brennholz-koenig.de/${slug}`,
        url: `https://brennholz-koenig.de/${slug}`,
        telephone: cityPage.phone_display || businessData?.phone || '+49 176 71085234',
        address: {
            '@type': 'PostalAddress',
            streetAddress: businessData?.street || 'Nürnberger Str. 97',
            addressLocality: cityPage.name, // Use city name dynamically
            postalCode: businessData?.postal_code || '34123',
            addressCountry: 'DE',
        },
        geo: {
            '@type': 'GeoCoordinates',
            latitude: cityPage.coordinates?.lat || businessData?.lat || 51.3127,
            longitude: cityPage.coordinates?.lng || businessData?.lng || 9.4797,
        },
        openingHoursSpecification: businessData?.opening_hours || [
            {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                opens: '08:00',
                closes: '18:00',
            },
            {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: 'Saturday',
                opens: '09:00',
                closes: '14:00',
            },
        ],
        priceRange: '$$',
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />
            <CityLandingClient cityPage={cityPage} localBusinessData={businessData} />
        </>
    );
}
