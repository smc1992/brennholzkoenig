'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import InvoicePreview from '../../InvoicePreview';

interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  customer_id: string | null;
  invoice_date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  subtotal_amount: string;
  tax_amount: string;
  total_amount: string;
  payment_terms: string;
  notes?: string;
  pdf_path?: string;
  created_at: string;
  updated_at: string;
}

interface Order {
  id: string;
  order_number: string;
  delivery_first_name: string;
  delivery_last_name: string;
  delivery_email: string;
  delivery_phone: string;
  delivery_street: string;
  delivery_house_number: string;
  delivery_postal_code: string;
  delivery_city: string;
  total_amount: string;
  subtotal_amount: string;
  delivery_price: string;
  created_at: string;
  order_items?: Array<{
    id: string;
    product_name: string;
    quantity: number;
    unit_price: string;
    total_price: string;
  }>;
  status?: string;
}

export default function CreateInvoicePage() {
  // Helper to construct absolute API URLs (avoids origin mismatches)
  const api = (path: string) => {
    const origin = typeof window !== 'undefined'
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_SITE_URL || '');
    return `${origin}${path}`;
  };

  // Data state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // UI state
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPageSize, setOrdersPageSize] = useState(20);
  const [ordersTotal, setOrdersTotal] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Preview state (reuses existing InvoicePreview component)
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [previewOrderId, setPreviewOrderId] = useState<string | null>(null);
  const [previewInvoiceId, setPreviewInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    // Load orders once invoices are available (including 0)
    if (invoices.length >= 0) {
      loadOrdersWithoutInvoice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices]);

  useEffect(() => {
    // Reload orders on filter/pagination changes
    loadOrdersWithoutInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderSearchTerm, ordersPage, ordersPageSize, orderStatusFilter]);

  const loadInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fehler beim Laden der Rechnungen:', error);
        setInvoices([]);
        return;
      }

      setInvoices(data || []);
    } catch (error) {
      console.error('Fehler beim Laden der Rechnungen:', error);
    }
  };

  const loadOrdersWithoutInvoice = async () => {
    try {
      const existingInvoiceOrderIds = invoices.map(inv => inv.order_id).filter(Boolean);
      const offset = (ordersPage - 1) * ordersPageSize;
      const to = offset + ordersPageSize - 1;

      let query = supabase
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
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, to);

      // Filter out orders that already have invoices
      if (existingInvoiceOrderIds.length > 0) {
        query = query.not('id', 'in', `(${existingInvoiceOrderIds.join(',')})`);
      }

      // Filter by order status
      if (orderStatusFilter && orderStatusFilter !== 'all') {
        query = query.eq('status', orderStatusFilter);
      }

      // Text search across key fields
      const term = orderSearchTerm?.trim();
      if (term) {
        const like = `%${term}%`;
        query = query.or(`order_number.ilike.${like},delivery_email.ilike.${like},delivery_first_name.ilike.${like},delivery_last_name.ilike.${like},delivery_phone.ilike.${like}`);
      }

      const { data: pageOrders, error: ordersError, count } = await query;

      if (ordersError) {
        console.error('❌ Error loading filtered orders:', ordersError);
        return;
      }

      setOrders(pageOrders || []);
      setOrdersTotal(typeof count === 'number' ? count : null);
    } catch (error) {
      console.error('💥 Error loading orders without invoice:', error);
      // Fallback: load all orders if the filtered query fails
      try {
        const { data: fallbackOrders, error: fallbackError } = await supabase
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
          .order('created_at', { ascending: false });

        if (!fallbackError && fallbackOrders) {
          setOrders(fallbackOrders);
        }
      } catch (fallbackError) {
        console.error('💥 Fallback also failed:', fallbackError);
      }
    }
  };

  const generateFromOrder = async (order: Order) => {
    setIsCreating(true);
    try {
      const invoiceNumber = `RG-${Date.now()}`;

      const directResponse = await fetch(api('/api/create-invoice-direct'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderData: order, invoiceNumber }),
      });

      if (!directResponse.ok) {
        const errorText = await directResponse.text();
        console.error('Direct API Error Response:', errorText);
        throw new Error('Direct invoice creation failed');
      }

      const directResult = await directResponse.json();

      if (directResult.success) {
        // Refresh datasets
        await loadInvoices();
        await loadOrdersWithoutInvoice();
        alert('Rechnung erfolgreich erstellt!');
      } else {
        throw new Error('Invoice creation did not return success');
      }
    } catch (error) {
      console.error('Fehler beim Erstellen der Rechnung:', error);
      alert('Fehler beim Erstellen der Rechnung');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-6">
      {/* Page header */}
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-gray-900">Bestellungen ohne Rechnung</h1>
        <p className="text-gray-600">Wählen Sie eine Bestellung und erstellen Sie eine Rechnung.</p>
      </div>

      {/* Controls */}
      <div className="mb-4 space-y-3">
        {/* Search */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Suchen nach Bestellnummer, Name, E-Mail, Telefon..."
            value={orderSearchTerm}
            onChange={(e) => { setOrderSearchTerm(e.target.value); setOrdersPage(1); }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Status:</label>
            <select
              value={orderStatusFilter}
              onChange={(e) => { setOrderStatusFilter(e.target.value); setOrdersPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
            >
              <option value="all">Alle Status</option>
              <option value="pending">Ausstehend</option>
              <option value="confirmed">Bestätigt</option>
              <option value="processing">In Bearbeitung</option>
              <option value="shipped">Versendet</option>
              <option value="delivered">Geliefert</option>
              <option value="cancelled">Storniert</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Pro Seite:</label>
            <select
              value={ordersPageSize}
              onChange={(e) => { setOrdersPageSize(parseInt(e.target.value, 10)); setOrdersPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders list */}
      {orders.length === 0 ? (
        <div className="py-4 text-gray-500">Keine Bestellungen ohne Rechnung gefunden.</div>
      ) : (
        <div className="divide-y divide-gray-200">
          {orders
            .filter((order) => {
              const hay = [
                order.order_number || '',
                `${order.delivery_first_name || ''} ${order.delivery_last_name || ''}`.trim(),
                order.delivery_email || '',
                order.delivery_phone || ''
              ].join(' ').toLowerCase();
              return hay.includes(orderSearchTerm.toLowerCase());
            })
            .map((order) => (
              <div key={order.id} className="py-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-medium text-gray-900">{order.order_number}</h5>
                    <p className="text-sm text-gray-600">
                      {order.delivery_first_name} {order.delivery_last_name}
                    </p>
                    <p className="text-sm text-gray-500">{order.delivery_email}</p>
                    {order.delivery_phone && (
                      <p className="text-sm text-gray-500">{order.delivery_phone}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      Bestellt am: {new Date(order.created_at).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">€{parseFloat(order.total_amount).toFixed(2)}</p>
                    <button
                      onClick={() => {
                        setPreviewOrderId(order.order_number || order.id);
                        setPreviewInvoiceId(null);
                        setShowInvoicePreview(true);
                      }}
                      className="mt-2 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors mr-2"
                    >
                      Vorschau
                    </button>
                    <button
                      onClick={() => generateFromOrder(order)}
                      disabled={isCreating}
                      className="mt-2 bg-amber-600 text-white px-3 py-1 rounded text-sm hover:bg-amber-700 transition-colors disabled:opacity-50"
                    >
                      {isCreating ? 'Erstelle...' : 'Rechnung erstellen'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Pagination */}
      <div className="bg-white py-3 border-t border-gray-200 mt-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Seite {ordersPage}{ordersTotal !== null ? ` von ${Math.max(1, Math.ceil(ordersTotal / ordersPageSize))}` : ''}
            {ordersTotal !== null ? ` (${ordersTotal} Einträge)` : ''}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setOrdersPage(p => Math.max(1, p - 1))}
              disabled={ordersPage <= 1}
              className="px-3 py-2 text-sm rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Vorherige
            </button>
            <button
              onClick={() => setOrdersPage(p => p + 1)}
              disabled={ordersTotal !== null ? ordersPage >= Math.ceil(ordersTotal / ordersPageSize) : false}
              className="px-3 py-2 text-sm rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Nächste
            </button>
          </div>
        </div>
      </div>

      {/* Invoice preview overlay integrated on the page */}
      {showInvoicePreview && (
        <InvoicePreview
          orderId={previewOrderId || undefined}
          invoiceId={previewInvoiceId || undefined}
          onClose={() => {
            setShowInvoicePreview(false);
            setPreviewOrderId(null);
            setPreviewInvoiceId(null);
          }}
        />
      )}
    </div>
  );
}