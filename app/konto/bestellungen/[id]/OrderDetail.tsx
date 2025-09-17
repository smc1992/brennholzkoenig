
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  description?: string;
}

interface OrderItem {
  id: string;
  order_id: string;
  product_name: string;
  product_category?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  tax_included?: boolean;
}

interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  total_amount: number;
  status: string;
  payment_method: string;
  shipping_address: any;
  billing_address: any;
  created_at: string;
  updated_at: string;
  notes?: string;
  customer_email?: string;
  customer_phone?: string;
  order_items: OrderItem[];
}

interface OrderDetailProps {
  orderId: string;
}

export default function OrderDetail({ orderId }: OrderDetailProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState('');
  const [productImages, setProductImages] = useState<{[key: string]: string}>({});

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          window.location.href = '/konto';
          return;
        }

        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items:order_items(*)
          `)
          .eq('id', orderId)
          .eq('delivery_email', user.email)
          .single();

        if (error) throw error;
        if (!data) {
          setError('Bestellung nicht gefunden');
          return;
        }
        setOrder(data);
        
        // Lade Produktbilder basierend auf product_name
        if (data.order_items && data.order_items.length > 0) {
          const productNames = data.order_items.map((item: any) => item.product_name);
          const { data: products } = await supabase
            .from('products')
            .select('name, image_url')
            .in('name', productNames);
          
          if (products) {
            const imageMap: {[key: string]: string} = {};
            products.forEach((product: any) => {
              imageMap[product.name] = product.image_url;
            });
            setProductImages(imageMap);
          }
        }
      } catch (error: unknown) {
        console.error('Fehler beim Laden der Bestelldetails:', error);
        setError('Bestellung konnte nicht geladen werden');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);
  
  // Hilfsfunktion für Produktbilder
  const getImageUrl = (url: string): string | undefined => {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return url;
    return `/images/${url}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Ausstehend';
      case 'confirmed': return 'Bestätigt';
      case 'shipped': return 'Versandt';
      case 'delivered': return 'Geliefert';
      case 'cancelled': return 'Storniert';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Lädt Bestellung...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <i className="ri-error-warning-line text-6xl text-red-400 mb-4"></i>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Bestellung nicht gefunden</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/konto/dashboard"
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors whitespace-nowrap"
          >
            Zurück zum Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 sm:pt-24 md:pt-28">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center py-4 space-x-4">
            <Link href="/konto/dashboard" className="text-orange-600 hover:text-orange-700">
              <i className="ri-arrow-left-line text-xl"></i>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bestellung #{order.order_number}</h1>
              <p className="text-gray-600">Aufgegeben am {formatDate(order.created_at)}</p>
            </div>
            <div className="ml-auto">
              <span className={`px-3 py-1 text-sm rounded-full border ${getStatusColor(order.status)}`}>
                {getStatusText(order.status)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Bestellte Artikel</h2>
              <div className="space-y-4">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {productImages[item.product_name] ? (
                        <img
                          src={getImageUrl(productImages[item.product_name])}
                          alt={item.product_name}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = '<i class="ri-package-line text-gray-400 text-xl"></i>';
                          }}
                        />
                      ) : (
                        <i className="ri-package-line text-gray-400 text-xl"></i>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.product_name}</h3>
                      {item.product_category && (
                        <p className="text-sm text-gray-600 mt-1">{item.product_category}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                        <span className="text-sm text-gray-600 whitespace-nowrap">Menge: {item.quantity}</span>
                        <span className="text-sm text-gray-600 whitespace-nowrap">Einzelpreis: {item.unit_price.toFixed(2)}€</span>
                        <span className="text-sm font-medium text-gray-900 whitespace-nowrap">Gesamt: {item.total_price.toFixed(2)}€</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {item.total_price.toFixed(2)}€
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 mt-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Gesamtsumme:</span>
                  <span className="text-xl font-bold text-orange-600">{order.total_amount.toFixed(2)}€</span>
                </div>
              </div>
            </div>

            {order.notes && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Notizen</h2>
                <p className="text-gray-700">{order.notes}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Bestellinformationen</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Bestellnummer:</span>
                  <p className="font-medium text-gray-900">#{order.order_number}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Status:</span>
                  <p>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Bestelldatum:</span>
                  <p className="font-medium text-gray-900">{formatDate(order.created_at)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">E-Mail:</span>
                  <p className="font-medium text-gray-900">{order.customer_email}</p>
                </div>
                {order.customer_phone && (
                  <div>
                    <span className="text-sm text-gray-600">Telefon:</span>
                    <p className="font-medium text-gray-900">{order.customer_phone}</p>
                  </div>
                )}
              </div>
            </div>

            {order.shipping_address && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Lieferadresse</h2>
                <div className="text-gray-700">
                  <p>{order.shipping_address.firstName} {order.shipping_address.lastName}</p>
                  <p>{order.shipping_address.street}</p>
                  <p>{order.shipping_address.postalCode} {order.shipping_address.city}</p>
                  <p>{order.shipping_address.country}</p>
                </div>
              </div>
            )}

            {order.billing_address && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Rechnungsadresse</h2>
                <div className="text-gray-700">
                  <p>{order.billing_address.firstName} {order.billing_address.lastName}</p>
                  <p>{order.billing_address.street}</p>
                  <p>{order.billing_address.postalCode} {order.billing_address.city}</p>
                  <p>{order.billing_address.country}</p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Aktionen</h2>
              <div className="space-y-3">
                <button className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors whitespace-nowrap">
                  Bestellung erneut bestellen
                </button>
                {order.status === 'pending' && (
                  <button className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap">
                    Bestellung stornieren
                  </button>
                )}
                <button className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap">
                  Support kontaktieren
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
