'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Order {
  id: string;
  total_amount: number;
  created_at: string;
  status: string;
  customer_id: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  created_at: string;
}

interface Customer {
  id: string;
  email: string;
  created_at: string;
  first_name?: string;
  last_name?: string;
}

interface MonthlyRevenueData {
  month: string;
  revenue: number;
}

interface ChartData {
  name: string;
  value: number;
}

interface DashboardSettings {
  stats_cards?: boolean;
  recent_orders?: boolean;
  quick_actions?: boolean;
  revenue_chart?: boolean;
  customer_activity?: boolean;
  [key: string]: any;
}

interface StatsTabProps {
  stats: {
    totalOrders: number;
    totalCustomers: number;
    totalRevenue: number;
    pendingOrders: number;
  };
  onRefresh: () => Promise<void>;
  onTabChange?: (tab: string) => void;
}

// Produktionsreife StatsTab - keine Fallback-Daten mehr

export default function StatsTab({ stats, onRefresh, onTabChange }: StatsTabProps) {
  // Starte mit leeren Arrays - werden durch echte Daten geladen
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [dashboardSettings, setDashboardSettings] = useState<DashboardSettings>({
    stats_cards: true,
    recent_orders: true,
    quick_actions: false,
    revenue_chart: false,
    customer_activity: false
  });

  // Dashboard-Einstellungen laden
  const loadDashboardSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'dashboard_config')
        .maybeSingle();

      if (error) {
        console.log('Dashboard settings not found, using defaults');
        return;
      }

      if (data && data.setting_value) {
        try {
          const settings = JSON.parse(data.setting_value);
          setDashboardSettings(prev => ({ ...prev, ...settings }));
          console.log('✅ Dashboard settings loaded:', settings);
        } catch (parseError) {
          console.warn('Invalid JSON in dashboard settings, using defaults');
        }
      }
    } catch (error) {
      console.error('Error loading dashboard settings:', error);
    }
  };

  useEffect(() => {
    loadDashboardSettings();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Produktionsreife parallele Datenabfrage
        const [ordersRes, productsRes] = await Promise.all([
          supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(10),
          supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(10)
        ]);

        if (ordersRes.error) {
          console.error('❌ Error loading orders:', ordersRes.error);
        } else {
          setOrders((ordersRes.data || []) as unknown as Order[]);
          console.log('✅ Production orders loaded:', ordersRes.data?.length || 0);
        }

        if (productsRes.error) {
          console.error('❌ Error loading products:', productsRes.error);
        } else {
          setProducts((productsRes.data || []) as unknown as Product[]);
          console.log('✅ Production products loaded:', productsRes.data?.length || 0);
        }

        // Customers werden später implementiert wenn Tabelle verfügbar
        setCustomers([]);
        
      } catch (error: unknown) {
        console.error('❌ Error loading production stats:', error);
        // Keine Fallback-Daten - zeige leere Arrays
        setOrders([]);
        setProducts([]);
        setCustomers([]);
      } finally {
         setLoading(false);
       }
     };

     fetchStats();
  }, []);

  const getMonthlyRevenue = (): MonthlyRevenueData[] => {
    const monthlyData: { [key: string]: number } = {};
    
    orders.forEach((order: Order) => {
      const month = new Date(order.created_at).toLocaleDateString('de-DE', { 
        year: 'numeric', 
        month: 'long' 
      });
      monthlyData[month] = (monthlyData[month] || 0) + order.total_amount;
    });

    return Object.entries(monthlyData).map(([month, revenue]) => ({
      month,
      revenue
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Dashboard Übersicht</h2>
        <button 
          onClick={() => onRefresh()} 
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer flex items-center"
        >
          <i className="ri-refresh-line mr-2"></i>
          Aktualisieren
        </button>
      </div>

      {/* Statistik-Karten - nur anzeigen wenn aktiviert */}
      {dashboardSettings.stats_cards && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Bestellungen</p>
                <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.totalOrders}</h3>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <i className="ri-shopping-bag-line text-xl text-blue-600"></i>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500">
                <span className="font-medium text-gray-800">{stats.pendingOrders}</span> ausstehend
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Kunden</p>
                <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.totalCustomers}</h3>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <i className="ri-user-line text-xl text-green-600"></i>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500">
                <span className="font-medium text-gray-800">{customers.length}</span> registriert
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Umsatz</p>
                <h3 className="text-2xl font-bold text-gray-800 mt-1">
                  {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(stats.totalRevenue)}
                </h3>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <i className="ri-money-euro-circle-line text-xl text-orange-600"></i>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500">
                <span className="font-medium text-gray-800">{getMonthlyRevenue().length}</span> Monate erfasst
              </p>
          </div>
         </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Produkte</p>
                <h3 className="text-2xl font-bold text-gray-800 mt-1">{products.length}</h3>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <i className="ri-stack-line text-xl text-purple-600"></i>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500">
                <span className="font-medium text-gray-800">{products.filter(p => p.stock_quantity > 0).length}</span> auf Lager
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Neueste Bestellungen - nur anzeigen wenn aktiviert */}
      {dashboardSettings.recent_orders && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mt-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Neueste Bestellungen</h3>
          {orders.length > 0 ? (
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">Bestellung #{order.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-500">
                      {order.created_at ? new Date(order.created_at).toLocaleDateString('de-DE') : 'Unbekanntes Datum'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-800">
                      {order.total_amount ? `${Number(order.total_amount).toFixed(2)} €` : '0,00 €'}
                    </p>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                      {order.status || 'Unbekannt'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Keine Bestellungen vorhanden</p>
          )}
        </div>
      )}

      {/* Quick Actions - nur anzeigen wenn aktiviert */}
      {dashboardSettings.quick_actions && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mt-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Schnellaktionen</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => onTabChange?.('orders')}
              className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mb-2">
                <span className="text-white text-sm">+</span>
              </div>
              <span className="text-sm font-medium text-blue-800">Neue Bestellung</span>
            </button>
            <button 
              onClick={() => onTabChange?.('customers')}
              className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mb-2">
                <span className="text-white text-sm">+</span>
              </div>
              <span className="text-sm font-medium text-green-800">Neuer Kunde</span>
            </button>
            <button 
              onClick={() => onTabChange?.('products')}
              className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mb-2">
                <span className="text-white text-sm">+</span>
              </div>
              <span className="text-sm font-medium text-purple-800">Neues Produkt</span>
            </button>
            <button 
              onClick={() => onTabChange?.('invoices')}
              className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mb-2">
                <span className="text-white text-sm">+</span>
              </div>
              <span className="text-sm font-medium text-orange-800">Neue Rechnung</span>
            </button>
          </div>
        </div>
      )}

      {/* Umsatz-Diagramm - nur anzeigen wenn aktiviert */}
      {dashboardSettings.revenue_chart && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mt-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Umsatz-Übersicht</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 text-2xl">💰</span>
              </div>
              <h4 className="text-2xl font-bold text-gray-800 mb-2">
                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(stats.totalRevenue)}
              </h4>
              <p className="text-gray-500">Gesamtumsatz</p>
              <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-800">{stats.totalOrders}</p>
                  <p className="text-gray-500">Bestellungen</p>
                </div>
                <div>
                  <p className="font-medium text-gray-800">{stats.totalCustomers}</p>
                  <p className="text-gray-500">Kunden</p>
                </div>
                <div>
                  <p className="font-medium text-gray-800">{products.length}</p>
                  <p className="text-gray-500">Produkte</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kundenaktivität - nur anzeigen wenn aktiviert */}
      {dashboardSettings.customer_activity && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mt-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Kundenaktivität</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm">👤</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Registrierte Kunden</p>
                  <p className="text-sm text-gray-500">Gesamt</p>
                </div>
              </div>
              <span className="text-lg font-bold text-gray-800">{customers.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">📦</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Aktive Bestellungen</p>
                  <p className="text-sm text-gray-500">In Bearbeitung</p>
                </div>
              </div>
              <span className="text-lg font-bold text-gray-800">{stats.pendingOrders}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-sm">📊</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Verfügbare Produkte</p>
                  <p className="text-sm text-gray-500">Im Lager</p>
                </div>
              </div>
              <span className="text-lg font-bold text-gray-800">{products.filter(p => p.stock_quantity > 0).length}</span>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center mt-6">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
          </div>
          <p className="text-gray-600">Lade Statistiken...</p>
        </div>
      ) : null}
    </div>
  );
}