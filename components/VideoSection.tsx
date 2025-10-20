'use client';

export default function VideoSection() {
  return (
    <section className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Headline */}
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
            <span className="text-[#D4A520]">BRENNHOLZKÖNIG</span> <span className="text-[#1A1A1A]">IMAGEVIDEO</span>
          </h2>
          <p className="text-base sm:text-lg text-[#1A1A1A]/70 mt-2" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
            Ein Blick in unsere Produktion und Qualitätssicherung
          </p>
        </div>

        {/* Video Card */}
        <div className="relative overflow-hidden rounded-2xl ring-1 ring-black/10 bg-white/95 backdrop-blur-sm shadow-2xl">
          <video
            className="w-full h-auto block"
            style={{ aspectRatio: '16 / 9' }}
            controls
            preload="none"
            playsInline
            aria-label="Brennholzkönig Imagevideo"
            controlsList="nodownload"
            poster="/images/Hero Brennholzkönig.webp"
          >
            <source src="/uploads/hero/brennholzkoenig-imagevideo.webm" type="video/webm" />
            <source src={encodeURI('/uploads/brennholzkönig imagevideo.mp4')} type="video/mp4" />
            Ihr Browser unterstützt das Videoformat nicht.
          </video>
        </div>
      </div>
    </section>
  );
}