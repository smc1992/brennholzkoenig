'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface InvoiceTabProps {
  onStatsUpdate?: () => Promise<void>;
}

interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  customer_id: string;
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
  orders?: {
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
  };
  customers?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
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
}

export default function InvoiceTab({ onStatsUpdate }: InvoiceTabProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    loadInvoices();
    loadOrdersWithoutInvoice();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, statusFilter, searchTerm]);

  const loadInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          orders (
            id,
            order_number,
            delivery_first_name,
            delivery_last_name,
            delivery_email,
            delivery_phone,
            delivery_street,
            delivery_house_number,
            delivery_postal_code,
            delivery_city,
            total_amount
          ),
          customers (
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fehler beim Laden der Rechnungen:', error);
        return;
      }

      setInvoices(data || []);
    } catch (error) {
      console.error('Fehler beim Laden der Rechnungen:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrdersWithoutInvoice = async () => {
    try {
      const { data, error } = await supabase
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
        .not('id', 'in', `(${invoices.map(inv => `'${inv.order_id}'`).join(',') || "''"})`)
        .eq('status', 'delivered')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fehler beim Laden der Bestellungen:', error);
        return;
      }

      setOrders(data || []);
    } catch (error) {
      console.error('Fehler beim Laden der Bestellungen:', error);
    }
  };

  const filterInvoices = () => {
    let filtered = invoices;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(invoice => 
        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.orders?.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${invoice.orders?.delivery_first_name} ${invoice.orders?.delivery_last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.orders?.delivery_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredInvoices(filtered);
  };

  const createInvoiceFromOrder = async (order: Order) => {
    setIsCreating(true);
    try {
      // Rechnungsnummer generieren
      const invoiceNumber = `RG-${Date.now()}`;
      
      // Steuerberechnung
      const subtotal = parseFloat(order.subtotal_amount || '0');
      const taxRate = 19; // 19% MwSt
      const taxAmount = (subtotal * taxRate) / 100;
      const totalAmount = subtotal + taxAmount;

      // Rechnung erstellen
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          order_id: order.id,
          customer_id: null, // Wird aus der Bestellung übernommen
          subtotal_amount: subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          status: 'draft'
        })
        .select()
        .single();

      if (invoiceError) {
        console.error('Fehler beim Erstellen der Rechnung:', invoiceError);
        alert('Fehler beim Erstellen der Rechnung');
        return;
      }

      // Rechnungspositionen erstellen
      if (order.order_items && order.order_items.length > 0) {
        const invoiceItems = order.order_items.map(item => ({
          invoice_id: invoice.id,
          description: item.product_name,
          quantity: item.quantity,
          unit_price: parseFloat(item.unit_price),
          total_price: parseFloat(item.total_price),
          tax_rate: taxRate
        }));

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(invoiceItems);

        if (itemsError) {
          console.error('Fehler beim Erstellen der Rechnungspositionen:', itemsError);
        }
      }

      // Listen aktualisieren
      await loadInvoices();
      await loadOrdersWithoutInvoice();
      setShowCreateModal(false);
      
      if (onStatsUpdate) {
        await onStatsUpdate();
      }

      alert('Rechnung erfolgreich erstellt!');
    } catch (error) {
      console.error('Fehler beim Erstellen der Rechnung:', error);
      alert('Fehler beim Erstellen der Rechnung');
    } finally {
      setIsCreating(false);
    }
  };

  const updateInvoiceStatus = async (invoiceId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', invoiceId);

      if (error) {
        console.error('Fehler beim Aktualisieren des Status:', error);
        return;
      }

      await loadInvoices();
      if (onStatsUpdate) {
        await onStatsUpdate();
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Status:', error);
    }
  };

  const generatePDF = async (invoice: Invoice) => {
    try {
      // Rechnungseinstellungen laden
      const { data: settings, error: settingsError } = await supabase
        .from('invoice_settings')
        .select('*')
        .single();

      if (settingsError) {
        console.error('Fehler beim Laden der Einstellungen:', settingsError);
        alert('Fehler beim Laden der Rechnungseinstellungen');
        return;
      }

      // Rechnungspositionen laden
      const { data: items, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoice.id);

      if (itemsError) {
        console.error('Fehler beim Laden der Rechnungspositionen:', itemsError);
        alert('Fehler beim Laden der Rechnungspositionen');
        return;
      }

      // PDF-Daten vorbereiten
      const invoiceData = {
        invoice_number: invoice.invoice_number,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        customer: {
          name: `${invoice.orders?.delivery_first_name || ''} ${invoice.orders?.delivery_last_name || ''}`.trim(),
          email: invoice.orders?.delivery_email || '',
          phone: invoice.orders?.delivery_phone,
          address: {
            street: invoice.orders?.delivery_street || '',
            house_number: invoice.orders?.delivery_house_number || '',
            postal_code: invoice.orders?.delivery_postal_code || '',
            city: invoice.orders?.delivery_city || ''
          }
        },
        items: items?.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: parseFloat(item.unit_price),
          total_price: parseFloat(item.total_price)
        })) || [],
        subtotal_amount: parseFloat(invoice.subtotal_amount),
        tax_amount: parseFloat(invoice.tax_amount),
        total_amount: parseFloat(invoice.total_amount),
        tax_rate: 19, // Standard MwSt-Satz
        payment_terms: invoice.payment_terms,
        notes: invoice.notes
      };

      const companySettings = {
        company_name: settings.company_name,
        company_address_line1: settings.company_address_line1,
        company_address_line2: settings.company_address_line2,
        company_postal_code: settings.company_postal_code,
        company_city: settings.company_city,
        company_phone: settings.company_phone,
        company_email: settings.company_email,
        company_website: settings.company_website,
        tax_id: settings.tax_id,
        bank_name: settings.bank_name,
        bank_iban: settings.bank_iban,
        bank_bic: settings.bank_bic,
        invoice_footer_text: settings.invoice_footer_text
      };

      // PDF generieren und herunterladen
      const { InvoicePDFGenerator } = await import('@/lib/pdfGenerator');
      await InvoicePDFGenerator.downloadInvoicePDF(
        invoiceData,
        companySettings,
        `Rechnung_${invoice.invoice_number}.pdf`
      );

    } catch (error) {
      console.error('Fehler bei der PDF-Generierung:', error);
      alert('Fehler bei der PDF-Generierung');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Entwurf';
      case 'sent': return 'Versendet';
      case 'paid': return 'Bezahlt';
      case 'overdue': return 'Überfällig';
      case 'cancelled': return 'Storniert';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rechnungen</h2>
          <p className="text-gray-600">Verwalten Sie Rechnungen und erstellen Sie neue aus Bestellungen</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
        >
          <i className="ri-add-line mr-2"></i>
          Rechnung erstellen
        </button>
      </div>

      {/* Filter und Suche */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Suchen nach Rechnungsnummer, Bestellnummer, Kunde..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        >
          <option value="all">Alle Status</option>
          <option value="draft">Entwurf</option>
          <option value="sent">Versendet</option>
          <option value="paid">Bezahlt</option>
          <option value="overdue">Überfällig</option>
          <option value="cancelled">Storniert</option>
        </select>
      </div>

      {/* Rechnungsliste */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rechnungsnummer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bestellung
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kunde
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Datum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Betrag
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {invoice.invoice_number}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {invoice.orders?.order_number || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {invoice.orders?.delivery_first_name} {invoice.orders?.delivery_last_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {invoice.orders?.delivery_email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(invoice.invoice_date).toLocaleDateString('de-DE')}
                    </div>
                    <div className="text-sm text-gray-500">
                      Fällig: {new Date(invoice.due_date).toLocaleDateString('de-DE')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      €{parseFloat(invoice.total_amount).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                      {getStatusText(invoice.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => {
                        setSelectedInvoice(invoice);
                        setShowInvoiceModal(true);
                      }}
                      className="text-amber-600 hover:text-amber-900"
                    >
                      <i className="ri-eye-line"></i>
                    </button>
                    <button
                      onClick={() => generatePDF(invoice)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <i className="ri-download-line"></i>
                    </button>
                    {invoice.status === 'draft' && (
                      <button
                        onClick={() => updateInvoiceStatus(invoice.id, 'sent')}
                        className="text-green-600 hover:text-green-900"
                      >
                        <i className="ri-send-plane-line"></i>
                      </button>
                    )}
                    {invoice.status === 'sent' && (
                      <button
                        onClick={() => updateInvoiceStatus(invoice.id, 'paid')}
                        className="text-green-600 hover:text-green-900"
                      >
                        <i className="ri-check-line"></i>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredInvoices.length === 0 && (
          <div className="text-center py-12">
            <i className="ri-file-list-3-line text-4xl text-gray-400 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Rechnungen gefunden</h3>
            <p className="text-gray-500">Erstellen Sie Ihre erste Rechnung aus einer Bestellung.</p>
          </div>
        )}
      </div>

      {/* Modal für Rechnung erstellen */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Rechnung aus Bestellung erstellen</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Bestellungen ohne Rechnung:</h4>
                {orders.length === 0 ? (
                  <p className="text-gray-500">Keine Bestellungen ohne Rechnung gefunden.</p>
                ) : (
                  <div className="space-y-2">
                    {orders.map((order) => (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-medium text-gray-900">{order.order_number}</h5>
                            <p className="text-sm text-gray-600">
                              {order.delivery_first_name} {order.delivery_last_name}
                            </p>
                            <p className="text-sm text-gray-500">{order.delivery_email}</p>
                            <p className="text-sm text-gray-500">
                              Bestellt am: {new Date(order.created_at).toLocaleDateString('de-DE')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">€{parseFloat(order.total_amount).toFixed(2)}</p>
                            <button
                              onClick={() => createInvoiceFromOrder(order)}
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal für Rechnungsdetails */}
      {showInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Rechnungsdetails</h3>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rechnungsnummer</label>
                    <p className="text-sm text-gray-900">{selectedInvoice.invoice_number}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedInvoice.status)}`}>
                      {getStatusText(selectedInvoice.status)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rechnungsdatum</label>
                    <p className="text-sm text-gray-900">{new Date(selectedInvoice.invoice_date).toLocaleDateString('de-DE')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fälligkeitsdatum</label>
                    <p className="text-sm text-gray-900">{new Date(selectedInvoice.due_date).toLocaleDateString('de-DE')}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kunde</label>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium">{selectedInvoice.orders?.delivery_first_name} {selectedInvoice.orders?.delivery_last_name}</p>
                    <p className="text-sm text-gray-600">{selectedInvoice.orders?.delivery_email}</p>
                    <p className="text-sm text-gray-600">{selectedInvoice.orders?.delivery_phone}</p>
                    <p className="text-sm text-gray-600">
                      {selectedInvoice.orders?.delivery_street} {selectedInvoice.orders?.delivery_house_number}<br/>
                      {selectedInvoice.orders?.delivery_postal_code} {selectedInvoice.orders?.delivery_city}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Beträge</label>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>Nettobetrag:</span>
                      <span>€{parseFloat(selectedInvoice.subtotal_amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>MwSt. (19%):</span>
                      <span>€{parseFloat(selectedInvoice.tax_amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-2">
                      <span>Gesamtbetrag:</span>
                      <span>€{parseFloat(selectedInvoice.total_amount).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {selectedInvoice.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notizen</label>
                    <p className="text-sm text-gray-900">{selectedInvoice.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => generatePDF(selectedInvoice)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <i className="ri-download-line mr-2"></i>
                  PDF herunterladen
                </button>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}