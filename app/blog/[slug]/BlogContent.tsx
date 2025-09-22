'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import SocialShare from '../../../components/SocialShare';
import BlogComments from '../../../components/BlogComments';
import Link from 'next/link';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  featured_image: string | null;
  author: string;
  category: string;
  tags: string[];
  reading_time: number;
  views: number;
  status: string;
  created_at: string;
  updated_at: string;
  meta_title: string;
  meta_description: string;
  canonical_url: string;
}

interface BlogContentProps {
  slug: string;
}

export default function BlogContent({ slug }: BlogContentProps) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tableOfContents, setTableOfContents] = useState<{id: string, text: string, level: number}[]>([]);

  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      'Brennholz-Wissen': 'bg-amber-100 text-amber-800',
      'Heizen & Energie': 'bg-red-100 text-red-800',
      'Nachhaltigkeit': 'bg-orange-100 text-orange-800',
      'Tipps & Tricks': 'bg-blue-100 text-blue-800',
      'Produkte': 'bg-purple-100 text-purple-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  useEffect(() => {
    loadPost();
  }, [slug]);

  useEffect(() => {
    if (post?.content) {
      generateTableOfContents(post.content);
    }
  }, [post?.content]);

  const generateTableOfContents = (content: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    const toc: {id: string, text: string, level: number}[] = Array.from(headings).map((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      const text = heading.textContent || '';
      const id = `heading-${index}`;
      
      heading.id = id;
      
      return {
        id,
        text,
        level
      };
    });
    
    setTableOfContents(toc);
  };

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const addHeadingIds = (content: string): string => {
    if (typeof window === 'undefined') return content;
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    headings.forEach((heading, index) => {
      heading.id = `heading-${index}`;
    });
    
    return doc.body.innerHTML;
  };

  const cleanTableHTML = (content: string): string => {
    // Entferne problematische colgroup und col Elemente
    let cleanedContent = content
      // Entferne colgroup mit allen col Elementen
      .replace(/<colgroup[^>]*>[\s\S]*?<\/colgroup>/gi, '')
      // Entferne einzelne col Elemente
      .replace(/<col[^>]*\/?>/gi, '')
      // Entferne colwidth Attribute aus th und td Elementen
      .replace(/\s+colwidth="[^"]*"/gi, '')
      // Entferne colspan und rowspan mit Wert 1 (redundant)
      .replace(/\s+colspan="1"/gi, '')
      .replace(/\s+rowspan="1"/gi, '')
      // Bereinige style Attribute in table Elementen
      .replace(/<table[^>]*style="[^"]*min-width:[^"]*"[^>]*>/gi, (match) => {
        return match.replace(/style="[^"]*"/gi, 'class="w-full"');
      });
    
    return cleanedContent;
  };

  const wrapTablesWithContainer = (content: string): string => {
    // Zuerst HTML bereinigen
    const cleanedContent = cleanTableHTML(content);
    
    // Server-side und Client-side kompatible Lösung
    if (typeof window === 'undefined') {
      // Server-side: Verwende String-Manipulation
      return cleanedContent.replace(
        /<table(?![^>]*class="[^"]*table-container[^"]*")[^>]*>/gi,
        (match) => `<div class="table-container overflow-x-auto">${match}`
      ).replace(
        /<\/table>/gi,
        '</table></div>'
      );
    }
    
    // Client-side: Verwende DOM-Manipulation
    const parser = new DOMParser();
    const doc = parser.parseFromString(cleanedContent, 'text/html');
    const tables = doc.querySelectorAll('table');
    
    tables.forEach((table) => {
      // Prüfen ob die Tabelle bereits in einem Container ist
      if (!table.parentElement?.classList.contains('table-container')) {
        const container = doc.createElement('div');
        container.className = 'table-container overflow-x-auto';
        
        // Tabelle mit Container umschließen
        table.parentNode?.insertBefore(container, table);
        container.appendChild(table);
      }
    });
    
    return doc.body.innerHTML;
  };

  const loadPost = async () => {
    try {
      console.log('Loading blog post for slug:', slug);
      const { data, error } = await supabase
        .from('page_contents')
        .select('*')
        .eq('content_type', 'blog_post')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error) {
        console.error('Supabase error:', error);
        setError('Artikel nicht gefunden');
        setLoading(false);
        return;
      }

      if (!data) {
        console.log('No data found for slug:', slug);
        setError('Artikel nicht gefunden');
        setLoading(false);
        return;
      }

      console.log('Blog post data loaded:', data);

      // Content verarbeiten und Tabellen umschließen
      let processedContent = data.content_value || '';
      
      // Sicherstellen, dass der Content korrekt formatiert ist
      if (processedContent) {
        // Tabellen mit Container umschließen für bessere mobile Darstellung
        processedContent = wrapTablesWithContainer(processedContent);
        
        // Zusätzliche Formatierung für bessere Darstellung
        processedContent = processedContent
          // Sicherstellen, dass Überschriften korrekte IDs haben für das Inhaltsverzeichnis
          .replace(/<h([1-6])([^>]*)>([^<]+)<\/h[1-6]>/gi, (match, level, attrs, text) => {
            const id = text.toLowerCase()
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .trim();
            return `<h${level} id="${id}"${attrs}>${text}</h${level}>`;
          })
          // Sicherstellen, dass Listen korrekt formatiert sind
          .replace(/<ul>/gi, '<ul class="space-y-2">')
          .replace(/<ol>/gi, '<ol class="space-y-2">')
          // Sicherstellen, dass Absätze korrekt formatiert sind
          .replace(/<p>/gi, '<p class="mb-4 leading-relaxed">');
      }

      const blogPost: BlogPost = {
        id: data.id,
        title: data.title || 'Untitled',
        slug: data.slug || slug,
        content: processedContent,
        excerpt: data.excerpt || '',
        featured_image: data.featured_image || null,
        author: data.author || 'Brennholz König Team',
        category: data.category || 'Allgemein',
        tags: Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []),
        reading_time: data.reading_time || 5,
        views: data.views || 0,
        status: data.status || 'published',
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
        meta_title: data.meta_title || data.title,
        meta_description: data.meta_description || data.excerpt,
        canonical_url: data.canonical_url || `https://brennholz-koenig.de/blog/${data.slug || slug}`
      };

      setPost(blogPost);
      
      // Inhaltsverzeichnis generieren
      if (processedContent) {
        generateTableOfContents(processedContent);
      }
      
      setLoading(false);
      
      // Verwandte Artikel laden
      loadRelatedPosts(blogPost.category, blogPost.id);
      
    } catch (err) {
      console.error('Error loading blog post:', err);
      setError('Fehler beim Laden des Artikels');
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
        .neq('id', currentPostId)
        .limit(3);

      const relatedPosts: BlogPost[] = (data || []).map((item: any) => ({
        id: String(item.id || ''),
        title: String(item.title || ''),
        content: String(item.content_value || ''),
        excerpt: String(item.excerpt || ''),
        slug: String(item.slug || ''),
        featured_image: item.featured_image || null,
        author: String(item.author || 'Brennholz König Team'),
        category: String(item.category || ''),
        tags: Array.isArray(item.tags) ? item.tags : (item.tags ? [item.tags] : []),
        reading_time: Number(item.reading_time || 5),
        views: Number(item.views || 0),
        status: String(item.status || 'published'),
        created_at: String(item.created_at || new Date().toISOString()),
        updated_at: String(item.updated_at || new Date().toISOString()),
        meta_title: String(item.meta_title || item.title || ''),
        meta_description: String(item.meta_description || item.excerpt || ''),
        canonical_url: String(item.canonical_url || `https://brennholz-koenig.de/blog/${item.slug}`)
      }));

      setRelatedPosts(relatedPosts);
    } catch (err) {
      console.error('Error loading related posts:', err);
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
          className="bg-[#C04020] hover:bg-[#A03318] text-white px-6 py-3 rounded-xl font-bold transition-colors cursor-pointer whitespace-nowrap"
        >
          Zurück zum Blog
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumbs */}
      <nav className="mb-12">
        <ol className="flex items-center space-x-3 text-sm">
          <li>
            <Link href="/" className="text-gray-500 hover:text-[#C04020] transition-colors">
              <i className="ri-home-line mr-1"></i>
              Home
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li>
            <Link href="/blog" className="text-gray-500 hover:text-[#C04020] transition-colors">
              Blog
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900 font-medium truncate">{post.title}</li>
        </ol>
      </nav>

      {/* Article Header */}
      <header className="mb-16">
        <div className="mb-6">
          <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${getCategoryColor(post.category)}`}>
            <i className="ri-bookmark-line mr-2"></i>
            {post.category}
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 leading-tight mb-8">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="text-xl text-gray-600 leading-relaxed mb-8 max-w-4xl">
            {post.excerpt}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-12">
          {post.author && (
            <div className="flex items-center">
              <i className="ri-user-line mr-2"></i>
              <span>{post.author}</span>
            </div>
          )}
          <div className="flex items-center">
            <i className="ri-calendar-line mr-2"></i>
            <time>{formatDate(post.created_at)}</time>
          </div>
          {post.reading_time && (
            <div className="flex items-center">
              <i className="ri-time-line mr-2"></i>
              <span>{post.reading_time} Min. Lesezeit</span>
            </div>
          )}
          {post.views && (
            <div className="flex items-center">
              <i className="ri-eye-line mr-2"></i>
              <span>{post.views} Aufrufe</span>
            </div>
          )}
        </div>

        {post.featured_image && (
          <div className="relative overflow-hidden rounded-3xl shadow-2xl mb-16">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-96 md:h-[500px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>
        )}
      </header>

      {/* Article Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile Table of Contents - Oben platziert */}
        <div className="lg:hidden mb-8">
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-4 border border-orange-200">
            <h3 className="text-lg font-black text-[#1A1A1A] mb-3 flex items-center">
              <i className="ri-list-unordered text-[#C04020] mr-2"></i>
              Inhaltsverzeichnis
            </h3>
            <div className="space-y-1">
              {tableOfContents.length > 0 ? (
                <nav className="space-y-1">
                  {tableOfContents.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollToHeading(item.id)}
                      className={`block w-full text-left text-sm hover:text-[#C04020] transition-colors ${
                        item.level === 1 ? 'font-bold text-gray-900 mb-1' :
                        item.level === 2 ? 'font-semibold text-gray-800 pl-0' :
                        item.level === 3 ? 'font-medium text-gray-700 pl-3' :
                        item.level === 4 ? 'text-gray-600 pl-6' :
                        item.level === 5 ? 'text-gray-500 pl-9' :
                        'text-gray-400 pl-12'
                      }`}
                    >
                      {item.text}
                    </button>
                  ))}
                </nav>
              ) : (
                <div className="text-sm text-gray-600">
                  Keine Überschriften gefunden
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 lg:w-2/3 min-w-0">
            <div className="prose prose-lg lg:prose-xl max-w-none overflow-hidden blog-content text-left sm:text-justify hyphens-auto break-words prose-headings:text-gray-900 prose-headings:font-black prose-h1:text-3xl sm:prose-h1:text-4xl lg:prose-h1:text-5xl prose-h1:mt-8 lg:prose-h1:mt-12 prose-h1:mb-6 lg:prose-h1:mb-8 prose-h1:leading-tight prose-h2:text-2xl sm:prose-h2:text-3xl lg:prose-h2:text-4xl prose-h2:mt-12 lg:prose-h2:mt-16 prose-h2:mb-6 lg:prose-h2:mb-8 prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-3 lg:prose-h2:pb-4 prose-h2:relative prose-h2:leading-tight prose-h2:before:content-[''] prose-h2:before:absolute prose-h2:before:left-0 prose-h2:before:top-0 prose-h2:before:w-8 lg:prose-h2:before:w-12 prose-h2:before:h-1 prose-h2:before:bg-[#C04020] prose-h2:before:rounded-full prose-h3:text-xl sm:prose-h3:text-2xl lg:prose-h3:text-3xl prose-h3:mt-8 lg:prose-h3:mt-12 prose-h3:mb-4 lg:prose-h3:mb-6 prose-h3:text-[#C04020] prose-h3:leading-tight prose-h4:text-lg sm:prose-h4:text-xl lg:prose-h4:text-2xl prose-h4:mt-6 lg:prose-h4:mt-10 prose-h4:mb-3 lg:prose-h4:mb-4 prose-h4:text-gray-800 prose-h4:leading-tight prose-h5:text-base sm:prose-h5:text-lg lg:prose-h5:text-xl prose-h5:mt-6 lg:prose-h5:mt-8 prose-h5:mb-2 lg:prose-h5:mb-3 prose-h5:text-gray-700 prose-h5:leading-tight prose-h6:text-sm sm:prose-h6:text-base lg:prose-h6:text-lg prose-h6:mt-4 lg:prose-h6:mt-6 prose-h6:mb-2 prose-h6:text-gray-600 prose-h6:leading-tight prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6 lg:prose-p:mb-8 prose-p:text-base lg:prose-p:text-lg prose-strong:text-gray-900 prose-strong:font-bold prose-strong:bg-yellow-100 prose-strong:px-1 prose-strong:rounded prose-a:text-[#C04020] prose-a:font-semibold prose-a:no-underline hover:prose-a:text-[#A03318] hover:prose-a:underline prose-a:break-words prose-blockquote:border-l-4 lg:prose-blockquote:border-l-8 prose-blockquote:border-[#C04020] prose-blockquote:bg-gradient-to-r prose-blockquote:from-orange-50 prose-blockquote:to-red-50 prose-blockquote:py-4 lg:prose-blockquote:py-8 prose-blockquote:px-4 lg:prose-blockquote:px-8 prose-blockquote:italic prose-blockquote:text-gray-800 prose-blockquote:text-lg lg:prose-blockquote:text-xl prose-blockquote:font-medium prose-blockquote:rounded-r-xl lg:prose-blockquote:rounded-r-2xl prose-blockquote:shadow-lg prose-blockquote:relative prose-blockquote:before:content-['\201C'] prose-blockquote:before:text-4xl lg:prose-blockquote:before:text-6xl prose-blockquote:before:text-[#C04020] prose-blockquote:before:absolute prose-blockquote:before:-top-1 lg:prose-blockquote:before:-top-2 prose-blockquote:before:-left-1 lg:prose-blockquote:before:-left-2 prose-blockquote:before:font-serif prose-ul:space-y-2 lg:prose-ul:space-y-4 prose-ol:space-y-2 lg:prose-ol:space-y-4 prose-li:text-gray-700 prose-li:leading-relaxed prose-li:text-base lg:prose-li:text-lg prose-li:relative prose-li:pl-1 lg:prose-li:pl-2 prose-li:marker:text-[#C04020] prose-li:marker:font-bold prose-table:border-collapse prose-table:w-full prose-table:shadow-lg prose-table:rounded-lg prose-table:overflow-hidden prose-table:border prose-table:border-gray-300 prose-th:bg-[#C04020] prose-th:text-white prose-th:border prose-th:border-gray-300 prose-th:px-3 lg:prose-th:px-6 prose-th:py-2 lg:prose-th:py-4 prose-th:text-left prose-th:font-bold prose-th:text-xs lg:prose-th:text-sm prose-th:uppercase prose-th:tracking-wider prose-td:border prose-td:border-gray-300 prose-td:px-3 lg:prose-td:px-6 prose-td:py-2 lg:prose-td:py-4 prose-td:text-gray-700 prose-td:text-sm lg:prose-td:text-base prose-td:align-top prose-tr:hover:bg-gray-50 prose-hr:border-gray-300 prose-hr:my-8 lg:prose-hr:my-12 prose-hr:relative prose-hr:before:content-['✦'] prose-hr:before:absolute prose-hr:before:left-1/2 prose-hr:before:top-1/2 prose-hr:before:-translate-x-1/2 prose-hr:before:-translate-y-1/2 prose-hr:before:w-8 lg:prose-hr:before:w-12 prose-hr:before:h-8 lg:prose-hr:before:h-12 prose-hr:before:bg-white prose-hr:before:border-2 prose-hr:before:border-[#C04020] prose-hr:before:rounded-full prose-hr:before:flex prose-hr:before:items-center prose-hr:before:justify-center prose-hr:before:text-[#C04020] prose-hr:before:text-lg lg:prose-hr:before:text-xl prose-code:bg-gray-100 prose-code:px-2 lg:prose-code:px-3 prose-code:py-1 prose-code:rounded-md prose-code:text-xs lg:prose-code:text-sm prose-code:font-mono prose-code:text-[#C04020] prose-code:font-semibold prose-code:break-words prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 lg:prose-pre:p-8 prose-pre:rounded-xl lg:prose-pre:rounded-2xl prose-pre:overflow-x-auto prose-pre:shadow-xl prose-pre:text-sm lg:prose-pre:text-base prose-img:rounded-xl lg:prose-img:rounded-2xl prose-img:shadow-xl lg:prose-img:shadow-2xl prose-img:border prose-img:border-gray-200 prose-img:my-6 lg:prose-img:my-12 prose-img:w-full prose-img:h-auto [&_.table-container]:overflow-x-auto [&_.table-container]:my-6 [&_table]:min-w-full [&_table]:border-collapse [&_table]:border [&_table]:border-gray-300 [&_th]:bg-[#C04020] [&_th]:text-white [&_th]:p-3 [&_th]:text-left [&_th]:font-semibold [&_th]:border [&_th]:border-gray-300 [&_th]:text-sm [&_td]:border [&_td]:border-gray-300 [&_td]:p-3 [&_td]:text-gray-700 [&_td]:align-top [&_td]:text-sm [&_td]:leading-relaxed [&_tr:hover]:bg-gray-50">
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: wrapTablesWithContainer(addHeadingIds(post.content || ''))
                }} 
              />
            </div>
          </div>
          
          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-1/3 max-w-sm">
            <div className="sticky top-8 space-y-6">
              {/* Table of Contents */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200">
                <h3 className="text-xl font-black text-[#1A1A1A] mb-4 flex items-center">
                  <i className="ri-list-unordered text-[#C04020] mr-2"></i>
                  Inhaltsverzeichnis
                </h3>
                <div className="space-y-2">
                  {tableOfContents.length > 0 ? (
                    <nav className="space-y-1">
                      {tableOfContents.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => scrollToHeading(item.id)}
                          className={`block w-full text-left text-sm hover:text-[#C04020] transition-colors ${
                            item.level === 1 ? 'font-bold text-gray-900 mb-2' :
                            item.level === 2 ? 'font-semibold text-gray-800 pl-0' :
                            item.level === 3 ? 'font-medium text-gray-700 pl-4' :
                            item.level === 4 ? 'text-gray-600 pl-8' :
                            item.level === 5 ? 'text-gray-500 pl-12' :
                            'text-gray-400 pl-16'
                          }`}
                        >
                          {item.text}
                        </button>
                      ))}
                    </nav>
                  ) : (
                    <div className="text-sm text-gray-600">
                      Keine Überschriften gefunden
                    </div>
                  )}
                </div>
              </div>
              
              {/* Quick Facts */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-black text-[#1A1A1A] mb-4 flex items-center">
                  <i className="ri-lightbulb-line text-[#C04020] mr-2"></i>
                  Schnelle Fakten
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center text-sm">
                    <i className="ri-time-line text-[#C04020] mr-2"></i>
                    <span className="text-gray-600">Lesezeit: {post.reading_time || '5'} Minuten</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <i className="ri-bookmark-line text-[#C04020] mr-2"></i>
                    <span className="text-gray-600">Kategorie: {post.category}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <i className="ri-calendar-line text-[#C04020] mr-2"></i>
                    <span className="text-gray-600">Veröffentlicht: {formatDate(post.created_at)}</span>
                  </div>
                </div>
              </div>
              
              {/* Expert Tip */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                <h3 className="text-xl font-black text-[#1A1A1A] mb-4 flex items-center">
                  <i className="ri-user-star-line text-blue-600 mr-2"></i>
                  Experten-Tipp
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Haben Sie Fragen zu diesem Artikel? Unser Expertenteam steht Ihnen gerne zur Verfügung.
                </p>
                <Link
                  href="/kontakt"
                  className="inline-flex items-center mt-4 text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors"
                >
                  <i className="ri-phone-line mr-1"></i>
                  Jetzt beraten lassen
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Article Footer */}
      <footer className="mt-20 pt-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-3xl p-8 md:p-12">
            <div className="flex flex-col lg:flex-row gap-8 items-center justify-between">
              <div className="text-center lg:text-left">
                <h3 className="text-2xl font-black text-[#1A1A1A] mb-4">Artikel teilen</h3>
                <p className="text-gray-600 mb-6">Teilen Sie diesen Artikel mit Freunden und Familie</p>
                <SocialShare
                  url={`https://brennholz-koenig.de/blog/${post.slug}`}
                  title={post.title}
                />
              </div>

              <div className="text-center lg:text-right">
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <i className="ri-customer-service-2-line text-4xl text-[#C04020] mb-4"></i>
                  <h4 className="text-xl font-bold text-[#1A1A1A] mb-2">Haben Sie Fragen?</h4>
                  <p className="text-gray-600 mb-4">Unser Expertenteam hilft Ihnen gerne weiter</p>
                  <Link
                    href="/kontakt"
                    className="inline-flex items-center bg-[#C04020] hover:bg-[#A03318] text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 hover:shadow-lg hover:scale-105"
                  >
                    <i className="ri-phone-line mr-2"></i>
                    Kontakt aufnehmen
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="mt-16 pt-12 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                      <h4 className="font-bold text-[#1A1A1A] mb-2 group-hover:text-[#C04020] transition-colors leading-tight">
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
          </div>
        </section>
      )}
      
      {/* Kommentare */}
      <BlogComments 
        blogPostId={post.id} 
        blogPostTitle={post.title}
      />
    </article>
  );
}