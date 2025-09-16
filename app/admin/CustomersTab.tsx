
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: string;
  name?: string;
  product_name: string;
  total_price: string;
}

interface Order {
  id: string;
  order_number: string;
  total_amount: string; // Changed to string to match database type
  status: string;
  created_at: string;
  delivery_first_name: string;
  delivery_last_name: string;
  delivery_email: string;
  delivery_phone: string;
  delivery_street: string;
  delivery_house_number: string;
  delivery_postal_code: string;
  delivery_city: string;
  billing_same_as_delivery: boolean;
  billing_company?: string;
  billing_first_name?: string;
  billing_last_name?: string;
  billing_street?: string;
  billing_house_number?: string;
  billing_postal_code?: string;
  billing_city?: string;
  payment_method: string;
  order_items?: OrderItem[]; // Added missing property
}

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  is_deleted?: boolean;
  customer_number?: string;
  orders?: Order[];
  [key: string]: any; // For any additional properties
}

export default function CustomersTab() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerNotes, setCustomerNotes] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [billingSameAsDelivery, setBillingSameAsDelivery] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    street: '',
    house_number: '',
    postal_code: '',
    city: '',
    date_of_birth: '',
    country: 'Deutschland',
    preferred_delivery_month: '',
    preferred_delivery_year: new Date().getFullYear().toString(),
    billing_same_as_delivery: true,
    billing_company: '',
    billing_first_name: '',
    billing_last_name: '',
    billing_street: '',
    billing_house_number: '',
    billing_postal_code: '',
    billing_city: ''
  });

  // Using the centralized Supabase client from lib/supabase.ts

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          orders (
            id,
            order_number,
            total_amount,
            status,
            created_at,
            delivery_first_name,
            delivery_last_name,
            delivery_email,
            delivery_phone,
            delivery_street,
            delivery_house_number,
            delivery_postal_code,
            delivery_city,
            billing_same_as_delivery,
            billing_company,
            billing_first_name,
            billing_last_name,
            billing_street,
            billing_house_number,
            billing_postal_code,
            billing_city,
            payment_method
          )
        `)
        .order('updated_at', { ascending: false })
        .order('is_deleted', { ascending: true });

      if (error) throw error;
      setCustomers((data as unknown as Customer[]) || []);

      const lastUpdate = localStorage.getItem('last_customer_update');
      const currentTime = new Date().toISOString();

      if (lastUpdate && data && data.length > 0) {
        const recentUpdates = data.filter((customer: any) =>
          new Date(customer.updated_at || customer.created_at) > new Date(lastUpdate)
        );

        if (recentUpdates.length > 0) {
          console.log(`${recentUpdates.length} Kundenaktualisierung(en) erkannt`);
          // Optional: Toast-Notification anzeigen
        }
      }

      localStorage.setItem('last_customer_update', currentTime);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateCustomerStats = (customer: Customer) => {
    const orders = customer.orders || [];
    const totalOrders = orders.length;
    const totalSpent = orders.reduce(
      (sum, order) => sum + (typeof order.total_amount === 'string' ? parseFloat(order.total_amount) : order.total_amount),
      0
    );
    const lastOrderDate = orders.length > 0 ? new Date(orders[0].created_at) : null;

    return { totalOrders, totalSpent, lastOrderDate };
  };

  const getCustomerStatus = (customer: Customer) => {
    if (customer.is_deleted) {
      return { status: 'Gelöscht', color: 'bg-red-100 text-red-800' };
    }

    const stats = calculateCustomerStats(customer);

    if (stats.totalSpent >= 1000 || stats.totalOrders >= 5) {
      return { status: 'VIP', color: 'bg-purple-100 text-purple-800' };
    }
    if (
      stats.totalOrders > 0 &&
      stats.lastOrderDate &&
      Date.now() - stats.lastOrderDate.getTime() < 90 * 24 * 60 * 60 * 1000
    ) {
      return { status: 'Aktiv', color: 'bg-green-100 text-green-800' };
    }
    if (stats.totalOrders === 0) {
      return { status: 'Neu', color: 'bg-blue-100 text-blue-800' };
    }
    return { status: 'Inaktiv', color: 'bg-gray-100 text-gray-800' };
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: 'Ausstehend',
      confirmed: 'Bestätigt',
      processing: 'In Bearbeitung',
      shipped: 'Versendet',
      delivered: 'Geliefert',
      cancelled: 'Storniert',
    };
    return texts[status] || status;
  };

  const filterCustomers = () => {
    let filtered = [...customers];

    if (searchTerm) {
      filtered = filtered.filter((customer) => {
        const term = searchTerm.toLowerCase();
        return (
          `${customer.first_name} ${customer.last_name}`
            .toLowerCase()
            .includes(term) ||
          customer.email?.toLowerCase().includes(term) ||
          customer.city?.toLowerCase().includes(term) ||
          customer.postal_code?.includes(searchTerm)
        );
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((customer) => {
        if (statusFilter === 'deleted') {
          return customer.is_deleted;
        }

        if (customer.is_deleted) return false;

        const stats = calculateCustomerStats(customer);
        switch (statusFilter) {
          case 'active':
            return (
              stats.totalOrders > 0 &&
              stats.lastOrderDate &&
              Date.now() - stats.lastOrderDate.getTime() <
                90 * 24 * 60 * 60 * 1000
            );
          case 'inactive':
            return (
              stats.totalOrders === 0 ||
              !stats.lastOrderDate ||
              Date.now() - stats.lastOrderDate.getTime() >=
                90 * 24 * 60 * 60 * 1000
            );
          case 'vip':
            return stats.totalSpent >= 1000 || stats.totalOrders >= 5;
          default:
            return true;
        }
      });
    }

    filtered.sort((a, b) => {
      if (a.is_deleted && !b.is_deleted) return 1;
      if (!a.is_deleted && b.is_deleted) return -1;

      const statsA = calculateCustomerStats(a);
      const statsB = calculateCustomerStats(b);
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'revenue_high':
          return statsB.totalSpent - statsA.totalSpent;
        case 'revenue_low':
          return statsA.totalSpent - statsB.totalSpent;
        case 'orders_high':
          return statsB.totalOrders - statsA.totalOrders;
        case 'name':
          return `${a.first_name} ${a.last_name}`.localeCompare(
            `${b.first_name} ${b.last_name}`
          );
        default:
          return 0;
      }
    });

    setFilteredCustomers(filtered);
  };

  const loadCustomerOrders = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            product_name,
            quantity,
            total_price
          )
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
         setCustomerOrders((data as unknown as Order[]) || []);
    } catch (error) {
      console.error('Error loading customer orders:', error);
      setCustomerOrders([]);
    }
  };

  const updateCustomer = async (customerId: string, updatedData: Partial<Customer>) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          ...updatedData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customerId);

      if (error) throw error;

      setEditingCustomer(null);
      await loadCustomers();
      alert('Kundeninformationen erfolgreich aktualisiert!');
    } catch (error) {
      console.error('Error updating customer:', error);
      alert('Fehler beim Aktualisieren der Kundeninformationen');
    }
  };

  const viewCustomerDetails = async (customerId: string) => {
    try {
      const customer = customers.find((c) => c.id === customerId);
      if (!customer) return;

      setSelectedCustomer(customer);
      await loadCustomerOrders(customerId);
    } catch (error) {
      console.error('Error viewing customer details:', error);
    }
  };

  const softDeleteCustomer = async (customerId: string): Promise<void> => {
    try {
      await supabase
        .from('orders')
        .delete()
        .eq('customer_id', customerId);

      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);

      if (error) throw error;

      await loadCustomers();
      alert('Kunde erfolgreich gelöscht!');
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Fehler beim Löschen des Kunden');
    }
  };

  const permanentDeleteCustomer = async (customerId: string) => {
    try {
      await supabase
        .from('orders')
        .delete()
        .eq('customer_id', customerId);

      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);

      if (error) throw error;

      await loadCustomers();
      alert('Kunde endgültig gelöscht!');
    } catch (error) {
      console.error('Error permanently deleting customer:', error);
      alert('Fehler beim endgültigen Löschen des Kunden');
    }
  };

  const createCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          ...newCustomerData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setNewCustomerData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        company: '',
        street: '',
        house_number: '',
        postal_code: '',
        city: '',
        date_of_birth: '',
        country: 'Deutschland',
        preferred_delivery_month: '',
        preferred_delivery_year: new Date().getFullYear().toString(),
        billing_same_as_delivery: true,
        billing_company: '',
        billing_first_name: '',
        billing_last_name: '',
        billing_street: '',
        billing_house_number: '',
        billing_postal_code: '',
        billing_city: ''
      });
      setShowAddCustomerModal(false);
      loadCustomers();
      alert('Kunde erfolgreich erstellt!');
    } catch (error: any) {
      console.error('Error creating customer:', error);
      alert('Fehler beim Erstellen des Kunden: ' + error.message);
    }
  };

  const exportCustomers = () => {
    if (filteredCustomers.length === 0) {
      alert('Export fehlgeschlagen: Keine Kundendaten verfügbar.');
      return;
    }

    const csvData = filteredCustomers.map((customer) => {
      const stats = calculateCustomerStats(customer);
      const csvRow: Record<string, string | number> = {
        Vorname: customer.first_name || '',
        Nachname: customer.last_name || '',
        'E-Mail': customer.email || '',
        Telefon: customer.phone || '',
        Straße: customer.street || '',
        Hausnummer: customer.house_number || '',
        PLZ: customer.postal_code || '',
        Stadt: customer.city || '',
        'Rechnungsadresse gleich': customer.billing_same_as_delivery ? 'Ja' : 'Nein',
        'Rechnungsfirma': customer.billing_company || '',
        'Rechnungsvorname': customer.billing_first_name || '',
        'Rechnungsnachname': customer.billing_last_name || '',
        'Rechnungsstraße': customer.billing_street || '',
        'Rechnungshausnummer': customer.billing_house_number || '',
        'Rechnungs-PLZ': customer.billing_postal_code || '',
        'Rechnungsstadt': customer.billing_city || '',
        'Kunde seit': new Date(customer.created_at).toLocaleDateString('de-DE'),
        Bestellungen: stats.totalOrders,
        Gesamtumsatz: `€${stats.totalSpent.toFixed(2)}`,
        'Letzte Bestellung': stats.lastOrderDate
          ? stats.lastOrderDate.toLocaleDateString('de-DE')
          : '-',
        Notizen: customer.notes || '',
      };
      return csvRow;
    });

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kunden_export_${new Date()
      .toISOString()
      .split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    loadCustomers();

    const customerSubscription = supabase
      .channel('customers_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customers',
        },
        (payload: any) => {
          console.log('Customer change detected:', payload);
          loadCustomers();
        }
      )
      .subscribe();

    return () => {
      customerSubscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm, statusFilter, sortBy]);

  useEffect(() => {
    if (editingCustomer) {
      setBillingSameAsDelivery(editingCustomer.billing_same_as_delivery || false);
    }
  }, [editingCustomer]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="w-12 h-12 flex items-center justify-center bg-[#C04020] rounded-full mx-auto mb-4 animate-pulse">
          <i className="ri-user-line text-2xl text-white"></i>
        </div>
        <p className="text-lg font-medium text-gray-700">Lade Kunden...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4">
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
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#C04020] transition-colors"
                placeholder="Suche nach Name, E-Mail, Ort oder PLZ..."
              />
            </div>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors cursor-pointer pr-8"
            >
              <option value="all">Alle Kunden</option>
              <option value="active">Aktive Kunden</option>
              <option value="inactive">Inaktive Kunden</option>
              <option value="vip">VIP Kunden</option>
              <option value="deleted">Gelöschte Kunden</option>
            </select>
          </div>

          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors cursor-pointer pr-8"
            >
              <option value="newest">Neueste zuerst</option>
              <option value="oldest">Älteste zuerst</option>
              <option value="revenue_high">Umsatz absteigend</option>
              <option value="revenue_low">Umsatz aufsteigend</option>
              <option value="orders_high">Bestellungen absteigend</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowAddCustomerModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-user-add-line mr-2"></i>
              Neuer Kunde
            </button>
            <button
              onClick={exportCustomers}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-file-excel-line mr-2"></i>
              CSV Export
            </button>
            <button
              onClick={loadCustomers}
              className="bg-[#C04020] hover:bg-[#A03318] text-white py-3 px-4 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-refresh-line mr-2"></i>
              Aktualisieren
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="w-12 h-12 flex items-center justify-center bg-blue-100 rounded-lg mr-4">
              <i className="ri-user-line text-2xl text-blue-600"></i>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Gesamte Kunden</p>
              <p className="text-3xl font-black text-[#1A1A1A]">{customers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="w-12 h-12 flex items-center justify-center bg-green-100 rounded-lg mr-4">
              <i className="ri-user-star-line text-2xl text-green-600"></i>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Aktive Kunden</p>
              <p className="text-3xl font-black text-[#1A1A1A]">
                {customers.filter((customer) => {
                  const stats = calculateCustomerStats(customer);
                  return (
                    stats.totalOrders > 0 &&
                    stats.lastOrderDate &&
                    Date.now() - stats.lastOrderDate.getTime() <
                      90 * 24 * 60 * 60 * 1000
                  );
                }).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="w-12 h-12 flex items-center justify-center bg-purple-100 rounded-lg mr-4">
              <i className="ri-vip-crown-line text-2xl text-purple-600"></i>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">VIP Kunden</p>
              <p className="text-3xl font-black text-[#1A1A1A]">
                {customers.filter((customer) => {
                  const stats = calculateCustomerStats(customer);
                  return stats.totalSpent >= 1000 || stats.totalOrders >= 5;
                }).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="w-12 h-12 flex items-center justify-center bg-red-100 rounded-lg mr-4">
              <i className="ri-delete-bin-line text-2xl text-red-600"></i>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Gelöschte Kunden</p>
              <p className="text-3xl font-black text-[#1A1A1A]">
                {customers.filter((customer) => customer.is_deleted).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#1A1A1A)">
              Kunden ({filteredCustomers.length})
            </h2>
            <div className="text-sm text-gray-500">
              Gefiltert: {filteredCustomers.length} von {customers.length} Kunden
            </div>
          </div>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
              <i className="ri-user-line text-2xl text-gray-400"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              {customers.length === 0 ? 'Noch keine Kunden' : 'Keine Kunden gefunden'}
            </h3>
            <p className="text-gray-500">
              {customers.length === 0
                ? 'Kunden werden hier angezeigt, sobald sie bestellen.'
                : 'Versuchen Sie andere Suchkriterien oder Filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Kundennummer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Kunde
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Kontakt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Adresse
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Bestellungen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Gesamtumsatz
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Letzte Bestellung
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => {
                  const stats = calculateCustomerStats(customer);
                  const status = getCustomerStatus(customer);
                  return (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900">
                          {(() => {
                            // Verwende echte customer_number falls verfügbar, sonst generiere aus ID
                            if (customer.customer_number) {
                              return customer.customer_number;
                            } else if (customer.email) {
                              // Generiere konsistente Kundennummer aus Email
                              let hash = 0;
                              for (let i = 0; i < customer.email.length; i++) {
                                const char = customer.email.charCodeAt(i);
                                hash = ((hash << 5) - hash) + char;
                                hash = hash & hash;
                              }
                              const numericPart = Math.abs(hash) % 89999 + 10000;
                              return `KD-${String(numericPart).padStart(5, '0')}`;
                            } else if (customer.id) {
                              return `KD-${String(parseInt(customer.id.replace(/-/g, '').slice(-5), 16) % 99999 + 10000).padStart(5, '0')}`;
                            }
                            return '-';
                          })()} 
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className={`w-10 h-10 flex items-center justify-center rounded-full mr-3 ${
                              customer.is_deleted ? 'bg-gray-400' : 'bg-[#C04020]'
                            }`}
                          >
                            <span className="text-white font-bold text-sm">
                              {customer.first_name?.[0]}
                              {customer.last_name?.[0]}
                            </span>
                          </div>
                          <div>
                            <div
                              className={`text-sm font-medium ${
                                customer.is_deleted ? 'text-gray-500' : 'text-gray-900'
                              }`}
                            >
                              {customer.first_name} {customer.last_name}
                              {customer.is_deleted && (
                                <span className="text-xs text-red-600 ml-2">
                                  (Profil gelöscht)
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              Kunde seit {new Date(customer.created_at).toLocaleDateString('de-DE')}
                              {customer.deleted_at && (
                                <span className="text-red-500 ml-2">
                                  • Gelöscht am {new Date(customer.deleted_at).toLocaleDateString('de-DE')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-sm ${
                            customer.is_deleted ? 'text-gray-400' : 'text-gray-900'
                          }`}
                        >
                          {customer.is_deleted ? 'E-Mail gelöscht' : customer.email}
                        </div>
                        {customer.phone && !customer.is_deleted && (
                          <div className="text-sm text-gray-500">{customer.phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {customer.street} {customer.house_number}
                        </div>
                        <div className="text-sm text-gray-500">
                          {customer.postal_code} {customer.city}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${status.color}`}
                        >
                          {status.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-[#C04020]">{stats.totalOrders}</div>
                        <div className="text-sm text-gray-500">Bestellungen</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-[#C04020)">
                          €{stats.totalSpent.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">Gesamtumsatz</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {stats.lastOrderDate ? (
                          <div>
                            <div className="text-sm text-gray-900">
                              {stats.lastOrderDate.toLocaleDateString('de-DE')}
                            </div>
                            <div className="text-sm text-gray-500">
                              vor {Math.floor((Date.now() - stats.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))} Tagen
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">-</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {!customer.is_deleted ? (
                          <>
                            <button
                              onClick={() => viewCustomerDetails(customer.id)}
                              className="text-[#C04020] hover:text-[#A03318] cursor-pointer"
                              title="Kundendetails"
                            >
                              <i className="ri-eye-line"></i>
                            </button>
                            <button
                              onClick={() => setEditingCustomer(customer)}
                              className="text-blue-600 hover:text-blue-800 cursor-pointer"
                              title="Kunde bearbeiten"
                            >
                              <i className="ri-edit-line"></i>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => viewCustomerDetails(customer.id)}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            title="Kundendetails anzeigen"
                          >
                            <i className="ri-eye-line"></i>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (customer.is_deleted) {
                              if (
                                confirm(
                                  'Sind Sie sicher, dass Sie diesen Kunden endgültig aus der Datenbank löschen möchten? Dies löscht auch alle zugehörigen Bestellungen unwiderruflich.'
                                )
                              ) {
                                permanentDeleteCustomer(customer.id);
                              }
                            } else {
                              if (
                                confirm(
                                  'Sind Sie sicher, dass Sie diesen Kunden löschen möchten? Dies löscht auch alle zugehörigen Bestellungen.'
                                )
                              ) {
                                softDeleteCustomer(customer.id);
                              }
                            }
                          }}
                          className="text-red-600 hover:text-red-800 cursor-pointer"
                          title={customer.is_deleted ? 'Endgültig löschen' : 'Kunde löschen'}
                        >
                          <i className={customer.is_deleted ? 'ri-delete-bin-2-line' : 'ri-delete-bin-line'}></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#1A1A1A)">
                  Kundendetails - {selectedCustomer.first_name} {selectedCustomer.last_name}
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditingCustomer(selectedCustomer)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-edit-line mr-2"></i>
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <i className="ri-close-line text-2xl"></i>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  {selectedCustomer.is_deleted && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                      <h3 className="text-lg font-bold text-red-900 mb-4">
                        <i className="ri-alert-line mr-2"></i>
                        Gelöschtes Konto
                      </h3>
                      <div className="space-y-2 text-sm text-red-800">
                        <p>
                          Dieser Kunde hat sein Konto am{' '}
                          {new Date(selectedCustomer.deleted_at).toLocaleDateString('de-DE')} gelöscht.
                        </p>
                        <p>Persönliche Daten wurden anonymisiert.</p>
                        <p>Bestellhistorie bleibt für administrative Zwecke erhalten.</p>
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Grundinformationen</h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Name:</span>
                        <p className="text-gray-900">
                          {selectedCustomer.first_name} {selectedCustomer.last_name}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">E-Mail:</span>
                        <p className="text-gray-900">
                          {selectedCustomer.is_deleted ? 'E-Mail gelöscht' : selectedCustomer.email}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Telefon:</span>
                        <p className="text-gray-900">
                          {selectedCustomer.is_deleted ? '-' : selectedCustomer.phone || '-'}
                        </p>
                      </div>
                      {!selectedCustomer.is_deleted && (
                        <div>
                          <span className="font-medium text-gray-700">Lieferadresse:</span>
                          <p className="text-gray-900">
                            {selectedCustomer.street} {selectedCustomer.house_number}
                            <br />
                            {selectedCustomer.postal_code} {selectedCustomer.city}
                          </p>
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-gray-700">Registriert am:</span>
                        <p className="text-gray-900">
                          {new Date(selectedCustomer.created_at).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                      {selectedCustomer.date_of_birth && !selectedCustomer.is_deleted && (
                        <div>
                          <span className="font-medium text-gray-700">Geburtsdatum:</span>
                          <p className="text-gray-900">
                            {new Date(selectedCustomer.date_of_birth).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-orange-50 rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-bold text-orange-900 mb-4">Rechnungsadresse</h3>
                    <div className="space-y-3 text-sm">
                      {selectedCustomer.billing_same_as_delivery ? (
                        <p className="text-orange-700 font-medium">
                          <i className="ri-check-line mr-2"></i>
                          Gleich der Lieferadresse
                        </p>
                      ) : (
                        <>
                          {selectedCustomer.billing_company && (
                            <div>
                              <span className="font-medium text-orange-700">Firma:</span>
                              <p className="text-orange-900">{selectedCustomer.billing_company}</p>
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-orange-700">Name:</span>
                            <p className="text-orange-900">
                              {selectedCustomer.billing_first_name} {selectedCustomer.billing_last_name}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-orange-700">Adresse:</span>
                            <p className="text-orange-900">
                              {selectedCustomer.billing_street} {selectedCustomer.billing_house_number}
                              <br />
                              {selectedCustomer.billing_postal_code} {selectedCustomer.billing_city}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-blue-900 mb-4">Kundenstatistiken</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Bestellungen gesamt:</span>
                        <span className="font-bold text-blue-900">
                          {selectedCustomer.orders?.length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Gesamtumsatz:</span>
                        <span className="font-bold text-blue-900">
                          €
                          {(selectedCustomer.orders || [])
                            .reduce((sum, order) => sum + parseFloat(order.total_amount), 0)
                            .toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Durchschnittlicher Bestellwert:</span>
                        <span className="font-bold text-blue-900">
                          €
                          {(selectedCustomer.orders || []).length > 0
                            ? (
                                (selectedCustomer.orders || []).reduce(
                                  (sum, order) => sum + parseFloat(order.total_amount),
                                  0
                                ) / (selectedCustomer.orders || []).length
                              ).toFixed(2)
                            : '0.00'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Bestellhistorie</h3>

                  {selectedCustomer.orders?.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
                        <i className="ri-shopping-bag-line text-2xl text-gray-400"></i>
                      </div>
                      <p className="text-gray-500">Dieser Kunde hat noch keine Bestellungen</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedCustomer.orders?.map((order) => (
                        <div
                          key={order.id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-bold text-[#1A1A1A]">#{order.order_number}</h4>
                              <p className="text-sm text-gray-600">
                                {new Date(order.created_at).toLocaleDateString('de-DE')} •
                                {order.payment_method === 'cash' ? 'Barzahlung' : order.payment_method}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-[#C04020]">
                                €{parseFloat(String(order.total_amount)).toFixed(2)}
                              </div>
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${getStatusColor(
                                  order.status
                                )}`}
                              >
                                {getStatusText(order.status)}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div className="bg-green-50 rounded p-3">
                              <h6 className="font-medium text-green-800 mb-2">Lieferadresse:</h6>
                              <div className="text-sm text-green-700">
                                <p>{order.delivery_first_name} {order.delivery_last_name}</p>
                                <p>{order.delivery_street} {order.delivery_house_number}</p>
                                <p>{order.delivery_postal_code} {order.delivery_city}</p>
                                {order.delivery_phone && <p>Tel: {order.delivery_phone}</p>}
                              </div>
                            </div>
                            <div className="bg-orange-50 rounded p-3">
                              <h6 className="font-medium text-orange-800 mb-2">Rechnungsadresse:</h6>
                              <div className="text-sm text-orange-700">
                                {order.billing_same_as_delivery ? (
                                  <p className="italic">Gleich der Lieferadresse</p>
                                ) : (
                                  <>
                                    {order.billing_company && <p>Firma: {order.billing_company}</p>}
                                    <p>{order.billing_first_name} {order.billing_last_name}</p>
                                    <p>{order.billing_street} {order.billing_house_number}</p>
                                    <p>{order.billing_postal_code} {order.billing_city}</p>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded-lg p-3">
                            <h5 className="font-medium text-gray-700 mb-2">Bestellpositionen:</h5>
                            <div className="space-y-1">
                              {order.order_items?.map((item: OrderItem, index: number) => (
                                <div
                                  key={index}
                                  className="flex justify-between text-sm"
                                >
                                  <span>
                                    {item.product_name} × {item.quantity}
                                  </span>
                                  <span className="font-medium">
                                    €{parseFloat(String(item.total_price)).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {editingCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-[#1A1A1A]">Kunde bearbeiten</h2>
                  <button
                    onClick={() => setEditingCustomer(null)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <i className="ri-close-line text-2xl"></i>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <form
              onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                const form = e.currentTarget;
                const formData = new FormData(form);
                const data: Record<string, any> = {};
                
                // Process form data with proper type handling
                formData.forEach((value, key) => {
                  data[key] = value;
                });
                
                data.billing_same_as_delivery = formData.get('billing_same_as_delivery') === 'on';
                updateCustomer(editingCustomer.id, data);
              }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Grundinformationen</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kundennummer</label>
                    <input
                      type="text"
                      value={editingCustomer.id ? `KD-${String(parseInt(editingCustomer.id.replace(/-/g, '').slice(-5), 16) % 99999 + 10000).padStart(5, '0')}` : '-'}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-600 font-mono"
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vorname</label>
                    <input
                      type="text"
                      name="first_name"
                      defaultValue={editingCustomer.first_name}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nachname</label>
                    <input
                      type="text"
                      name="last_name"
                      defaultValue={editingCustomer.last_name}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">E-Mail</label>
                    <input
                      type="email"
                      name="email"
                      defaultValue={editingCustomer.email}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                    <input
                      type="tel"
                      name="phone"
                      defaultValue={editingCustomer.phone}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Firmenname (optional)</label>
                    <input
                      type="text"
                      name="company"
                      defaultValue={editingCustomer.company}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors"
                      placeholder="Firmenname eingeben..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Geburtsdatum</label>
                    <input
                      type="date"
                      name="date_of_birth"
                      defaultValue={editingCustomer.date_of_birth}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Land</label>
                    <select
                      name="country"
                      defaultValue={editingCustomer.country || 'Deutschland'}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors"
                    >
                      <option value="Deutschland">Deutschland</option>
                      <option value="Österreich">Österreich</option>
                      <option value="Schweiz">Schweiz</option>
                      <option value="Andere">Andere</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bevorzugter Liefermonat</label>
                    <select
                      name="preferred_delivery_month"
                      defaultValue={editingCustomer.preferred_delivery_month || ''}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors"
                    >
                      <option value="">Keine Präferenz</option>
                      <option value="Januar">Januar</option>
                      <option value="Februar">Februar</option>
                      <option value="März">März</option>
                      <option value="April">April</option>
                      <option value="Mai">Mai</option>
                      <option value="Juni">Juni</option>
                      <option value="Juli">Juli</option>
                      <option value="August">August</option>
                      <option value="September">September</option>
                      <option value="Oktober">Oktober</option>
                      <option value="November">November</option>
                      <option value="Dezember">Dezember</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bevorzugtes Lieferjahr</label>
                    <select
                      name="preferred_delivery_year"
                      defaultValue={editingCustomer.preferred_delivery_year || new Date().getFullYear().toString()}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors"
                    >
                      <option value={new Date().getFullYear().toString()}>{new Date().getFullYear()}</option>
                      <option value={(new Date().getFullYear() + 1).toString()}>{new Date().getFullYear() + 1}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Lieferadresse</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Straße</label>
                    <input
                      type="text"
                      name="street"
                      defaultValue={editingCustomer.street}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hausnummer</label>
                    <input
                      type="text"
                      name="house_number"
                      defaultValue={editingCustomer.house_number}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Postleitzahl</label>
                    <input
                      type="text"
                      name="postal_code"
                      defaultValue={editingCustomer.postal_code}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Stadt</label>
                    <input
                      type="text"
                      name="city"
                      defaultValue={editingCustomer.city}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Rechnungsadresse</h3>

                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="billing_same_as_delivery"
                      checked={billingSameAsDelivery}
                      onChange={(e) => setBillingSameAsDelivery(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Rechnungsadresse gleich Lieferadresse
                    </span>
                  </label>
                </div>

                {!billingSameAsDelivery && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Firma (optional)</label>
                      <input
                        type="text"
                        name="billing_company"
                        defaultValue={editingCustomer.billing_company}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Vorname</label>
                      <input
                        type="text"
                        name="billing_first_name"
                        defaultValue={editingCustomer.billing_first_name}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nachname</label>
                      <input
                        type="text"
                        name="billing_last_name"
                        defaultValue={editingCustomer.billing_last_name}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Straße</label>
                      <input
                        type="text"
                        name="billing_street"
                        defaultValue={editingCustomer.billing_street}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hausnummer</label>
                      <input
                        type="text"
                        name="billing_house_number"
                        defaultValue={editingCustomer.billing_house_number}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Postleitzahl</label>
                      <input
                        type="text"
                        name="billing_postal_code"
                        defaultValue={editingCustomer.billing_postal_code}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Stadt</label>
                      <input
                        type="text"
                        name="billing_city"
                        defaultValue={editingCustomer.billing_city}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
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
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Neuen Kunden anlegen</h3>
                  <button
                    onClick={() => setShowAddCustomerModal(false)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <i className="ri-close-line text-2xl"></i>
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <form onSubmit={createCustomer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kundennummer
                  </label>
                  <input
                    type="text"
                    value={newCustomerData.email ? `KD-${String(Math.abs(newCustomerData.email.split('').reduce((a: number, b: string) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0)) % 89999 + 10000).padStart(5, '0')}` : 'Wird automatisch generiert'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    readOnly
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vorname *
                  </label>
                  <input
                    type="text"
                    value={newCustomerData.first_name}
                    onChange={(e) => setNewCustomerData({...newCustomerData, first_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nachname *
                  </label>
                  <input
                    type="text"
                    value={newCustomerData.last_name}
                    onChange={(e) => setNewCustomerData({...newCustomerData, last_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-Mail *
                </label>
                <input
                  type="email"
                  value={newCustomerData.email}
                  onChange={(e) => setNewCustomerData({...newCustomerData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={newCustomerData.phone}
                  onChange={(e) => setNewCustomerData({...newCustomerData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Firmenname (optional)
                </label>
                <input
                  type="text"
                  value={newCustomerData.company || ''}
                  onChange={(e) => setNewCustomerData({...newCustomerData, company: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Firmenname eingeben..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Straße
                  </label>
                  <input
                    type="text"
                    value={newCustomerData.street}
                    onChange={(e) => setNewCustomerData({...newCustomerData, street: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hausnummer
                  </label>
                  <input
                    type="text"
                    value={newCustomerData.house_number}
                    onChange={(e) => setNewCustomerData({...newCustomerData, house_number: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PLZ
                  </label>
                  <input
                    type="text"
                    value={newCustomerData.postal_code}
                    onChange={(e) => setNewCustomerData({...newCustomerData, postal_code: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stadt
                  </label>
                  <input
                    type="text"
                    value={newCustomerData.city}
                    onChange={(e) => setNewCustomerData({...newCustomerData, city: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Geburtsdatum
                  </label>
                  <input
                    type="date"
                    value={newCustomerData.date_of_birth}
                    onChange={(e) => setNewCustomerData({...newCustomerData, date_of_birth: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Land
                  </label>
                  <select
                    value={newCustomerData.country}
                    onChange={(e) => setNewCustomerData({...newCustomerData, country: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Deutschland">Deutschland</option>
                    <option value="Österreich">Österreich</option>
                    <option value="Schweiz">Schweiz</option>
                    <option value="Andere">Andere</option>
                  </select>
                </div>
              </div>

              <div>
                <h4 className="text-md font-semibold text-gray-800 mb-3">Lieferpräferenzen</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bevorzugter Liefermonat
                    </label>
                    <select
                      value={newCustomerData.preferred_delivery_month}
                      onChange={(e) => setNewCustomerData({...newCustomerData, preferred_delivery_month: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Kein Präferenz</option>
                      <option value="Januar">Januar</option>
                      <option value="Februar">Februar</option>
                      <option value="März">März</option>
                      <option value="April">April</option>
                      <option value="Mai">Mai</option>
                      <option value="Juni">Juni</option>
                      <option value="Juli">Juli</option>
                      <option value="August">August</option>
                      <option value="September">September</option>
                      <option value="Oktober">Oktober</option>
                      <option value="November">November</option>
                      <option value="Dezember">Dezember</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bevorzugtes Lieferjahr
                    </label>
                    <select
                      value={newCustomerData.preferred_delivery_year}
                      onChange={(e) => setNewCustomerData({...newCustomerData, preferred_delivery_year: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={new Date().getFullYear().toString()}>{new Date().getFullYear()}</option>
                      <option value={(new Date().getFullYear() + 1).toString()}>{new Date().getFullYear() + 1}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-semibold text-gray-800 mb-3">Rechnungsadresse</h4>
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newCustomerData.billing_same_as_delivery}
                      onChange={(e) => setNewCustomerData({...newCustomerData, billing_same_as_delivery: e.target.checked})}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Rechnungsadresse ist identisch mit Lieferadresse</span>
                  </label>
                </div>

                {!newCustomerData.billing_same_as_delivery && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Firma (optional)
                      </label>
                      <input
                        type="text"
                        value={newCustomerData.billing_company}
                        onChange={(e) => setNewCustomerData({...newCustomerData, billing_company: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Vorname
                        </label>
                        <input
                          type="text"
                          value={newCustomerData.billing_first_name}
                          onChange={(e) => setNewCustomerData({...newCustomerData, billing_first_name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nachname
                        </label>
                        <input
                          type="text"
                          value={newCustomerData.billing_last_name}
                          onChange={(e) => setNewCustomerData({...newCustomerData, billing_last_name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Straße
                        </label>
                        <input
                          type="text"
                          value={newCustomerData.billing_street}
                          onChange={(e) => setNewCustomerData({...newCustomerData, billing_street: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Hausnummer
                        </label>
                        <input
                          type="text"
                          value={newCustomerData.billing_house_number}
                          onChange={(e) => setNewCustomerData({...newCustomerData, billing_house_number: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          PLZ
                        </label>
                        <input
                          type="text"
                          value={newCustomerData.billing_postal_code}
                          onChange={(e) => setNewCustomerData({...newCustomerData, billing_postal_code: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Stadt
                        </label>
                        <input
                          type="text"
                          value={newCustomerData.billing_city}
                          onChange={(e) => setNewCustomerData({...newCustomerData, billing_city: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Kunde erstellen
                </button>
              </div>
            </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
