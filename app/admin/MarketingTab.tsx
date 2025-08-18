
'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

interface DiscountCode {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  minimum_order_amount: number | null;
  usage_limit: number;
  usage_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
  description?: string;
}

interface Promotion {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  promotion_type: string;
  discount_amount: number;
  is_active: boolean;
  created_at: string;
  title?: string;
  discount_percentage?: number;
  target_products?: string;
}

export default function MarketingTab() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('campaigns');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    type: 'email',
    target_audience: 'all_customers',
    start_date: '',
    end_date: '',
    budget: '',
    status: 'draft'
  });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDiscountModalOpen, setIsAddDiscountModalOpen] = useState(false);
  const [isAddPromotionModalOpen, setIsAddPromotionModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(null);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: discountsData, error: discountsError } = await supabase
        .from('discount_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (discountsError) throw discountsError;

      const { data: promotionsData, error: promotionsError } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });

      if (promotionsError) throw promotionsError;

      setDiscountCodes(discountsData || []);
      setPromotions(promotionsData || []);
    } catch (error) {
      console.error('Error loading marketing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addDiscountCode = async (discountData: Partial<DiscountCode>) => {
    try {
      const { error } = await supabase
        .from('discount_codes')
        .insert({
          ...discountData,
          created_at: new Date().toISOString(),
          usage_count: 0
        });

      if (error) throw error;

      setIsAddDiscountModalOpen(false);
      loadData();
      alert('Rabattcode erfolgreich erstellt!');
    } catch (error) {
      console.error('Error adding discount code:', error);
      alert('Fehler beim Erstellen des Rabattcodes');
    }
  };

  const updateDiscountCode = async (discountData: Partial<DiscountCode>) => {
    try {
      const { error } = await supabase
        .from('discount_codes')
        .update({
          ...discountData,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingDiscount?.id);

      if (error) throw error;

      setEditingDiscount(null);
      loadData();
      alert('Rabattcode erfolgreich aktualisiert!');
    } catch (error) {
      console.error('Error updating discount code:', error);
      alert('Fehler beim Aktualisieren des Rabattcodes');
    }
  };

  const addPromotion = async (promotionData: Partial<Promotion>) => {
    try {
      const { error } = await supabase
        .from('promotions')
        .insert({
          ...promotionData,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      setIsAddPromotionModalOpen(false);
      loadData();
      alert('Aktion erfolgreich erstellt!');
    } catch (error) {
      console.error('Error adding promotion:', error);
      alert('Fehler beim Erstellen der Aktion');
    }
  };

  const updatePromotion = async (promotionData: Partial<Promotion>) => {
    try {
      const { error } = await supabase
        .from('promotions')
        .update({
          ...promotionData,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingPromotion?.id);

      if (error) throw error;

      setEditingPromotion(null);
      loadData();
      alert('Aktion erfolgreich aktualisiert!');
    } catch (error) {
      console.error('Error updating promotion:', error);
      alert('Fehler beim Aktualisieren der Aktion');
    }
  };

  const deleteDiscountCode = async (codeId: string) => {
    if (confirm('Möchten Sie diesen Rabattcode wirklich löschen?')) {
      try {
        const { error } = await supabase
          .from('discount_codes')
          .delete()
          .eq('id', codeId);

        if (error) throw error;

        loadData();
        alert('Rabattcode erfolgreich gelöscht!');
      } catch (error) {
        console.error('Error deleting discount code:', error);
        alert('Fehler beim Löschen des Rabattcodes');
      }
    }
  };

  const deletePromotion = async (id: string) => {
    if (confirm('Möchten Sie diese Aktion wirklich löschen?')) {
      try {
        const { error } = await supabase
          .from('promotions')
          .delete()
          .eq('id', id);

        if (error) throw error;
        loadData();
        alert('Aktion erfolgreich gelöscht!');
      } catch (error) {
        console.error('Error deleting promotion:', error);
        alert('Fehler beim Löschen der Aktion');
      }
    }
  };

  const handleDeletePromotion = (promotion: Promotion) => {
    deletePromotion(promotion.id);
  };
  
  const handleDeleteDiscount = (discount: DiscountCode) => {
    deleteDiscountCode(discount.id);
  };

  const handleEditDiscount = (discount: DiscountCode) => {
    setEditingDiscount(discount);
  };

  const handleEditPromotion = (promotion: Promotion) => {
    setEditingPromotion(promotion);
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const getDiscountStatusColor = (discount: DiscountCode) => {
    const now = new Date();
    const startDate = new Date(discount.valid_from);
    const endDate = new Date(discount.valid_until);

    if (!discount.is_active) return 'text-gray-600 bg-gray-100';
    if (now < startDate) return 'text-blue-600 bg-blue-100';
    if (now > endDate) return 'text-red-600 bg-red-100';
    if (discount.usage_limit && discount.usage_count >= discount.usage_limit) return 'text-red-600 bg-red-100';
    return 'text-green-600 bg-green-100';
  };

  const getDiscountStatus = (discount: DiscountCode) => {
    const now = new Date();
    const startDate = new Date(discount.valid_from);
    const endDate = new Date(discount.valid_until);

    if (!discount.is_active) return 'Inaktiv';
    if (now < startDate) return 'Geplant';
    if (now > endDate) return 'Abgelaufen';
    if (discount.usage_limit && discount.usage_count >= discount.usage_limit) return 'Aufgebraucht';
    return 'Aktiv';
  };

  const getPromotionStatusColor = (promotion: Promotion) => {
    const now = new Date();
    const startDate = new Date(promotion.start_date);
    const endDate = new Date(promotion.end_date);

    if (!promotion.is_active) return 'text-gray-600 bg-gray-100';
    if (now < startDate) return 'text-blue-600 bg-blue-100';
    if (now > endDate) return 'text-red-600 bg-red-100';
    return 'text-green-600 bg-green-100';
  };

  const getPromotionStatus = (promotion: Promotion) => {
    const now = new Date();
    const startDate = new Date(promotion.start_date);
    const endDate = new Date(promotion.end_date);

    if (!promotion.is_active) return 'Inaktiv';
    if (now < startDate) return 'Geplant';
    if (now > endDate) return 'Abgelaufen';
    return 'Aktiv';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="w-12 h-12 flex items-center justify-center bg-[#C04020] rounded-full mx-auto mb-4 animate-pulse">
          <i className="ri-coupon-line text-2xl text-white"></i>
        </div>
        <p className="text-lg font-medium text-gray-700">Lade Marketing-Tools...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">Marketing-Tools</h2>
            <p className="text-gray-600">Verwalten Sie Rabattcodes und Aktionen</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsAddDiscountModalOpen(true)}
              className="bg-[#C04020] hover:bg-[#A03318] text-white px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-coupon-line mr-2"></i>
              Neuer Rabattcode
            </button>
            <button
              onClick={() => setIsAddPromotionModalOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-megaphone-line mr-2"></i>
              Neue Aktion
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('discounts')}
              className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${
                activeTab === 'discounts'
                  ? 'border-[#C04020] text-[#C04020]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className="ri-coupon-line mr-2"></i>
              Rabattcodes ({discountCodes.length})
            </button>
            <button
              onClick={() => setActiveTab('promotions')}
              className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${
                activeTab === 'promotions'
                  ? 'border-[#C04020] text-[#C04020]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className="ri-megaphone-line mr-2"></i>
              Aktionen ({promotions.length})
            </button>
          </nav>
        </div>

        {/* Discount Codes Tab */}
        {activeTab === 'discounts' && (
          <div className="p-6">
            {discountCodes.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
                  <i className="ri-coupon-line text-2xl text-gray-400"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">Noch keine Rabattcodes</h3>
                <p className="text-gray-500 mb-4">Erstellen Sie Ihren ersten Rabattcode für Kunden.</p>
                <button
                  onClick={() => setIsAddDiscountModalOpen(true)}
                  className="bg-[#C04020] hover:bg-[#A03318] text-white px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-add-line mr-2"></i>
                  Ersten Rabattcode erstellen
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Rabatt
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Gültigkeit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Verwendung
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
                    {discountCodes.map((discount) => (
                      <tr key={discount.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-bold text-[#1A1A1A] font-mono bg-gray-100 px-2 py-1 rounded">
                              {discount.code}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {discount.description}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-[#C04020]">
                            {discount.discount_type === 'percentage'
                              ? `${discount.discount_value}%`
                              : `€${discount.discount_value}`}
                          </div>
                          {discount.minimum_order_amount && (
                            <div className="text-xs text-gray-500">
                              Min. €{discount.minimum_order_amount}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {new Date(discount.valid_from).toLocaleDateString('de-DE')} -
                          </div>
                          <div className="text-sm text-gray-900">
                            {new Date(discount.valid_until).toLocaleDateString('de-DE')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {discount.usage_count} / {discount.usage_limit || '∞'}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className="bg-[#C04020] h-2 rounded-full"
                              style={{
                                width: discount.usage_limit
                                  ? `${Math.min(100, (discount.usage_count / discount.usage_limit) * 100)}%`
                                  : '0%',
                              }}
                            ></div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDiscountStatusColor(discount)}`}>
                            {getDiscountStatus(discount)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => setEditingDiscount(discount)}
                            className="text-blue-600 hover:text-blue-800 cursor-pointer"
                            title="Bearbeiten"
                          >
                            <i className="ri-edit-line"></i>
                          </button>
                          <button
                            onClick={() => deleteDiscountCode(discount.id)}
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
        )}

        {/* Promotions Tab */}
        {activeTab === 'promotions' && (
          <div className="p-6">
            {promotions.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
                  <i className="ri-megaphone-line text-2xl text-gray-400"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">Noch keine Aktionen</h3>
                <p className="text-gray-500 mb-4">Erstellen Sie Ihre erste Werbeaktion.</p>
                <button
                  onClick={() => setIsAddPromotionModalOpen(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-add-line mr-2"></i>
                  Erste Aktion erstellen
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {promotions.map((promotion) => (
                  <div key={promotion.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-[#1A1A1A] mb-2">
                          {promotion.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-3">
                          {promotion.description}
                        </p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPromotionStatusColor(promotion)}`}>
                          {getPromotionStatus(promotion)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex justify-between">
                        <span>Laufzeit:</span>
                        <span className="font-medium">
                          {new Date(promotion.start_date).toLocaleDateString('de-DE')} - {new Date(promotion.end_date).toLocaleDateString('de-DE')}
                        </span>
                      </div>
                      {promotion.discount_percentage && (
                        <div className="flex justify-between">
                          <span>Rabatt:</span>
                          <span className="font-medium text-[#C04020]">
                            {promotion.discount_percentage}%
                          </span>
                        </div>
                      )}
                      {promotion.target_products && (
                        <div className="flex justify-between">
                          <span>Produkte:</span>
                          <span className="font-medium">
                            {promotion.target_products.length} ausgewählt
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => setEditingPromotion(promotion)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <i className="ri-edit-line mr-1"></i>
                        Bearbeiten
                      </button>
                      <button
                        onClick={() => deletePromotion(promotion.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Discount Code Modal */}
      {isAddDiscountModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#1A1A1A]">
                  Neuen Rabattcode erstellen
                </h2>
                <button
                  onClick={() => setIsAddDiscountModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
            </div>

            <form
              onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget as HTMLFormElement);
                const data = Object.fromEntries(formData.entries()) as Record<string, FormDataEntryValue>;

                addDiscountCode({
                  code: String(data.code),
                  discount_type: String(data.discount_type),
                  discount_value: parseFloat(String(data.discount_value)),
                  minimum_order_amount: data.minimum_order_amount ? parseFloat(String(data.minimum_order_amount)) : undefined,
                  valid_from: String(data.valid_from),
                  valid_until: String(data.valid_until),
                  usage_limit: data.usage_limit ? parseInt(String(data.usage_limit)) : undefined,
                  is_active: data.is_active === 'true',
                });
              }}
              className="p-6 space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Code *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="code"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] font-mono uppercase"
                      required
                      placeholder="RABATT50"
                    />
                    <button
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        const button = e.currentTarget;
                        const input = button.previousElementSibling as HTMLInputElement;
                        if (input) input.value = generateRandomCode();
                      }}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-refresh-line"></i>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rabatt-Typ</label>
                  <select
                    name="discount_type"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] cursor-pointer pr-8"
                    required
                  >
                    <option value="percentage">Prozentual (%)</option>
                    <option value="fixed">Fester Betrag (€)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rabatt-Wert *</label>
                  <input
                    type="number"
                    name="discount_value"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                    required
                    placeholder="10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mindestbestellwert (€)</label>
                  <input
                    type="number"
                    name="minimum_order_amount"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                    placeholder="50.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gültig von *</label>
                  <input
                    type="date"
                    name="valid_from"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gültig bis *</label>
                  <input
                    type="date"
                    name="valid_until"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Verwendungslimit</label>
                  <input
                    type="number"
                    name="usage_limit"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                    placeholder="Leer = unbegrenzt"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    name="is_active"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] cursor-pointer pr-8"
                    defaultValue="true"
                  >
                    <option value="true">Aktiv</option>
                    <option value="false">Inaktiv</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Beschreibung</label>
                  <textarea
                    name="description"
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                    placeholder="Interne Beschreibung des Rabattcodes..."
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="bg-[#C04020] hover:bg-[#A03318] text-white px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
                >
                  Rabattcode erstellen
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddDiscountModalOpen(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Discount Code Modal */}
      {editingDiscount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#1A1A1A]">
                  Rabattcode bearbeiten: {editingDiscount.code}
                </h2>
                <button
                  onClick={() => setEditingDiscount(null)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
            </div>

            <form
              onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget as HTMLFormElement);
                const data = Object.fromEntries(formData.entries()) as Record<string, FormDataEntryValue>;

                updateDiscountCode({
                  code: String(data.code),
                  discount_type: String(data.discount_type),
                  discount_value: data.discount_value ? parseFloat(String(data.discount_value)) : undefined,
                  minimum_order_amount: data.minimum_order_amount ? parseFloat(String(data.minimum_order_amount)) : undefined,
                  valid_from: String(data.valid_from),
                  valid_until: String(data.valid_until),
                  usage_limit: data.usage_limit ? parseInt(String(data.usage_limit)) : undefined,
                  is_active: data.is_active === 'true',
                  description: String(data.description),
                });
              }}
              className="p-6 space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Code *</label>
                  <input
                    type="text"
                    name="code"
                    defaultValue={editingDiscount.code}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] font-mono uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rabatt-Typ</label>
                  <select
                    name="discount_type"
                    defaultValue={editingDiscount.discount_type}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] cursor-pointer pr-8"
                    required
                  >
                    <option value="percentage">Prozentual (%)</option>
                    <option value="fixed">Fester Betrag (€)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rabatt-Wert *</label>
                  <input
                    type="number"
                    name="discount_value"
                    step="0.01"
                    defaultValue={editingDiscount.discount_value}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mindestbestellwert (€)</label>
                  <input
                    type="number"
                    name="minimum_order_amount"
                    step="0.01"
                    defaultValue={editingDiscount.minimum_order_amount || ''}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gültig von *</label>
                  <input
                    type="date"
                    name="valid_from"
                    defaultValue={editingDiscount.valid_from?.split('T')[0]}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gültig bis *</label>
                  <input
                    type="date"
                    name="valid_until"
                    defaultValue={editingDiscount.valid_until?.split('T')[0]}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Verwendungslimit</label>
                  <input
                    type="number"
                    name="usage_limit"
                    defaultValue={editingDiscount.usage_limit || ''}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Aktuell: {editingDiscount.usage_count} verwendet
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    name="is_active"
                    defaultValue={editingDiscount.is_active.toString()}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] cursor-pointer pr-8"
                  >
                    <option value="true">Aktiv</option>
                    <option value="false">Inaktiv</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Beschreibung</label>
                  <textarea
                    name="description"
                    rows={3}
                    defaultValue={editingDiscount.description || ''}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="bg-[#C04020] hover:bg-[#A03318] text-white px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
                >
                  Änderungen speichern
                </button>
                <button
                  type="button"
                  onClick={() => setEditingDiscount(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
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
