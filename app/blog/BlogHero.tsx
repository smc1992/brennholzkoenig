'use client';

export default function BlogHero() {
  return (
    <section className="relative bg-gradient-to-br from-green-50 to-green-100 py-20">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
        style={{
          backgroundImage: `url('https://readdy.ai/api/search-image?query=modern%20wooden%20cabin%20interior%20with%20fireplace%20burning%20seasoned%20hardwood%20logs%2C%20cozy%20warm%20atmosphere%2C%20natural%20lighting%20streaming%20through%20windows%2C%20rustic%20yet%20refined%20decor%2C%20professional%20interior%20photography%20style&width=1200&height=600&seq=blog-hero-bg&orientation=landscape')`
        }}
      ></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-bold text-[#1A1A1A] mb-6 leading-tight">
            Brennholz
            <span className="text-green-600 block">Ratgeber</span>
          </h1>
          
          <p className="text-xl text-gray-700 mb-8 leading-relaxed">
            Entdecken Sie alles Wissenswerte rund um Brennholz, Kaminfeuer und nachhaltiges Heizen. 
            Tipps von Experten, Anleitungen und aktuelle Trends aus der Welt des Brennholzes.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-sm">
              <i className="ri-book-open-line text-green-600 mr-3 text-xl"></i>
              <span className="font-medium text-gray-800">Expertenwissen</span>
            </div>
            
            <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-sm">
              <i className="ri-leaf-line text-green-600 mr-3 text-xl"></i>
              <span className="font-medium text-gray-800">Nachhaltigkeit</span>
            </div>
            
            <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-sm">
              <i className="ri-fire-line text-green-600 mr-3 text-xl"></i>
              <span className="font-medium text-gray-800">Praxis-Tipps</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}