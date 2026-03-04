
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface DiscountCode {
  id?: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: string | number;
  minimum_order: string | number;
  minimum_order_amount?: string | number; // Added missing property
  usage_limit: string | number;
  usage_count?: number; // Added missing property
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function DiscountCodesTab() {
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({ show: false, message: '', type: 'success' });
  const [newCode, setNewCode] = useState<DiscountCode>({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    minimum_order: '',
    usage_limit: '',
    valid_from: '',
    valid_until: '',
    is_active: true
  });

  // Using the centralized Supabase client from lib/supabase.ts

  useEffect(() => {
    loadDiscountCodes();
  }, []);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  const loadDiscountCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDiscountCodes(data || []);
    } catch (error: unknown) {
      console.error('Fehler beim Laden der Rabattcodes:', error);
      showNotification('Fehler beim Laden der Rabattcodes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCode({ ...newCode, code: result });
  };

  const validateForm = () => {
    if (!newCode.code.trim()) {
      showNotification('Bitte geben Sie einen Rabattcode ein', 'error');
      return false;
    }
    if (!newCode.discount_value || parseFloat(String(newCode.discount_value)) <= 0) {
      showNotification('Bitte geben Sie einen gültigen Rabatt-Wert ein', 'error');
      return false;
    }
    if (newCode.discount_type === 'percentage' && parseFloat(String(newCode.discount_value)) > 100) {
      showNotification('Prozentuale Rabatte können nicht über 100% liegen', 'error');
      return false;
    }
    if (!newCode.usage_limit || parseInt(String(newCode.usage_limit)) < 1) {
      showNotification('Bitte geben Sie ein gültiges Verwendungslimit ein', 'error');
      return false;
    }
    if (!newCode.valid_from || !newCode.valid_until) {
      showNotification('Bitte geben Sie gültige Daten ein', 'error');
      return false;
    }
    if (new Date(newCode.valid_from) >= new Date(newCode.valid_until)) {
      showNotification('Das Enddatum muss nach dem Startdatum liegen', 'error');
      return false;
    }
    return true;
  };

  const createDiscountCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      // Prüfe ob Code bereits existiert
      const { data: existingCode } = await supabase
        .from('discount_codes')
        .select('id')
        .eq('code', newCode.code.toUpperCase())
        .single();

      if (existingCode) {
        showNotification('Dieser Rabattcode existiert bereits', 'error');
        return;
      }

      const codeData = {
        code: newCode.code.toUpperCase(),
        discount_type: newCode.discount_type,
        discount_value: parseFloat(String(newCode.discount_value)),
        minimum_order_amount: parseFloat(String(newCode.minimum_order)) || 0,
        usage_limit: parseInt(String(newCode.usage_limit)),
        usage_count: 0,
        valid_from: newCode.valid_from,
        valid_until: newCode.valid_until,
        is_active: newCode.is_active,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('discount_codes')
        .insert([codeData]);

      if (error) throw error;

      await loadDiscountCodes();
      setShowAddModal(false);
      setNewCode({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        minimum_order: '',
        usage_limit: '',
        valid_from: '',
        valid_until: '',
        is_active: true
      });
      showNotification('Rabattcode erfolgreich erstellt!', 'success');
    } catch (error: unknown) {
      console.error('Fehler beim Erstellen des Rabattcodes:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      showNotification('Fehler beim Erstellen des Rabattcodes: ' + errorMessage, 'error');
    }
  };

  const toggleCodeStatus = async (id: number | undefined, newStatus: boolean) => {
    if (!id) return;
    try {
      const { error } = await supabase
        .from('discount_codes')
        .update({ is_active: newStatus })
        .eq('id', id);

      if (error) throw error;

      await loadDiscountCodes();
      showNotification(`Rabattcode ${newStatus ? 'aktiviert' : 'deaktiviert'}`, 'success');
    } catch (error: unknown) {
      console.error('Fehler beim Aktualisieren des Status:', error);
      showNotification('Fehler beim Aktualisieren des Status', 'error');
    }
  };

  const deleteCode = async (id: number | undefined) => {
    if (!id) return;
    if (!confirm('Möchten Sie diesen Rabattcode wirklich löschen?')) return;

    try {
      const { error } = await supabase
        .from('discount_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadDiscountCodes();
      showNotification('Rabattcode erfolgreich gelöscht', 'success');
    } catch (error: unknown) {
      console.error('Fehler beim Löschen:', error);
      showNotification('Fehler beim Löschen des Rabattcodes', 'error');
    }
  };

  // Setze Standard-Daten für das Formular
  const setDefaultDates = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const formatDateTime = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setNewCode({
      ...newCode,
      valid_from: formatDateTime(tomorrow),
      valid_until: formatDateTime(nextMonth)
    });
  };

  useEffect(() => {
    if (showAddModal && !newCode.valid_from) {
      setDefaultDates();
    }
  }, [showAddModal]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C04020]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Benachrichtigung */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
          <div className="flex items-center">
            <i className={`ri-${notification.type === 'success' ? 'check' : 'error-warning'}-line mr-2`}></i>
            {notification.message}
          </div>
        </div>
      )}

      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rabattcodes</h2>
          <p className="text-gray-600 mt-1">Erstellen und verwalten Sie Rabattcodes für Ihre Kunden</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#C04020] text-white px-4 py-2 rounded-lg hover:bg-[#A0351A] transition-colors whitespace-nowrap cursor-pointer"
        >
          <i className="ri-add-line mr-2"></i>
          Neuer Rabattcode
        </button>
      </div>

      {/* Erstellen-Formular */}
      {showAddModal && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Neuen Rabattcode erstellen</h3>

          <form onSubmit={createDiscountCode} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rabattcode *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newCode.code}
                    onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="z.B. SOMMER2024"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateRandomCode}
                    className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer whitespace-nowrap"
                    title="Zufälligen Code generieren"
                  >
                    <i className="ri-refresh-line"></i>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rabatt-Typ *
                </label>
                <select
                  value={newCode.discount_type}
                  onChange={(e) => setNewCode({ ...newCode, discount_type: e.target.value as 'percentage' | 'fixed' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                >
                  <option value="percentage">Prozentual (%)</option>
                  <option value="fixed">Fester Betrag (€)</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rabatt-Wert *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={newCode.discount_value}
                    onChange={(e) => setNewCode({ ...newCode, discount_value: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    max={newCode.discount_type === 'percentage' ? '100' : undefined}
                    step="0.01"
                    required
                  />
                  <span className="absolute right-3 top-2 text-gray-500">
                    {newCode.discount_type === 'percentage' ? '%' : '€'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mindestbestellwert (€)
                </label>
                <input
                  type="number"
                  value={newCode.minimum_order}
                  onChange={(e) => setNewCode({ ...newCode, minimum_order: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max. Verwendungen *
                </label>
                <input
                  type="number"
                  value={newCode.usage_limit}
                  onChange={(e) => setNewCode({ ...newCode, usage_limit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gültig ab *
                </label>
                <input
                  type="datetime-local"
                  value={newCode.valid_from}
                  onChange={(e) => setNewCode({ ...newCode, valid_from: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gültig bis *
                </label>
                <input
                  type="datetime-local"
                  value={newCode.valid_until}
                  onChange={(e) => setNewCode({ ...newCode, valid_until: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={newCode.is_active}
                  onChange={(e) => setNewCode({ ...newCode, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="active" className="ml-2 text-sm text-gray-700">
                  Sofort aktivieren
                </label>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-save-line mr-2"></i>
                  Erstellen
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Rabattcodes-Liste */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Aktuelle Rabattcodes ({discountCodes.length})</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rabatt
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verwendungen
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gültigkeit
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {discountCodes.map((code) => {
                const isExpired = new Date(code.valid_until) < new Date();
                const isNotYetValid = new Date(code.valid_from) > new Date();
                const usageLimit = typeof code.usage_limit === 'string' ? parseFloat(code.usage_limit) : code.usage_limit;
                const usagePercentage = usageLimit > 0 ? ((code.usage_count || 0) / usageLimit) * 100 : 0;

                return (
                  <tr key={code.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="font-mono font-bold text-lg text-[#C04020]">
                        {code.code}
                      </div>
                      {code.minimum_order_amount && Number(code.minimum_order_amount) > 0 && (
                        <div className="text-xs text-gray-500">
                          Min. {code.minimum_order_amount}€
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold">
                        {code.discount_type === 'percentage' ? `${code.discount_value}%` : `${code.discount_value}€`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {code.discount_type === 'percentage' ? 'Prozentual' : 'Fester Betrag'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm">
                        {code.usage_count || 0} / {code.usage_limit}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className={`h-2 rounded-full ${usagePercentage >= 100 ? 'bg-red-500' : usagePercentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'} `}
                          style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <div>{new Date(code.valid_from).toLocaleDateString('de-DE')}</div>
                      <div className="text-gray-500">bis</div>
                      <div className={isExpired ? 'text-red-600 font-medium' : ''}>
                        {new Date(code.valid_until).toLocaleDateString('de-DE')}
                      </div>
                      {isExpired && (
                        <div className="text-xs text-red-600">Abgelaufen</div>
                      )}
                      {isNotYetValid && (
                        <div className="text-xs text-orange-600">Noch nicht gültig</div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${code.is_active && !isExpired && !isNotYetValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} `}>
                        {code.is_active && !isExpired && !isNotYetValid ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleCodeStatus(code.id, !code.is_active)}
                          className={`p-1 rounded transition-colors cursor-pointer ${code.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'} `}
                          title={code.is_active ? 'Deaktivieren' : 'Aktivieren'}
                        >
                          <i className={`ri-${code.is_active ? 'pause' : 'play'}-circle-line text-lg`}></i>
                        </button>
                        <button
                          onClick={() => deleteCode(code.id)}
                          className="p-1 rounded text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Löschen"
                        >
                          <i className="ri-delete-bin-line text-lg"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {discountCodes.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <i className="ri-coupon-3-line text-4xl mb-4"></i>
              <p>Noch keine Rabattcodes erstellt</p>
              <p className="text-sm mt-1">Erstellen Sie Ihren ersten Rabattcode</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
