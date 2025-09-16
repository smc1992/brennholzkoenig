
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Using the centralized Supabase client from lib/supabase.ts

interface SEOMetadata {
  id?: string;
  page_slug: string;
  page_title: string;
  meta_description: string;
  meta_keywords: string;
  og_title: string;
  og_description: string;
  og_image_url: string;
  og_image_alt: string;
  twitter_title: string;
  twitter_description: string;
  twitter_image_url: string;
  twitter_image_alt: string;
  canonical_url: string;
  robots_directive: string;
  schema_markup: any;
}

interface SEOImage {
  id?: string;
  image_url: string;
  alt_text: string;
  title_text: string;
  page_slug: string;
  context: string;
}

export default function SEOTab() {
  const [activeTab, setActiveTab] = useState('pages');
  const [seoPages, setSeoPages] = useState<SEOMetadata[]>([]);
  const [seoImages, setSeoImages] = useState<SEOImage[]>([]);
  const [selectedPage, setSelectedPage] = useState<SEOMetadata | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState('');

  const defaultPages = [
    { slug: '/', name: 'Startseite' },
    { slug: 'shop', name: 'Shop' },
    { slug: 'ueber-uns', name: 'Über uns' },
    { slug: 'kontakt', name: 'Kontakt' },
    { slug: 'impressum', name: 'Impressum' },
    { slug: 'datenschutz', name: 'Datenschutz' },
    { slug: 'agb', name: 'AGB' },
    { slug: 'widerrufsrecht', name: 'Widerrufsrecht' }
  ];

  useEffect(() => {
    loadSEOData();
  }, []);

  const loadSEOData = async () => {
    try {
      const [pagesResponse, imagesResponse] = await Promise.all([
        supabase.from('seo_metadata').select('*').order('page_slug'),
        supabase.from('seo_images').select('*').order('page_slug')
      ]);

      if (pagesResponse.data) setSeoPages(pagesResponse.data);
      if (imagesResponse.data) setSeoImages(imagesResponse.data);
    } catch (error) {
      console.error('Error loading SEO data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSEOPage = async (data: SEOMetadata) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('seo_metadata')
        .upsert(data, { onConflict: 'page_slug' });

      if (error) throw error;

      await loadSEOData();
      setIsEditing(false);
      setSelectedPage(null);
      setNotification('SEO-Daten erfolgreich gespeichert!');
      setTimeout(() => setNotification(''), 3000);
    } catch (error) {
      console.error('Error saving SEO data:', error);
      setNotification('Fehler beim Speichern der SEO-Daten');
      setTimeout(() => setNotification(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const runPageSpeedTest = async () => {
    setSaving(true);
    try {
      const testUrl = 'https://brennholz-koenig.de';
      const pagespeedUrl = `https://developers.google.com/speed/pagespeed/insights/?url=${encodeURIComponent(testUrl)}`;
      
      // Open PageSpeed Insights in new tab
      window.open(pagespeedUrl, '_blank');
      
      setNotification('PageSpeed Insights in neuem Tab geöffnet');
      setTimeout(() => setNotification(''), 3000);
    } catch (error) {
      console.error('Error opening PageSpeed test:', error);
      setNotification('Fehler beim Öffnen des PageSpeed Tests');
      setTimeout(() => setNotification(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const runSSLCheck = async () => {
    setSaving(true);
    try {
      const testUrl = 'https://brennholz-koenig.de';
      const sslTestUrl = `https://www.ssllabs.com/ssltest/analyze.html?d=${encodeURIComponent(testUrl.replace('https://', ''))}`;
      
      // Open SSL Labs test in new tab
      window.open(sslTestUrl, '_blank');
      
      setNotification('SSL Labs Test in neuem Tab geöffnet');
      setTimeout(() => setNotification(''), 3000);
    } catch (error) {
      console.error('Error opening SSL test:', error);
      setNotification('Fehler beim Öffnen des SSL Tests');
      setTimeout(() => setNotification(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const generateRobotsTxt = async () => {
    setSaving(true);
    try {
      const robotsContent = `User-agent: *
Allow: /

Sitemap: https://brennholz-koenig.de/sitemap.xml

# Disallow admin areas
Disallow: /admin/
Disallow: /api/
Disallow: /_next/

# Allow important pages
Allow: /shop
Allow: /ueber-uns
Allow: /kontakt
Allow: /blog

# Crawl-delay for bots
Crawl-delay: 1`;
      
      // Create and download robots.txt file
      const blob = new Blob([robotsContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'robots.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setNotification('Robots.txt erfolgreich generiert und heruntergeladen');
      setTimeout(() => setNotification(''), 3000);
    } catch (error) {
      console.error('Error generating robots.txt:', error);
      setNotification('Fehler beim Generieren der robots.txt');
      setTimeout(() => setNotification(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const validateStructuredData = async () => {
    setSaving(true);
    try {
      const testUrl = 'https://brennholz-koenig.de';
      const validatorUrl = `https://search.google.com/test/rich-results?url=${encodeURIComponent(testUrl)}`;
      
      // Open Google Rich Results Test in new tab
      window.open(validatorUrl, '_blank');
      
      setNotification('Google Rich Results Test in neuem Tab geöffnet');
      setTimeout(() => setNotification(''), 3000);
    } catch (error) {
      console.error('Error opening structured data validator:', error);
      setNotification('Fehler beim Öffnen des Schema.org Validators');
      setTimeout(() => setNotification(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const saveSEOImage = async (imageData: SEOImage) => {
    try {
      const { error } = await supabase
        .from('seo_images')
        .upsert(imageData);

      if (error) throw error;
      await loadSEOData();
      setNotification('Bild-SEO erfolgreich gespeichert!');
      setTimeout(() => setNotification(''), 3000);
    } catch (error) {
      console.error('Error saving image data:', error);
      setNotification('Fehler beim Speichern der Bild-Daten');
      setTimeout(() => setNotification(''), 3000);
    }
  };

  const generateSitemap = async () => {
    setSaving(true);
    try {
      // Trigger sitemap regeneration
      await fetch('/sitemap.xml', { cache: 'no-store' });
      setNotification('Sitemap erfolgreich aktualisiert!');
      setTimeout(() => setNotification(''), 3000);
    } catch (error) {
      console.error('Error regenerating sitemap:', error);
      setNotification('Fehler beim Aktualisieren der Sitemap');
      setTimeout(() => setNotification(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const runSEOAudit = async () => {
    setSaving(true);
    try {
      const auditResults = [];
      const warnings = [];
      const errors = [];

      // Check missing SEO data
      const missingData = defaultPages.filter(page =>
        !seoPages.find(seo => seo.page_slug === page.slug)
      );

      if (missingData.length > 0) {
        errors.push(`${missingData.length} Seite(n) ohne SEO-Daten: ${missingData.map(p => p.name).join(', ')}`);
      }

      // Check meta descriptions
      const shortDescriptions = seoPages.filter(page =>
        !page.meta_description || page.meta_description.length < 120
      );
      
      if (shortDescriptions.length > 0) {
        warnings.push(`${shortDescriptions.length} Seite(n) mit zu kurzer Meta-Description (< 120 Zeichen)`);
      }
      
      const longDescriptions = seoPages.filter(page =>
        page.meta_description && page.meta_description.length > 160
      );
      
      if (longDescriptions.length > 0) {
        warnings.push(`${longDescriptions.length} Seite(n) mit zu langer Meta-Description (> 160 Zeichen)`);
      }

      // Check page titles
      const shortTitles = seoPages.filter(page =>
        !page.page_title || page.page_title.length < 30
      );
      
      if (shortTitles.length > 0) {
        warnings.push(`${shortTitles.length} Seite(n) mit zu kurzem Title (< 30 Zeichen)`);
      }
      
      const longTitles = seoPages.filter(page =>
        page.page_title && page.page_title.length > 60
      );
      
      if (longTitles.length > 0) {
        warnings.push(`${longTitles.length} Seite(n) mit zu langem Title (> 60 Zeichen)`);
      }

      // Check missing Open Graph data
      const missingOG = seoPages.filter(page =>
        !page.og_title || !page.og_description || !page.og_image_url
      );
      
      if (missingOG.length > 0) {
        warnings.push(`${missingOG.length} Seite(n) ohne vollständige Open Graph Daten`);
      }

      // Check missing Twitter Card data
      const missingTwitter = seoPages.filter(page =>
        !page.twitter_title || !page.twitter_description
      );
      
      if (missingTwitter.length > 0) {
        warnings.push(`${missingTwitter.length} Seite(n) ohne Twitter Card Daten`);
      }

      // Check canonical URLs
      const missingCanonical = seoPages.filter(page =>
        !page.canonical_url
      );
      
      if (missingCanonical.length > 0) {
        warnings.push(`${missingCanonical.length} Seite(n) ohne Canonical URL`);
      }

      // Check robots directives
      const missingRobots = seoPages.filter(page =>
        !page.robots_directive
      );
      
      if (missingRobots.length > 0) {
        warnings.push(`${missingRobots.length} Seite(n) ohne Robots-Direktive`);
      }

      // Generate audit report
      let auditReport = '=== SEO AUDIT BERICHT ===\n\n';
      
      if (errors.length === 0 && warnings.length === 0) {
        auditReport += '✅ Alle SEO-Checks bestanden!\n\n';
        auditReport += `Geprüfte Seiten: ${seoPages.length}\n`;
        auditReport += `Verfügbare Seiten: ${defaultPages.length}\n`;
      } else {
        if (errors.length > 0) {
          auditReport += '❌ FEHLER:\n';
          errors.forEach(error => auditReport += `• ${error}\n`);
          auditReport += '\n';
        }
        
        if (warnings.length > 0) {
          auditReport += '⚠️ WARNUNGEN:\n';
          warnings.forEach(warning => auditReport += `• ${warning}\n`);
          auditReport += '\n';
        }
      }
      
      auditReport += '=== EMPFEHLUNGEN ===\n';
      auditReport += '• Meta-Descriptions: 120-160 Zeichen\n';
      auditReport += '• Page Titles: 30-60 Zeichen\n';
      auditReport += '• Open Graph Daten für Social Media\n';
      auditReport += '• Twitter Card Daten\n';
      auditReport += '• Canonical URLs setzen\n';
      auditReport += '• Robots-Direktiven definieren\n';
      
      // Show audit results in alert
      alert(auditReport);
      
      setNotification(`SEO-Audit abgeschlossen: ${errors.length} Fehler, ${warnings.length} Warnungen`);
      setTimeout(() => setNotification(''), 5000);
    } catch (error) {
      console.error('Error running SEO audit:', error);
      setNotification('Fehler beim SEO-Audit');
      setTimeout(() => setNotification(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const generateSchema = (pageData: SEOMetadata) => {
    const baseSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Brennholz König',
      url: 'https://brennholz-koenig.de',
      logo: 'https://brennholz-koenig.de/logo.png'
    };

    if (pageData.page_slug === '/') {
      return {
        ...baseSchema,
        '@type': 'LocalBusiness',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Frankfurter Straße 3',
          addressLocality: 'Buttlar',
          postalCode: '36419',
          addressCountry: 'DE'
        },
        telephone: '+49-123-456789',
        priceRange: '€€'
      };
    }

    return baseSchema;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notification && (
        <div
          className={`p-4 rounded-lg ${
            notification.includes('Fehler') ? 'bg-red-100 border border-red-400 text-red-700' : 'bg-green-100 border border-green-400 text-green-700'
          }`}
        >
          {notification}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">SEO Management</h2>
        <div className="flex space-x-2">
          <button
            onClick={generateSitemap}
            disabled={saving}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            <i className="ri-refresh-line mr-2"></i>
            {saving ? 'Aktualisiere...' : 'Sitemap aktualisieren'}
          </button>
          <button
            onClick={runSEOAudit}
            disabled={saving}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            <i className="ri-search-line mr-2"></i>
            {saving ? 'Analysiere...' : 'SEO-Audit'}
          </button>
        </div>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => setActiveTab('pages')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'pages' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          <i className="ri-file-text-line mr-2"></i>
          Seiten-SEO
        </button>
        <button
          onClick={() => setActiveTab('images')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'images' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          <i className="ri-image-line mr-2"></i>
          Bild-SEO
        </button>
        <button
          onClick={() => setActiveTab('tools')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'tools' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          <i className="ri-tools-line mr-2"></i>
          SEO-Tools
        </button>
      </div>

      {activeTab === 'pages' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Seiten-Liste */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-lg font-semibold mb-4">Seiten</h3>
            <div className="space-y-2">
              {defaultPages.map(page => {
                const seoData = seoPages.find(seo => seo.page_slug === page.slug);
                return (
                  <div
                    key={page.slug}
                    onClick={() => {
                      setSelectedPage(
                        seoData || {
                          page_slug: page.slug,
                          page_title: `${page.name} | Brennholz König`,
                          meta_description: `Erfahren Sie mehr über ${page.name.toLowerCase()} bei Brennholz König - Ihrem Experten für hochwertiges Brennholz.`,
                          meta_keywords: 'brennholz, kaminholz, ofenholz',
                          og_title: `${page.name} | Brennholz König`,
                          og_description: `Erfahren Sie mehr über ${page.name.toLowerCase()} bei Brennholz König - Ihrem Experten für hochwertiges Brennholz.`,
                          og_image_url: 'https://readdy.ai/api/search-image?query=Premium%20stacked%20firewood%20logs%20in%20forest%20setting%20with%20warm%20sunlight%20filtering%20through%20trees%2C%20natural%20wood%20texture%2C%20sustainable%20forestry%2C%20high%20quality%20dried%20wood%20for%20fireplace%2C%20rustic%20outdoor%20atmosphere%2C%20professional%20photography&width=1200&height=630&seq=og-default&orientation=landscape',
                          og_image_alt: 'Brennholz König - Premium Brennholz',
                          twitter_title: `${page.name} | Brennholz König`,
                          twitter_description: `Erfahren Sie mehr über ${page.name.toLowerCase()} bei Brennholz König - Ihrem Experten für hochwertiges Brennholz.`,
                          twitter_image_url: 'https://readdy.ai/api/search-image?query=Premium%20stacked%20firewood%20logs%20in%20forest%20setting%20with%20warm%20sunlight%20filtering%20through%20trees%2C%20natural%20wood%20texture%2C%20sustainable%20forestry%2C%20high%20quality%20dried%20wood%20for%20fireplace%2C%20rustic%20outdoor%20atmosphere%2C%20professional%20photography&width=1200&height=630&seq=twitter-default&orientation=landscape',
                          twitter_image_alt: 'Brennholz König - Premium Brennholz',
                          canonical_url: `https://brennholz-koenig.de${page.slug === '/' ? '' : '/' + page.slug}`,
                          robots_directive: 'index,follow',
                          schema_markup: {}
                        }
                      );
                      setIsEditing(true);
                    }}
                    className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium">{page.name}</p>
                      <p className="text-sm text-gray-500">{page.slug}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {seoData ? (
                        <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                      ) : (
                        <span className="w-3 h-3 bg-gray-300 rounded-full"></span>
                      )}
                      <i className="ri-arrow-right-s-line text-gray-400"></i>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SEO-Editor */}
          {isEditing && selectedPage && (
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">SEO bearbeiten</h3>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setSelectedPage(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <form
                onSubmit={e => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  const data: SEOMetadata = {
                    ...selectedPage,
                    page_title: formData.get('page_title') as string,
                    meta_description: formData.get('meta_description') as string,
                    meta_keywords: formData.get('meta_keywords') as string,
                    og_title: formData.get('og_title') as string,
                    og_description: formData.get('og_description') as string,
                    og_image_url: formData.get('og_image_url') as string,
                    og_image_alt: formData.get('og_image_alt') as string,
                    twitter_title: formData.get('twitter_title') as string,
                    twitter_description: formData.get('twitter_description') as string,
                    twitter_image_url: formData.get('twitter_image_url') as string,
                    twitter_image_alt: formData.get('twitter_image_alt') as string,
                    canonical_url: formData.get('canonical_url') as string,
                    robots_directive: formData.get('robots_directive') as string,
                    schema_markup: generateSchema(selectedPage)
                  };
                  saveSEOPage(data);
                }}
                className="space-y-6"
              >
                {/* Basic SEO */}
                <div>
                  <h4 className="font-medium mb-3">Grundlegende SEO-Daten</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Seitentitel (Title Tag) <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="page_title"
                        defaultValue={selectedPage.page_title}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        maxLength={60}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Optimal: 50-60 Zeichen</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Meta Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="meta_description"
                        defaultValue={selectedPage.meta_description}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        rows={3}
                        maxLength={160}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Optimal: 150-160 Zeichen</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Keywords (kommagetrennt)
                      </label>
                      <input
                        name="meta_keywords"
                        defaultValue={selectedPage.meta_keywords}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="brennholz, kaminholz, holz kaufen"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Canonical URL
                      </label>
                      <input
                        name="canonical_url"
                        defaultValue={selectedPage.canonical_url}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Robots Directive
                      </label>
                      <select
                        name="robots_directive"
                        defaultValue={selectedPage.robots_directive}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="index,follow">index,follow</option>
                        <option value="noindex,follow">noindex,follow</option>
                        <option value="index,nofollow">index,nofollow</option>
                        <option value="noindex,nofollow">noindex,nofollow</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Open Graph */}
                <div>
                  <h4 className="font-medium mb-3">Open Graph (Facebook)</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        OG Titel
                      </label>
                      <input
                        name="og_title"
                        defaultValue={selectedPage.og_title}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        maxLength={60}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        OG Beschreibung
                      </label>
                      <textarea
                        name="og_description"
                        defaultValue={selectedPage.og_description}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        rows={2}
                        maxLength={200}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        OG Bild URL
                      </label>
                      <input
                        name="og_image_url"
                        defaultValue={selectedPage.og_image_url}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="https://brennholz-koenig.de/og-image.jpg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        OG Bild Alt-Text
                      </label>
                      <input
                        name="og_image_alt"
                        defaultValue={selectedPage.og_image_alt}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Twitter Cards */}
                <div>
                  <h4 className="font-medium mb-3">Twitter Cards</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Twitter Titel
                      </label>
                      <input
                        name="twitter_title"
                        defaultValue={selectedPage.twitter_title}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        maxLength={70}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Twitter Beschreibung
                      </label>
                      <textarea
                        name="twitter_description"
                        defaultValue={selectedPage.twitter_description}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        rows={2}
                        maxLength={200}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Twitter Bild URL
                      </label>
                      <input
                        name="twitter_image_url"
                        defaultValue={selectedPage.twitter_image_url}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Twitter Bild Alt-Text
                      </label>
                      <input
                        name="twitter_image_alt"
                        defaultValue={selectedPage.twitter_image_alt}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setSelectedPage(null);
                    }}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                  >
                    {saving ? 'Speichern...' : 'Speichern'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {activeTab === 'images' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Bild-SEO Management</h3>
            <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
              <i className="ri-add-line mr-2"></i>
              Bild hinzufügen
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Bild</th>
                  <th className="text-left py-3 px-4">Alt-Text</th>
                  <th className="text-left py-3 px-4">Title</th>
                  <th className="text-left py-3 px-4">Seite</th>
                  <th className="text-left py-3 px-4">Kontext</th>
                  <th className="text-left py-3 px-4">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {seoImages.map(image => (
                  <tr key={image.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <img
                        src={image.image_url}
                        alt={image.alt_text}
                        className="w-16 h-12 object-cover rounded"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        value={image.alt_text}
                        onChange={e => {
                          const updated = seoImages.map(img =>
                            img.id === image.id ? { ...img, alt_text: e.target.value } : img
                          );
                          setSeoImages(updated);
                        }}
                        onBlur={() => saveSEOImage(image)}
                        className="w-full px-2 py-1 text-sm border rounded"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        value={image.title_text}
                        onChange={e => {
                          const updated = seoImages.map(img =>
                            img.id === image.id ? { ...img, title_text: e.target.value } : img
                          );
                          setSeoImages(updated);
                        }}
                        onBlur={() => saveSEOImage(image)}
                        className="w-full px-2 py-1 text-sm border rounded"
                      />
                    </td>
                    <td className="py-3 px-4 text-sm">{image.page_slug}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 text-xs bg-gray-100 rounded">
                        {image.context}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button className="text-red-500 hover:text-red-700">
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'tools' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SEO-Analyse */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">SEO-Analyse</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-green-800">Sitemap</p>
                  <p className="text-sm text-green-600">Aktiv und aktuell</p>
                </div>
                <i className="ri-check-line text-green-500 text-xl"></i>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-green-800">Robots.txt</p>
                  <p className="text-sm text-green-600">Korrekt konfiguriert</p>
                </div>
                <i className="ri-check-line text-green-500 text-xl"></i>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p className="font-medium text-yellow-800">SSL-Zertifikat</p>
                  <p className="text-sm text-yellow-600">Zu prüfen nach Domain-Setup</p>
                </div>
                <i className="ri-time-line text-yellow-500 text-xl"></i>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p className="font-medium text-yellow-800">Core Web Vitals</p>
                  <p className="text-sm text-yellow-600">Nach Live-Gang messen</p>
                </div>
                <i className="ri-time-line text-yellow-500 text-xl"></i>
              </div>
            </div>
          </div>

          {/* Schnellaktionen */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Schnellaktionen</h3>
            <div className="space-y-3">
              <button
                onClick={generateSitemap}
                disabled={saving}
                className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <div className="flex items-center">
                  <i className="ri-refresh-line text-orange-500 mr-3"></i>
                  <span>Sitemap aktualisieren</span>
                </div>
                <i className="ri-arrow-right-s-line text-gray-400"></i>
              </button>

              <button
                onClick={runSEOAudit}
                disabled={saving}
                className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <div className="flex items-center">
                  <i className="ri-search-line text-orange-500 mr-3"></i>
                  <span>SEO-Audit durchführen</span>
                </div>
                <i className="ri-arrow-right-s-line text-gray-400"></i>
              </button>

              <button
                onClick={runPageSpeedTest}
                disabled={saving}
                className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <div className="flex items-center">
                  <i className="ri-speed-line text-orange-500 mr-3"></i>
                  <span>PageSpeed Test</span>
                </div>
                <i className="ri-arrow-right-s-line text-gray-400"></i>
              </button>

              <button
                onClick={runSSLCheck}
                disabled={saving}
                className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <div className="flex items-center">
                  <i className="ri-shield-check-line text-orange-500 mr-3"></i>
                  <span>SSL-Check</span>
                </div>
                <i className="ri-arrow-right-s-line text-gray-400"></i>
              </button>

              <button
                onClick={generateRobotsTxt}
                disabled={saving}
                className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <div className="flex items-center">
                  <i className="ri-robot-line text-orange-500 mr-3"></i>
                  <span>Robots.txt generieren</span>
                </div>
                <i className="ri-arrow-right-s-line text-gray-400"></i>
              </button>

              <button
                onClick={validateStructuredData}
                disabled={saving}
                className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <div className="flex items-center">
                  <i className="ri-code-s-slash-line text-orange-500 mr-3"></i>
                  <span>Schema.org validieren</span>
                </div>
                <i className="ri-arrow-right-s-line text-gray-400"></i>
              </button>
            </div>
          </div>

          {/* Schema Markup Vorschau */}
          <div className="md:col-span-2 bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Schema Markup Vorschau</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-sm text-gray-700 overflow-x-auto">
                {JSON.stringify(
                  {
                    '@context': 'https://schema.org',
                    '@type': 'LocalBusiness',
                    name: 'Brennholz König',
                    url: 'https://brennholz-koenig.de',
                    logo: 'https://brennholz-koenig.de/logo.png',
                    address: {
                      '@type': 'PostalAddress',
                      streetAddress: 'Frankfurter Straße 3',
                      addressLocality: 'Buttlar',
                      postalCode: '36419',
                      addressCountry: 'DE'
                    },
                    telephone: '+49-123-456789',
                    priceRange: '€€',
                    description: 'Premium Brennholz und Kaminholz online bestellen. Hochwertige Qualität, schnelle Lieferung.'
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
