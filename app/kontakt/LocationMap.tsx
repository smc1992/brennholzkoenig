
'use client';

export default function LocationMap() {
  return (
    <section className="py-12 sm:py-16 bg-gradient-to-br from-[#F5F0E0] to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#1A1A1A] mb-4" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
            UNSER <span className="text-[#C04020]">STANDORT</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-700" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
            Besuchen Sie <strong>Brennholhandel Vey</strong> in Buttlar - Ihr Partner für Premium-Brennholz
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-start">
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
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
                    <p className="font-bold text-base sm:text-lg">Brennholhandel Vey</p>
                    <p className="text-sm sm:text-base">Frankfurter Straße 3</p>
                    <p className="text-sm sm:text-base">36419 Buttlar</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center bg-[#D4A520] rounded-full mr-4 sm:mr-6 flex-shrink-0">
                  <i className="ri-phone-line text-white text-lg sm:text-2xl"></i>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-[#1A1A1A] mb-2" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                    TELEFON
                  </h3>
                  <div className="space-y-1">
                    <p className="font-bold text-base sm:text-lg text-[#C04020]">0561-43071895</p>
                    <p className="text-xs sm:text-sm text-gray-600">Montag bis Freitag: 7:00 - 18:00 Uhr</p>
                    <p className="text-xs sm:text-sm text-gray-600">Samstag: 8:00 - 14:00 Uhr</p>
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
                    <p className="font-bold text-base sm:text-lg text-[#C04020]">0176-22572100</p>
                    <p className="text-xs sm:text-sm text-gray-600">Für Express-Lieferungen</p>
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

          <div className="relative h-96 sm:h-[500px] bg-gray-100 rounded-2xl overflow-hidden shadow-xl">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2497.8!2d9.9!3d50.8!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTDCsDQ4JzAwLjAiTiA5wrA1NCcwMC4wIkU!5e0!3m2!1sde!2sde!4v1234567890123"
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen={true} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              className="rounded-2xl"
            ></iframe>
          </div>
        </div>

        <div className="mt-8 sm:mt-12 text-center">
          <div className="bg-gradient-to-r from-[#1A1A1A] to-[#2A2A2A] text-white rounded-2xl p-6 sm:p-8 inline-block">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="w-16 h-16 flex items-center justify-center bg-[#D4A520] rounded-full flex-shrink-0">
                <i className="ri-customer-service-line text-2xl"></i>
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-xl sm:text-2xl font-black mb-2" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                  Persönliche Beratung vor Ort
                </h3>
                <p className="text-sm sm:text-base opacity-90">
                  Vereinbaren Sie einen Termin und lassen Sie sich vor Ort von der Qualität 
                  unseres Premium-Brennholzes überzeugen.
                </p>
              </div>
              <a 
                href="tel:0561-43071895"
                className="bg-[#C04020] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#A03318] transition-all duration-300 whitespace-nowrap cursor-pointer"
              >
                Termin vereinbaren
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
