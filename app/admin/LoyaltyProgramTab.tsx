
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
    is_enabled: true,
    // Erweiterte Punktevergabe-Regeln
    categoryMultipliers: {
      premium: 2.0,      // Premium-Brennholz: 2x Punkte
      standard: 1.0,     // Standard-Brennholz: 1x Punkte
      accessories: 1.5   // Zubehör: 1.5x Punkte
    },
    timeBonuses: {
      weekendMultiplier: 1.5,  // Wochenende: 1.5x Punkte
      holidayMultiplier: 2.0,  // Feiertage: 2x Punkte
      enabled: false
    },
    orderValueBonuses: [
      { minValue: 100, bonusPoints: 20 },
      { minValue: 200, bonusPoints: 50 },
      { minValue: 500, bonusPoints: 150 }
    ],
    // Automatisierte Belohnungen
    automatedRewards: {
      enabled: true,
      autoVouchers: {
        enabled: true,
        thresholds: [
          { points: 500, voucherValue: 10, description: "10€ Gutschein ab 500 Punkten" },
          { points: 1000, voucherValue: 25, description: "25€ Gutschein ab 1000 Punkten" },
          { points: 2000, voucherValue: 60, description: "60€ Gutschein ab 2000 Punkten" }
        ]
      },
      birthdayEmails: {
        enabled: true,
        bonusPoints: 100,
        emailTemplate: "Herzlichen Glückwunsch zum Geburtstag! Als Geschenk erhalten Sie {points} Bonuspunkte.",
        sendDaysBefore: 0
      },
      anniversaryRewards: {
        enabled: false,
        bonusPoints: 200,
        emailTemplate: "Vielen Dank für Ihre Treue! Zum Jahrestag Ihrer Mitgliedschaft erhalten Sie {points} Bonuspunkte."
      }
    },
    gamification: {
      enabled: false,
      levelSystem: {
        enabled: false,
        levels: [
          { name: "Bronze", minPoints: 0, benefits: "5% Rabatt", color: "#CD7F32" },
          { name: "Silber", minPoints: 500, benefits: "10% Rabatt", color: "#C0C0C0" },
          { name: "Gold", minPoints: 1000, benefits: "15% Rabatt", color: "#FFD700" },
          { name: "Platin", minPoints: 2000, benefits: "20% Rabatt", color: "#E5E4E2" }
        ]
      },
      badges: {
        enabled: false,
        availableBadges: [
          { id: "first_purchase", name: "Erste Bestellung", description: "Erste Bestellung abgeschlossen", icon: "🎉", points: 50 },
          { id: "loyal_customer", name: "Treuer Kunde", description: "10 Bestellungen abgeschlossen", icon: "⭐", points: 100 },
          { id: "big_spender", name: "Großeinkäufer", description: "Bestellung über 500€", icon: "💎", points: 200 },
          { id: "referral_master", name: "Empfehlungsmeister", description: "5 Freunde empfohlen", icon: "🤝", points: 150 }
        ]
      },
      progressBar: {
        enabled: false,
        showOnProfile: true,
        showPointsToNextLevel: true,
        animateProgress: true
      }
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');

  // Using the centralized Supabase client from lib/supabase.ts

  const [members, setMembers] = useState<LoyaltyMember[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: settingsData } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_type', 'loyalty_program')
        .eq('setting_key', 'config')
        .single();

      if (settingsData?.setting_value) {
        const parsedSettings = JSON.parse(settingsData.setting_value);
        setLoyaltySettings(parsedSettings);
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
        const formattedMembers = membersData.map((member: any) => ({
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
          setting_type: 'loyalty_program',
          setting_key: 'config',
          setting_value: JSON.stringify(loyaltySettings),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'setting_type,setting_key'
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

            {/* Erweiterte Punktevergabe-Regeln */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Erweiterte Punktevergabe-Regeln</h4>
              
              {/* Produktkategorien-Multiplikatoren */}
              <div className="mb-6">
                <h5 className="text-md font-medium text-gray-700 mb-3">Produktkategorien-Multiplikatoren</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Premium-Brennholz (Multiplikator)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={loyaltySettings.categoryMultipliers?.premium || 2.0}
                      onChange={(e) => setLoyaltySettings({ 
                        ...loyaltySettings, 
                        categoryMultipliers: { 
                          ...loyaltySettings.categoryMultipliers, 
                          premium: parseFloat(e.target.value) || 2.0 
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Standard-Brennholz (Multiplikator)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={loyaltySettings.categoryMultipliers?.standard || 1.0}
                      onChange={(e) => setLoyaltySettings({ 
                        ...loyaltySettings, 
                        categoryMultipliers: { 
                          ...loyaltySettings.categoryMultipliers, 
                          standard: parseFloat(e.target.value) || 1.0 
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zubehör (Multiplikator)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={loyaltySettings.categoryMultipliers?.accessories || 1.5}
                      onChange={(e) => setLoyaltySettings({ 
                        ...loyaltySettings, 
                        categoryMultipliers: { 
                          ...loyaltySettings.categoryMultipliers, 
                          accessories: parseFloat(e.target.value) || 1.5 
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0.1"
                    />
                  </div>
                </div>
              </div>

              {/* Zeit-Boni */}
              <div className="mb-6">
                <h5 className="text-md font-medium text-gray-700 mb-3">Zeit-basierte Boni</h5>
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={loyaltySettings.timeBonuses?.enabled || false}
                      onChange={(e) => setLoyaltySettings({ 
                        ...loyaltySettings, 
                        timeBonuses: { 
                          ...loyaltySettings.timeBonuses, 
                          enabled: e.target.checked 
                        }
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Zeit-Boni aktivieren</span>
                  </label>
                </div>
                {loyaltySettings.timeBonuses?.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Wochenend-Multiplikator
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={loyaltySettings.timeBonuses?.weekendMultiplier || 1.5}
                        onChange={(e) => setLoyaltySettings({ 
                          ...loyaltySettings, 
                          timeBonuses: { 
                            ...loyaltySettings.timeBonuses, 
                            weekendMultiplier: parseFloat(e.target.value) || 1.5 
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1.0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Feiertags-Multiplikator
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={loyaltySettings.timeBonuses?.holidayMultiplier || 2.0}
                        onChange={(e) => setLoyaltySettings({ 
                          ...loyaltySettings, 
                          timeBonuses: { 
                            ...loyaltySettings.timeBonuses, 
                            holidayMultiplier: parseFloat(e.target.value) || 2.0 
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1.0"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Bestellwert-Boni */}
              <div className="mb-6">
                <h5 className="text-md font-medium text-gray-700 mb-3">Bestellwert-Boni</h5>
                <div className="space-y-3">
                  {loyaltySettings.orderValueBonuses?.map((bonus, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mindestbestellwert (€)
                        </label>
                        <input
                          type="number"
                          value={bonus.minValue}
                          onChange={(e) => {
                            const newBonuses = [...(loyaltySettings.orderValueBonuses || [])];
                            newBonuses[index] = { ...bonus, minValue: parseInt(e.target.value) || 0 };
                            setLoyaltySettings({ ...loyaltySettings, orderValueBonuses: newBonuses });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bonus-Punkte
                        </label>
                        <input
                          type="number"
                          value={bonus.bonusPoints}
                          onChange={(e) => {
                            const newBonuses = [...(loyaltySettings.orderValueBonuses || [])];
                            newBonuses[index] = { ...bonus, bonusPoints: parseInt(e.target.value) || 0 };
                            setLoyaltySettings({ ...loyaltySettings, orderValueBonuses: newBonuses });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                        />
                      </div>
                      <div>
                        <button
                          onClick={() => {
                            const newBonuses = loyaltySettings.orderValueBonuses?.filter((_, i) => i !== index) || [];
                            setLoyaltySettings({ ...loyaltySettings, orderValueBonuses: newBonuses });
                          }}
                          className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newBonuses = [...(loyaltySettings.orderValueBonuses || []), { minValue: 0, bonusPoints: 0 }];
                      setLoyaltySettings({ ...loyaltySettings, orderValueBonuses: newBonuses });
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <i className="ri-add-line mr-2"></i>
                    Bonus hinzufügen
                  </button>
                </div>
              </div>
            </div>

            {/* Automatisierte Belohnungen */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Automatisierte Belohnungen</h4>
              
              {/* Automatisierte Belohnungen aktivieren */}
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={loyaltySettings.automatedRewards?.enabled || false}
                    onChange={(e) => setLoyaltySettings({ 
                      ...loyaltySettings, 
                      automatedRewards: { 
                        ...loyaltySettings.automatedRewards, 
                        enabled: e.target.checked 
                      }
                    })}
                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Automatisierte Belohnungen aktivieren</span>
                </label>
              </div>

              {loyaltySettings.automatedRewards?.enabled && (
                <>
                  {/* Auto-Gutscheine */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-md font-medium text-gray-700">Automatische Gutscheine</h5>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={loyaltySettings.automatedRewards?.autoVouchers?.enabled || false}
                          onChange={(e) => setLoyaltySettings({ 
                            ...loyaltySettings, 
                            automatedRewards: { 
                              ...loyaltySettings.automatedRewards, 
                              autoVouchers: { 
                                ...loyaltySettings.automatedRewards?.autoVouchers, 
                                enabled: e.target.checked 
                              }
                            }
                          })}
                          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-600">Aktiviert</span>
                      </label>
                    </div>
                    
                    {loyaltySettings.automatedRewards?.autoVouchers?.enabled && (
                      <div className="space-y-3">
                        {loyaltySettings.automatedRewards?.autoVouchers?.thresholds?.map((threshold, index) => (
                          <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Punkte-Schwelle
                              </label>
                              <input
                                type="number"
                                value={threshold.points}
                                onChange={(e) => {
                                  const newThresholds = [...(loyaltySettings.automatedRewards?.autoVouchers?.thresholds || [])];
                                  newThresholds[index] = { ...threshold, points: parseInt(e.target.value) || 0 };
                                  setLoyaltySettings({ 
                                    ...loyaltySettings, 
                                    automatedRewards: { 
                                      ...loyaltySettings.automatedRewards, 
                                      autoVouchers: { 
                                        ...loyaltySettings.automatedRewards?.autoVouchers, 
                                        thresholds: newThresholds 
                                      }
                                    }
                                  });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                min="0"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Gutschein-Wert (€)
                              </label>
                              <input
                                type="number"
                                value={threshold.voucherValue}
                                onChange={(e) => {
                                  const newThresholds = [...(loyaltySettings.automatedRewards?.autoVouchers?.thresholds || [])];
                                  newThresholds[index] = { ...threshold, voucherValue: parseInt(e.target.value) || 0 };
                                  setLoyaltySettings({ 
                                    ...loyaltySettings, 
                                    automatedRewards: { 
                                      ...loyaltySettings.automatedRewards, 
                                      autoVouchers: { 
                                        ...loyaltySettings.automatedRewards?.autoVouchers, 
                                        thresholds: newThresholds 
                                      }
                                    }
                                  });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                min="0"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Beschreibung
                              </label>
                              <input
                                type="text"
                                value={threshold.description}
                                onChange={(e) => {
                                  const newThresholds = [...(loyaltySettings.automatedRewards?.autoVouchers?.thresholds || [])];
                                  newThresholds[index] = { ...threshold, description: e.target.value };
                                  setLoyaltySettings({ 
                                    ...loyaltySettings, 
                                    automatedRewards: { 
                                      ...loyaltySettings.automatedRewards, 
                                      autoVouchers: { 
                                        ...loyaltySettings.automatedRewards?.autoVouchers, 
                                        thresholds: newThresholds 
                                      }
                                    }
                                  });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <button
                                onClick={() => {
                                  const newThresholds = loyaltySettings.automatedRewards?.autoVouchers?.thresholds?.filter((_, i) => i !== index) || [];
                                  setLoyaltySettings({ 
                                    ...loyaltySettings, 
                                    automatedRewards: { 
                                      ...loyaltySettings.automatedRewards, 
                                      autoVouchers: { 
                                        ...loyaltySettings.automatedRewards?.autoVouchers, 
                                        thresholds: newThresholds 
                                      }
                                    }
                                  });
                                }}
                                className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors mt-6"
                              >
                                <i className="ri-delete-bin-line"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const newThresholds = [...(loyaltySettings.automatedRewards?.autoVouchers?.thresholds || []), { points: 0, voucherValue: 0, description: "" }];
                            setLoyaltySettings({ 
                              ...loyaltySettings, 
                              automatedRewards: { 
                                ...loyaltySettings.automatedRewards, 
                                autoVouchers: { 
                                  ...loyaltySettings.automatedRewards?.autoVouchers, 
                                  thresholds: newThresholds 
                                }
                              }
                            });
                          }}
                          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          <i className="ri-add-line mr-2"></i>
                          Gutschein-Schwelle hinzufügen
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Geburtstags-E-Mails */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-md font-medium text-gray-700">Geburtstags-E-Mails</h5>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={loyaltySettings.automatedRewards?.birthdayEmails?.enabled || false}
                          onChange={(e) => setLoyaltySettings({ 
                            ...loyaltySettings, 
                            automatedRewards: { 
                              ...loyaltySettings.automatedRewards, 
                              birthdayEmails: { 
                                ...loyaltySettings.automatedRewards?.birthdayEmails, 
                                enabled: e.target.checked 
                              }
                            }
                          })}
                          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-600">Aktiviert</span>
                      </label>
                    </div>
                    
                    {loyaltySettings.automatedRewards?.birthdayEmails?.enabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bonus-Punkte
                          </label>
                          <input
                            type="number"
                            value={loyaltySettings.automatedRewards?.birthdayEmails?.bonusPoints || 100}
                            onChange={(e) => setLoyaltySettings({ 
                              ...loyaltySettings, 
                              automatedRewards: { 
                                ...loyaltySettings.automatedRewards, 
                                birthdayEmails: { 
                                  ...loyaltySettings.automatedRewards?.birthdayEmails, 
                                  bonusPoints: parseInt(e.target.value) || 100 
                                }
                              }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tage vor Geburtstag senden
                          </label>
                          <input
                            type="number"
                            value={loyaltySettings.automatedRewards?.birthdayEmails?.sendDaysBefore || 0}
                            onChange={(e) => setLoyaltySettings({ 
                              ...loyaltySettings, 
                              automatedRewards: { 
                                ...loyaltySettings.automatedRewards, 
                                birthdayEmails: { 
                                  ...loyaltySettings.automatedRewards?.birthdayEmails, 
                                  sendDaysBefore: parseInt(e.target.value) || 0 
                                }
                              }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            min="0"
                            max="30"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            E-Mail-Vorlage (verwenden Sie {'{points}'} für die Punkteanzahl)
                          </label>
                          <textarea
                            value={loyaltySettings.automatedRewards?.birthdayEmails?.emailTemplate || ""}
                            onChange={(e) => setLoyaltySettings({ 
                              ...loyaltySettings, 
                              automatedRewards: { 
                                ...loyaltySettings.automatedRewards, 
                                birthdayEmails: { 
                                  ...loyaltySettings.automatedRewards?.birthdayEmails, 
                                  emailTemplate: e.target.value 
                                }
                              }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={3}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Jahrestags-Belohnungen */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-md font-medium text-gray-700">Jahrestags-Belohnungen</h5>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={loyaltySettings.automatedRewards?.anniversaryRewards?.enabled || false}
                          onChange={(e) => setLoyaltySettings({ 
                            ...loyaltySettings, 
                            automatedRewards: { 
                              ...loyaltySettings.automatedRewards, 
                              anniversaryRewards: { 
                                ...loyaltySettings.automatedRewards?.anniversaryRewards, 
                                enabled: e.target.checked 
                              }
                            }
                          })}
                          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-600">Aktiviert</span>
                      </label>
                    </div>
                    
                    {loyaltySettings.automatedRewards?.anniversaryRewards?.enabled && (
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bonus-Punkte
                          </label>
                          <input
                            type="number"
                            value={loyaltySettings.automatedRewards?.anniversaryRewards?.bonusPoints || 200}
                            onChange={(e) => setLoyaltySettings({ 
                              ...loyaltySettings, 
                              automatedRewards: { 
                                ...loyaltySettings.automatedRewards, 
                                anniversaryRewards: { 
                                  ...loyaltySettings.automatedRewards?.anniversaryRewards, 
                                  bonusPoints: parseInt(e.target.value) || 200 
                                }
                              }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            E-Mail-Vorlage (verwenden Sie {'{points}'} für die Punkteanzahl)
                          </label>
                          <textarea
                            value={loyaltySettings.automatedRewards?.anniversaryRewards?.emailTemplate || ""}
                            onChange={(e) => setLoyaltySettings({ 
                              ...loyaltySettings, 
                              automatedRewards: { 
                                ...loyaltySettings.automatedRewards, 
                                anniversaryRewards: { 
                                  ...loyaltySettings.automatedRewards?.anniversaryRewards, 
                                  emailTemplate: e.target.value 
                                }
                              }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={3}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Gamification-Features */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Gamification-Features</h4>
              
              {/* Gamification aktivieren */}
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={loyaltySettings.gamification?.enabled || false}
                    onChange={(e) => setLoyaltySettings({ 
                      ...loyaltySettings, 
                      gamification: { 
                        ...loyaltySettings.gamification, 
                        enabled: e.target.checked 
                      }
                    })}
                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Gamification-Features aktivieren</span>
                </label>
              </div>

              {loyaltySettings.gamification?.enabled && (
                <>
                  {/* Level-System */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-md font-medium text-gray-700">Level-System</h5>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={loyaltySettings.gamification?.levelSystem?.enabled || false}
                          onChange={(e) => setLoyaltySettings({ 
                            ...loyaltySettings, 
                            gamification: { 
                              ...loyaltySettings.gamification, 
                              levelSystem: { 
                                ...loyaltySettings.gamification?.levelSystem, 
                                enabled: e.target.checked 
                              }
                            }
                          })}
                          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-600">Aktiviert</span>
                      </label>
                    </div>
                    
                    {loyaltySettings.gamification?.levelSystem?.enabled && (
                      <div className="space-y-3">
                        {loyaltySettings.gamification?.levelSystem?.levels?.map((level, index) => (
                          <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Level-Name
                              </label>
                              <input
                                type="text"
                                value={level.name}
                                onChange={(e) => {
                                  const newLevels = [...(loyaltySettings.gamification?.levelSystem?.levels || [])];
                                  newLevels[index] = { ...level, name: e.target.value };
                                  setLoyaltySettings({ 
                                    ...loyaltySettings, 
                                    gamification: { 
                                      ...loyaltySettings.gamification, 
                                      levelSystem: { 
                                        ...loyaltySettings.gamification?.levelSystem, 
                                        levels: newLevels 
                                      }
                                    }
                                  });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Min. Punkte
                              </label>
                              <input
                                type="number"
                                value={level.minPoints}
                                onChange={(e) => {
                                  const newLevels = [...(loyaltySettings.gamification?.levelSystem?.levels || [])];
                                  newLevels[index] = { ...level, minPoints: parseInt(e.target.value) || 0 };
                                  setLoyaltySettings({ 
                                    ...loyaltySettings, 
                                    gamification: { 
                                      ...loyaltySettings.gamification, 
                                      levelSystem: { 
                                        ...loyaltySettings.gamification?.levelSystem, 
                                        levels: newLevels 
                                      }
                                    }
                                  });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                min="0"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Vorteile
                              </label>
                              <input
                                type="text"
                                value={level.benefits}
                                onChange={(e) => {
                                  const newLevels = [...(loyaltySettings.gamification?.levelSystem?.levels || [])];
                                  newLevels[index] = { ...level, benefits: e.target.value };
                                  setLoyaltySettings({ 
                                    ...loyaltySettings, 
                                    gamification: { 
                                      ...loyaltySettings.gamification, 
                                      levelSystem: { 
                                        ...loyaltySettings.gamification?.levelSystem, 
                                        levels: newLevels 
                                      }
                                    }
                                  });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Farbe
                              </label>
                              <input
                                type="color"
                                value={level.color}
                                onChange={(e) => {
                                  const newLevels = [...(loyaltySettings.gamification?.levelSystem?.levels || [])];
                                  newLevels[index] = { ...level, color: e.target.value };
                                  setLoyaltySettings({ 
                                    ...loyaltySettings, 
                                    gamification: { 
                                      ...loyaltySettings.gamification, 
                                      levelSystem: { 
                                        ...loyaltySettings.gamification?.levelSystem, 
                                        levels: newLevels 
                                      }
                                    }
                                  });
                                }}
                                className="w-full h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <button
                                onClick={() => {
                                  const newLevels = loyaltySettings.gamification?.levelSystem?.levels?.filter((_, i) => i !== index) || [];
                                  setLoyaltySettings({ 
                                    ...loyaltySettings, 
                                    gamification: { 
                                      ...loyaltySettings.gamification, 
                                      levelSystem: { 
                                        ...loyaltySettings.gamification?.levelSystem, 
                                        levels: newLevels 
                                      }
                                    }
                                  });
                                }}
                                className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors mt-6"
                              >
                                <i className="ri-delete-bin-line"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const newLevels = [...(loyaltySettings.gamification?.levelSystem?.levels || []), { name: "", minPoints: 0, benefits: "", color: "#000000" }];
                            setLoyaltySettings({ 
                              ...loyaltySettings, 
                              gamification: { 
                                ...loyaltySettings.gamification, 
                                levelSystem: { 
                                  ...loyaltySettings.gamification?.levelSystem, 
                                  levels: newLevels 
                                }
                              }
                            });
                          }}
                          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          <i className="ri-add-line mr-2"></i>
                          Level hinzufügen
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Abzeichen-System */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-md font-medium text-gray-700">Abzeichen-System</h5>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={loyaltySettings.gamification?.badges?.enabled || false}
                          onChange={(e) => setLoyaltySettings({ 
                            ...loyaltySettings, 
                            gamification: { 
                              ...loyaltySettings.gamification, 
                              badges: { 
                                ...loyaltySettings.gamification?.badges, 
                                enabled: e.target.checked 
                              }
                            }
                          })}
                          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-600">Aktiviert</span>
                      </label>
                    </div>
                    
                    {loyaltySettings.gamification?.badges?.enabled && (
                      <div className="space-y-3">
                        {loyaltySettings.gamification?.badges?.availableBadges?.map((badge, index) => (
                          <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 bg-gray-50 rounded-lg">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                ID
                              </label>
                              <input
                                type="text"
                                value={badge.id}
                                onChange={(e) => {
                                  const newBadges = [...(loyaltySettings.gamification?.badges?.availableBadges || [])];
                                  newBadges[index] = { ...badge, id: e.target.value };
                                  setLoyaltySettings({ 
                                    ...loyaltySettings, 
                                    gamification: { 
                                      ...loyaltySettings.gamification, 
                                      badges: { 
                                        ...loyaltySettings.gamification?.badges, 
                                        availableBadges: newBadges 
                                      }
                                    }
                                  });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Name
                              </label>
                              <input
                                type="text"
                                value={badge.name}
                                onChange={(e) => {
                                  const newBadges = [...(loyaltySettings.gamification?.badges?.availableBadges || [])];
                                  newBadges[index] = { ...badge, name: e.target.value };
                                  setLoyaltySettings({ 
                                    ...loyaltySettings, 
                                    gamification: { 
                                      ...loyaltySettings.gamification, 
                                      badges: { 
                                        ...loyaltySettings.gamification?.badges, 
                                        availableBadges: newBadges 
                                      }
                                    }
                                  });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Beschreibung
                              </label>
                              <input
                                type="text"
                                value={badge.description}
                                onChange={(e) => {
                                  const newBadges = [...(loyaltySettings.gamification?.badges?.availableBadges || [])];
                                  newBadges[index] = { ...badge, description: e.target.value };
                                  setLoyaltySettings({ 
                                    ...loyaltySettings, 
                                    gamification: { 
                                      ...loyaltySettings.gamification, 
                                      badges: { 
                                        ...loyaltySettings.gamification?.badges, 
                                        availableBadges: newBadges 
                                      }
                                    }
                                  });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Icon (Emoji)
                              </label>
                              <input
                                type="text"
                                value={badge.icon}
                                onChange={(e) => {
                                  const newBadges = [...(loyaltySettings.gamification?.badges?.availableBadges || [])];
                                  newBadges[index] = { ...badge, icon: e.target.value };
                                  setLoyaltySettings({ 
                                    ...loyaltySettings, 
                                    gamification: { 
                                      ...loyaltySettings.gamification, 
                                      badges: { 
                                        ...loyaltySettings.gamification?.badges, 
                                        availableBadges: newBadges 
                                      }
                                    }
                                  });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Punkte
                              </label>
                              <input
                                type="number"
                                value={badge.points}
                                onChange={(e) => {
                                  const newBadges = [...(loyaltySettings.gamification?.badges?.availableBadges || [])];
                                  newBadges[index] = { ...badge, points: parseInt(e.target.value) || 0 };
                                  setLoyaltySettings({ 
                                    ...loyaltySettings, 
                                    gamification: { 
                                      ...loyaltySettings.gamification, 
                                      badges: { 
                                        ...loyaltySettings.gamification?.badges, 
                                        availableBadges: newBadges 
                                      }
                                    }
                                  });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                min="0"
                              />
                            </div>
                            <div>
                              <button
                                onClick={() => {
                                  const newBadges = loyaltySettings.gamification?.badges?.availableBadges?.filter((_, i) => i !== index) || [];
                                  setLoyaltySettings({ 
                                    ...loyaltySettings, 
                                    gamification: { 
                                      ...loyaltySettings.gamification, 
                                      badges: { 
                                        ...loyaltySettings.gamification?.badges, 
                                        availableBadges: newBadges 
                                      }
                                    }
                                  });
                                }}
                                className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors mt-6"
                              >
                                <i className="ri-delete-bin-line"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const newBadges = [...(loyaltySettings.gamification?.badges?.availableBadges || []), { id: "", name: "", description: "", icon: "", points: 0 }];
                            setLoyaltySettings({ 
                              ...loyaltySettings, 
                              gamification: { 
                                ...loyaltySettings.gamification, 
                                badges: { 
                                  ...loyaltySettings.gamification?.badges, 
                                  availableBadges: newBadges 
                                }
                              }
                            });
                          }}
                          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          <i className="ri-add-line mr-2"></i>
                          Abzeichen hinzufügen
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Fortschrittsbalken */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-md font-medium text-gray-700">Fortschrittsbalken</h5>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={loyaltySettings.gamification?.progressBar?.enabled || false}
                          onChange={(e) => setLoyaltySettings({ 
                            ...loyaltySettings, 
                            gamification: { 
                              ...loyaltySettings.gamification, 
                              progressBar: { 
                                ...loyaltySettings.gamification?.progressBar, 
                                enabled: e.target.checked 
                              }
                            }
                          })}
                          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-600">Aktiviert</span>
                      </label>
                    </div>
                    
                    {loyaltySettings.gamification?.progressBar?.enabled && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={loyaltySettings.gamification?.progressBar?.showOnProfile || false}
                              onChange={(e) => setLoyaltySettings({ 
                                ...loyaltySettings, 
                                gamification: { 
                                  ...loyaltySettings.gamification, 
                                  progressBar: { 
                                    ...loyaltySettings.gamification?.progressBar, 
                                    showOnProfile: e.target.checked 
                                  }
                                }
                              })}
                              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">Im Profil anzeigen</span>
                          </label>
                        </div>
                        <div>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={loyaltySettings.gamification?.progressBar?.showPointsToNextLevel || false}
                              onChange={(e) => setLoyaltySettings({ 
                                ...loyaltySettings, 
                                gamification: { 
                                  ...loyaltySettings.gamification, 
                                  progressBar: { 
                                    ...loyaltySettings.gamification?.progressBar, 
                                    showPointsToNextLevel: e.target.checked 
                                  }
                                }
                              })}
                              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">Punkte bis nächstes Level anzeigen</span>
                          </label>
                        </div>
                        <div>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={loyaltySettings.gamification?.progressBar?.animateProgress || false}
                              onChange={(e) => setLoyaltySettings({ 
                                ...loyaltySettings, 
                                gamification: { 
                                  ...loyaltySettings.gamification, 
                                  progressBar: { 
                                    ...loyaltySettings.gamification?.progressBar, 
                                    animateProgress: e.target.checked 
                                  }
                                }
                              })}
                              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">Animierte Fortschrittsanzeige</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Erweiterte Admin-Funktionen */}
            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                <i className="ri-tools-line mr-2"></i>
                Erweiterte Admin-Funktionen
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Bulk-Aktionen */}
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-medium text-gray-800 mb-3">
                    <i className="ri-group-line mr-2"></i>
                    Bulk-Aktionen
                  </h4>
                  <div className="space-y-2">
                    <button
                      onClick={async () => {
                        const points = prompt('Punkte für alle Mitglieder hinzufügen:');
                        if (points && !isNaN(Number(points))) {
                          try {
                            const { error } = await supabase.rpc('bulk_add_points', {
                              points_to_add: parseInt(points)
                            });
                            if (error) throw error;
                            alert(`${points} Punkte zu allen Mitgliedern hinzugefügt!`);
                            loadData();
                          } catch (error) {
                            alert('Fehler bei Bulk-Aktion: ' + (error as Error).message);
                          }
                        }
                      }}
                      className="w-full text-left px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                    >
                      <i className="ri-add-circle-line mr-2"></i>
                      Punkte für alle hinzufügen
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm('Alle abgelaufenen Punkte löschen?')) {
                          try {
                            const { error } = await supabase.rpc('cleanup_expired_points');
                            if (error) throw error;
                            alert('Abgelaufene Punkte erfolgreich bereinigt!');
                            loadData();
                          } catch (error) {
                            alert('Fehler bei Bereinigung: ' + (error as Error).message);
                          }
                        }
                      }}
                      className="w-full text-left px-3 py-2 text-sm bg-orange-50 text-orange-700 rounded hover:bg-orange-100 transition-colors"
                    >
                      <i className="ri-delete-bin-line mr-2"></i>
                      Abgelaufene Punkte bereinigen
                    </button>
                    <button
                      onClick={async () => {
                        const newTier = prompt('Neues Tier für alle Mitglieder:');
                        if (newTier) {
                          try {
                            const { error } = await supabase.rpc('bulk_update_tier', {
                              new_tier: newTier
                            });
                            if (error) throw error;
                            alert(`Alle Mitglieder auf Tier "${newTier}" aktualisiert!`);
                            loadData();
                          } catch (error) {
                            alert('Fehler bei Tier-Update: ' + (error as Error).message);
                          }
                        }
                      }}
                      className="w-full text-left px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded hover:bg-purple-100 transition-colors"
                    >
                      <i className="ri-vip-crown-line mr-2"></i>
                      Tier für alle aktualisieren
                    </button>
                  </div>
                </div>

                {/* Export-Funktionen */}
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-medium text-gray-800 mb-3">
                    <i className="ri-download-line mr-2"></i>
                    Export & Berichte
                  </h4>
                  <div className="space-y-2">
                    <button
                      onClick={async () => {
                        try {
                          const { data, error } = await supabase
                            .from('loyalty_members')
                            .select(`
                              *,
                              customers (first_name, last_name, email)
                            `);
                          if (error) throw error;
                          
                          const csv = [
                            'Name,E-Mail,Punkte,Gesamt Verdient,Gesamt Eingelöst,Tier,Erstellt',
                            ...data.map(member => [
                              `"${member.customers?.first_name} ${member.customers?.last_name}"`,
                              member.customers?.email,
                              member.points_balance,
                              member.total_points_earned,
                              member.total_points_redeemed,
                              member.tier || 'Bronze',
                              new Date(member.created_at).toLocaleDateString('de-DE')
                            ].join(','))
                          ].join('\n');
                          
                          const blob = new Blob([csv], { type: 'text/csv' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `loyalty-members-${new Date().toISOString().split('T')[0]}.csv`;
                          a.click();
                          URL.revokeObjectURL(url);
                        } catch (error) {
                          alert('Fehler beim Export: ' + (error as Error).message);
                        }
                      }}
                      className="w-full text-left px-3 py-2 text-sm bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
                    >
                      <i className="ri-file-excel-line mr-2"></i>
                      Mitglieder als CSV
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const { data, error } = await supabase
                            .from('loyalty_transactions')
                            .select('*')
                            .order('created_at', { ascending: false })
                            .limit(1000);
                          if (error) throw error;
                          
                          const csv = [
                            'Datum,Mitglied ID,Punkte,Typ,Grund',
                            ...data.map(tx => [
                              new Date(tx.created_at).toLocaleDateString('de-DE'),
                              tx.member_id,
                              tx.points_change,
                              tx.transaction_type,
                              `"${tx.reason || ''}"`
                            ].join(','))
                          ].join('\n');
                          
                          const blob = new Blob([csv], { type: 'text/csv' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `loyalty-transactions-${new Date().toISOString().split('T')[0]}.csv`;
                          a.click();
                          URL.revokeObjectURL(url);
                        } catch (error) {
                          alert('Fehler beim Export: ' + (error as Error).message);
                        }
                      }}
                      className="w-full text-left px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                    >
                      <i className="ri-file-list-line mr-2"></i>
                      Transaktionen als CSV
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const { data: stats, error } = await supabase.rpc('get_loyalty_statistics');
                          if (error) throw error;
                          
                          const report = `Loyalty-Programm Statistiken
Generiert am: ${new Date().toLocaleDateString('de-DE')}

Gesamtstatistiken:
- Aktive Mitglieder: ${stats.total_members || 0}
- Gesamte vergebene Punkte: ${stats.total_points_earned || 0}
- Gesamte eingelöste Punkte: ${stats.total_points_redeemed || 0}
- Durchschnittliche Punkte pro Mitglied: ${Math.round((stats.total_points_earned || 0) / (stats.total_members || 1))}

Tier-Verteilung:
- Bronze: ${stats.bronze_members || 0}
- Silber: ${stats.silver_members || 0}
- Gold: ${stats.gold_members || 0}
- Platin: ${stats.platinum_members || 0}`;
                          
                          const blob = new Blob([report], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `loyalty-report-${new Date().toISOString().split('T')[0]}.txt`;
                          a.click();
                          URL.revokeObjectURL(url);
                        } catch (error) {
                          alert('Fehler beim Erstellen des Berichts: ' + (error as Error).message);
                        }
                      }}
                      className="w-full text-left px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded hover:bg-purple-100 transition-colors"
                    >
                      <i className="ri-bar-chart-line mr-2"></i>
                      Statistik-Bericht
                    </button>
                  </div>
                </div>

                {/* Schnell-Statistiken */}
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-medium text-gray-800 mb-3">
                    <i className="ri-dashboard-line mr-2"></i>
                    Schnell-Statistiken
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Aktive Mitglieder:</span>
                      <span className="font-semibold text-blue-600">{members.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Gesamte Punkte:</span>
                      <span className="font-semibold text-green-600">
                        {members.reduce((sum, m) => sum + m.points_balance, 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Ø Punkte/Mitglied:</span>
                      <span className="font-semibold text-orange-600">
                        {members.length > 0 ? Math.round(members.reduce((sum, m) => sum + m.points_balance, 0) / members.length) : 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Top Tier:</span>
                      <span className="font-semibold text-purple-600">
                        {members.filter(m => m.tier === 'Platin').length > 0 ? 'Platin' :
                         members.filter(m => m.tier === 'Gold').length > 0 ? 'Gold' :
                         members.filter(m => m.tier === 'Silber').length > 0 ? 'Silber' : 'Bronze'}
                      </span>
                    </div>
                    <div className="pt-2 border-t">
                      <button
                        onClick={loadData}
                        className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      >
                        <i className="ri-refresh-line mr-2"></i>
                        Daten aktualisieren
                      </button>
                    </div>
                  </div>
                </div>
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
