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

interface StatsTabProps {
  stats: {
    totalOrders: number;
    totalCustomers: number;
    totalRevenue: number;
    pendingOrders: number;
  };
  onRefresh: () => Promise<void>;
}

// Fallback-Daten für sofortige Anzeige
const fallbackOrders: Order[] = [
  { id: '1', total_amount: 89.99, created_at: '2024-01-15', status: 'delivered', customer_id: '1' },
  { id: '2', total_amount: 79.99, created_at: '2024-01-20', status: 'pending', customer_id: '2' },
  { id: '3', total_amount: 99.99, created_at: '2024-01-25', status: 'delivered', customer_id: '3' }
];

const fallbackProducts: Product[] = [
  { id: '1', name: 'Industrieholz Buche Klasse 1', price: 89.99, stock_quantity: 50, created_at: '2024-01-01' },
  { id: '2', name: 'Industrieholz Buche Klasse 2', price: 79.99, stock_quantity: 30, created_at: '2024-01-01' },
  { id: '3', name: 'Scheitholz Buche 33cm', price: 99.99, stock_quantity: 25, created_at: '2024-01-01' }
];

const fallbackCustomers: Customer[] = [
  { id: '1', email: 'kunde1@example.com', created_at: '2024-01-10', first_name: 'Max', last_name: 'Mustermann' },
  { id: '2', email: 'kunde2@example.com', created_at: '2024-01-12', first_name: 'Anna', last_name: 'Schmidt' },
  { id: '3', email: 'kunde3@example.com', created_at: '2024-01-14', first_name: 'Peter', last_name: 'Weber' }
];

export default function StatsTab({ stats, onRefresh }: StatsTabProps) {
  // Starte mit Fallback-Daten für sofortige Anzeige
  const [orders, setOrders] = useState<Order[]>(fallbackOrders);
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [customers, setCustomers] = useState<Customer[]>(fallbackCustomers);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Sichere Abfrage für customers Tabelle
        const getCustomersData = async () => {
          try {
            const result = await supabase.from('customers').select('*');
            return result;
          } catch (error) {
            console.warn('customers Tabelle nicht verfügbar:', error);
            return { data: [], error: null };
          }
        };

        const [ordersRes, productsRes, customersRes] = await Promise.all([
          supabase.from('orders').select('*'),
          supabase.from('products').select('*'),
          getCustomersData()
        ]);

        if (ordersRes.error) throw ordersRes.error;
        if (productsRes.error) throw productsRes.error;
        // customersRes.error wird bereits in getCustomersData behandelt

        // Nur aktualisieren wenn echte Daten vorhanden
        const realOrders = (ordersRes.data || []) as unknown as Order[];
        const realProducts = (productsRes.data || []) as unknown as Product[];
        const realCustomers = (customersRes.data || []) as unknown as Customer[];
        
        if (realOrders.length > 0) {
          setOrders(realOrders);
          console.log('Real orders loaded:', realOrders.length);
        }
        if (realProducts.length > 0) {
          setProducts(realProducts);
          console.log('Real products loaded:', realProducts.length);
        }
        if (realCustomers.length > 0) {
          setCustomers(realCustomers);
          console.log('Real customers loaded:', realCustomers.length);
        }
      } catch (error: unknown) {
        console.error('Fehler beim Laden der Statistiken:', error);
        // Bei Fehler bleiben Fallback-Daten erhalten
      }
      // Kein setLoading(false) mehr nötig
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

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
          </div>
          <p className="text-gray-600">Lade Statistiken...</p>
        </div>
      ) : null}
    </div>
  );
}