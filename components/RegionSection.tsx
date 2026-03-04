
'use client';

export default function RegionSection() {
  return (
    <section className="py-16 bg-[#1A1A1A] text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-black mb-6" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
            REGIONAL & <span className="text-[#D4A520]">NACHHALTIG</span>
          </h2>
          <p className="text-xl max-w-3xl mx-auto" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
            Unser Brennholz stammt ausschließlich aus nachhaltiger Forstwirtschaft der Region Fulda. 
            Kurze Transportwege garantieren frische Qualität und schonen die Umwelt.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="text-center">
            <div className="w-16 h-16 flex items-center justify-center bg-[#D4A520] rounded-full mx-auto mb-4">
              <i className="ri-leaf-line text-white text-2xl"></i>
            </div>
            <h3 className="text-xl font-bold mb-3" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
              Nachhaltige Forstwirtschaft
            </h3>
            <p className="text-gray-200" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
              Unser Holz stammt aus zertifizierten, nachhaltig bewirtschafteten Wäldern der Region.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 flex items-center justify-center bg-[#D4A520] rounded-full mx-auto mb-4">
              <i className="ri-map-pin-line text-white text-2xl"></i>
            </div>
            <h3 className="text-xl font-bold mb-3" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
              150km Lieferradius
            </h3>
            <p className="text-gray-200" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
              Wir liefern zuverlässig in ganz Fulda und Umgebung bis zu 150km Entfernung.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 flex items-center justify-center bg-[#D4A520] rounded-full mx-auto mb-4">
              <i className="ri-truck-line text-white text-2xl"></i>
            </div>
            <h3 className="text-xl font-bold mb-3" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
              Kurze Transportwege
            </h3>
            <p className="text-gray-200" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
              Regionale Beschaffung bedeutet kurze Wege und dadurch besonders frische Qualität.
            </p>
          </div>
        </div>

        <div className="bg-white/10 rounded-xl p-8 backdrop-blur-sm">
          <h3 className="text-2xl font-bold mb-6 text-center" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
            Unser Liefergebiet
          </h3>
          
          {/* Großstädte */}
          <div className="mb-8">
            <h4 className="text-lg font-bold mb-4 text-[#D4A520]" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
              Großstädte
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                'Frankfurt am Main', 'Kassel', 'Wiesbaden', 'Würzburg',
                'Göttingen', 'Erfurt', 'Offenbach am Main', 'Paderborn'
              ].map((city) => (
                <div key={city} className="flex items-center text-white">
                  <div className="w-3 h-3 flex items-center justify-center bg-[#C04020] rounded-full mr-2">
                    <i className="ri-map-pin-line text-white text-xs"></i>
                  </div>
                  <span className="text-sm">{city}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mittelstädte */}
          <div className="mb-8">
            <h4 className="text-lg font-bold mb-4 text-[#D4A520]" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
              Mittelstädte
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                'Bad Hersfeld', 'Alsfeld', 'Fulda', 'Gießen', 'Marburg',
                'Hanau', 'Bad Nauheim', 'Schmalkalden', 'Bebra'
              ].map((city) => (
                <div key={city} className="flex items-center text-white">
                  <div className="w-3 h-3 flex items-center justify-center bg-[#D4A520] rounded-full mr-2">
                    <i className="ri-map-pin-line text-white text-xs"></i>
                  </div>
                  <span className="text-sm">{city}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Kleinstädte */}
          <div className="mb-8">
            <h4 className="text-lg font-bold mb-4 text-[#D4A520]" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
              Kleinstädte und größere Gemeinden
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                'Petersberg', 'Künzell', 'Eichenzell', 'Hünfeld', 'Tann (Rhön)',
                'Neuhof', 'Rotenburg an der Fulda', 'Lauterbach (Hessen)', 
                'Schlitz', 'Grebenau'
              ].map((city) => (
                <div key={city} className="flex items-center text-white">
                  <div className="w-3 h-3 flex items-center justify-center bg-[#8B7000] rounded-full mr-2">
                    <i className="ri-map-pin-line text-white text-xs"></i>
                  </div>
                  <span className="text-sm">{city}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d156745.0!2d9.675!3d50.554!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47a39d0b4b8c8b07%3A0x4dd4c5c5c5c5c5c5!2sFulda%2C%20Germany!5e0!3m2!1sen!2sus!4v1634567890123!5m2!1sen!2sus"
              className="w-full h-full rounded-lg"
              loading="lazy"
              suppressHydrationWarning={true}
            ></iframe>
          </div>

          <div className="bg-white/5 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center space-x-8">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-[#C04020] rounded-full mr-2"></div>
                <span className="text-sm">Großstädte</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-[#D4A520] rounded-full mr-2"></div>
                <span className="text-sm">Mittelstädte</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-[#8B7000] rounded-full mr-2"></div>
                <span className="text-sm">Kleinstädte</span>
              </div>
            </div>
          </div>

          <p className="text-center text-gray-200" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
            Schnelle Zustellung • Termingenau
          </p>
        </div>
      </div>
    </section>
  );
}
