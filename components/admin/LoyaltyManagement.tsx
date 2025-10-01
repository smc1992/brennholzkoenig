'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface LoyaltyMember {
  id: string;
  customer_id: string;
  tier: string;
  points_balance: number;
  total_earned: number;
  total_redeemed: number;
  last_activity: string;
  created_at: string;
  customers: {
    first_name: string;
    last_name: string;
    email: string;
    customer_number: string;
  };
}

interface LoyaltyTransaction {
  id: string;
  member_id: string;
  points: number;
  transaction_type: string;
  description: string;
  order_id?: string;
  expires_at?: string;
  created_at: string;
  loyalty_members: {
    customers: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

interface LoyaltySettings {
  id: string;
  points_per_euro: number;
  bronze_threshold: number;
  silver_threshold: number;
  gold_threshold: number;
  points_expiry_days: number;
  bronze_discount: number;
  silver_discount: number;
  gold_discount: number;
  updated_at: string;
}

interface LoyaltyStats {
  totalMembers: number;
  bronzeMembers: number;
  silverMembers: number;
  goldMembers: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  activePointsBalance: number;
}

export default function LoyaltyManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  const [members, setMembers] = useState<LoyaltyMember[]>([]);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [settings, setSettings] = useState<LoyaltySettings | null>(null);
  const [stats, setStats] = useState<LoyaltyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState('all');
  const [showAddPointsModal, setShowAddPointsModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<LoyaltyMember | null>(null);
  const [pointsToAdd, setPointsToAdd] = useState(0);
  const [pointsDescription, setPointsDescription] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchMembers(),
      fetchTransactions(),
      fetchSettings(),
      fetchStats()
    ]);
    setLoading(false);
  };

  const fetchMembers = async () => {
    try {
      const { data } = await supabase
        .from('loyalty_members')
        .select(`
          *,
          customers (
            first_name,
            last_name,
            email,
            customer_number
          )
        `)
        .order('created_at', { ascending: false });

      if (data) {
        setMembers(data as LoyaltyMember[]);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Mitglieder:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data } = await supabase
        .from('loyalty_transactions')
        .select(`
          *,
          loyalty_members (
            customers (
              first_name,
              last_name,
              email
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (data) {
        setTransactions(data as LoyaltyTransaction[]);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Transaktionen:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('loyalty_settings')
        .select('*')
        .single();

      if (data) {
        setSettings(data as LoyaltySettings);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Einstellungen:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Get member counts by tier
      const { data: memberStats } = await supabase
        .from('loyalty_members')
        .select('tier, points_balance, total_earned, total_redeemed');

      if (memberStats) {
        const stats: LoyaltyStats = {
          totalMembers: memberStats.length,
          bronzeMembers: memberStats.filter((m: any) => m.tier === 'bronze').length,
          silverMembers: memberStats.filter((m: any) => m.tier === 'silver').length,
          goldMembers: memberStats.filter((m: any) => m.tier === 'gold').length,
          totalPointsIssued: memberStats.reduce((sum: number, m: any) => sum + m.total_earned, 0),
          totalPointsRedeemed: memberStats.reduce((sum: number, m: any) => sum + m.total_redeemed, 0),
          activePointsBalance: memberStats.reduce((sum: number, m: any) => sum + m.points_balance, 0)
        };
        setStats(stats);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Statistiken:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<LoyaltySettings>) => {
    try {
      const { error } = await supabase
        .from('loyalty_settings')
        .update(newSettings)
        .eq('id', settings?.id);

      if (error) throw error;

      await fetchSettings();
      alert('Einstellungen erfolgreich aktualisiert!');
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Einstellungen:', error);
      alert('Fehler beim Aktualisieren der Einstellungen');
    }
  };

  const addPointsToMember = async () => {
    if (!selectedMember || pointsToAdd <= 0) return;

    try {
      const { error } = await supabase
        .from('loyalty_transactions')
        .insert({
          member_id: selectedMember.id,
          points: pointsToAdd,
          transaction_type: 'bonus',
          description: pointsDescription || 'Admin Bonus-Punkte'
        });

      if (error) throw error;

      // Update member's balance
      const { error: updateError } = await supabase
        .from('loyalty_members')
        .update({
          points_balance: selectedMember.points_balance + pointsToAdd,
          total_earned: selectedMember.total_earned + pointsToAdd
        })
        .eq('id', selectedMember.id);

      if (updateError) throw updateError;

      setShowAddPointsModal(false);
      setSelectedMember(null);
      setPointsToAdd(0);
      setPointsDescription('');
      await fetchData();
      alert('Punkte erfolgreich hinzugefügt!');
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Punkte:', error);
      alert('Fehler beim Hinzufügen der Punkte');
    }
  };

  const runMaintenance = async () => {
    try {
      const response = await fetch('/api/loyalty/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_LOYALTY_MAINTENANCE_TOKEN}`
        }
      });

      if (response.ok) {
        alert('Wartung erfolgreich ausgeführt!');
        await fetchData();
      } else {
        throw new Error('Wartung fehlgeschlagen');
      }
    } catch (error) {
      console.error('Fehler bei der Wartung:', error);
      alert('Fehler bei der Wartung');
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.customers.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.customers.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.customers.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.customers.customer_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTier = selectedTier === 'all' || member.tier === selectedTier;
    
    return matchesSearch && matchesTier;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'bronze':
        return 'ri-medal-line text-amber-600';
      case 'silver':
        return 'ri-vip-crown-line text-gray-600';
      case 'gold':
        return 'ri-vip-crown-fill text-yellow-600';
      default:
        return 'ri-user-line text-gray-600';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze':
        return 'bg-amber-100 text-amber-800';
      case 'silver':
        return 'bg-gray-100 text-gray-800';
      case 'gold':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Loyalty-Programm Verwaltung</h2>
        <button
          onClick={runMaintenance}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <i className="ri-refresh-line mr-2"></i>
          Wartung ausführen
        </button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Gesamt Mitglieder</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalMembers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="ri-group-line text-xl text-blue-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aktive Punkte</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activePointsBalance.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="ri-medal-line text-xl text-green-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ausgegebene Punkte</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPointsIssued.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <i className="ri-add-circle-line text-xl text-orange-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Eingelöste Punkte</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPointsRedeemed.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <i className="ri-subtract-line text-xl text-red-600"></i>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tier Distribution */}
      {stats && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tier-Verteilung</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <i className="ri-medal-line text-xl text-amber-600"></i>
                <span className="font-medium text-amber-900">Bronze</span>
              </div>
              <span className="text-xl font-bold text-amber-600">{stats.bronzeMembers}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <i className="ri-vip-crown-line text-xl text-gray-600"></i>
                <span className="font-medium text-gray-900">Silber</span>
              </div>
              <span className="text-xl font-bold text-gray-600">{stats.silverMembers}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <i className="ri-vip-crown-fill text-xl text-yellow-600"></i>
                <span className="font-medium text-yellow-900">Gold</span>
              </div>
              <span className="text-xl font-bold text-yellow-600">{stats.goldMembers}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'members', label: 'Mitglieder', icon: 'ri-group-line' },
              { id: 'transactions', label: 'Transaktionen', icon: 'ri-exchange-line' },
              { id: 'settings', label: 'Einstellungen', icon: 'ri-settings-line' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className={tab.icon}></i>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'members' && (
            <div>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Suche nach Name, E-Mail oder Kundennummer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="all">Alle Tiers</option>
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silber</option>
                  <option value="gold">Gold</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kunde
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Punkte
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gesamt erhalten
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Letzte Aktivität
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {member.customers.first_name} {member.customers.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{member.customers.email}</div>
                            <div className="text-xs text-gray-400">#{member.customers.customer_number}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierColor(member.tier)}`}>
                            <i className={`${getTierIcon(member.tier)} mr-1`}></i>
                            {member.tier.charAt(0).toUpperCase() + member.tier.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.points_balance.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.total_earned.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(member.last_activity)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedMember(member);
                              setShowAddPointsModal(true);
                            }}
                            className="text-orange-600 hover:text-orange-900"
                          >
                            Punkte hinzufügen
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Letzte Transaktionen</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kunde
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Typ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Punkte
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Beschreibung
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Datum
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.loyalty_members.customers.first_name} {transaction.loyalty_members.customers.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{transaction.loyalty_members.customers.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.transaction_type === 'earned' ? 'bg-green-100 text-green-800' :
                            transaction.transaction_type === 'redeemed' ? 'bg-red-100 text-red-800' :
                            transaction.transaction_type === 'bonus' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {transaction.transaction_type === 'earned' ? 'Erhalten' :
                             transaction.transaction_type === 'redeemed' ? 'Eingelöst' :
                             transaction.transaction_type === 'bonus' ? 'Bonus' :
                             transaction.transaction_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${
                            transaction.points > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.points > 0 ? '+' : ''}{transaction.points}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {transaction.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(transaction.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'settings' && settings && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Loyalty-Einstellungen</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Punkte-System</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Punkte pro Euro
                    </label>
                    <input
                      type="number"
                      value={settings.points_per_euro}
                      onChange={(e) => setSettings({...settings, points_per_euro: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Punkte-Ablauf (Tage)
                    </label>
                    <input
                      type="number"
                      value={settings.points_expiry_days}
                      onChange={(e) => setSettings({...settings, points_expiry_days: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Tier-Schwellenwerte</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Silber Tier (Punkte)
                    </label>
                    <input
                      type="number"
                      value={settings.silver_threshold}
                      onChange={(e) => setSettings({...settings, silver_threshold: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gold Tier (Punkte)
                    </label>
                    <input
                      type="number"
                      value={settings.gold_threshold}
                      onChange={(e) => setSettings({...settings, gold_threshold: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => updateSettings(settings)}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                >
                  Einstellungen speichern
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Points Modal */}
      {showAddPointsModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Punkte hinzufügen für {selectedMember.customers.first_name} {selectedMember.customers.last_name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Anzahl Punkte
                </label>
                <input
                  type="number"
                  min="1"
                  value={pointsToAdd}
                  onChange={(e) => setPointsToAdd(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Punkte eingeben"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beschreibung
                </label>
                <input
                  type="text"
                  value={pointsDescription}
                  onChange={(e) => setPointsDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Grund für Punktevergabe"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddPointsModal(false);
                  setSelectedMember(null);
                  setPointsToAdd(0);
                  setPointsDescription('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={addPointsToMember}
                disabled={pointsToAdd <= 0}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Punkte hinzufügen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}