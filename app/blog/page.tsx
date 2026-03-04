import BlogHero from './BlogHero';
import OptimizedBlogGrid from '../../components/OptimizedBlogGrid';
import { createServerSupabase } from '@/lib/supabase-server';

export const metadata = {
  title: 'Brennholz Ratgeber & Blog | Brennholzkönig',
  description: 'Entdecken Sie alles Wissenswerte rund um Brennholz, Kaminfeuer und nachhaltiges Heizen. Tipps von Experten, Anleitungen und aktuelle Trends.',
  keywords: 'Brennholz Ratgeber, Kamin Tipps, Heizen, Holz trocknen, Feuermachen, Brennholz lagern'
};

export default async function BlogPage() {
  const startTime = Date.now();
  
  // Server-Side Blog Post Preloading
  const supabase = createServerSupabase();
  let posts = [];
  let error = null;
  
  try {
    const { data, error: fetchError } = await supabase
      .from('page_contents')
      .select('*')
      .eq('content_type', 'blog_post')
      .eq('status', 'published')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(12);
    
    if (fetchError) throw fetchError;
    posts = data || [];
  } catch (err: any) {
    error = err.message;
    console.error('Blog: Fehler beim Laden der Blog-Posts:', err);
  }
  
  const loadTime = Date.now() - startTime;
  console.log(`📝 Blog posts preloaded in ${loadTime}ms: { postCount: ${posts.length}, loadTime: ${loadTime}, hasError: ${!!error} }`);
  return (
    <main>
      <BlogHero />
      <OptimizedBlogGrid 
        initialPosts={posts}
        loadTime={loadTime}
        error={error}
      />
    </main>
  );
}