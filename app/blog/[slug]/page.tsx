
import { Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import BlogContent from './BlogContent';

export async function generateStaticParams() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    const { data } = await supabase
      .from('page_contents')
      .select('slug')
      .eq('content_type', 'blog_post')
      .eq('status', 'published')
      .eq('is_active', true);

    return data?.map(article => ({ slug: article.slug })) || [];
  } catch (error) {
    console.error('Error loading blog slugs:', error);
    return [];
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    const { data } = await supabase
      .from('page_contents')
      .select('title, excerpt, meta_title, meta_description, focus_keywords')
      .eq('content_type', 'blog_post')
      .eq('slug', params.slug)
      .eq('status', 'published')
      .eq('is_active', true)
      .single();

    if (data) {
      return {
        title: data.meta_title || `${data.title} | Brennholzkönig Blog`,
        description: data.meta_description || data.excerpt || 'Expertentipps und Anleitungen rund um Brennholz, Kaminfeuer und nachhaltiges Heizen.',
        keywords: data.focus_keywords || 'Brennholz, Kamin, Heizen, Tipps, Anleitung'
      };
    }
  } catch (error) {
    console.error('Error loading blog metadata:', error);
  }

  return {
    title: `Blog | Brennholzkönig`,
    description: 'Expertentipps und Anleitungen rund um Brennholz, Kaminfeuer und nachhaltiges Heizen.',
    keywords: 'Brennholz, Kamin, Heizen, Tipps, Anleitung'
  };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  return (
    <main>
      <Suspense fallback={
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="w-full h-64 bg-gray-200 rounded-xl mb-8"></div>
          </div>
        </div>
      }>
        <BlogContent slug={params.slug} />
      </Suspense>
    </main>
  );
}
