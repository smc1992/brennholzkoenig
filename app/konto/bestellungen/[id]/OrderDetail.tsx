
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [productImages, setProductImages] = useState<{[key: string]: string}>({});

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000); // Auto-hide after 5 seconds
  };

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
      case 'processing': return 'In Bearbeitung';
      case 'shipped': return 'Versandt';
      case 'delivered': return 'Geliefert';
      case 'cancelled': return 'Storniert';
      default: return status;
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    
    setCancelling(true);
    setError(null);
    
    try {
      const response = await fetch('/api/cancel-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId: order.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Fehler beim Stornieren der Bestellung');
      }

      // Bestellung neu laden um den aktualisierten Status zu zeigen
      const { data: updatedOrder, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('id', orderId)
        .single();

      if (fetchError) {
        console.error('Fehler beim Neuladen der Bestellung:', fetchError);
      } else {
        setOrder(updatedOrder);
      }

      setShowCancelDialog(false);
      
      // Detaillierte Erfolgs-/E-Mail-Nachricht anzeigen
      let message = 'Ihre Bestellung wurde erfolgreich storniert.';
      let toastType: 'success' | 'warning' = 'success';
      
      if (result.emailsSent > 0) {
        if (result.emailsFailed > 0) {
          message += ` ${result.emailsSent} von ${result.emailsSent + result.emailsFailed} Bestätigungs-E-Mails wurden versendet.`;
          toastType = 'warning';
        } else {
          message += ' Sie erhalten eine Bestätigungs-E-Mail.';
        }
      } else if (result.emailsFailed > 0) {
        message += ' Hinweis: Die Bestätigungs-E-Mail konnte nicht versendet werden. Bitte kontaktieren Sie den Support.';
        toastType = 'warning';
      }
      
      showToast(message, toastType);
      
    } catch (err) {
      console.error('Fehler beim Stornieren:', err);
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler beim Stornieren');
    } finally {
      setCancelling(false);
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
                  <button 
                    onClick={() => setShowCancelDialog(true)}
                    disabled={cancelling}
                    className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cancelling ? 'Storniere...' : 'Bestellung stornieren'}
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

      {/* Bestätigungsdialog für Stornierung */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Bestellung stornieren
            </h3>
            <p className="text-gray-600 mb-6">
              Sind Sie sicher, dass Sie die Bestellung #{order?.order_number} stornieren möchten? 
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelDialog(false)}
                disabled={cancelling}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Abbrechen
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {cancelling ? 'Storniere...' : 'Ja, stornieren'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className={`rounded-lg p-4 shadow-lg border-l-4 ${
            toast.type === 'success' 
              ? 'bg-green-50 border-green-400 text-green-800' 
              : toast.type === 'warning'
              ? 'bg-yellow-50 border-yellow-400 text-yellow-800'
              : 'bg-red-50 border-red-400 text-red-800'
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {toast.type === 'success' && (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {toast.type === 'warning' && (
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                {toast.type === 'error' && (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium">{toast.message}</p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={() => setToast(null)}
                  className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
