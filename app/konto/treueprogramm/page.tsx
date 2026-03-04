'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  user_metadata: {
    first_name?: string;
    last_name?: string;
  };
}

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  customer_number: string;
}

interface LoyaltyMember {
  id: string;
  customer_id: string;
  tier: string;
  points_balance: number;
  total_earned: number;
  total_redeemed: number;
  last_activity: string;
  created_at: string;
  updated_at: string;
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
  orders?: {
    order_number: string;
  };
}

interface LoyaltySettings {
  points_per_euro: number;
  bronze_threshold: number;
  silver_threshold: number;
  gold_threshold: number;
  points_expiry_days: number;
}

export default function LoyaltyDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyMember | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [settings, setSettings] = useState<LoyaltySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = '/konto';
      return;
    }
    setUser(user as User);
    await Promise.all([
      fetchCustomerData(user),
      fetchLoyaltySettings()
    ]);
    setLoading(false);
  };

  const fetchCustomerData = async (user: any) => {
    try {
      // Kundendaten laden
      const { data: customerData } = await supabase
        .from('customers')
        .select('id, first_name, last_name, email, customer_number')
        .eq('email', user.email)
        .single();

      if (!customerData) {
        console.log('Kunde nicht gefunden');
        return;
      }
      
      setCustomer(customerData as Customer);

      // Loyalty-Daten laden
      const { data: loyaltyData } = await supabase
        .from('loyalty_members')
        .select('*')
        .eq('customer_id', customerData.id)
        .single();

      if (loyaltyData) {
        setLoyaltyData(loyaltyData as LoyaltyMember);
        await fetchTransactions(loyaltyData.id);
      }

    } catch (error) {
      console.error('Fehler beim Laden der Kundendaten:', error);
    }
  };

  const fetchTransactions = async (memberId: string) => {
    try {
      const { data: transactionData } = await supabase
        .from('loyalty_transactions')
        .select(`
          *,
          orders (
            order_number
          )
        `)
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (transactionData) {
        setTransactions(transactionData as LoyaltyTransaction[]);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Transaktionen:', error);
    }
  };

  const fetchLoyaltySettings = async () => {
    try {
      const { data: settingsData } = await supabase
        .from('loyalty_settings')
        .select('*')
        .single();

      if (settingsData) {
        setSettings(settingsData as LoyaltySettings);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Einstellungen:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTierInfo = (tier: string) => {
    switch (tier) {
      case 'bronze':
        return {
          name: 'Bronze',
          icon: 'ri-medal-line',
          color: 'from-amber-600 to-amber-800',
          bgColor: 'bg-amber-100',
          textColor: 'text-amber-600',
          benefits: ['Punkte sammeln', 'Exklusive Angebote']
        };
      case 'silver':
        return {
          name: 'Silber',
          icon: 'ri-vip-crown-line',
          color: 'from-gray-400 to-gray-600',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-600',
          benefits: ['Punkte sammeln', 'Exklusive Angebote', '5% Extra-Rabatt', 'Prioritäts-Support']
        };
      case 'gold':
        return {
          name: 'Gold',
          icon: 'ri-vip-crown-fill',
          color: 'from-yellow-400 to-yellow-600',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-600',
          benefits: ['Punkte sammeln', 'Exklusive Angebote', '10% Extra-Rabatt', 'Prioritäts-Support', 'Kostenloser Versand']
        };
      default:
        return {
          name: 'Basis',
          icon: 'ri-user-line',
          color: 'from-gray-400 to-gray-600',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-600',
          benefits: ['Punkte sammeln']
        };
    }
  };

  const getNextTierInfo = () => {
    if (!loyaltyData || !settings) return null;

    const currentPoints = loyaltyData.total_earned;
    
    if (loyaltyData.tier === 'bronze' && currentPoints < settings.silver_threshold) {
      return {
        nextTier: 'Silber',
        pointsNeeded: settings.silver_threshold - currentPoints,
        progress: (currentPoints / settings.silver_threshold) * 100
      };
    } else if (loyaltyData.tier === 'silver' && currentPoints < settings.gold_threshold) {
      return {
        nextTier: 'Gold',
        pointsNeeded: settings.gold_threshold - currentPoints,
        progress: (currentPoints / settings.gold_threshold) * 100
      };
    }
    
    return null;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earned':
        return 'ri-add-circle-line text-green-600';
      case 'redeemed':
        return 'ri-subtract-line text-red-600';
      case 'expired':
        return 'ri-time-line text-gray-600';
      case 'bonus':
        return 'ri-gift-line text-purple-600';
      default:
        return 'ri-exchange-line text-blue-600';
    }
  };

  const getTransactionTypeText = (type: string) => {
    switch (type) {
      case 'earned':
        return 'Punkte erhalten';
      case 'redeemed':
        return 'Punkte eingelöst';
      case 'expired':
        return 'Punkte abgelaufen';
      case 'bonus':
        return 'Bonus-Punkte';
      default:
        return 'Transaktion';
    }
  };

  const getExpiringPoints = () => {
    if (!transactions) return 0;
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    return transactions
      .filter(t => 
        t.transaction_type === 'earned' && 
        t.expires_at && 
        new Date(t.expires_at) <= thirtyDaysFromNow &&
        new Date(t.expires_at) > new Date()
      )
      .reduce((sum, t) => sum + t.points, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Lädt Treueprogramm...</p>
        </div>
      </div>
    );
  }

  if (!loyaltyData) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 sm:pt-24 md:pt-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
              <i className="ri-medal-line text-2xl text-orange-600"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Willkommen im Treueprogramm!</h2>
            <p className="text-gray-600 mb-6">
              Sie sind noch nicht für unser Treueprogramm registriert. 
              Sammeln Sie Punkte bei jeder Bestellung und profitieren Sie von exklusiven Vorteilen.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              <i className="ri-shopping-bag-line mr-2"></i>
              Jetzt einkaufen und Punkte sammeln
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tierInfo = getTierInfo(loyaltyData.tier);
  const nextTierInfo = getNextTierInfo();
  const expiringPoints = getExpiringPoints();

  return (
    <div className="min-h-screen bg-gray-50 pt-20 sm:pt-24 md:pt-28">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/konto/dashboard" className="text-orange-600 hover:text-orange-700 transition-colors">
                <i className="ri-arrow-left-line text-xl"></i>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Treueprogramm</h1>
                <p className="text-sm text-gray-500">Ihre Punkte und Vorteile</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-red-600 transition-colors"
            >
              <i className="ri-logout-box-line text-xl"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-orange-600">Startseite</Link>
          <i className="ri-arrow-right-s-line"></i>
          <Link href="/konto/dashboard" className="hover:text-orange-600">Dashboard</Link>
          <i className="ri-arrow-right-s-line"></i>
          <span className="text-orange-600 font-medium">Treueprogramm</span>
        </div>

        {/* Tier Status Card */}
        <div className={`bg-gradient-to-r ${tierInfo.color} rounded-xl p-6 mb-8 text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <i className={`${tierInfo.icon} text-2xl`}></i>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{tierInfo.name} Mitglied</h2>
                <p className="text-white/90">Seit {formatDate(loyaltyData.created_at)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{loyaltyData.points_balance}</p>
              <p className="text-white/90">Verfügbare Punkte</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Gesammelte Punkte</p>
                <p className="text-2xl font-bold text-gray-900">{loyaltyData.total_earned}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="ri-add-circle-line text-xl text-green-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Eingelöste Punkte</p>
                <p className="text-2xl font-bold text-gray-900">{loyaltyData.total_redeemed}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <i className="ri-subtract-line text-xl text-red-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Verfügbare Punkte</p>
                <p className="text-2xl font-bold text-gray-900">{loyaltyData.points_balance}</p>
              </div>
              <div className={`w-12 h-12 ${tierInfo.bgColor} rounded-lg flex items-center justify-center`}>
                <i className={`${tierInfo.icon} text-xl ${tierInfo.textColor}`}></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Laufen bald ab</p>
                <p className="text-2xl font-bold text-gray-900">{expiringPoints}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <i className="ri-time-line text-xl text-yellow-600"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Next Tier Progress */}
        {nextTierInfo && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Fortschritt zu {nextTierInfo.nextTier}
              </h3>
              <span className="text-sm text-gray-600">
                Noch {nextTierInfo.pointsNeeded} Punkte
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div 
                className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(nextTierInfo.progress, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">
              {Math.round(nextTierInfo.progress)}% erreicht
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Übersicht
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'transactions'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Transaktionen
              </button>
              <button
                onClick={() => setActiveTab('benefits')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'benefits'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Vorteile
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Ihre Vorteile</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tierInfo.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <i className="ri-check-line text-sm text-green-600"></i>
                        </div>
                        <span className="text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {settings && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Punkte sammeln</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <i className="ri-money-euro-circle-line text-orange-600"></i>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {settings.points_per_euro} Punkte pro 1€ Einkauf
                          </p>
                          <p className="text-sm text-gray-600">
                            Bei jeder Bestellung automatisch gutgeschrieben
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'transactions' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Letzte Transaktionen</h3>
                {transactions.length > 0 ? (
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                            <i className={getTransactionIcon(transaction.transaction_type)}></i>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {getTransactionTypeText(transaction.transaction_type)}
                            </p>
                            <p className="text-sm text-gray-600">{transaction.description}</p>
                            {transaction.orders && (
                              <p className="text-xs text-gray-500">
                                Bestellung #{transaction.orders.order_number}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${
                            transaction.points > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.points > 0 ? '+' : ''}{transaction.points}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(transaction.created_at)}
                          </p>
                          {transaction.expires_at && (
                            <p className="text-xs text-yellow-600">
                              Läuft ab: {formatDate(transaction.expires_at)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <i className="ri-file-list-line text-4xl text-gray-300 mb-4"></i>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Transaktionen</h3>
                    <p className="text-gray-600">Sie haben noch keine Punktetransaktionen.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'benefits' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Alle Tier-Vorteile</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {['bronze', 'silver', 'gold'].map((tier) => {
                    const info = getTierInfo(tier);
                    const isCurrentTier = loyaltyData.tier === tier;
                    
                    return (
                      <div key={tier} className={`border-2 rounded-lg p-6 ${
                        isCurrentTier ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                      }`}>
                        <div className="text-center mb-4">
                          <div className={`w-16 h-16 ${info.bgColor} rounded-full flex items-center justify-center mx-auto mb-3`}>
                            <i className={`${info.icon} text-2xl ${info.textColor}`}></i>
                          </div>
                          <h4 className="text-lg font-bold text-gray-900">{info.name}</h4>
                          {isCurrentTier && (
                            <span className="inline-block px-2 py-1 bg-orange-500 text-white text-xs rounded-full mt-1">
                              Ihr aktueller Tier
                            </span>
                          )}
                        </div>
                        <ul className="space-y-2">
                          {info.benefits.map((benefit, index) => (
                            <li key={index} className="flex items-center space-x-2">
                              <i className="ri-check-line text-green-600"></i>
                              <span className="text-sm text-gray-700">{benefit}</span>
                            </li>
                          ))}
                        </ul>
                        {settings && tier !== 'bronze' && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-xs text-gray-600">
                              Ab {tier === 'silver' ? settings.silver_threshold : settings.gold_threshold} Punkten
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Schnell-Aktionen</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/shop"
              className="flex items-center justify-center px-6 py-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              <i className="ri-shopping-bag-line mr-2"></i>
              Punkte sammeln
            </Link>

            <Link
              href="/konto/bestellverlauf"
              className="flex items-center justify-center px-6 py-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              <i className="ri-file-list-line mr-2"></i>
              Bestellverlauf
            </Link>

            <Link
              href="/kontakt"
              className="flex items-center justify-center px-6 py-4 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
            >
              <i className="ri-customer-service-line mr-2"></i>
              Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}