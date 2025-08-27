'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
}

interface User {
  id: string;
  email: string;
  user_metadata: {
    first_name?: string;
    last_name?: string;
  };
}

interface LoyaltyMember {
  id: string;
  tier: string;
  points: number;
  tier_benefits: any;
}

export default function CustomerDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyMember | null>(null);
  const [loading, setLoading] = useState(true);

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
      fetchOrders(user),
      fetchLoyaltyData(user)
    ]);
    setLoading(false);
  };

  const fetchOrders = async (user: any) => {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            quantity,
            price_per_unit,
            products (
              name,
              image_url
            )
          )
        `)
        .eq('customer_email', user.email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(orders || []);
    } catch (error) {
      console.error('Fehler beim Laden der Bestellungen:', error);
    }
  };

  const fetchLoyaltyData = async (user: any) => {
    try {
      let { data: loyalty, error } = await supabase
        .from('loyalty_members')
        .select('*')
        .eq('customer_email', user.email)
        .single();

      if (error && error.code === 'PGRST116') {
        const { data: newLoyalty, error: createError } = await supabase
          .from('loyalty_members')
          .insert({
            customer_email: user.email,
            tier: 'bronze',
            points: 0,
            tier_benefits: {
              points_per_euro: 1,
              birthday_bonus: 50,
              discount_percentage: 0,
              free_shipping: false,
              priority_support: false
            }
          })
          .select()
          .single();

        if (createError) {
          console.error('Fehler beim Erstellen des Loyalty Members:', createError);
          return;
        }

        setLoyaltyData(newLoyalty);
      } else if (error) {
        console.error('Fehler beim Laden der Treuepunkte:', error);
        return;
      } else if (loyalty) {
        setLoyaltyData(loyalty);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Treuepunkte:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Ausstehend';
      case 'confirmed':
        return 'Bestätigt';
      case 'shipped':
        return 'Versandt';
      case 'delivered':
        return 'Geliefert';
      case 'cancelled':
        return 'Storniert';
      default:
        return status;
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'bronze':
        return 'ri-medal-line';
      case 'silver':
        return 'ri-vip-crown-line';
      case 'gold':
        return 'ri-vip-crown-fill';
      default:
        return 'ri-user-line';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Lädt...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-orange-600 hover:text-orange-700 transition-colors">
                <div className="w-6 h-6 flex items-center justify-center">
                  <i className="ri-arrow-left-line text-xl"></i>
                </div>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500">Willkommen zurück, {user?.user_metadata?.first_name || 'Kunde'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/shop" className="text-gray-600 hover:text-orange-600 transition-colors">
                <div className="w-6 h-6 flex items-center justify-center">
                  <i className="ri-store-line text-xl"></i>
                </div>
              </Link>
              <Link href="/warenkorb" className="text-gray-600 hover:text-orange-600 transition-colors">
                <div className="w-6 h-6 flex items-center justify-center">
                  <i className="ri-shopping-cart-line text-xl"></i>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-600 transition-colors"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <i className="ri-logout-box-line text-xl"></i>
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-orange-600">Startseite</Link>
          <div className="w-4 h-4 flex items-center justify-center">
            <i className="ri-arrow-right-s-line"></i>
          </div>
          <span className="text-orange-600 font-medium">Dashboard</span>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 mb-8 border">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Willkommen zurück, {user?.user_metadata?.first_name || 'Kunde'}! 
              </h2>
              <p className="text-gray-600">Hier ist Ihre aktuelle Kontoübersicht</p>
            </div>
            {loyaltyData && (
              <div className="bg-gradient-to-r from-amber-600 to-amber-800 p-4 rounded-lg text-white">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <i className={`${getTierIcon(loyaltyData.tier)} text-xl`}></i>
                  </div>
                  <div>
                    <p className="text-sm font-medium opacity-90">{loyaltyData.tier.toUpperCase()} MITGLIED</p>
                    <p className="text-lg font-bold">{loyaltyData.points} Punkte</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Gesamtbestellungen</p>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="ri-shopping-bag-line text-xl text-blue-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aktive Bestellungen</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.filter((o) => ['pending', 'confirmed', 'shipped'].includes(o.status)).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <i className="ri-truck-line text-xl text-orange-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Gesamtausgaben</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.reduce((sum, order) => sum + order.total_amount, 0).toFixed(2)}€
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="ri-money-euro-circle-line text-xl text-green-600"></i>
              </div>
            </div>
          </div>

          {loyaltyData && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Treuepunkte</p>
                  <p className="text-2xl font-bold text-gray-900">{loyaltyData.points}</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <i className={`${getTierIcon(loyaltyData.tier)} text-xl text-amber-600`}></i>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Letzte Bestellungen</h3>
              <Link href="/konto/bestellverlauf" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                Alle anzeigen
              </Link>
            </div>

            {orders.slice(0, 3).map((order) => (
              <div key={order.id} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="font-medium text-gray-900">#{order.order_number}</p>
                  <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{order.total_amount.toFixed(2)}€</p>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
              </div>
            ))}

            {orders.length === 0 && (
              <div className="text-center py-8">
                <i className="ri-shopping-bag-line text-4xl text-gray-300 mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Noch keine Bestellungen</h3>
                <p className="text-gray-600 mb-6">Sie haben noch keine Bestellungen aufgegeben.</p>
                <Link
                  href="/shop"
                  className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Jetzt einkaufen
                </Link>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Schnellzugriff</h3>
            <div className="space-y-3">
              <Link
                href="/konto/profil"
                className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <i className="ri-user-line text-orange-600"></i>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Profil verwalten</p>
                  <p className="text-sm text-gray-600">Persönliche Daten bearbeiten</p>
                </div>
              </Link>

              <Link
                href="/konto/wunschliste"
                className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                  <i className="ri-heart-line text-red-600"></i>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Wunschliste</p>
                  <p className="text-sm text-gray-600">Gespeicherte Produkte</p>
                </div>
              </Link>

              <Link
                href="/konto/adressen"
                className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <i className="ri-map-pin-line text-blue-600"></i>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Adressen</p>
                  <p className="text-sm text-gray-600">Lieferadressen verwalten</p>
                </div>
              </Link>

              <Link
                href="/kontakt"
                className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <i className="ri-customer-service-line text-green-600"></i>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Support</p>
                  <p className="text-sm text-gray-600">Hilfe & Kontakt</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Schnell-Aktionen</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/shop"
              className="flex items-center justify-center px-6 py-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <i className="ri-shopping-bag-line mr-2"></i>
              Jetzt einkaufen
            </Link>

            <Link
              href="/konto/bestellverlauf"
              className="flex items-center justify-center px-6 py-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <i className="ri-file-list-line mr-2"></i>
              Bestellungen anzeigen
            </Link>

            <Link
              href="/kontakt"
              className="flex items-center justify-center px-6 py-4 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <i className="ri-customer-service-line mr-2"></i>
              Support kontaktieren  
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
