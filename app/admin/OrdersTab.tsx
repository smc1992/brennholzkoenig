
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface OrdersTabProps {
  onStatsUpdate?: () => Promise<void>;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: string;
  subtotal_amount?: string;
  delivery_price: string;
  delivery_type: string;
  delivery_method?: string;
  payment_method?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  
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
  
  customers?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    street: string;
    house_number: string;
    postal_code: string;
    city: string;
  };
  order_items?: Array<{
    id: string;
    product_name: string;
    product_category: string;
    quantity: number;
    unit_price: string;
    total_price: string;
  }>;
}

export default function OrdersTab({ onStatsUpdate }: OrdersTabProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Order | null>(null);

  // Using the centralized Supabase client from lib/supabase.ts

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, statusFilter, searchTerm]);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers (
            first_name,
            last_name,
            email,
            phone,
            street,
            house_number,
            postal_code,
            city
          ),
          order_items (
            product_name,
            product_category,
            quantity,
            unit_price,
            total_price
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data as any[]) || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${order.customers?.first_name} ${order.customers?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customers?.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      // Update local state
      setOrders(prev =>
        prev.map(order =>
          order.id === orderId
            ? { ...order, status: newStatus, updated_at: new Date().toISOString() }
            : order
        )
      );

      // Specific messages for status changes that affect inventory
      if (newStatus === 'confirmed') {
        alert(`Bestellstatus erfolgreich auf "${getStatusText(newStatus)}" geändert.\n\nDer Lagerbestand wurde automatisch aktualisiert.`);
      } else if (newStatus === 'cancelled') {
        alert(`Bestellstatus erfolgreich auf "${getStatusText(newStatus)}" geändert.\n\nDer Lagerbestand wurde automatisch zurückgebucht.`);
      } else {
        alert(`Bestellstatus erfolgreich auf "${getStatusText(newStatus)}" geändert.`);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Fehler beim Aktualisieren des Bestellstatus');
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      // Erst die order_items löschen
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      // Dann die Bestellung löschen
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (orderError) throw orderError;

      // Local state aktualisieren
      setOrders(prev => prev.filter(order => order.id !== orderId));
      setShowDeleteConfirm(null);
      alert('Bestellung erfolgreich gelöscht.');
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Fehler beim Löschen der Bestellung: ' + (error as any).message);
    }
  };

  const saveOrderChanges = async (orderId: string, updatedData: any) => {
    try {
      // Bestellung aktualisieren
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          delivery_type: updatedData.delivery_type,
          delivery_price: updatedData.delivery_price,
          notes: updatedData.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (orderError) throw orderError;

      // Kundendaten aktualisieren falls vorhanden
      if (updatedData.customer) {
        const { error: customerError } = await supabase
          .from('customers')
          .update({
            first_name: updatedData.customer.first_name,
            last_name: updatedData.customer.last_name,
            email: updatedData.customer.email,
            phone: updatedData.customer.phone,
            street: updatedData.customer.street,
            house_number: updatedData.customer.house_number,
            postal_code: updatedData.customer.postal_code,
            city: updatedData.customer.city
          })
          .eq('id', updatedData.customer.id);

        if (customerError) throw customerError;
      }

      // Order Items aktualisieren
      if (updatedData.items) {
        for (const item of updatedData.items) {
          const { error: itemError } = await supabase
            .from('order_items')
            .update({
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.quantity * item.unit_price
            })
            .eq('id', item.id);

          if (itemError) throw itemError;
        }
      }

      // Gesamtbetrag neu berechnen und aktualisieren
      const calculateTotalRevenue = (orders: Order[], deliveryPrice: string): number => {
        return orders.reduce((sum: number, item: Order) => {
          return sum + parseFloat(item.total_amount);
        }, 0) + parseFloat(deliveryPrice);
      };

      const newTotal = calculateTotalRevenue(orders, updatedData.delivery_price);

      const { error: totalError } = await supabase
        .from('orders')
        .update({ total_amount: newTotal })
        .eq('id', orderId);

      if (totalError) throw totalError;

      // Local state aktualisieren
      await loadOrders();
      setEditingOrder(null);
      alert('Bestellung erfolgreich aktualisiert.');
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Fehler beim Aktualisieren der Bestellung: ' + (error as any).message);
    }
  };

  type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

  const getStatusColor = (status: string) => {
    const colors: Record<OrderStatus, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as OrderStatus] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts: Record<OrderStatus, string> = {
      pending: 'Ausstehend',
      confirmed: 'Bestätigt',
      processing: 'In Bearbeitung',
      shipped: 'Versendet',
      delivered: 'Geliefert',
      cancelled: 'Storniert'
    };
    return texts[status as OrderStatus] || status;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="w-12 h-12 flex items-center justify-center bg-[#C04020] rounded-full mx-auto mb-4 animate-pulse">
          <i className="ri-shopping-bag-line text-2xl text-white"></i>
        </div>
        <p className="text-lg font-medium text-gray-700">Lade Bestellungen...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <div className="w-5 h-5 flex items-center justify-center text-gray-400">
                  <i className="ri-search-line"></i>
                </div>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#C04020] transition-colors"
                placeholder="Suche nach Bestellnummer, Kunde oder E-Mail..."
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#C04020] transition-colors cursor-pointer pr-8"
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

          {/* Refresh */}
          <button
            onClick={loadOrders}
            className="bg-[#C04020] hover:bg-[#A03318] text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-refresh-line mr-2"></i>
            Aktualisieren
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#1A1A1A]">
              Bestellungen ({filteredOrders.length})
            </h2>
            <div className="text-sm text-gray-500">
              Gesamt: {orders.length} Bestellungen
            </div>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
              <i className="ri-shopping-bag-line text-2xl text-gray-400"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              {orders.length === 0 ? 'Noch keine Bestellungen' : 'Keine Bestellungen gefunden'}
            </h3>
            <p className="text-gray-500">
              {orders.length === 0
                ? 'Bestellungen werden hier angezeigt, sobald Kunden bestellen.'
                : 'Versuchen Sie andere Suchkriterien oder Filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Bestellung
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Kunde
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Betrag
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Lieferung
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order: Order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-[#1A1A1A]">#{order.order_number}</div>
                      <div className="text-xs text-gray-500">{order.order_items?.length || 0} Artikel</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.customers?.first_name} {order.customers?.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{order.customers?.email}</div>
                      {order.customers?.phone && (
                        <div className="text-xs text-gray-400">{order.customers.phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-[#C04020]">€{parseFloat(order.total_amount).toFixed(2)}</div>
                      <div className="text-xs text-gray-500">
                        inkl. €{parseFloat(order.delivery_price).toFixed(2)} Lieferung
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={e => updateOrderStatus(order.id, e.target.value)}
                        className={`text-xs font-bold rounded-full px-3 py-1 border-0 cursor-pointer pr-8 ${getStatusColor(order.status)}`}
                      >
                        <option value="pending">Ausstehend</option>
                        <option value="confirmed">Bestätigt</option>
                        <option value="processing">In Bearbeitung</option>
                        <option value="shipped">Versendet</option>
                        <option value="delivered">Geliefert</option>
                        <option value="cancelled">Storniert</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.delivery_type === 'express' ? 'Express' : 'Standard'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.delivery_type === 'express' ? '24-48h' : '1-3 Wochen'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(order.created_at).toLocaleDateString('de-DE')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleTimeString('de-DE', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                          className="text-[#C04020] hover:text-[#A03318] cursor-pointer"
                          title="Details anzeigen"
                        >
                          <i className="ri-eye-line"></i>
                        </button>
                        <button
                          onClick={() => setEditingOrder(order)}
                          className="text-blue-600 hover:text-blue-800 cursor-pointer"
                          title="Bestellung bearbeiten"
                        >
                          <i className="ri-edit-line"></i>
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(order)}
                          className="text-red-600 hover:text-red-800 cursor-pointer"
                          title="Bestellung löschen"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 flex items-center justify-center bg-red-100 rounded-full mx-auto mb-4">
                <i className="ri-delete-bin-line text-2xl text-red-600"></i>
              </div>
              <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">Bestellung löschen?</h2>
              <p className="text-gray-600 mb-6">
                Möchten Sie die Bestellung <strong>#{showDeleteConfirm.order_number}</strong> wirklich permanent
                löschen? Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => deleteOrder(showDeleteConfirm.id)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
                >
                  Löschen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {editingOrder && (
        <EditOrderModal
          order={editingOrder}
          onSave={saveOrderChanges}
          onClose={() => setEditingOrder(null)}
        />
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#1A1A1A]">
                  Bestellung #{selectedOrder.order_number}
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditingOrder(selectedOrder)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-edit-line mr-2"></i>
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <i className="ri-close-line text-2xl"></i>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Lieferadresse</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Name:</span> {selectedOrder.delivery_first_name || selectedOrder.customers?.first_name}{' '}
                      {selectedOrder.delivery_last_name || selectedOrder.customers?.last_name}
                    </p>
                    <p>
                      <span className="font-medium">E-Mail:</span> {selectedOrder.delivery_email || selectedOrder.customers?.email}
                    </p>
                    {(selectedOrder.delivery_phone || selectedOrder.customers?.phone) && (
                      <p>
                        <span className="font-medium">Telefon:</span> {selectedOrder.delivery_phone || selectedOrder.customers?.phone}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Adresse:</span>{' '}
                      {selectedOrder.delivery_street || selectedOrder.customers?.street} {selectedOrder.delivery_house_number || selectedOrder.customers?.house_number}
                    </p>
                    <p>
                      {selectedOrder.delivery_postal_code || selectedOrder.customers?.postal_code} {selectedOrder.delivery_city || selectedOrder.customers?.city}
                    </p>
                    {selectedOrder.delivery_notes && (
                      <p>
                        <span className="font-medium">Liefernotizen:</span> {selectedOrder.delivery_notes}
                      </p>
                    )}
                    {(selectedOrder.preferred_delivery_month || selectedOrder.preferred_delivery_year) && (
                      <p>
                        <span className="font-medium">Gewünschter Liefertermin:</span> {selectedOrder.preferred_delivery_month} {selectedOrder.preferred_delivery_year}
                      </p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Rechnungsadresse</h3>
                  <div className="space-y-2 text-sm">
                    {selectedOrder.billing_same_as_delivery ? (
                      <p className="text-gray-600 italic">Gleich wie Lieferadresse</p>
                    ) : (
                      <>
                        {selectedOrder.billing_company && (
                          <p>
                            <span className="font-medium">Firma:</span> {selectedOrder.billing_company}
                          </p>
                        )}
                        <p>
                          <span className="font-medium">Name:</span> {selectedOrder.billing_first_name} {selectedOrder.billing_last_name}
                        </p>
                        <p>
                          <span className="font-medium">Adresse:</span>{' '}
                          {selectedOrder.billing_street} {selectedOrder.billing_house_number}
                        </p>
                        <p>
                          {selectedOrder.billing_postal_code} {selectedOrder.billing_city}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Bestelldetails</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Bestelldatum:</span>{' '}
                      {new Date(selectedOrder.created_at).toLocaleDateString('de-DE')}
                    </p>
                    <p>
                      <span className="font-medium">Status:</span>{' '}
                      <span
                        className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(selectedOrder.status)}`}
                      >
                        {getStatusText(selectedOrder.status)}
                      </span>
                    </p>
                    {selectedOrder.payment_method && (
                      <p>
                        <span className="font-medium">Zahlungsmethode:</span> {selectedOrder.payment_method === 'bar' ? 'Barzahlung bei Lieferung' : selectedOrder.payment_method}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Lieferart:</span>{' '}
                      {selectedOrder.delivery_type === 'express' ? 'Express (24-48h)' : 'Standard (1-3 Wochen)'}
                    </p>
                    {selectedOrder.delivery_method && (
                      <p>
                        <span className="font-medium">Liefermethode:</span> {selectedOrder.delivery_method}
                      </p>
                    )}
                    {selectedOrder.subtotal_amount && (
                      <p>
                        <span className="font-medium">Zwischensumme:</span> €
                        {parseFloat(selectedOrder.subtotal_amount).toFixed(2)}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Lieferkosten:</span> €
                      {parseFloat(selectedOrder.delivery_price).toFixed(2)}
                    </p>
                    <p>
                      <span className="font-medium font-bold">Gesamtsumme:</span> €
                      {parseFloat(selectedOrder.total_amount).toFixed(2)}
                    </p>
                    {selectedOrder.notes && (
                      <p>
                        <span className="font-medium">Hinweise:</span> {selectedOrder.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Bestellte Artikel</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-gray-50 rounded-lg">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-600">Produkt</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-600">Kategorie</th>
                        <th className="px-4 py-3 text-right text-sm font-bold text-gray-600">Menge</th>
                        <th className="px-4 py-3 text-right text-sm font-bold text-gray-600">Einzelpreis</th>
                        <th className="px-4 py-3 text-right text-sm font-bold text-gray-600">Gesamtpreis</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.order_items?.map((item, index) => (
                        <tr key={index} className="border-b border-gray-200 last:border-b-0">
                          <td className="px-4 py-3 text-sm text-gray-900">{item.product_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.product_category}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.quantity} SRM</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            €{parseFloat(item.unit_price).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-[#C04020] text-right">
                            €{parseFloat(item.total_price).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-100">
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                          Warenwert:
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-[#C04020] text-right">
                          €{(parseFloat(selectedOrder.total_amount) - parseFloat(selectedOrder.delivery_price)).toFixed(
                            2
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                          Lieferung:
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-[#C04020] text-right">
                          €{parseFloat(selectedOrder.delivery_price).toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-lg font-bold text-gray-900 text-right">
                          Gesamtsumme:
                        </td>
                        <td className="px-4 py-3 text-lg font-bold text-[#C04020] text-right">
                          €{parseFloat(selectedOrder.total_amount).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface OrderItem {
  id: string;
  product_name: string;
  product_category: string;
  quantity: number;
  unit_price: number;
}

interface OrderFormData {
  customer: {
    id?: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    street: string;
    house_number: string;
    postal_code: string;
    city: string;
  };
  delivery_type: string;
  delivery_price: string;
  notes: string;
  items: OrderItem[];
}

interface EditOrderModalProps {
  order: Order;
  onSave: (orderId: string, updatedData: OrderFormData) => void;
  onClose: () => void;
}

// Edit Order Modal Component
function EditOrderModal({ order, onSave, onClose }: EditOrderModalProps) {
  const [formData, setFormData] = useState<OrderFormData>({
    customer: {
      id: order.customers?.id,
      first_name: order.customers?.first_name || '',
      last_name: order.customers?.last_name || '',
      email: order.customers?.email || '',
      phone: order.customers?.phone || '',
      street: order.customers?.street || '',
      house_number: order.customers?.house_number || '',
      postal_code: order.customers?.postal_code || '',
      city: order.customers?.city || ''
    },
    delivery_type: order.delivery_type || 'standard',
    delivery_price: order.delivery_price || '0',
    notes: order.notes || '',
    items:
      order.order_items?.map(item => ({
        id: item.id,
        product_name: item.product_name,
        product_category: item.product_category,
        quantity: item.quantity,
        unit_price: parseFloat(item.unit_price)
      })) || []
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave(order.id, formData);
  };

  const updateItemQuantity = (index: number, newQuantity: string | number) => {
    const updatedItems = [...formData.items];
    updatedItems[index].quantity = parseInt(String(newQuantity));
    setFormData({ ...formData, items: updatedItems });
  };

  const updateItemPrice = (index: number, newPrice: string | number) => {
    const updatedItems = [...formData.items];
    updatedItems[index].unit_price = parseFloat(String(newPrice));
    setFormData({ ...formData, items: updatedItems });
  };

  const calculateTotal = () => {
    const itemsTotal = formData.items.reduce((sum: number, item: OrderItem) => sum + item.quantity * item.unit_price, 0);
    return itemsTotal + parseFloat(formData.delivery_price);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#1A1A1A]">
              Bestellung #{order.order_number} bearbeiten
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Customer Information */}
          <div>
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Kundeninformationen</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vorname</label>
                <input
                  type="text"
                  value={formData.customer.first_name}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      customer: { ...formData.customer, first_name: e.target.value }
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nachname</label>
                <input
                  type="text"
                  value={formData.customer.last_name}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      customer: { ...formData.customer, last_name: e.target.value }
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
                <input
                  type="email"
                  value={formData.customer.email}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      customer: { ...formData.customer, email: e.target.value }
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input
                  type="tel"
                  value={formData.customer.phone}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      customer: { ...formData.customer, phone: e.target.value }
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Straße</label>
                <input
                  type="text"
                  value={formData.customer.street}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      customer: { ...formData.customer, street: e.target.value }
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hausnummer</label>
                <input
                  type="text"
                  value={formData.customer.house_number}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      customer: { ...formData.customer, house_number: e.target.value }
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PLZ</label>
                <input
                  type="text"
                  value={formData.customer.postal_code}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      customer: { ...formData.customer, postal_code: e.target.value }
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stadt</label>
                <input
                  type="text"
                  value={formData.customer.city}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      customer: { ...formData.customer, city: e.target.value }
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors text-sm"
                />
              </div>
            </div>
          </div>

          {/* Delivery Settings */}
          <div>
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Liefereinstellungen</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lieferart</label>
                <select
                  value={formData.delivery_type}
                  onChange={e => setFormData({ ...formData, delivery_type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors text-sm cursor-pointer pr-8"
                >
                  <option value="standard">Standard (1-3 Wochen)</option>
                  <option value="express">Express (24-48h)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lieferkosten (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.delivery_price}
                  onChange={e => setFormData({ ...formData, delivery_price: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors text-sm"
                />
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Bestellte Artikel</h3>
            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Produkt</label>
                      <input
                        type="text"
                        value={item.product_name}
                        readOnly
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Menge (SRM)</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e => updateItemQuantity(index, e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Preis pro SRM (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unit_price}
                        onChange={e => updateItemPrice(index, e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gesamtpreis</label>
                      <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-sm font-bold text-[#C04020]">
                        €{(item.quantity * item.unit_price).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hinweise</label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors text-sm"
              placeholder="Zusätzliche Hinweise zur Bestellung..."
            />
          </div>

          {/* Total */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Neue Gesamtsumme:</span>
              <span className="text-[#C04020]">€{calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="flex-1 bg-[#C04020] hover:bg-[#A03318] text-white py-3 px-4 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-save-line mr-2"></i>
              Änderungen speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
