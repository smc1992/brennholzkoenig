import BlogHero from './BlogHero';
import BlogGrid from './BlogGrid';

export const metadata = {
  title: 'Brennholz Ratgeber & Blog | Brennholzkönig',
  description: 'Entdecken Sie alles Wissenswerte rund um Brennholz, Kaminfeuer und nachhaltiges Heizen. Tipps von Experten, Anleitungen und aktuelle Trends.',
  keywords: 'Brennholz Ratgeber, Kamin Tipps, Heizen, Holz trocknen, Feuermachen, Brennholz lagern'
};

export default function BlogPage() {
  return (
    <main>
      <BlogHero />
      <BlogGrid />
    </main>
  );
}