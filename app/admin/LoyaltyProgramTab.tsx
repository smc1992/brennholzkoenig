
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface LoyaltyMember {
  id: string;
  customer_id: string;
  points_balance: number;
  total_points_earned: number;
  total_points_redeemed: number;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  customer_email?: string;
  tier?: string;
  total_earned?: number;
  total_redeemed?: number;
  customers?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export default function LoyaltyProgramTab() {
  const [loyaltySettings, setLoyaltySettings] = useState({
    points_per_euro: 1,
    welcome_bonus: 100,
    birthday_bonus: 50,
    referral_bonus: 200,
    minimum_redemption: 100,
    point_value: 0.01,
    is_enabled: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');

  // Using the centralized Supabase client from lib/supabase.ts

  const [members, setMembers] = useState<LoyaltyMember[]>([]);
  const [settings, setSettings] = useState({
    points_per_euro: 1,
    points_value: 0.01,
    min_points_redemption: 100,
    birthday_bonus: 50,
    referral_bonus: 100,
    active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: settingsData } = await supabase
        .from('app_settings')
        .select('*')
        .eq('category', 'loyalty_program')
        .single();

      if (settingsData?.settings) {
        setSettings(settingsData.settings);
      }

      const { data: membersData } = await supabase
        .from('loyalty_members')
        .select(`
          *,
          customers (
            first_name,
            last_name,
            email
          )
        `)
        .order('points_balance', { ascending: false });

      if (membersData) {
        const formattedMembers = membersData.map(member => ({
          ...member,
          customer_name: `${member.customers?.first_name} ${member.customers?.last_name}`,
          customer_email: member.customers?.email
        }));
        setMembers(formattedMembers);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          category: 'loyalty_program',
          settings: settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      alert('Treueprogramm-Einstellungen gespeichert!');
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern der Einstellungen.');
    } finally {
      setSaving(false);
    }
  };

  const adjustPoints = async (memberId: string, points: number, reason: string) => {
    try {
      const { error } = await supabase.rpc('adjust_loyalty_points', {
        member_id: memberId,
        points_change: points,
        reason: reason
      });

      if (error) throw error;
      await loadData();
      alert('Punkte erfolgreich angepasst!');
    } catch (error) {
      console.error('Fehler beim Anpassen der Punkte:', error);
      alert('Fehler beim Anpassen der Punkte.');
    }
  };

  const getTierName = (points: number) => {
    if (points >= 1000) return 'Gold';
    if (points >= 500) return 'Silber';
    return 'Bronze';
  };

  const getTierColor = (tier?: string) => {
    switch (tier) {
      case 'Gold': return 'bg-yellow-100 text-yellow-800';
      case 'Silber': return 'bg-gray-100 text-gray-800';
      default: return 'bg-orange-100 text-orange-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C04020]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Kundentreue-Programm</h2>
        <p className="text-gray-600 mt-1">Belohnen Sie treue Kunden mit Punkten und Vorteilen</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm cursor-pointer ${
              activeTab === 'settings'
                ? 'border-[#C04020] text-[#C04020]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <i className="ri-settings-line mr-2"></i>
            Einstellungen
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`py-2 px-1 border-b-2 font-medium text-sm cursor-pointer ${
              activeTab === 'members'
                ? 'border-[#C04020] text-[#C04020]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <i className="ri-user-star-line mr-2"></i>
            Mitglieder ({members.length})
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`py-2 px-1 border-b-2 font-medium text-sm cursor-pointer ${
              activeTab === 'rewards'
                ? 'border-[#C04020] text-[#C04020]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <i className="ri-gift-line mr-2"></i>
            Belohnungen
          </button>
        </nav>
      </div>

      {/* Einstellungen Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Programm-Einstellungen</h3>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Treueprogramm aktiviert</h4>
                <p className="text-sm text-gray-600">Kunden sammeln automatisch Punkte bei Bestellungen</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={loyaltySettings.is_enabled}
                  onChange={(e) => setLoyaltySettings({ ...loyaltySettings, is_enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Punkte pro ausgegebenem Euro
                </label>
                <input
                  type="number"
                  value={loyaltySettings.points_per_euro}
                  onChange={(e) => setLoyaltySettings({ ...loyaltySettings, points_per_euro: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Bei 100€ Bestellung = {(100 * loyaltySettings.points_per_euro).toFixed(0)} Punkte
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wert pro Punkt (€)
                </label>
                <input
                  type="number"
                  value={loyaltySettings.point_value}
                  onChange={(e) => setLoyaltySettings({ ...loyaltySettings, point_value: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">
                  100 Punkte = {(100 * loyaltySettings.point_value).toFixed(2)}€ Rabatt
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mindest-Punkte für Einlösung
                </label>
                <input
                  type="number"
                  value={loyaltySettings.minimum_redemption}
                  onChange={(e) => setLoyaltySettings({ ...loyaltySettings, minimum_redemption: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Geburtstags-Bonus (Punkte)
                </label>
                <input
                  type="number"
                  value={loyaltySettings.birthday_bonus}
                  onChange={(e) => setLoyaltySettings({ ...loyaltySettings, birthday_bonus: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weiterempfehlungs-Bonus
                </label>
                <input
                  type="number"
                  value={loyaltySettings.referral_bonus}
                  onChange={(e) => setLoyaltySettings({ ...loyaltySettings, referral_bonus: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={saveSettings}
                disabled={saving}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    Speichern...
                  </>
                ) : (
                  <>
                    <i className="ri-save-line mr-2"></i>
                    Einstellungen speichern
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mitglieder Tab */}
      {activeTab === 'members' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Treueprogramm-Mitglieder</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kunde
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tier
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Punkte-Stand
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gesammelt
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Eingelöst
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{member.customer_name}</div>
                        <div className="text-sm text-gray-500">{member.customer_email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierColor(member.tier)}`}>
                        {member.tier}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-lg font-bold text-[#C04020]">
                        {member.points_balance}
                      </div>
                      <div className="text-xs text-gray-500">
                        ≈ {(member.points_balance * loyaltySettings.point_value).toFixed(2)}€
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {member.total_earned}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {member.total_redeemed}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            const points = prompt('Punkte hinzufügen (+) oder abziehen (-):');
                            if (points) {
                              const reason = prompt('Grund für die Anpassung:') || 'Manuelle Anpassung';
                              adjustPoints(member.id, parseInt(points), reason);
                            }
                          }}
                          className="text-blue-600 hover:bg-blue-50 p-1 rounded transition-colors cursor-pointer"
                          title="Punkte anpassen"
                        >
                          <i className="ri-edit-line text-lg"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {members.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <i className="ri-user-star-line text-4xl mb-4"></i>
                <p>Noch keine Treueprogramm-Mitglieder</p>
                <p className="text-sm mt-1">Kunden werden automatisch angemeldet bei der ersten Bestellung</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Belohnungen Tab */}
      {activeTab === 'rewards' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Belohnungs-Tiers</h3>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="border rounded-lg p-4 bg-orange-50 border-orange-200">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                  <i className="ri-bronze-line text-white text-sm"></i>
                </div>
                <h4 className="font-semibold text-orange-800">Bronze</h4>
              </div>
              <p className="text-sm text-orange-700 mb-4">0 - 499 Punkte</p>
              <ul className="text-sm text-orange-600 space-y-1">
                <li>• Standard Punkte-Sammlung</li>
                <li>• Geburtstags-Bonus</li>
                <li>• Newsletter-Rabatte</li>
              </ul>
            </div>

            <div className="border rounded-lg p-4 bg-gray-50 border-gray-200">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center mr-3">
                  <i className="ri-silver-line text-white text-sm"></i>
                </div>
                <h4 className="font-semibold text-gray-800">Silber</h4>
              </div>
              <p className="text-sm text-gray-700 mb-4">500 - 999 Punkte</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 1.5x Punkte-Multiplikator</li>
                <li>• Exklusive Angebote</li>
                <li>• Prioritäts-Support</li>
                <li>• Früher Zugang zu Sales</li>
              </ul>
            </div>

            <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                  <i className="ri-vip-crown-line text-white text-sm"></i>
                </div>
                <h4 className="font-semibold text-yellow-800">Gold</h4>
              </div>
              <p className="text-sm text-yellow-700 mb-4">1000+ Punkte</p>
              <ul className="text-sm text-yellow-600 space-y-1">
                <li>• 2x Punkte-Multiplikator</li>
                <li>• VIP-Kundenbetreuer</li>
                <li>• Kostenloser Premium-Versand</li>
                <li>• Exklusive Gold-Produkte</li>
                <li>• Persönliche Beratung</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">💡 Programm-Tipps</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Kommunizieren Sie die Vorteile deutlich auf Ihrer Website</li>
              <li>• Senden Sie regelmäßige Punktestand-Updates per E-Mail</li>
              <li>• Erstellen Sie zeitlich begrenzte Bonus-Aktionen</li>
              <li>• Belohnen Sie auch andere Aktionen wie Bewertungen oder Weiterempfehlungen</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
