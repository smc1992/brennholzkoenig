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

export default function StatsTab({ stats, onRefresh }: StatsTabProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

        setOrders((ordersRes.data || []) as unknown as Order[]);
        setProducts((productsRes.data || []) as unknown as Product[]);
        setCustomers((customersRes.data || []) as unknown as Customer[]);
      } catch (error: unknown) {
        console.error('Fehler beim Laden der Statistiken:', error);
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