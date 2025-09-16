
'use client';

export default function LocationMap() {
  return (
    <section className="py-12 sm:py-16 bg-gradient-to-br from-[#F5F0E0] to-white overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-full">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#1A1A1A] mb-4" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
            UNSER <span className="text-[#C04020]">STANDORT</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-700" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
            Besuchen Sie <strong>Brennholzkönig</strong> in Eiterfeld-Großentaft - Ihr Partner für Premium-Brennholz
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-start w-full max-w-full overflow-hidden">
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 w-full max-w-full">
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center bg-[#C04020] rounded-full mr-4 sm:mr-6 flex-shrink-0">
                  <i className="ri-map-pin-line text-white text-lg sm:text-2xl"></i>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-[#1A1A1A] mb-2" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                    ADRESSE
                  </h3>
                  <div className="space-y-1">
                    <p className="font-bold text-base sm:text-lg">Brennholzkönig</p>
                <p className="text-sm sm:text-base">Am Rainbaum 19a</p>
                <p className="text-sm sm:text-base">36132 Eiterfeld-Großentaft</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center bg-[#1A1A1A] rounded-full mr-4 sm:mr-6 flex-shrink-0">
                  <i className="ri-smartphone-line text-white text-lg sm:text-2xl"></i>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-[#1A1A1A] mb-2" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                    MOBIL
                  </h3>
                  <div className="space-y-1">
                    <a href="tel:+4917671085234" className="font-bold text-base sm:text-lg text-[#C04020] hover:text-[#A03318] transition-colors duration-300 cursor-pointer">+49 176 71085234</a>
                    <p className="text-xs sm:text-sm text-gray-600">Besuche des Lagers / Selbstabholmarkt nur mit persönlichem Termin möglich</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#F5F0E0] rounded-xl p-4 sm:p-6">
                <h4 className="font-bold text-[#1A1A1A] mb-3" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                  Anfahrt & Parken
                </h4>
                <div className="space-y-2 text-xs sm:text-sm text-gray-700">
                  <div className="flex items-center">
                    <i className="ri-car-line text-[#D4A520] mr-2 flex-shrink-0"></i>
                    <span>Kostenlose Parkplätze direkt vor Ort</span>
                  </div>
                  <div className="flex items-center">
                    <i className="ri-road-map-line text-[#D4A520] mr-2 flex-shrink-0"></i>
                    <span>5 Minuten von der A4 Abfahrt Bad Hersfeld</span>
                  </div>
                  <div className="flex items-center">
                    <i className="ri-calendar-check-line text-[#D4A520] mr-2 flex-shrink-0"></i>
                    <span>Termine nach Vereinbarung - bitte vorab anrufen</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative h-96 sm:h-[500px] bg-gray-100 rounded-2xl overflow-hidden shadow-xl w-full">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2497.8!2d9.9!3d50.8!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTDCsDQ4JzAwLjAiTiA5wrA1NCcwMC4wIkU!5e0!3m2!1sde!2sde!4v1234567890123"
              width="100%" 
              height="100%" 
              style={{ border: 0, width: '100%', height: '100%', display: 'block' }} 
              allowFullScreen={true} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              className="rounded-2xl w-full h-full"
            ></iframe>
          </div>
        </div>


      </div>
    </section>
  );
}
