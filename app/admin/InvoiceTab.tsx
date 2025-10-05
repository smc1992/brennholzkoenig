'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import InvoicePreview from './InvoicePreview';
import TaxSettingsModal from './TaxSettingsModal';

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
  // Nutze absolute Origin für API-Calls, um Port/Protocol-Mismatches zu vermeiden
  const api = (path: string) => {
    const origin = typeof window !== 'undefined'
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_SITE_URL || '');
    return `${origin}${path}`;
  };

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
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [previewOrderId, setPreviewOrderId] = useState<string | null>(null);
  const [previewInvoiceId, setPreviewInvoiceId] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [showTaxSettings, setShowTaxSettings] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    if (invoices.length >= 0) { // Auch bei 0 Rechnungen laden
      loadOrdersWithoutInvoice();
    }
  }, [invoices]);

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
      console.log('🔄 Loading orders without invoice...', {
        invoices_count: invoices.length,
        existing_order_ids: invoices.map(inv => inv.order_id)
      });
      
      // Erst alle Bestellungen laden
      const { data: allOrders, error: allOrdersError } = await supabase
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
        
      if (allOrdersError) {
        console.error('❌ Error loading all orders:', allOrdersError);
        return;
      }
      
      console.log('📦 All orders loaded:', allOrders?.length || 0);
      
      // Dann filtern: Bestellungen ohne Rechnung
      const existingInvoiceOrderIds = invoices.map(inv => inv.order_id);
      const ordersWithoutInvoice = (allOrders || []).filter((order: any) => 
        !existingInvoiceOrderIds.includes(order.id)
      );
      
      console.log('✅ Orders without invoice:', {
        total_orders: allOrders?.length || 0,
        existing_invoices: existingInvoiceOrderIds.length,
        orders_without_invoice: ordersWithoutInvoice.length,
        filtered_orders: ordersWithoutInvoice.map((o: any) => ({ id: o.id, order_number: o.order_number, status: o.status }))
      });
      
      setOrders(ordersWithoutInvoice);
      
      // Fallback: Wenn keine Bestellungen gefunden werden, aber es sollte welche geben
      if (ordersWithoutInvoice.length === 0 && allOrders && allOrders.length > 0) {
        console.log('⚠️ No orders without invoice found, but orders exist. Using all orders as fallback.');
        setOrders(allOrders);
      }
      
    } catch (error) {
      console.error('💥 Error loading orders without invoice:', error);
      
      // Fallback: Lade alle Bestellungen bei Fehler
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
          console.log('🔄 Using fallback: loaded all orders:', fallbackOrders.length);
          setOrders(fallbackOrders);
        }
      } catch (fallbackError) {
        console.error('💥 Fallback also failed:', fallbackError);
      }
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
      // Verwende die invoice-builder API um korrekte Steuerberechnung zu erhalten
      const response = await fetch(api('/api/invoice-builder'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          templateId: 'invoice',
          saveToFile: false
        })
      });

      if (!response.ok) {
        throw new Error('Fehler bei der Steuerberechnung');
      }

      // Rechnungsnummer generieren
      const invoiceNumber = `RG-${Date.now()}`;
      
      // Lade die korrekt berechneten Summen aus der invoice-builder Route
      // Dazu müssen wir die loadInvoiceData Funktion direkt aufrufen
      const invoiceResponse = await fetch(api(`/api/invoice-builder?orderId=${order.id}`));
      const invoiceData = await invoiceResponse.json();
      
      const subtotal = invoiceData.subtotal_amount || 0;
      const taxAmount = invoiceData.tax_amount || 0;
      const totalAmount = invoiceData.total_amount || 0;

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
          tax_rate: 19 // 19% MwSt
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

  const testPDFGeneration = async () => {
    try {
      console.log('🧪 Testing modern PDF generation with Puppeteer');
      
      // Verwende echte Bestellungen für Tests
      if (orders.length === 0) {
        alert('Keine Bestellungen zum Testen verfügbar. Erstellen Sie zuerst eine Bestellung.');
        return;
      }
      
      const testOrder = orders[0];
      console.log('Using order for test:', testOrder.order_number);
      
      const response = await fetch('/api/invoice-builder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          orderId: testOrder.id,
          templateId: 'invoice',
          saveToFile: false
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `test-rechnung-${testOrder.order_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('✅ Test PDF generation successful');
      alert('Test PDF wurde erfolgreich generiert!');
    } catch (error) {
      console.error('❌ Test PDF generation failed:', error);
      alert(`Test PDF Fehler: ${error}`);
    }
  };

  const generatePDF = async (invoice: Invoice) => {
    setIsGeneratingPDF(true);
    try {
      console.log('Generating PDF for invoice:', invoice.invoice_number, 'ID:', invoice.id);
      const apiUrl = api('/api/invoice-builder');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          orderId: invoice.order_id, // Verwende order_id um die Bestellung zu laden
          templateId: 'invoice',
          saveToFile: false
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response from', apiUrl, ':', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        throw new Error(`PDF generation failed: ${errorData.details || errorData.error || response.statusText}`);
      }

      const blob = await response.blob();
      const fileUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = fileUrl;
      a.download = `rechnung-${invoice.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(fileUrl);
      document.body.removeChild(a);

      alert('PDF erfolgreich generiert!');
    } catch (error) {
      console.error('PDF generation error:', error);
      alert(`Fehler beim Generieren der PDF: ${error instanceof Error ? error.message : error}`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const showPreview = async (invoice: Invoice) => {
    try {
      const response = await fetch(api(`/api/invoice-builder?action=preview&invoiceId=${invoice.id}&templateId=default`));
      
      if (!response.ok) {
        throw new Error('Preview generation failed');
      }
      
      const html = await response.text();
      setPreviewHtml(html);
      setPreviewInvoice(invoice);
      setShowPreviewModal(true);
    } catch (error) {
      console.error('Preview error:', error);
      alert('Fehler beim Laden der Vorschau');
    }
  };

  const generateFromOrder = async (order: Order) => {
    setIsCreating(true);
    try {
      // Generiere Rechnungsnummer
      const invoiceNumber = `RG-${Date.now()}`;
      
      console.log('🔄 Creating invoice for order:', order.order_number);
      
      // Erstelle Rechnung direkt (umgeht RLS-Probleme)
      const directResponse = await fetch(api('/api/create-invoice-direct'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          orderData: order,
          invoiceNumber: invoiceNumber
        }),
      });

      if (!directResponse.ok) {
        const errorText = await directResponse.text();
        console.error('Direct API Error Response:', errorText);
        throw new Error('Direct invoice creation failed');
      }

      const directResult = await directResponse.json();
      
      if (directResult.success) {
        console.log('✅ Invoice created:', directResult.invoice);
        
        // Versuche auch PDF zu generieren (optional)
        try {
          const pdfResponse = await fetch(api('/api/invoice-builder'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              invoiceId: directResult.invoice.id,
              templateId: 'invoice',
              saveToFile: true
            }),
          });
          
          if (pdfResponse.ok) {
            console.log('✅ PDF also generated successfully');
          } else {
            console.log('⚠️ PDF generation failed, but invoice created');
          }
        } catch (pdfError) {
          console.log('⚠️ PDF generation error:', pdfError);
        }
        
        alert(`Rechnung erfolgreich erstellt! Rechnungsnummer: ${directResult.invoice.invoice_number}`);
        
        // Schließe das Modal
        setShowCreateModal(false);
        
        // Aktualisiere die Rechnungsliste
        await loadInvoices();
        
        // Aktualisiere auch die Bestellungsliste
        await loadOrdersWithoutInvoice();
        
        // Aktualisiere Statistiken falls verfügbar
        if (onStatsUpdate) {
          await onStatsUpdate();
        }
      } else {
        throw new Error('Direct invoice creation failed');
      }
    } catch (error) {
      console.error('Invoice generation error:', error);
      alert(`Fehler beim Erstellen der Rechnung: ${error instanceof Error ? error.message : error}`);
    } finally {
      setIsCreating(false);
    }
  };

  const deleteInvoice = async (invoice: Invoice) => {
    const confirmDelete = confirm(
      `Sind Sie sicher, dass Sie die Rechnung ${invoice.invoice_number} löschen möchten?\n\nDiese Aktion kann nicht rückgängig gemacht werden.`
    );
    
    if (!confirmDelete) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoice.id);
      
      if (error) {
        throw error;
      }
      
      // Lösche auch die PDF-Datei falls vorhanden
      if (invoice.pdf_path) {
        try {
          await supabase.storage
            .from('documents')
            .remove([invoice.pdf_path]);
        } catch (storageError) {
          console.warn('PDF file could not be deleted:', storageError);
        }
      }
      
      alert('Rechnung erfolgreich gelöscht!');
      
      // Aktualisiere die Rechnungsliste
      await loadInvoices();
      
      // Aktualisiere Statistiken falls verfügbar
      if (onStatsUpdate) {
        await onStatsUpdate();
      }
    } catch (error) {
      console.error('Delete invoice error:', error);
      alert(`Fehler beim Löschen der Rechnung: ${error instanceof Error ? error.message : error}`);
    }
  };



  // HTML-Preview Funktion
  const previewHTML = async (invoice: Invoice) => {
    try {
      // HTML-Preview in neuem Tab öffnen (verwende invoice_number statt id)
      const url = `/api/invoices/${invoice.invoice_number}?format=html`;
      window.open(url, '_blank');
      
      console.log('✅ HTML preview opened successfully');
    } catch (error) {
      console.error('💥 HTML preview failed:', error);
      alert('Fehler beim Öffnen der HTML-Vorschau');
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
        <div className="flex gap-2">
          <button
            onClick={() => setShowTaxSettings(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            title="Steuereinstellungen verwalten"
          >
            <i className="ri-settings-3-line mr-2"></i>
            Steuereinstellungen
          </button>
          <button
            onClick={testPDFGeneration}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            title="Test PDF-Generierung mit Puppeteer"
          >
            <i className="ri-file-pdf-line mr-2"></i>
            Test PDF
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
          >
            <i className="ri-add-line mr-2"></i>
            Rechnung erstellen
          </button>
        </div>
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
                        setPreviewInvoiceId(invoice.id);
                        setPreviewOrderId(null);
                        setShowInvoicePreview(true);
                      }}
                      className="text-green-600 hover:text-green-900"
                      title="Vorschau anzeigen"
                    >
                      <i className="ri-eye-line"></i>
                    </button>
                    <button
                      onClick={() => generatePDF(invoice)}
                      disabled={isGeneratingPDF}
                      className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                      title="PDF herunterladen"
                    >
                      <i className="ri-download-line"></i>
                    </button>
                    <button
                      onClick={() => previewHTML(invoice)}
                      className="text-green-600 hover:text-green-900"
                      title="HTML-Vorschau öffnen"
                    >
                      <i className="ri-external-link-line"></i>
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
                        title="Als bezahlt markieren"
                      >
                        <i className="ri-check-line"></i>
                      </button>
                    )}
                    <button
                      onClick={() => deleteInvoice(invoice)}
                      className="text-red-600 hover:text-red-900"
                      title="Rechnung löschen"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
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
                      <span>zzgl. MwSt.:</span>
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
                  onClick={() => {
                    setPreviewInvoiceId(selectedInvoice.id);
                    setPreviewOrderId(null);
                    setShowInvoicePreview(true);
                    setShowInvoiceModal(false);
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <i className="ri-eye-line mr-2"></i>
                  Vorschau
                </button>
                <button
                  onClick={() => generatePDF(selectedInvoice)}
                  disabled={isGeneratingPDF}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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

      {/* Modal für Rechnungsvorschau */}
      {showPreviewModal && previewInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Vorschau: {previewInvoice.invoice_number}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => generatePDF(previewInvoice)}
                    disabled={isGeneratingPDF}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <i className="ri-download-line mr-2"></i>
                    PDF herunterladen
                  </button>
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <i className="ri-close-line text-xl"></i>
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-[600px]"
                  title="Rechnungsvorschau"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* InvoicePreview Komponente */}
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

     {/* Steuereinstellungen Modal */}
     <TaxSettingsModal
       isOpen={showTaxSettings}
       onClose={() => setShowTaxSettings(false)}
       onSave={() => {
         // Reload data if needed
         loadInvoices();
       }}
     />
   </div>
 );
}