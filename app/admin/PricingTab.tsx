
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function PricingTab() {
  interface PricingTier {
    id: string;
    name: string;
    min_quantity: number;
    max_quantity: number | null;
    adjustment_type: 'percentage' | 'fixed';
    adjustment_value: number;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
  }

  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTier, setEditingTier] = useState<PricingTier | null>(null);
  interface NewTierState {
    name: string;
    description: string;
    price: string;
    billing_period: string;
    features: string[];
    is_popular: boolean;
    is_active: boolean;
  }

  const [newTier, setNewTier] = useState<NewTierState>({
    name: '',
    description: '',
    price: '',
    billing_period: 'monthly',
    features: [],
    is_popular: false,
    is_active: true
  });

  // Using the centralized Supabase client from lib/supabase.ts

  const [minOrderQuantity, setMinOrderQuantity] = useState(3);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    loadPricingData();
  }, []);

  const loadPricingData = async () => {
    try {
      const { data: tiersData, error: tiersError } = await supabase
        .from('pricing_tiers')
        .select('*')
        .eq('is_active', true)
        .order('min_quantity');

      if (tiersError) throw tiersError;
      setPricingTiers(tiersData || []);

      const { data: settingsData, error: settingsError } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'minimum_order_quantity')
        .single();

      if (settingsError) {
        console.log('Settings not found, using default');
      } else {
        setMinOrderQuantity(parseInt(settingsData.setting_value) || 3);
      }
    } catch (error) {
      console.error('Error loading pricing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateMinOrderQuantity = async (newMinQuantity: number) => {
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          setting_key: 'minimum_order_quantity',
          setting_value: newMinQuantity.toString(),
          description: 'Mindestbestellmenge in SRM',
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setMinOrderQuantity(newMinQuantity);
      alert('Mindestbestellmenge erfolgreich aktualisiert!');
    } catch (error) {
      console.error('Error updating minimum order quantity:', error);
      alert('Fehler beim Aktualisieren der Mindestbestellmenge');
    }
  };

  interface PricingTierData {
    name: string;
    min_quantity: number;
    max_quantity: number | null;
    adjustment_type: 'percentage' | 'fixed';
    adjustment_value: number;
    is_active: boolean;
  }

  const savePricingTier = async (tierData: PricingTierData) => {
    try {
      if (editingTier) {
        const { error } = await supabase
          .from('pricing_tiers')
          .update({
            ...tierData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTier.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pricing_tiers')
          .insert(tierData);

        if (error) throw error;
      }

      setIsEditModalOpen(false);
      setShowAddModal(false);
      setEditingTier(null);
      loadPricingData();
      alert(editingTier ? 'Preisstaffel erfolgreich aktualisiert!' : 'Preisstaffel erfolgreich erstellt!');
    } catch (error) {
      console.error('Error saving pricing tier:', error);
      alert('Fehler beim Speichern der Preisstaffel');
    }
  };

  const deletePricingTier = async (tierId: string) => {
    if (!confirm('Möchten Sie diese Preisstaffel wirklich löschen?')) return;

    try {
      const { error } = await supabase
        .from('pricing_tiers')
        .update({ is_active: false })
        .eq('id', tierId);

      if (error) throw error;

      loadPricingData();
      alert('Preisstaffel erfolgreich gelöscht!');
    } catch (error) {
      console.error('Error deleting pricing tier:', error);
      alert('Fehler beim Löschen der Preisstaffel');
    }
  };

  const getAdjustmentText = (tier: PricingTier) => {
    if (tier.adjustment_type === 'percentage') {
      if (tier.adjustment_value === 0) return 'Normalpreis';
      return tier.adjustment_value > 0 ? `+${tier.adjustment_value}% Zuschlag` : `${tier.adjustment_value}% Rabatt`;
    } else {
      return tier.adjustment_value > 0 ? `+€${tier.adjustment_value} pro SRM` : `€${Math.abs(tier.adjustment_value)} Rabatt pro SRM`;
    }
  };

  const getQuantityRangeText = (tier: PricingTier) => {
    if (tier.max_quantity) {
      return `${tier.min_quantity}-${tier.max_quantity} SRM`;
    }
    return `ab ${tier.min_quantity} SRM`;
  };

  const calculateExamplePrice = (basePrice: number, tier: PricingTier) => {
    if (tier.adjustment_type === 'percentage') {
      return basePrice + (basePrice * tier.adjustment_value / 100);
    } else {
      return basePrice + tier.adjustment_value;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="w-12 h-12 flex items-center justify-center bg-[#C04020] rounded-full mx-auto mb-4 animate-pulse">
          <i className="ri-price-tag-line text-2xl text-white"></i>
        </div>
        <p className="text-lg font-medium text-gray-700">Lade Preiskalkulation...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mindestbestellmenge */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#1A1A1A]">Mindestbestellmenge</h2>
            <p className="text-sm text-gray-600">Legen Sie die minimale Bestellmenge fest</p>
          </div>
          <div className="w-12 h-12 flex items-center justify-center bg-[#C04020]/10 rounded-full">
            <i className="ri-ruler-line text-xl text-[#C04020]"></i>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mindestmenge (SRM)
            </label>
            <input
              type="number"
              min="1"
              value={minOrderQuantity}
              onChange={(e) => setMinOrderQuantity(parseInt(e.target.value) || 1)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
            />
          </div>
          <button
            onClick={() => updateMinOrderQuantity(minOrderQuantity)}
            className="bg-[#C04020] hover:bg-[#A03318] text-white px-6 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap mt-6"
          >
            Speichern
          </button>
        </div>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="w-5 h-5 flex items-center justify-center mr-3 text-blue-600">
              <i className="ri-information-line"></i>
            </div>
            <div className="text-sm text-blue-800">
              <p className="font-medium">Aktuell: Mindestbestellung {minOrderQuantity} SRM</p>
              <p>Kunden können nicht weniger als {minOrderQuantity} SRM bestellen.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Preisstaffeln */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#1A1A1A]">Preisstaffeln</h2>
              <p className="text-sm text-gray-600">Verwalten Sie die Preiskalkulationsregeln</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-[#C04020] hover:bg-[#A03318] text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-add-line mr-2"></i>
                Neue Staffel
              </button>
              <button
                onClick={loadPricingData}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-refresh-line mr-2"></i>
                Aktualisieren
              </button>
            </div>
          </div>
        </div>

        {pricingTiers.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
              <i className="ri-price-tag-line text-2xl text-gray-400"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">Keine Preisstaffeln</h3>
            <p className="text-gray-500 mb-4">Erstellen Sie Ihre erste Preisstaffel.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-[#C04020] hover:bg-[#A03318] text-white px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              Erste Staffel erstellen
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Staffel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Mengenbereich
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Preisanpassung
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Beispielpreis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pricingTiers.map((tier) => (
                  <tr key={tier.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-[#1A1A1A]">
                        {tier.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {getQuantityRangeText(tier)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-sm font-medium ${
                          tier.adjustment_value === 0 ? 'text-gray-600' :
                          tier.adjustment_value > 0 ? 'text-orange-600' : 'text-green-600'
                        }`}
                      >
                        {getAdjustmentText(tier)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        <div>Bei €45 Grundpreis:</div>
                        <div className="font-bold text-[#C04020]">
                          €{calculateExamplePrice(45, tier).toFixed(2)} pro SRM
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-600">
                        Aktiv
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setEditingTier(tier);
                          setIsEditModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 cursor-pointer"
                        title="Bearbeiten"
                      >
                        <i className="ri-edit-line"></i>
                      </button>
                      <button
                        onClick={() => deletePricingTier(tier.id)}
                        className="text-red-600 hover:text-red-800 cursor-pointer"
                        title="Löschen"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Current Pricing Overview */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 flex items-center justify-center bg-blue-500 rounded-full mr-3">
            <i className="ri-calculator-line text-white"></i>
          </div>
          <h3 className="text-lg font-bold text-[#1A1A1A]">Aktuelle Preiskalkulation</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="text-sm text-gray-600 mb-1">Mindestbestellung</div>
            <div className="text-lg font-bold text-[#C04020]">{minOrderQuantity} SRM</div>
          </div>
          {pricingTiers.map((tier, index) => (
            <div key={tier.id} className="bg-white rounded-lg p-4 border border-blue-100">
              <div className="text-sm text-gray-600 mb-1">{getQuantityRangeText(tier)}</div>
              <div
                className={`text-lg font-bold ${
                  tier.adjustment_value === 0 ? 'text-gray-600' :
                  tier.adjustment_value > 0 ? 'text-orange-600' : 'text-green-600'
                }`}
              >
                {getAdjustmentText(tier)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(isEditModalOpen || showAddModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#1A1A1A}">
                  {editingTier ? 'Preisstaffel bearbeiten' : 'Neue Preisstaffel'}
                </h2>
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setShowAddModal(false);
                    setEditingTier(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
            </div>

            <form
              onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget as HTMLFormElement);
                const data: PricingTierData = {
                  name: String(formData.get('name') || ''),
                  min_quantity: parseInt(String(formData.get('min_quantity') || '0')),
                  max_quantity: formData.get('max_quantity') ? parseInt(String(formData.get('max_quantity'))) : null,
                  adjustment_type: (formData.get('adjustment_type') as 'percentage' | 'fixed') || 'percentage',
                  adjustment_value: parseFloat(String(formData.get('adjustment_value') || '0')),
                  is_active: true
                };
                savePricingTier(data);
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Staffel-Name
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingTier?.name || ''}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                  placeholder="z.B. Großmengenrabatt"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min. SRM
                  </label>
                  <input
                    type="number"
                    name="min_quantity"
                    min="1"
                    defaultValue={editingTier?.min_quantity || ''}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max. SRM (optional)
                  </label>
                  <input
                    type="number"
                    name="max_quantity"
                    min="1"
                    defaultValue={editingTier?.max_quantity || ''}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                    placeholder="Leer = unbegrenzt"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anpassungstyp
                </label>
                <select
                  name="adjustment_type"
                  defaultValue={editingTier?.adjustment_type || 'percentage'}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] cursor-pointer pr-8"
                  required
                >
                  <option value="percentage">Prozentual (%)</option>
                  <option value="fixed">Fester Betrag (€)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anpassungswert
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="adjustment_value"
                  defaultValue={editingTier?.adjustment_value || ''}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                  placeholder="z.B. 30 für +30% oder -2.50 für -2,50€"
                  required
                />
                <div className="text-xs text-gray-500 mt-1">
                  Positive Werte = Zuschlag, Negative Werte = Rabatt, 0 = Normalpreis
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-[#C04020] hover:bg-[#A03318] text-white py-3 px-4 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
                >
                  {editingTier ? 'Aktualisieren' : 'Erstellen'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setShowAddModal(false);
                    setEditingTier(null);
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
