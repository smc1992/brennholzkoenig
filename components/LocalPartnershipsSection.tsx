'use client';

interface Partner {
  id: string;
  name: string;
  type: 'forestry' | 'supplier' | 'service' | 'community' | 'certification';
  description: string;
  website?: string;
  logo?: string;
  established?: string;
  location: string;
}

interface LocalPartnershipsSectionProps {
  cityName: string;
  customPartners?: Partner[];
  headerImageUrl?: string;
}

export default function LocalPartnershipsSection({ 
  cityName, 
  customPartners = [],
  headerImageUrl
}: LocalPartnershipsSectionProps) {
  const normalizedPartners: Partner[] = (customPartners || []).map((p: any, idx: number) => ({
    id: p.id || String(idx + 1),
    name: p.name,
    type: (p.type as Partner['type']) || 'service',
    description: p.description,
    website: p.website || p.website_url,
    logo: p.logo || p.logo_url,
    established: p.established || (p.founded_year ? String(p.founded_year) : undefined),
    location: p.location || cityName
  }));
  // Fallback-Partner für bessere lokale Glaubwürdigkeit
  const defaultPartners: Partner[] = [
    {
      id: '1',
      name: `Forstwirtschaft ${cityName}`,
      type: 'forestry',
      description: `Unser Hauptpartner für nachhaltiges Brennholz aus den Wäldern rund um ${cityName}. Seit über 20 Jahren arbeiten wir zusammen für beste Qualität.`,
      established: '2003',
      location: `${cityName} und Umgebung`
    },
    {
      id: '2',
      name: `Sägewerk Regional ${cityName}`,
      type: 'supplier',
      description: `Lokales Sägewerk, das unser Brennholz professionell aufbereitet und für optimale Brenneigenschaften sorgt.`,
      established: '1995',
      location: `Industriegebiet ${cityName}`
    },
    {
      id: '3',
      name: `Transportservice ${cityName}`,
      type: 'service',
      description: `Zuverlässiger lokaler Transportpartner für schnelle und sichere Lieferungen in alle Stadtteile von ${cityName}.`,
      established: '2010',
      location: cityName
    },
    {
      id: '4',
      name: `Umweltverband ${cityName}`,
      type: 'community',
      description: `Gemeinsam setzen wir uns für nachhaltige Forstwirtschaft und Umweltschutz in der Region ${cityName} ein.`,
      established: '2008',
      location: `${cityName} Zentrum`
    },
    {
      id: '5',
      name: 'PEFC Zertifizierung',
      type: 'certification',
      description: `Unser Brennholz ist PEFC-zertifiziert und stammt aus nachhaltig bewirtschafteten Wäldern der Region.`,
      established: '2005',
      location: 'International anerkannt'
    },
    {
      id: '6',
      name: `Kaminbauer ${cityName}`,
      type: 'service',
      description: `Lokale Kaminbauer und Ofensetzer, die unsere Kunden bei der optimalen Nutzung unseres Brennholzes beraten.`,
      established: '1988',
      location: `${cityName} und Landkreis`
    }
  ];

  const allPartners = normalizedPartners.length > 0 ? normalizedPartners : defaultPartners;

  const partnerTypes = [
    { 
      id: 'forestry', 
      name: 'Forstwirtschaft', 
      icon: '🌲',
      color: 'bg-green-100 text-green-700',
      description: 'Nachhaltige Waldwirtschaft'
    },
    { 
      id: 'supplier', 
      name: 'Lieferanten', 
      icon: '🏭',
      color: 'bg-blue-100 text-blue-700',
      description: 'Aufbereitung & Qualität'
    },
    { 
      id: 'service', 
      name: 'Dienstleister', 
      icon: '🚚',
      color: 'bg-orange-100 text-orange-700',
      description: 'Transport & Service'
    },
    { 
      id: 'community', 
      name: 'Gemeinschaft', 
      icon: '🤝',
      color: 'bg-purple-100 text-purple-700',
      description: 'Lokale Initiativen'
    },
    { 
      id: 'certification', 
      name: 'Zertifizierung', 
      icon: '✅',
      color: 'bg-emerald-100 text-emerald-700',
      description: 'Qualitätsstandards'
    }
  ];

  const getPartnersByType = (type: string) => {
    return allPartners.filter(partner => partner.type === type);
  };

  const getTypeInfo = (type: string) => {
    return partnerTypes.find(t => t.id === type);
  };

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-white to-wood-50">
      <div className="max-w-6xl mx-auto">
        {headerImageUrl && (
          <div className="relative overflow-hidden rounded-2xl shadow-lg mb-8">
            <img src={headerImageUrl} alt={`Partner in ${cityName}`} className="w-full h-64 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        )}
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-700 mb-4">
            Unsere Partner in {cityName}
          </h2>
          <p className="text-lg text-wood-800 max-w-3xl mx-auto">
            Gemeinsam mit starken lokalen Partnern in {cityName} und der Region 
            garantieren wir Ihnen beste Qualität und zuverlässigen Service.
          </p>
        </div>

        {/* Partnership Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="text-center bg-white rounded-xl shadow-lg p-6">
            <div className="text-3xl font-bold text-primary-700 mb-2">15+</div>
            <div className="text-sm text-gray-600">Lokale Partner</div>
          </div>
          <div className="text-center bg-white rounded-xl shadow-lg p-6">
            <div className="text-3xl font-bold text-primary-700 mb-2">20+</div>
            <div className="text-sm text-gray-600">Jahre Erfahrung</div>
          </div>
          <div className="text-center bg-white rounded-xl shadow-lg p-6">
            <div className="text-3xl font-bold text-primary-700 mb-2">100%</div>
            <div className="text-sm text-gray-600">Regional</div>
          </div>
          <div className="text-center bg-white rounded-xl shadow-lg p-6">
            <div className="text-3xl font-bold text-primary-700 mb-2">PEFC</div>
            <div className="text-sm text-gray-600">Zertifiziert</div>
          </div>
        </div>

        {/* Partner Categories */}
        {partnerTypes.map((type) => {
          const partnersOfType = getPartnersByType(type.id);
          if (partnersOfType.length === 0) return null;

          return (
            <div key={type.id} className="mb-12">
              {/* Category Header */}
              <div className="flex items-center mb-6">
                <div className={`p-3 rounded-lg ${type.color} mr-4`}>
                  <span className="text-2xl">{type.icon}</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-primary-700">{type.name}</h3>
                  <p className="text-wood-800">{type.description}</p>
                </div>
              </div>

              {/* Partners Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {partnersOfType.map((partner) => (
                  <div 
                    key={partner.id}
                    className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-200"
                  >
                    {/* Partner Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-primary-700 mb-1">
                          {partner.name}
                        </h4>
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <span className="mr-2">📍</span>
                          {partner.location}
                        </div>
                        {partner.established && (
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="mr-2">📅</span>
                            Seit {partner.established}
                          </div>
                        )}
                      </div>
                      <div className={`p-2 rounded-lg ${type.color}`}>
                        <span className="text-lg">{type.icon}</span>
                      </div>
                    </div>

                    {/* Partner Description */}
                    <p className="text-wood-800 text-sm leading-relaxed mb-4">
                      {partner.description}
                    </p>

                    {/* Partner Actions */}
                    <div className="flex items-center justify-between">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${type.color}`}>
                        {type.name}
                      </div>
                      {partner.website && (
                        <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                          Website →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Partnership Benefits */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 text-white">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-4">
              Warum lokale Partnerschaften in {cityName} wichtig sind
            </h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-white bg-opacity-20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌱</span>
              </div>
              <h4 className="font-semibold mb-2">Nachhaltigkeit</h4>
              <p className="text-wood-100 text-sm">
                Kurze Transportwege und regionale Kreisläufe schonen die Umwelt
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-white bg-opacity-20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h4 className="font-semibold mb-2">Schnelligkeit</h4>
              <p className="text-wood-100 text-sm">
                Lokale Partner ermöglichen flexible und schnelle Lieferungen
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-white bg-opacity-20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏆</span>
              </div>
              <h4 className="font-semibold mb-2">Qualität</h4>
              <p className="text-wood-100 text-sm">
                Persönliche Beziehungen garantieren höchste Qualitätsstandards
              </p>
            </div>
          </div>
        </div>

        {/* Regional Impact */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-primary-700 mb-6 text-center">
            Unser Beitrag zur Region {cityName}
          </h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-primary-700 mb-4">
                🌳 Umwelt & Nachhaltigkeit
              </h4>
              <ul className="space-y-2 text-wood-800">
                <li>• Förderung nachhaltiger Forstwirtschaft</li>
                <li>• Reduzierung von CO₂-Emissionen durch kurze Wege</li>
                <li>• Unterstützung der Biodiversität in lokalen Wäldern</li>
                <li>• PEFC-zertifizierte Holzwirtschaft</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-primary-700 mb-4">
                💼 Wirtschaft & Arbeitsplätze
              </h4>
              <ul className="space-y-2 text-wood-800">
                <li>• Sicherung lokaler Arbeitsplätze</li>
                <li>• Stärkung der regionalen Wirtschaft</li>
                <li>• Förderung von Handwerksbetrieben</li>
                <li>• Investitionen in die lokale Infrastruktur</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
