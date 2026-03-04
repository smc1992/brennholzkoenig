'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import SocialShare from './SocialShare';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  content_value?: string;
  excerpt: string;
  slug: string;
  featured_image: string;
  author: string;
  category: string;
  tags: string[];
  published_at: string;
  created_at: string;
  reading_time?: string;
  is_active: boolean;
  status: string;
}

// Fallback-Blog-Posts für sofortige Anzeige
const fallbackPosts: BlogPost[] = [
  {
    id: '1',
    title: 'Die richtige Lagerung von Brennholz',
    content: 'Erfahren Sie, wie Sie Ihr Brennholz optimal lagern, um die beste Qualität zu gewährleisten.',
    excerpt: 'Tipps und Tricks für die optimale Brennholz-Lagerung',
    slug: 'brennholz-richtig-lagern',
    featured_image: '',
    author: 'Brennholzkönig Team',
    category: 'Ratgeber',
    tags: ['Lagerung', 'Tipps', 'Qualität'],
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    reading_time: '5',
    is_active: true,
    status: 'published'
  },
  {
    id: '2',
    title: 'Welches Brennholz für welchen Kamin?',
    content: 'Die Wahl des richtigen Brennholzes ist entscheidend für ein optimales Feuererlebnis.',
    excerpt: 'Finden Sie das perfekte Brennholz für Ihren Kamin',
    slug: 'brennholz-fuer-kamin-waehlen',
    featured_image: '',
    author: 'Brennholzkönig Team',
    category: 'Beratung',
    tags: ['Kamin', 'Holzarten', 'Beratung'],
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    reading_time: '4',
    is_active: true,
    status: 'published'
  },
  {
    id: '3',
    title: 'Nachhaltiges Heizen mit Holz',
    content: 'Warum Heizen mit Holz eine umweltfreundliche Alternative ist.',
    excerpt: 'Umweltfreundlich und nachhaltig heizen',
    slug: 'nachhaltiges-heizen-holz',
    featured_image: '',
    author: 'Brennholzkönig Team',
    category: 'Nachhaltigkeit',
    tags: ['Nachhaltigkeit', 'Umwelt', 'Heizen'],
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    reading_time: '6',
    is_active: true,
    status: 'published'
  }
];

interface OptimizedBlogGridProps {
  maxPosts?: number;
  showSearch?: boolean;
  showCategories?: boolean;
  initialPosts?: BlogPost[];
  loadTime?: number;
  error?: string | null;
}

export default function OptimizedBlogGrid({ 
  maxPosts,
  showSearch = true,
  showCategories = true,
  initialPosts = [],
  loadTime = 0,
  error: serverError = null
}: OptimizedBlogGridProps) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts.length > 0 ? initialPosts : fallbackPosts);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Alle');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(initialPosts.length === 0);
  const [realtimeError, setRealtimeError] = useState<string | null>(null);
  const [isRealTimeActive, setIsRealTimeActive] = useState<boolean>(false);
  
  // Kombiniere Server- und Real-time Fehler
  const combinedError = serverError || realtimeError;

  // Memoized gefilterte Posts für Performance
  const filteredPosts = useMemo(() => {
    let filtered = posts;
    
    // Kategorie-Filter
    if (selectedCategory !== 'Alle') {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }
    
    // Such-Filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchLower) ||
        post.excerpt.toLowerCase().includes(searchLower) ||
        post.content.toLowerCase().includes(searchLower) ||
        post.category.toLowerCase().includes(searchLower)
      );
    }
    
    // Limit anwenden
    if (maxPosts) {
      filtered = filtered.slice(0, maxPosts);
    }
    
    return filtered;
  }, [posts, selectedCategory, searchTerm, maxPosts]);

  // Memoized Kategorien
  const availableCategories = useMemo(() => {
    const cats = Array.from(new Set(posts.map(post => post.category).filter(Boolean)));
    return ['Alle', ...cats];
  }, [posts]);

  useEffect(() => {
    loadBlogPosts();
  }, []);

  const loadBlogPosts = async () => {
    // Nur laden wenn keine Server-Daten vorhanden
    if (initialPosts.length > 0) {
      console.log('Blog: Verwende Server-Side Blog-Posts');
      return;
    }
    
    try {
      setLoading(true);
      setRealtimeError(null);
      
      const { data, error: fetchError } = await supabase
        .from('page_contents')
        .select('*')
        .eq('content_type', 'blog_post')
        .eq('status', 'published')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(50); // Performance-Limit

      if (fetchError) {
        throw fetchError;
      }

      if (data && data.length > 0) {
        const typedPosts: BlogPost[] = data.map((item: any) => ({
          id: item.id?.toString() || '',
          title: item.title || '',
          content: item.content || '',
          content_value: item.content_value || '',
          excerpt: item.excerpt || item.content?.substring(0, 150) + '...' || '',
          slug: item.slug || '',
          featured_image: item.featured_image || '',
          author: item.author || 'Brennholzkönig Team',
          category: item.category || 'Allgemein',
          tags: item.tags || [],
          published_at: item.published_at || item.created_at,
          created_at: item.created_at || '',
          reading_time: item.reading_time || '3',
          is_active: item.is_active !== false,
          status: item.status || 'published'
        }));
        
        setPosts(typedPosts);
        setIsRealTimeActive(true);
        console.log(`Blog: ${typedPosts.length} Posts aus Datenbank geladen`);
      } else {
        console.log('Blog: Keine Posts in Datenbank, verwende Fallback');
      }
    } catch (error) {
      console.error('Blog: Fehler beim Laden der Posts:', error);
      setRealtimeError('Fehler beim Laden der Blog-Posts');
      // Behalte Fallback-Posts bei Fehlern
    } finally {
      setLoading(false);
    }
  };

  const refreshPosts = async () => {
    await loadBlogPosts();
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('de-DE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Kürzlich';
    }
  };

  const getImageUrl = (post: BlogPost) => {
    if (post.featured_image) {
      return post.featured_image;
    }
    return `https://readdy.ai/api/search-image?query=cozy%20fireplace%20with%20burning%20seasoned%20hardwood%20logs%2C%20warm%20orange%20glow%2C%20comfortable%20living%20room%20setting%2C%20modern%20interior%20design%2C%20professional%20home%20photography&width=400&height=300&seq=blog-${post.id}&orientation=landscape`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Blog & Ratgeber</h2>
        <div className="flex items-center space-x-4">
          <button 
            onClick={refreshPosts}
            className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded transition-colors"
            title="Posts aktualisieren"
          >
            <i className="ri-refresh-line"></i>
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      {(showSearch || showCategories) && (
        <div className="mb-8 md:mb-12">
          <div className="flex flex-col lg:flex-row gap-4 md:gap-6 items-start lg:items-center justify-between">
            {showSearch && (
              <div className="relative flex-1 max-w-md">
                <i className="ri-search-line absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl"></i>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Blog durchsuchen..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C04020] focus:border-transparent text-sm"
                />
              </div>
            )}

            {showCategories && (
              <div className="flex flex-wrap gap-2">
                {availableCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      selectedCategory === category
                        ? 'bg-[#C04020] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error State */}
      {combinedError && (
        <div className="mb-8 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{combinedError}</p>
          <button 
            onClick={refreshPosts}
            className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Erneut versuchen
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && initialPosts.length === 0 && posts.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="bg-white rounded-2xl shadow-sm animate-pulse">
              <div className="w-full h-48 bg-gray-200 rounded-t-2xl"></div>
              <div className="p-6 space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Blog Posts Grid */}
      {!loading && (
        <>
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12 md:py-16">
              <div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-6">
                <i className="ri-article-line text-2xl md:text-3xl text-gray-400"></i>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">Keine Artikel gefunden</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {searchTerm || selectedCategory !== 'Alle'
                  ? 'Versuchen Sie eine andere Suche oder Kategorie.'
                  : 'Noch keine Blog-Artikel veröffentlicht. Besuchen Sie uns bald wieder!'}
              </p>
              {(searchTerm || selectedCategory !== 'Alle') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('Alle');
                  }}
                  className="mt-4 bg-[#C04020] text-white px-6 py-2 rounded-lg hover:bg-[#A03518] transition-colors"
                >
                  Alle Artikel anzeigen
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {filteredPosts.map((post) => (
                <article key={post.id} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 group">
                  <Link href={`/blog/${post.slug}`}>
                    <div className="relative overflow-hidden">
                      <img
                        src={getImageUrl(post)}
                        alt={post.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/api/placeholder?width=400&height=300&text=Blog+Bild';
                        }}
                      />
                      {post.category && (
                        <span className="absolute top-4 left-4 bg-[#C04020] text-white px-3 py-1 rounded-full text-xs font-bold">
                          {post.category}
                        </span>
                      )}
                    </div>
                  </Link>

                  <div className="p-6">
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <i className="ri-calendar-line mr-2"></i>
                      <time>{formatDate(post.created_at)}</time>
                      <span className="mx-2">•</span>
                      <i className="ri-time-line mr-1"></i>
                      <span>{post.reading_time || '3'} Min. Lesezeit</span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#C04020] transition-colors">
                      <Link href={`/blog/${post.slug}`}>
                        {post.title}
                      </Link>
                    </h3>

                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <i className="ri-user-line mr-2"></i>
                        <span>{post.author}</span>
                      </div>
                      
                      <Link 
                        href={`/blog/${post.slug}`}
                        className="text-[#C04020] hover:text-[#A03318] font-medium text-sm transition-colors"
                      >
                        Weiterlesen →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Post Count */}
          <div className="mt-8 text-center text-gray-600">
            <p>{filteredPosts.length} von {posts.length} Artikeln angezeigt</p>
          </div>
        </>
      )}
    </div>
  );
}