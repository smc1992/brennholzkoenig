
'use client';

export default function AboutHero() {
  return (
    <section 
      className="py-16 sm:py-20 md:py-24 relative"
      style={{
        backgroundImage: `linear-gradient(rgba(26, 26, 26, 0.7), rgba(26, 26, 26, 0.7)), url('https://readdy.ai/api/search-image?query=Professional%20German%20man%20in%20workwear%20standing%20proudly%20next%20to%20stacked%20firewood%2C%20authentic%20timber%20yard%20background%2C%20warm%20lighting%2C%20mature%20confident%20appearance%2C%20hands-on%20businessman%20portrait%20style&width=1920&height=800&seq=thorsten-hero&orientation=landscape')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-4 sm:mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
          ÜBER <span className="text-[#C04020]">UNS</span>
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl text-[#F5F0E0] mb-6 sm:mb-8 max-w-3xl mx-auto" style={{ fontFamily: 'Barlow, sans-serif' }}>
          Thorsten Vey – der Mann hinter dem Holz. Ehrlich, bodenständig und 
          kompetent versorgt er über 6.000 Kunden mit erstklassigem Brennholz.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-6 sm:gap-8 text-white px-4">
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-[#D4A520] mb-2">6.000+</div>
            <div className="text-sm sm:text-base">Zufriedene Kunden</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-[#D4A520] mb-2">4</div>
            <div className="text-sm sm:text-base">Bundesländer</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-[#D4A520] mb-2">100%</div>
            <div className="text-sm sm:text-base">Handwerk</div>
          </div>
        </div>
      </div>
    </section>
  );
}
