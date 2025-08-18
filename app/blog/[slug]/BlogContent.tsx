'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface SocialShareProps {
  url: string;
  title: string;
}

const SocialShare = ({ url, title }: SocialShareProps) => {
  return (
    <div className="flex gap-2">
      <a 
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition-colors"
      >
        <i className="ri-facebook-fill"></i>
      </a>
      <a 
        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-sky-500 hover:bg-sky-600 text-white p-2 rounded-full transition-colors"
      >
        <i className="ri-twitter-fill"></i>
      </a>
      <a 
        href={`https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full transition-colors"
      >
        <i className="ri-whatsapp-fill"></i>
      </a>
    </div>
  );
};

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  featured_image: string;
  author: string;
  category: string;
  tags: string[];
  published_at: string;
  created_at: string;
  updated_at: string;
  meta_title?: string;
  meta_description?: string;
  reading_time?: string;
  views?: number;
}

interface BlogContentProps {
  slug: string;
}

export default function BlogContent({ slug }: BlogContentProps) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      'Brennholz-Wissen': 'bg-amber-100 text-amber-800',
      'Heizen & Energie': 'bg-red-100 text-red-800',
      'Nachhaltigkeit': 'bg-green-100 text-green-800',
      'Tipps & Tricks': 'bg-blue-100 text-blue-800',
      'Produkte': 'bg-purple-100 text-purple-800'
    };
    
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  useEffect(() => {
    loadBlogPost();
  }, [slug]);

  const loadBlogPost = async () => {
    try {
      const { data } = await supabase
        .from('page_contents')
        .select('*')
        .eq('content_type', 'blog_post')
        .eq('slug', slug)
        .eq('status', 'published')
        .eq('is_active', true)
        .single();

      if (data) {
        setPost(data);
        loadRelatedPosts(data.category, data.id);
      }
    } catch (error) {
      console.error('Error loading blog post:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedPosts = async (category: string, currentPostId: string) => {
    try {
      const { data } = await supabase
        .from('page_contents')
        .select('*')
        .eq('content_type', 'blog_post')
        .eq('category', category)
        .eq('status', 'published')
        .eq('is_active', true)
        .neq('id', currentPostId)
        .limit(3);

      setRelatedPosts(data || []);
    } catch (error) {
      console.error('Error loading related posts:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="w-full h-64 bg-gray-200 rounded-xl mb-8"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/5"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-24 h-24 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-6">
          <i className="ri-article-line text-3xl text-gray-400"></i>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Artikel nicht gefunden</h1>
        <p className="text-gray-600 mb-8">Der gesuchte Blog-Artikel existiert nicht oder wurde entfernt.</p>
        <Link
          href="/blog"
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold transition-colors cursor-pointer whitespace-nowrap"
        >
          Zurück zum Blog
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Breadcrumbs */}
      <nav className="mb-8">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li>
            <Link href="/" className="hover:text-green-600">
              Home
            </Link>
          </li>
          <i className="ri-arrow-right-s-line"></i>
          <li>
            <Link href="/blog" className="hover:text-green-600">
              Blog
            </Link>
          </li>
          <i className="ri-arrow-right-s-line"></i>
          <li className="text-gray-800 font-medium truncate">{post.title}</li>
        </ol>
      </nav>

      {/* Article Header */}
      <header className="mb-12">
        {post.category && (
          <span className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-bold mb-4">
            {post.category}
          </span>
        )}

        <h1 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-6 leading-tight">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="text-xl text-gray-600 mb-6 leading-relaxed">
            {post.excerpt}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8">
          <div className="flex items-center">
            <i className="ri-calendar-line mr-2"></i>
            <time>{formatDate(post.created_at)}</time>
          </div>
          <div className="flex items-center">
            <i className="ri-time-line mr-2"></i>
            <span>{post.reading_time || '5'} Min. Lesezeit</span>
          </div>
          <div className="flex items-center">
            <i className="ri-eye-line mr-2"></i>
            <span>{post.views || 0} Aufrufe</span>
          </div>
        </div>

        {/* Featured Image */}
        {post.featured_image && (
          <div className="relative rounded-2xl overflow-hidden mb-8">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-96 object-cover"
            />
          </div>
        )}
      </header>

      {/* Article Content */}
      <div className="prose prose-lg max-w-none">
        <div
          className="text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>

      {/* Article Footer */}
      <footer className="mt-12 pt-8 border-t border-gray-200">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">Artikel teilen</h3>
            <SocialShare
              url={`https://brennholz-koenig.de/blog/${post.slug}`}
              title={post.title}
            />
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-500 mb-2">Haben Sie Fragen?</p>
            <Link
              href="/kontakt"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              Kontakt aufnehmen
            </Link>
          </div>
        </div>
      </footer>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="mt-16 pt-12 border-t border-gray-200">
          <h3 className="text-2xl font-bold text-[#1A1A1A] mb-8">Ähnliche Artikel</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPosts.map((relatedPost) => (
              <article key={relatedPost.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow group">
                <Link href={`/blog/${relatedPost.slug}`}>
                  <div className="relative overflow-hidden">
                    <img
                      src={
                        relatedPost.featured_image ||
                        `https://readdy.ai/api/search-image?query=cozy%20fireplace%20with%20burning%20seasoned%20hardwood%20logs%20warm%20orange%20glow%20comfortable%20living%20room&width=300&height=200&seq=related-${relatedPost.id}&orientation=landscape`
                      }
                      alt={relatedPost.title}
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </Link>

                <div className="p-4">
                  <Link href={`/blog/${relatedPost.slug}`}>
                    <h4 className="font-bold text-[#1A1A1A] mb-2 group-hover:text-green-600 transition-colors leading-tight">
                      {relatedPost.title}
                    </h4>
                  </Link>

                  <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                    {relatedPost.excerpt?.substring(0, 100)}...
                  </p>

                  <div className="flex items-center text-xs text-gray-500">
                    <i className="ri-calendar-line mr-1"></i>
                    <time>{formatDate(relatedPost.created_at)}</time>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}