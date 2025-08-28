
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  subtotal_amount?: number;
  delivery_price?: number;
  created_at: string;
  delivery_type: string;
  delivery_method?: string;
  payment_method?: string;
  
  // Lieferadresse
  delivery_first_name?: string;
  delivery_last_name?: string;
  delivery_email?: string;
  delivery_phone?: string;
  delivery_street?: string;
  delivery_house_number?: string;
  delivery_postal_code?: string;
  delivery_city?: string;
  delivery_notes?: string;
  preferred_delivery_month?: string;
  preferred_delivery_year?: string;
  
  // Rechnungsadresse
  billing_same_as_delivery?: boolean;
  billing_company?: string;
  billing_first_name?: string;
  billing_last_name?: string;
  billing_street?: string;
  billing_house_number?: string;
  billing_postal_code?: string;
  billing_city?: string;
  
  order_items: {
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/konto';
        return;
      }

      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_name,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq('delivery_email', user.email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((orders as any[]) || []);
    } catch (error) {
      console.error('Fehler beim Laden der Bestellungen:', error);
    } finally {
      setLoading(false);
    }
  };

  const reorderItems = async (order: Order) => {
    try {
      // Artikel aus der Bestellung in den Warenkorb legen
      const cartItems = order.order_items.map(item => ({
        id: Date.now() + Math.random(), // Temporäre ID
        name: item.product_name,
        price: item.unit_price.toString(),
        quantity: item.quantity,
        unit: 'SRM',
        image: '/placeholder-product.jpg', // Standardbild
        category: 'Brennholz'
      }));

      // Bestehenden Warenkorb laden und erweitern – robust gegen fehlerhaftes JSON
      let existingCart: any[] = [];
      try {
        existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
        if (!Array.isArray(existingCart)) existingCart = [];
      } catch {
        existingCart = [];
      }

      const updatedCart = [...existingCart, ...cartItems];
      localStorage.setItem('cart', JSON.stringify(updatedCart));

      // Zum Warenkorb weiterleiten
      window.location.href = '/warenkorb';
    } catch (error) {
      console.error('Fehler beim Wiederholen der Bestellung:', error);
      alert('Fehler beim Hinzufügen der Artikel zum Warenkorb.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_items.some(item =>
        item.product_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedOrders = filteredOrders.sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'highest':
        return b.total_amount - a.total_amount;
      case 'lowest':
        return a.total_amount - b.total_amount;
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Lädt Bestellungen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center py-4 space-x-4">
            <Link href="/konto/dashboard" className="text-orange-600 hover:text-orange-700">
              <i className="ri-arrow-left-line text-xl"></i>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Bestellverlauf</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filter und Suche */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Suchen
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Bestellnummer oder Produkt..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                />
                <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status filtern
              </label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm pr-8"
              >
                <option value="all">Alle Status</option>
                <option value="pending">Ausstehend</option>
                <option value="confirmed">Bestätigt</option>
                <option value="shipped">Versandt</option>
                <option value="delivered">Geliefert</option>
                <option value="cancelled">Storniert</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sortieren nach
              </label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm pr-8"
              >
                <option value="newest">Neueste zuerst</option>
                <option value="oldest">Älteste zuerst</option>
                <option value="highest">Höchster Betrag</option>
                <option value="lowest">Niedrigster Betrag</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bestellungen */}
        {sortedOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <i className="ri-shopping-bag-line text-6xl text-gray-300 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'Keine Bestellungen gefunden' : 'Noch keine Bestellungen'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all'
                ? 'Versuchen Sie andere Suchkriterien.'
                : 'Sie haben noch keine Bestellungen aufgegeben.'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Link
                href="/shop"
                className="inline-flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors whitespace-nowrap"
              >
                <i className="ri-shopping-bag-line mr-2"></i>
                Jetzt einkaufen
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedOrders.map(order => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Bestellung #{order.order_number}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {formatDate(order.created_at)} • {order.delivery_type === 'express' ? 'Express' : 'Standard'} Lieferung
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">€{order.total_amount.toFixed(2)}</p>
                      <span className={`inline-block px-3 py-1 text-xs rounded-full border ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Bestellte Artikel:</h4>
                    <div className="space-y-2">
                      {order.order_items.map(item => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center">
                            <span className="w-8 h-6 bg-gray-100 rounded flex items-center justify-center text-xs font-medium mr-3">
                              {item.quantity}×
                            </span>
                            <span className="text-gray-900">{item.product_name}</span>
                          </div>
                          <span className="font-medium text-gray-900">€{item.total_price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                    <div className="flex space-x-3">
                      <Link
                        href={`/konto/bestellungen/${order.id}`}
                        className="px-4 py-2 text-orange-600 border border-orange-600 rounded-lg hover:bg-orange-50 transition-colors text-sm font-medium whitespace-nowrap"
                      >
                        Details anzeigen
                      </Link>
                      {order.status === 'delivered' && (
                        <button
                          onClick={() => reorderItems(order)}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium whitespace-nowrap"
                        >
                          <i className="ri-repeat-line mr-1"></i>
                          Erneut bestellen
                        </button>
                      )}
                    </div>

                    <div className="text-xs text-gray-500">
                      {order.order_items.reduce((sum, item) => sum + item.quantity, 0)} Artikel
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Statistiken */}
        {orders.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ihre Bestellstatistiken</h3>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{orders.length}</div>
                <div className="text-sm text-gray-600">Gesamtbestellungen</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  €{orders.reduce((sum, order) => sum + order.total_amount, 0).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Gesamtausgaben</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  €{(orders.reduce((sum, order) => sum + order.total_amount, 0) / orders.length).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Durchschn. Bestellwert</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {orders.filter(o => o.status === 'delivered').length}
                </div>
                <div className="text-sm text-gray-600">Erfolgreiche Lieferungen</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
