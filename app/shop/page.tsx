
'use client';

import ShopHero from './ShopHero';
import ProductGrid from './ProductGrid';
import ShopInfo from './ShopInfo';
import SEOMetadata from '../../components/SEOMetadata';

export default function ShopPage() {
  return (
    <>
      <SEOMetadata 
        title="Premium Brennholz Shop - Buche, Eiche, Birke kaufen | Brennholzkönig"
        description="Entdecken Sie unser Premium Brennholz-Sortiment: Buche, Eiche, Birke und mehr. Kammergetrocknet auf 6% Restfeuchte. Sofort lieferbar in Rhön-Grabfeld und Umgebung."
        keywords={['Brennholz Shop', 'Brennholz kaufen', 'Buche Brennholz', 'Eiche Brennholz', 'Birke Brennholz', 'Kaminholz bestellen', 'trocken', '6% Restfeuchte', 'Rhön-Grabfeld']}
        url="https://brennholzkoenig.de/shop"
        image="https://readdy.ai/api/search-image?query=Premium%20firewood%20shop%20display%20with%20neatly%20stacked%20beech%20and%20spruce%20wood%20logs%2C%20professional%20wooden%20warehouse%20interior%2C%20warm%20ambient%20lighting%2C%20rustic%20wooden%20shelves%20filled%20with%20different%20types%20of%20firewood%2C%20cozy%20atmosphere%2C%20high%20quality%20wood%20products%20presentation&width=1200&height=630&seq=shop-seo-image&orientation=landscape"
      />
      <div>
        <ShopHero />
        <ProductGrid />
        <ShopInfo />
      </div>
    </>
  );
}