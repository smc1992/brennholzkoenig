
'use client';

export default function ShopHero() {
  return (
    <section 
      className="relative min-h-[50vh] sm:min-h-[60vh] flex items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://readdy.ai/api/search-image?query=Premium%20firewood%20shop%20display%20with%20neatly%20stacked%20beech%20and%20spruce%20wood%20logs%2C%20professional%20wooden%20warehouse%20interior%2C%20warm%20ambient%20lighting%2C%20rustic%20wooden%20shelves%20filled%20with%20different%20types%20of%20firewood%2C%20cozy%20atmosphere%2C%20high%20quality%20wood%20products%20presentation&width=1200&height=600&seq=shop-hero-bg&orientation=landscape')`,
        paddingTop: '80px'
      }}
    >
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 text-center text-white relative z-10 max-w-7xl">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black mb-4 sm:mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
          BRENNHOLZ <span className="text-[#C04020]">SHOP</span>
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-medium mb-6 sm:mb-8 max-w-4xl mx-auto" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
          Premium Brennholz direkt vom Produzenten. Hochwertige Qualität für Ihr Zuhause.
        </p>
      </div>
    </section>
  );
}
