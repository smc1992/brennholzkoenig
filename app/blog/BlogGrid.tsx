
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import SocialShare from '../../components/SocialShare';

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
}

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
};

export default function BlogGrid() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Alle');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadBlogPosts();
    loadCategories();
  }, [selectedCategory, searchTerm]);

  const loadBlogPosts = async () => {
    try {
      let query = supabase
        .from('page_contents')
        .select('*')
        .eq('content_type', 'blog_post')
        .eq('status', 'published')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (selectedCategory !== 'Alle') {
        query = query.eq('category', selectedCategory);
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,content_value.ilike.%${searchTerm}%,excerpt.ilike.%${searchTerm}%`);
      }

      const { data } = await query;
      setPosts(data || []);
      setFilteredPosts(data || []);
    } catch (error) {
      console.error('Error loading blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data } = await supabase
        .from('page_contents')
        .select('category')
        .eq('content_type', 'blog_post')
        .eq('status', 'published')
        .eq('is_active', true);

      const uniqueCategories = [...new Set(data?.map(item => item.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Search and Filter */}
      <div className="mb-12">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <i className="ri-search-line absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl"></i>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Blog durchsuchen..."
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('Alle')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                selectedCategory === 'Alle'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Alle Artikel
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Blog Posts Grid */}
      {posts.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-6">
            <i className="ri-article-line text-3xl text-gray-400"></i>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Keine Artikel gefunden</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {searchTerm || selectedCategory !== 'Alle'
              ? 'Versuchen Sie eine andere Suche oder Kategorie.'
              : 'Noch keine Blog-Artikel veröffentlicht. Besuchen Sie uns bald wieder!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <article key={post.id} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow group">
              <Link href={`/blog/${post.slug}`}>
                <div className="relative overflow-hidden">
                  <img
                    src={post.featured_image || `https://readdy.ai/api/search-image?query=cozy%20fireplace%20with%20burning%20seasoned%20hardwood%20logs%2C%20warm%20orange%20glow%2C%20comfortable%20living%20room%20setting%2C%20modern%20interior%20design%2C%20professional%20home%20photography&width=400&height=300&seq=blog-${post.id}&orientation=landscape`}
                    alt={post.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {post.category && (
                    <span className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">
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

                <Link href={`/blog/${post.slug}`}>
                  <h3 className="text-xl font-bold text-[#1A1A1A] mb-3 group-hover:text-green-600 transition-colors leading-tight">
                    {post.title}
                  </h3>
                </Link>

                <p className="text-gray-600 mb-4 leading-relaxed">
                  {truncateText(post.excerpt || post.content_value || '', 150)}
                </p>

                <div className="flex items-center justify-between">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center text-green-600 hover:text-green-700 font-medium transition-colors cursor-pointer"
                  >
                    Weiterlesen
                    <i className="ri-arrow-right-line ml-2"></i>
                  </Link>

                  <div className="flex items-center">
                    <SocialShare
                      url={`https://brennholz-koenig.de/blog/${post.slug}`}
                      title={post.title}
                      compact={true}
                    />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Load More */}
      {posts.length > 0 && posts.length % 9 === 0 && (
        <div className="text-center mt-12">
          <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold transition-colors cursor-pointer whitespace-nowrap">
            Mehr Artikel laden
          </button>
        </div>
      )}
    </div>
  );
}
