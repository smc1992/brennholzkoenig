
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CityButton } from '@/components/ui/CityButton';

interface CostCalculatorSectionProps {
  cityData?: any;
}

export default function CostCalculatorSection({ cityData }: CostCalculatorSectionProps) {
  const [houseSize, setHouseSize] = useState(150);
  const [quantity, setQuantity] = useState(6); // Standard Menge für Normalpreis
  const [currentHeating, setCurrentHeating] = useState('oel');
  const [calculationResult, setCalculationResult] = useState({
    current: 0,
    scheitholz: 0,
    industrieholz: 0,
    savings: 0,
    totalQuantityNeeded: 0
  });
  const [showResults, setShowResults] = useState(false);

  const heatingOptions = [
    { value: 'oel', label: 'Heizöl', costPer100qm: 2600, icon: 'ri-drop-line', color: 'bg-red-500' },
    { value: 'gas', label: 'Erdgas', costPer100qm: 2200, icon: 'ri-fire-line', color: 'bg-orange-500' },
    { value: 'strom', label: 'Strom', costPer100qm: 3800, icon: 'ri-flashlight-line', color: 'bg-yellow-500' },
    { value: 'scheitholz', label: 'Scheitholz Buche', costPer100qm: 1300, icon: 'ri-seedling-line', color: 'bg-[#D4A520]' }
  ];

  // Preisberechnung basierend auf neuer Struktur
  const calculatePriceWithDiscount = (basePrice: number, quantity: number) => {
    let finalPrice = basePrice;
    
    if (quantity >= 3 && quantity <= 6) {
      finalPrice = basePrice * 1.3; // +30% Zuschlag
    } else if (quantity >= 7 && quantity <= 24) {
      finalPrice = basePrice; // Normalpreis
    } else if (quantity >= 25) {
      finalPrice = basePrice - 2.5; // -2,50€ Rabatt
    }
    
    return Math.round(finalPrice);
  };

  const getPriceInfo = (quantity: number) => {
    if (quantity < 7) return { info: 'Mindestmenge: 7 SRM', color: 'text-red-600' };
    if (quantity >= 3 && quantity <= 6) return { info: '+30% Zuschlag (kleine Menge)', color: 'text-orange-600' };
    if (quantity >= 7 && quantity <= 24) return { info: 'Normalpreis', color: 'text-green-600' };
    if (quantity >= 25) return { info: '-2,50€ Mengenrabatt', color: 'text-blue-600' };
    return { info: '', color: '' };
  };

  const calculateCosts = () => {
    const factor = houseSize / 100;
    const currentOption = heatingOptions.find(opt => opt.value === currentHeating);

    // Geschätzte benötigte SRM pro Jahr basierend auf Wohnfläche
    const estimatedSRMNeeded = Math.max(3, Math.round(houseSize / 25)); // ca. 1 SRM pro 25m²
    
    // Preise für Industrieholz mit neuer Struktur
    const baseIndustrieholzPrice = 115; // Buche Klasse I Grundpreis
    const adjustedPrice = calculatePriceWithDiscount(baseIndustrieholzPrice, quantity);

    // Sicherstellen, dass currentOption nicht undefined ist
    const costPer100qm = currentOption?.costPer100qm || 0;

    const results = {
      current: Math.round(costPer100qm * factor),
      scheitholz: Math.round(1300 * factor),
      industrieholz: Math.round(adjustedPrice * quantity), // Verwendung der gewählten Menge
      savings: 0,
      totalQuantityNeeded: estimatedSRMNeeded
    };

    results.savings = results.current - results.industrieholz;
    setCalculationResult(results);
    setShowResults(true);
  };

  const priceInfo = getPriceInfo(quantity);

  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-[#F5F0E0] to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center bg-[#D4A520] text-[#1A1A1A] px-6 py-3 rounded-full font-bold text-sm md:text-base mb-6">
            <i className="ri-calculator-line mr-2"></i>
            KOSTENKALKULATOR
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#1A1A1A] mb-6" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
            WIE VIEL <span className="text-[#C04020]">SPAREN</span> SIE?
          </h2>
          <p className="text-lg md:text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
            Berechnen Sie Ihre persönlichen Ersparnisse mit unserem <strong className="text-[#C04020]">Premium-Industrieholz</strong>. 
            Die Ergebnisse werden Sie überraschen!
          </p>
        </div>

        {/* Preisstruktur Info */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-[#F5F0E0] rounded-xl p-6">
            <h3 className="text-xl font-bold text-[#1A1A1A] mb-4 text-center">Unsere Preisstruktur</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-orange-100 rounded-lg p-3 text-center">
                <div className="font-bold text-orange-700 mb-1">3-5 SRM</div>
                <div className="text-orange-600">+30% Zuschlag</div>
                <div className="text-xs text-gray-600 mt-1">Kleine Mengen</div>
              </div>
              <div className="bg-green-100 rounded-lg p-3 text-center">
                <div className="font-bold text-green-700 mb-1">6-24 SRM</div>
                <div className="text-green-600">Normalpreis</div>
                <div className="text-xs text-gray-600 mt-1">Standard</div>
              </div>
              <div className="bg-blue-100 rounded-lg p-3 text-center">
                <div className="font-bold text-blue-700 mb-1">Ab 25 SRM</div>
                <div className="text-blue-600">-2,50€ Rabatt pro SRM</div>
                <div className="text-xs text-gray-600 mt-1">Großmengen</div>
                <div className="text-xs text-blue-700 mt-2 font-medium">Nur für Industrieholz Klasse 2</div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Calculator Form */}
          <div className="bg-white rounded-2xl p-6 md:p-10 shadow-2xl mb-8 md:mb-12">
            <div className="grid md:grid-cols-3 gap-8">
              {/* House Size Input */}
              <div>
                <label className="block text-lg font-bold text-[#1A1A1A] mb-4">
                  <i className="ri-home-line mr-2 text-[#C04020]"></i>
                  Ihre Wohnfläche
                </label>
                <div className="relative">
                  <input 
                    type="range"
                    min="50"
                    max="400"
                    value={houseSize}
                    onChange={(e) => setHouseSize(parseInt(e.target.value))}
                    className="w-full h-3 bg-gradient-to-r from-[#F5F0E0] to-[#D4A520] rounded-full appearance-none cursor-pointer slider"
                    suppressHydrationWarning={true}
                  />
                  <div className="flex justify-between text-sm text-gray-600 mt-2">
                    <span>50m²</span>
                    <span>400m²</span>
                  </div>
                </div>
                <div className="text-center mt-4">
                  <div className="inline-flex items-center bg-[#C04020] text-white px-6 py-3 rounded-xl font-bold text-xl">
                    <i className="ri-ruler-line mr-2"></i>
                    {houseSize} m²
                  </div>
                </div>
              </div>

              {/* Quantity Selector */}
              <div>
                <label className="block text-lg font-bold text-[#1A1A1A] mb-4">
                  <i className="ri-stack-line mr-2 text-[#C04020]"></i>
                  Bestellmenge (SRM)
                </label>
                <select 
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 cursor-pointer text-lg font-medium pr-8"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                >
                  {[3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30].map(num => (
                    <option key={num} value={num}>{num} SRM</option>
                  ))}
                </select>
                <div className={`text-sm mt-2 font-medium text-center ${priceInfo.color}`}>
                  {priceInfo.info}
                </div>
                <div className="text-center mt-4">
                  <div className="inline-flex items-center bg-[#D4A520] text-white px-4 py-2 rounded-lg font-bold">
                    <i className="ri-price-tag-3-line mr-2"></i>
                    €{calculatePriceWithDiscount(115, quantity)} pro SRM
                  </div>
                </div>
              </div>

              {/* Current Heating System */}
              <div>
                <label className="block text-lg font-bold text-[#1A1A1A] mb-4">
                  <i className="ri-fire-line mr-2 text-[#C04020]"></i>
                  Ihre aktuelle Heizung
                </label>
                <div className="space-y-3">
                  {heatingOptions.map((option) => (
                    <label key={option.value} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="heating"
                        value={option.value}
                        checked={currentHeating === option.value}
                        onChange={(e) => setCurrentHeating(e.target.value)}
                        className="sr-only"
                        suppressHydrationWarning={true}
                      />
                      <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center transition-all ${
                        currentHeating === option.value 
                          ? 'border-[#C04020] bg-[#C04020]' 
                          : 'border-gray-300 bg-white'
                      }`}>
                        {currentHeating === option.value && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div className="flex items-center">
                        <div className={`w-8 h-8 flex items-center justify-center ${option.color} rounded-full mr-3`}>
                          <i className={`${option.icon} text-white text-sm`}></i>
                        </div>
                        <span className="text-base font-medium text-gray-800">{option.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Calculate Button */}
            <div className="text-center mt-8">
              <button 
                onClick={calculateCosts}
                className="bg-gradient-to-r from-[#C04020] to-[#A03318] text-white px-10 py-4 text-xl font-bold rounded-xl hover:from-[#A03318] hover:to-[#8B2914] transition-all duration-300 whitespace-nowrap cursor-pointer shadow-2xl transform hover:scale-105"
              >
                <i className="ri-calculator-line mr-3"></i>
                Ersparnis berechnen
              </button>
            </div>
          </div>

          {/* Results */}
          {showResults && (
            <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] text-white rounded-2xl p-6 md:p-10 shadow-2xl">
              <div className="text-center mb-8">
                <h3 className="text-3xl md:text-4xl font-black mb-4" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                  IHRE JÄHRLICHEN HEIZKOSTEN
                </h3>
                <p className="text-lg opacity-90">Basierend auf {houseSize}m² Wohnfläche und {quantity} SRM Brennholz</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {/* Current Costs */}
                <div className="bg-red-500/20 border border-red-400 rounded-xl p-6 text-center">
                  <div className="w-16 h-16 flex items-center justify-center bg-red-500 rounded-full mx-auto mb-4">
                    <i className="ri-arrow-up-line text-white text-2xl"></i>
                  </div>
                  <h4 className="text-lg font-bold mb-2">AKTUELL</h4>
                  <p className="text-2xl md:text-3xl font-black text-red-400">
                    {calculationResult.current.toLocaleString()}€
                  </p>
                  <p className="text-sm opacity-80 mt-1">
                    {heatingOptions.find(opt => opt.value === currentHeating)?.label}
                  </p>
                </div>

                {/* Scheitholz Costs */}
                <div className="bg-yellow-500/20 border border-yellow-400 rounded-xl p-6 text-center">
                  <div className="w-16 h-16 flex items-center justify-center bg-yellow-500 rounded-full mx-auto mb-4">
                    <i className="ri-seedling-line text-white text-2xl"></i>
                  </div>
                  <h4 className="text-lg font-bold mb-2">SCHEITHOLZ</h4>
                  <p className="text-2xl md:text-3xl font-black text-yellow-400">
                    {calculationResult.scheitholz.toLocaleString()}€
                  </p>
                  <p className="text-sm opacity-80 mt-1">
                    Premium Buche 33cm
                  </p>
                </div>

                {/* Industrieholz Costs */}
                <div className="bg-[#D4A520]/20 border border-[#D4A520] rounded-xl p-6 text-center">
                  <div className="w-16 h-16 flex items-center justify-center bg-[#D4A520] rounded-full mx-auto mb-4">
                    <i className="ri-arrow-down-line text-white text-2xl"></i>
                  </div>
                  <h4 className="text-lg font-bold mb-2">INDUSTRIEHOLZ</h4>
                  <p className="text-2xl md:text-3xl font-black text-[#C04020]">
                    {calculationResult.industrieholz.toLocaleString()}€
                  </p>
                  <p className="text-sm opacity-80 mt-1">
                    {quantity} SRM • €{calculatePriceWithDiscount(115, quantity)}/SRM
                  </p>
                </div>
              </div>

              {/* Savings Highlight */}
              <div className="bg-gradient-to-r from-[#D4A520] to-[#FFD700] text-[#1A1A1A] rounded-xl p-6 md:p-8 text-center">
                <div className="mb-4">
                  <div className="text-4xl md:text-5xl lg:text-6xl font-black mb-2">
                    {calculationResult.savings > 0 ? calculationResult.savings.toLocaleString() : 0}€
                  </div>
                  <p className="text-xl md:text-2xl font-bold">
                    {calculationResult.savings > 0 ? 'SPAREN SIE PRO JAHR!' : 'GÜNSTIGER HEIZEN MIT BRENNHOLZ'}
                  </p>
                </div>
                {calculationResult.savings > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm md:text-base">
                    <div className="flex items-center justify-center">
                      <i className="ri-time-line mr-2"></i>
                      <span><strong>{Math.round(calculationResult.savings / 12)}€</strong> pro Monat</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <i className="ri-calendar-line mr-2"></i>
                      <span><strong>{Math.round(calculationResult.savings * 10).toLocaleString()}€</strong> in 10 Jahren</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <i className="ri-percent-line mr-2"></i>
                      <span><strong>{Math.round((calculationResult.savings / calculationResult.current) * 100)}%</strong> Ersparnis</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Quantity Info */}
              <div className="mt-6 p-4 bg-white/10 rounded-lg">
                <div className="flex items-center justify-center text-sm">
                  <i className="ri-information-line mr-2"></i>
                  <span>
                    Empfohlene Menge für {houseSize}m²: ca. {calculationResult.totalQuantityNeeded} SRM pro Jahr
                    {quantity < calculationResult.totalQuantityNeeded && (
                      <span className="text-yellow-300 ml-2">
                        (Sie haben {quantity} SRM gewählt - eventuell benötigen Sie mehr)
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* CTA */}
              <div className="text-center mt-8">
                <CityButton
                  type="calculator"
                  customText={cityData?.calculator_cta_text || 'Jetzt Premium-Qualität bestellen'}
                  cityData={cityData}
                  className="bg-white text-[#C04020] px-4 sm:px-8 py-4 rounded-xl font-bold text-sm sm:text-lg hover:bg-gray-100 transition-colors whitespace-nowrap cursor-pointer shadow-xl transform hover:scale-105 w-full sm:w-auto inline-block"
                >
                  <i className="ri-shopping-cart-line mr-2 sm:mr-3"></i>
                  <span className="hidden sm:inline">{cityData?.calculator_cta_text || 'Jetzt Premium-Qualität bestellen'}</span>
                  <span className="sm:hidden">Jetzt bestellen!</span>
                </CityButton>
                <p className="text-sm opacity-80 mt-3">
                  Mindestbestellmenge: 3 SRM • Lieferung ab €43,50 • Express €139
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Additional Styles */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 24px;
          width: 24px;
          background: #C04020;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 4px 8px rgba(192, 64, 32, 0.3);
        }
        .slider::-moz-range-thumb {
          height: 24px;
          width: 24px;
          background: #C04020;
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 4px 8px rgba(192, 64, 32, 0.3);
        }
      `}</style>
    </section>
  );
}
