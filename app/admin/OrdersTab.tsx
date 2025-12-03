
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
  
  // Gutschein-Felder
  discount_amount?: string;
  discount_code_id?: number;
  
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
  discount_codes?: {
    id: number;
    code: string;
    description: string;
    discount_type: string;
    discount_value: string;
  };
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  // Using the centralized Supabase client from lib/supabase.ts

  useEffect(() => {
    loadOrders();
    loadProducts();
    loadCustomers();
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
            id,
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
            id,
            product_name,
            product_category,
            quantity,
            unit_price,
            total_price
          ),
          discount_codes (
            id,
            code,
            description,
            discount_type,
            discount_value
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

  const loadProducts = async () => {
    try {
      console.log('🔄 Loading products from Supabase database...');
      
      // Direkte Abfrage ohne Session-Prüfung für bessere Kompatibilität
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, category, unit, is_active')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('❌ Error loading products:', error);
        // Fallback: Verwende bekannte Produktdaten aus der Datenbank
        console.log('🔄 Using fallback product data...');
        const fallbackProducts = [
           {
             id: 1,
             name: 'Industrieholz Buche Klasse 1',
             price: '115',
             category: 'Industrieholz',
             unit: 'SRM',
             is_active: true
           },
           {
             id: 2,
             name: 'Industrieholz Buche Klasse II',
             price: '90',
             category: 'Industrieholz',
             unit: 'SRM',
             is_active: true
           },
           {
             id: 3,
             name: 'Scheitholz Buche 33 cm',
             price: '95',
             category: 'Brennholz',
             unit: 'SRM',
             is_active: true
           },
           {
             id: 4,
             name: 'Scheitholz Buche 25 cm',
             price: '100',
             category: 'Brennholz',
             unit: 'SRM',
             is_active: true
           },
           {
             id: 5,
             name: 'Scheitholz - Industrieholz Mix 33 cm',
             price: '90',
             category: 'Brennholz',
             unit: 'SRM',
             is_active: true
           },
           {
             id: 6,
             name: 'Scheitholz Fichte 33 cm',
             price: '55',
             category: 'Brennholz',
             unit: 'SRM',
             is_active: true
           }
         ];
        console.log('✅ Fallback products loaded:', fallbackProducts.length, 'products');
        setProducts(fallbackProducts);
        return;
      }
      
      console.log('✅ Products loaded from database:', data?.length || 0, 'products');
      console.log('📦 Sample product:', data?.[0]);
      setProducts(data || []);
      
    } catch (error) {
      console.error('💥 Failed to load products:', error);
      // Verwende Fallback-Daten bei jedem Fehler
      const fallbackProducts = [
         {
           id: 1,
           name: 'Industrieholz Buche Klasse 1',
           price: '115',
           category: 'Industrieholz',
           unit: 'SRM',
           is_active: true
         },
         {
           id: 2,
           name: 'Industrieholz Buche Klasse II',
           price: '90',
           category: 'Industrieholz',
           unit: 'SRM',
           is_active: true
         },
         {
           id: 3,
           name: 'Scheitholz Buche 33 cm',
           price: '95',
           category: 'Brennholz',
           unit: 'SRM',
           is_active: true
         },
         {
           id: 4,
           name: 'Scheitholz Buche 25 cm',
           price: '100',
           category: 'Brennholz',
           unit: 'SRM',
           is_active: true
         },
         {
           id: 5,
           name: 'Scheitholz - Industrieholz Mix 33 cm',
           price: '90',
           category: 'Brennholz',
           unit: 'SRM',
           is_active: true
         },
         {
           id: 6,
           name: 'Scheitholz Fichte 33 cm',
           price: '55',
           category: 'Brennholz',
           unit: 'SRM',
           is_active: true
         }
       ];
      console.log('🔄 Using fallback products due to error:', fallbackProducts.length);
      setProducts(fallbackProducts);
    }
  };

  const loadCustomers = async () => {
    try {
      console.log('🔄 Loading customers from Supabase database...');
      
      // Check if we have a valid session first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('❌ Session error:', sessionError);
        throw sessionError;
      }
      
      if (!session) {
        console.warn('⚠️ No active session found for customers');
        throw new Error('No active session');
      }
      
      console.log('✅ Valid session found, fetching customers...');
      
      const { data, error } = await supabase
        .from('customers')
        .select('id, first_name, last_name, email, phone, street, house_number, postal_code, city')
        .order('first_name');

      if (error) {
        console.error('❌ Error loading customers:', error);
        throw error;
      }
      
      console.log('✅ Customers loaded from database:', data?.length || 0, 'customers');
      setCustomers(data || []);
      
    } catch (error) {
      console.error('💥 Failed to load customers from database:', error);
      console.log('🔄 Retrying customers with fresh session...');
      
      // Try to refresh the session and retry
      try {
        const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) throw refreshError;
        
        if (newSession) {
          console.log('✅ Session refreshed, retrying customers fetch...');
          const { data: retryData, error: retryError } = await supabase
            .from('customers')
            .select('id, first_name, last_name, email, phone, street, house_number, postal_code, city')
            .order('first_name');
            
          if (retryError) throw retryError;
          
          console.log('✅ Customers loaded after session refresh:', retryData?.length || 0, 'customers');
          setCustomers(retryData || []);
        } else {
          throw new Error('Failed to refresh session for customers');
        }
      } catch (retryError) {
        console.error('💥 Failed to load customers even after session refresh:', retryError);
        setCustomers([]);
      }
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

  const createNewOrder = async (orderData: OrderFormData) => {
    setSaving(true);
    try {
      // Generate order number with improved format
      const generateOrderNumber = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const randomNum = Math.floor(Math.random() * 9000) + 1000; // 4-digit random number
        return `BK-${year}${month}-${randomNum}`;
      };
      
      const orderNumber = generateOrderNumber();
      
      // Create or get customer
      let customerId = orderData.customer.id;
      if (!customerId) {
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            first_name: orderData.customer.first_name,
            last_name: orderData.customer.last_name,
            email: orderData.customer.email,
            phone: orderData.customer.phone,
            street: orderData.customer.street,
            house_number: orderData.customer.house_number,
            postal_code: orderData.customer.postal_code,
            city: orderData.customer.city
          })
          .select()
          .single();
        
        if (customerError) throw customerError;
        customerId = newCustomer.id;
      }
      
      // Calculate totals
      const subtotal = orderData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const deliveryPrice = parseFloat(orderData.delivery_price);
      const total = subtotal + deliveryPrice;
      
      // Create order
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_id: customerId,
          status: 'pending',
          delivery_type: orderData.delivery_type,
          delivery_price: deliveryPrice,
          subtotal_amount: subtotal,
          total_amount: total,
          notes: orderData.notes,
          delivery_first_name: orderData.customer.first_name,
          delivery_last_name: orderData.customer.last_name,
          delivery_email: orderData.customer.email,
          delivery_phone: orderData.customer.phone,
          delivery_street: orderData.customer.street,
          delivery_house_number: orderData.customer.house_number,
          delivery_postal_code: orderData.customer.postal_code,
          delivery_city: orderData.customer.city
        })
        .select()
        .single();
      
      if (orderError) throw orderError;
      
      // Lade Steuereinstellungen für tax_included
      const { data: taxSettings } = await supabase
        .from('invoice_settings')
        .select('default_tax_included')
        .single();
      
      const defaultTaxIncluded = taxSettings?.default_tax_included || false;
      
      // Create order items
      const orderItems = orderData.items.map(item => ({
        order_id: newOrder.id,
        product_name: item.product_name,
        product_category: item.product_category,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
        tax_included: defaultTaxIncluded
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) throw itemsError;
      
      // Send order confirmation email
      try {
        const emailData = {
          orderData: {
            orderNumber: newOrder.order_number,
            items: orderData.items.map((item) => ({
              name: item.product_name,
              quantity: item.quantity,
              price: item.unit_price.toString(),
              unit: 'SRM',
            })),
            totalAmount: total.toString(),
            deliveryAddress: `${orderData.customer.first_name} ${orderData.customer.last_name}\n${orderData.customer.street} ${orderData.customer.house_number}\n${orderData.customer.postal_code} ${orderData.customer.city}`,
          },
          customerEmail: orderData.customer.email,
          customerName: `${orderData.customer.first_name} ${orderData.customer.last_name}`,
          templateType: 'order_confirmation'
        };

        console.log('Sende Admin-Bestellbestätigung an:', orderData.customer.email);
        
        const emailResponse = await fetch('/api/send-order-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailData),
        });

        const emailResult = await emailResponse.json();
        
        if (emailResult.success) {
          console.log('✅ Admin-Bestellbestätigung erfolgreich gesendet:', emailResult.template_used);
        } else {
          console.error('❌ Admin E-Mail-Versand fehlgeschlagen:', emailResult.error);
        }
      } catch (emailError) {
        console.error('Admin E-Mail Fehler (nicht kritisch):', emailError);
      }
      
      await loadOrders();
      setShowCreateModal(false);
      
      if (onStatsUpdate) {
        await onStatsUpdate();
      }
      
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Fehler beim Erstellen der Bestellung');
    } finally {
      setSaving(false);
    }
  };

  const sendShippingNotification = async (orderId: string) => {
    try {
      // Get order details with customer information
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_name,
            product_category,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError || !orderData) {
        throw new Error('Bestellung nicht gefunden');
      }

      // Prepare customer data
      const customerName = `${orderData.delivery_first_name || ''} ${orderData.delivery_last_name || ''}`.trim();
      const customerEmail = orderData.delivery_email;
      
      if (!customerEmail) {
        throw new Error('Keine E-Mail-Adresse für den Kunden gefunden');
      }

      // Build complete delivery address with fallback logic
      const deliveryAddressParts = [];
      
      // Add street and house number
      if (orderData.delivery_street) {
        const streetPart = orderData.delivery_house_number 
          ? `${orderData.delivery_street} ${orderData.delivery_house_number}`
          : orderData.delivery_street;
        deliveryAddressParts.push(streetPart);
      }
      
      // Add postal code and city
      if (orderData.delivery_postal_code || orderData.delivery_city) {
        const cityPart = [orderData.delivery_postal_code, orderData.delivery_city]
          .filter(Boolean)
          .join(' ');
        if (cityPart) {
          deliveryAddressParts.push(cityPart);
        }
      }
      
      const deliveryAddress = deliveryAddressParts.length > 0 
        ? deliveryAddressParts.join(', ')
        : 'Lieferadresse nicht verfügbar';
      
      console.log('🏠 Lieferadresse-Debug:', {
        street: orderData.delivery_street,
        houseNumber: orderData.delivery_house_number,
        postalCode: orderData.delivery_postal_code,
        city: orderData.delivery_city,
        finalAddress: deliveryAddress
      });
      
      // Format product list for template
      const productList = orderData.order_items?.map((item: any) => 
        `${item.quantity}x ${item.product_name} (${parseFloat(item.unit_price).toFixed(2)}€)`
      ).join('<br>') || 'Keine Produkte';

      // Baue Payload für dedizierte Versandbenachrichtigungs-API
      const shippingPayload = {
        customer: {
          name: customerName,
          email: customerEmail,
          firstName: orderData.delivery_first_name || '',
          lastName: orderData.delivery_last_name || ''
        },
        order: {
          id: orderId,
          number: orderData.order_number,
          total: orderData.total_amount ? parseFloat(orderData.total_amount) : undefined,
          date: new Date(orderData.created_at).toLocaleDateString('de-DE')
        },
        shipping: {
          trackingNumber: `BK-${orderData.order_number}`,
          carrier: orderData.delivery_method || orderData.delivery_type || 'Standard',
          method: orderData.delivery_type || 'Standard',
          estimatedDelivery: orderData.preferred_delivery_month && orderData.preferred_delivery_year
            ? `${orderData.preferred_delivery_month} ${orderData.preferred_delivery_year}`
            : undefined,
          trackingUrl: `https://brennholzkoenig.de/konto/bestellungen/${orderData.order_number}`
        },
        products: (orderData.order_items || []).map((item: any) => ({
          name: item.product_name,
          quantity: item.quantity,
          price: item.unit_price ? parseFloat(item.unit_price) : undefined
        })),
        delivery: {
          address: {
            firstName: orderData.delivery_first_name || '',
            lastName: orderData.delivery_last_name || '',
            street: orderData.delivery_street || '',
            address: deliveryAddress,
            zipCode: orderData.delivery_postal_code || '',
            city: orderData.delivery_city || ''
          }
        },
        adminNotification: {
          enabled: false
        }
      };

      // Sende Versandbenachrichtigung über dedizierte API
      const emailResponse = await fetch('/api/send-shipping-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shippingPayload),
      });

      const emailResult = await emailResponse.json();
      
      if (!emailResult.success) {
        throw new Error(emailResult.error || 'E-Mail-Versand fehlgeschlagen');
      }

      console.log('✅ Versandbenachrichtigung erfolgreich gesendet an:', customerEmail);
    } catch (error) {
      console.error('❌ Fehler beim Senden der Versandbenachrichtigung:', error);
      throw error;
    }
  };

  const sendDeliveryNotification = async (orderId: string) => {
    try {
      // Get order details with customer information
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_name,
            product_category,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError || !orderData) {
        throw new Error('Bestellung nicht gefunden');
      }

      // Prepare email data
      const customerName = `${orderData.delivery_first_name || ''} ${orderData.delivery_last_name || ''}`.trim();
      const customerEmail = orderData.delivery_email;
      
      if (!customerEmail) {
        throw new Error('Keine E-Mail-Adresse für den Kunden gefunden');
      }

      const deliveryAddress = `${orderData.delivery_street || ''} ${orderData.delivery_house_number || ''}, ${orderData.delivery_postal_code || ''} ${orderData.delivery_city || ''}`.trim();
      
      // Format product list
      const productList = orderData.order_items?.map((item: any) => 
        `${item.quantity}x ${item.product_name} (${parseFloat(item.unit_price).toFixed(2)}€)`
      ).join(', ') || 'Keine Produkte';

      // Send email using template
      const emailResponse = await fetch('/api/send-delivery-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerEmail,
          customerName,
          orderNumber: orderData.order_number,
          orderDate: new Date(orderData.created_at).toLocaleDateString('de-DE'),
          deliveryAddress,
          productList
        }),
      });

      const emailResult = await emailResponse.json();
      
      if (!emailResult.success) {
        throw new Error(emailResult.error || 'E-Mail-Versand fehlgeschlagen');
      }

      console.log('✅ Lieferbenachrichtigung erfolgreich gesendet an:', customerEmail);
    } catch (error) {
      console.error('❌ Fehler beim Senden der Lieferbenachrichtigung:', error);
      throw error;
    }
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

      // Send shipping notification email when status changes to "shipped"
      if (newStatus === 'shipped') {
        try {
          await sendShippingNotification(orderId);
        } catch (emailError) {
          console.error('Error sending shipping notification:', emailError);
          // Don't fail the status update if email fails
        }
      }

      // Send delivery notification email when status changes to "delivered"
      if (newStatus === 'delivered') {
        try {
          await sendDeliveryNotification(orderId);
        } catch (emailError) {
          console.error('Error sending delivery notification:', emailError);
          // Don't fail the status update if email fails
        }
      }

      // Send cancellation notification email when status changes to "cancelled"
      if (newStatus === 'cancelled') {
        try {
          // Call API route to send cancellation notifications
          const response = await fetch('/api/admin-cancel-order', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ orderId }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Fehler beim Versenden der Stornierungsbenachrichtigungen');
          }

          const result = await response.json();
          console.log('✅ Stornierungsbenachrichtigungen erfolgreich versendet:', result);
        } catch (emailError) {
          console.error('❌ Fehler beim Senden der Stornierungsbenachrichtigung:', emailError);
          // Don't fail the status update if email fails
        }
      }

      // Specific messages for status changes that affect inventory
      if (newStatus === 'confirmed') {
        alert(`Bestellstatus erfolgreich auf "${getStatusText(newStatus)}" geändert.\n\nDer Lagerbestand wurde automatisch aktualisiert.`);
      } else if (newStatus === 'cancelled') {
        alert(`Bestellstatus erfolgreich auf "${getStatusText(newStatus)}" geändert.\n\nDer Lagerbestand wurde automatisch zurückgebucht.\n\nStornierungsbenachrichtigungen wurden versendet.`);
      } else if (newStatus === 'shipped') {
        alert(`Bestellstatus erfolgreich auf "${getStatusText(newStatus)}" geändert.\n\nEine Versandbenachrichtigung wurde an den Kunden gesendet.`);
      } else if (newStatus === 'delivered') {
        alert(`Bestellstatus erfolgreich auf "${getStatusText(newStatus)}" geändert.\n\nEine Lieferbenachrichtigung wurde an den Kunden gesendet.`);
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

      // Gesamtbetrag neu berechnen: Summe aller Items + Lieferkosten
      const itemsTotal = updatedData.items.reduce((sum: number, item: any) => {
        return sum + (item.quantity * item.unit_price);
      }, 0);
      const deliveryPrice = parseFloat(updatedData.delivery_price) || 0;
      const newTotal = itemsTotal + deliveryPrice;

      // Auch subtotal_amount aktualisieren (Warenwert ohne Lieferung)
      const { error: totalError } = await supabase
        .from('orders')
        .update({ 
          total_amount: newTotal,
          subtotal_amount: itemsTotal
        })
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
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                Gesamt: {orders.length} Bestellungen
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-[#C04020] hover:bg-[#A03318] text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-2"
              >
                <i className="ri-add-line"></i>
                Neue Bestellung
              </button>
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
                    Kundennummer
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
                      <div className="text-sm font-mono text-gray-900">
                        {order.customers?.id ? `KD-${String(parseInt(order.customers.id.replace(/-/g, '').slice(-5), 16) % 99999 + 10000).padStart(5, '0')}` : (order.delivery_email ? `KD-${String(Math.abs(order.delivery_email.split('').reduce((a: number, b: string) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0)) % 89999 + 10000).padStart(5, '0')}` : '-')}
                      </div>
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

      {/* Create Order Modal */}
      {showCreateModal && (
        <CreateOrderModal
          products={products}
          customers={customers}
          onSave={createNewOrder}
          onClose={() => setShowCreateModal(false)}
          saving={saving}
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
                    {selectedOrder.discount_amount && parseFloat(selectedOrder.discount_amount) > 0 && (
                      <p>
                        <span className="font-medium">Gutschein:</span>{' '}
                        <span className="text-green-600 font-medium">
                          {selectedOrder.discount_codes?.code || 'Rabattcode'} 
                          (-€{parseFloat(selectedOrder.discount_amount).toFixed(2)})
                        </span>
                        {selectedOrder.discount_codes?.description && (
                          <span className="text-gray-500 text-sm block ml-20">
                            {selectedOrder.discount_codes.description}
                          </span>
                        )}
                      </p>
                    )}
                    <p>
                      <span className="font-bold">Gesamtsumme:</span> €
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
                      {selectedOrder.discount_amount && parseFloat(selectedOrder.discount_amount) > 0 && (
                        <tr>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            Gutschein: {selectedOrder.discount_codes?.code || 'Rabatt'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {selectedOrder.discount_codes?.description || 'Rabattcode'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">1x</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            -€{parseFloat(selectedOrder.discount_amount).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-green-600 text-right">
                            -€{parseFloat(selectedOrder.discount_amount).toFixed(2)}
                          </td>
                        </tr>
                      )}
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
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          <div className="p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#1A1A1A]">
                Bestellung #{order.order_number} bearbeiten
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <div>
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Kundeninformationen</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kundennummer</label>
                <input
                  type="text"
                  value={order.customers?.id ? `KD-${String(parseInt(order.customers.id.replace(/-/g, '').slice(-5), 16) % 99999 + 10000).padStart(5, '0')}` : (order.delivery_email ? `KD-${String(Math.abs(order.delivery_email.split('').reduce((a: number, b: string) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0)) % 89999 + 10000).padStart(5, '0')}` : '-')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-600 font-mono text-sm"
                  readOnly
                />
              </div>
              
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
      </div>
    </div>
  );
}

// CreateOrderModal Interface
interface CreateOrderModalProps {
  products: any[];
  customers: any[];
  onSave: (orderData: OrderFormData) => void;
  onClose: () => void;
  saving: boolean;
}

// CreateOrderModal Component
function CreateOrderModal({ products, customers, onSave, onClose, saving }: CreateOrderModalProps) {
  const [formData, setFormData] = useState<OrderFormData>({
    customer: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      street: '',
      house_number: '',
      postal_code: '',
      city: ''
    },
    delivery_type: 'standard',
    delivery_price: '0',
    notes: '',
    items: []
  });
  
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [newItem, setNewItem] = useState({
    product_id: '',
    quantity: 1
  });

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomer(customerId);
    if (customerId) {
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        setFormData({
          ...formData,
          customer: {
            id: customer.id,
            first_name: customer.first_name,
            last_name: customer.last_name,
            email: customer.email,
            phone: customer.phone || '',
            street: customer.street,
            house_number: customer.house_number,
            postal_code: customer.postal_code,
            city: customer.city
          }
        });
      }
    } else {
      setFormData({
        ...formData,
        customer: {
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          street: '',
          house_number: '',
          postal_code: '',
          city: ''
        }
      });
    }
  };

  const addItem = () => {
    console.log('🔥 AddItem clicked:', {
      newItem,
      products_count: products.length,
      products_sample: products[0],
      selected_product_id: newItem.product_id,
      product_id_type: typeof newItem.product_id
    });
    
    if (!newItem.product_id) {
      console.error('❌ No product selected');
      alert('Bitte wählen Sie ein Produkt aus.');
      return;
    }
    
    if (newItem.quantity <= 0) {
      console.error('❌ Invalid quantity:', newItem.quantity);
      alert('Bitte geben Sie eine gültige Menge ein.');
      return;
    }
    
    // Konvertiere product_id zu Number für Vergleich, falls nötig
    const productId = typeof newItem.product_id === 'string' ? parseInt(newItem.product_id) : newItem.product_id;
    const product = products.find(p => p.id === productId || p.id.toString() === newItem.product_id.toString());
    
    console.log('🎯 Product search details:', {
      searching_for: newItem.product_id,
      converted_id: productId,
      available_products: products.map(p => ({ id: p.id, name: p.name, id_type: typeof p.id })),
      found_product: product
    });
    
    if (!product) {
      console.error('❌ Product not found in products array');
      console.error('Available product IDs:', products.map(p => p.id));
      console.error('Searching for ID:', newItem.product_id);
      alert(`Produkt nicht gefunden. Verfügbare Produkte: ${products.map(p => p.name).join(', ')}`);
      return;
    }
    
    const item: OrderItem = {
      id: `temp-${Date.now()}`,
      product_name: product.name,
      product_category: product.category || 'Brennholz',
      quantity: newItem.quantity,
      unit_price: parseFloat(product.price)
    };
    
    console.log('✅ Adding item to order:', item);
    
    setFormData({
      ...formData,
      items: [...formData.items, item]
    });
    
    console.log('📦 Updated formData.items:', [...formData.items, item]);
    
    setNewItem({ product_id: '', quantity: 1 });
    console.log('🔄 Reset newItem');
  };

  const removeItem = (index: number) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: updatedItems });
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    const updatedItems = [...formData.items];
    updatedItems[index].quantity = quantity;
    setFormData({ ...formData, items: updatedItems });
  };

  const calculateTotal = () => {
    console.log('💰 Calculating total:', {
      items: formData.items,
      itemsCount: formData.items.length,
      delivery_price: formData.delivery_price
    });
    
    const itemsTotal = formData.items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unit_price;
      console.log('📦 Item calculation:', {
        name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        itemTotal
      });
      return sum + itemTotal;
    }, 0);
    
    const deliveryPrice = parseFloat(formData.delivery_price) || 0;
    const total = itemsTotal + deliveryPrice;
    
    console.log('🧮 Total calculation result:', {
      itemsTotal,
      deliveryPrice,
      total
    });
    
    return total;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      alert('Bitte fügen Sie mindestens ein Produkt hinzu.');
      return;
    }
    if (!formData.customer.first_name || !formData.customer.last_name || !formData.customer.email) {
      alert('Bitte füllen Sie alle Kundenfelder aus.');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          <div className="p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#1A1A1A]">
                Neue Bestellung erstellen
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Selection */}
          <div>
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Kunde auswählen</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Bestehender Kunde</label>
              <select
                value={selectedCustomer}
                onChange={(e) => handleCustomerSelect(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors text-sm"
              >
                <option value="">Neuen Kunden erstellen</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.first_name} {customer.last_name} ({customer.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Customer Information */}
          <div>
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Kundeninformationen</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kundennummer</label>
                <input
                  type="text"
                  value={formData.customer.id ? `KD-${String(parseInt(formData.customer.id.replace(/-/g, '').slice(-5), 16) % 99999 + 10000).padStart(5, '0')}` : (formData.customer.email ? `KD-${String(Math.abs(formData.customer.email.split('').reduce((a: number, b: string) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0)) % 89999 + 10000).padStart(5, '0')}` : 'Wird automatisch generiert')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-600 font-mono text-sm"
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vorname *</label>
                <input
                  type="text"
                  required
                  value={formData.customer.first_name}
                  onChange={e => setFormData({
                    ...formData,
                    customer: { ...formData.customer, first_name: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nachname *</label>
                <input
                  type="text"
                  required
                  value={formData.customer.last_name}
                  onChange={e => setFormData({
                    ...formData,
                    customer: { ...formData.customer, last_name: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail *</label>
                <input
                  type="email"
                  required
                  value={formData.customer.email}
                  onChange={e => setFormData({
                    ...formData,
                    customer: { ...formData.customer, email: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input
                  type="tel"
                  value={formData.customer.phone}
                  onChange={e => setFormData({
                    ...formData,
                    customer: { ...formData.customer, phone: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Straße</label>
                <input
                  type="text"
                  value={formData.customer.street}
                  onChange={e => setFormData({
                    ...formData,
                    customer: { ...formData.customer, street: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hausnummer</label>
                <input
                  type="text"
                  value={formData.customer.house_number}
                  onChange={e => setFormData({
                    ...formData,
                    customer: { ...formData.customer, house_number: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PLZ</label>
                <input
                  type="text"
                  value={formData.customer.postal_code}
                  onChange={e => setFormData({
                    ...formData,
                    customer: { ...formData.customer, postal_code: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stadt</label>
                <input
                  type="text"
                  value={formData.customer.city}
                  onChange={e => setFormData({
                    ...formData,
                    customer: { ...formData.customer, city: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors text-sm"
                />
              </div>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Produkte hinzufügen</h3>
            <div className="space-y-4 mb-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Produkt auswählen</label>
                  <select
                    value={newItem.product_id}
                    onChange={e => {
                      console.log('🔄 Product selection changed:', {
                        selected_value: e.target.value,
                        available_products: products.map(p => ({ id: p.id, name: p.name })),
                        products_count: products.length
                      });
                      setNewItem({ ...newItem, product_id: e.target.value });
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors text-sm"
                  >
                    <option value="">Produkt auswählen</option>
                    {products.map(product => {
                      console.log('🏷️ Rendering product option:', { id: product.id, name: product.name, price: product.price });
                      return (
                        <option key={product.id} value={product.id}>
                          {product.name} - €{product.price} / {product.unit}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="w-24">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Menge</label>
                  <input
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={e => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors text-sm"
                    placeholder="1"
                  />
                </div>
                <div className="w-32 flex items-end">
                  <button
                    type="button"
                    onClick={addItem}
                    disabled={!newItem.product_id}
                    className="w-full bg-[#C04020] hover:bg-[#A03318] disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    <i className="ri-add-line mr-1"></i>
                    Hinzufügen
                  </button>
                </div>
              </div>
              
              {/* Live Price Preview */}
              {(() => {
                console.log('🔍 Price Preview Debug:', {
                  product_id: newItem.product_id,
                  products_count: products.length,
                  quantity: newItem.quantity
                });
                
                if (newItem.product_id) {
                  const selectedProduct = products.find(p => p.id === newItem.product_id);
                  console.log('🎯 Selected product:', selectedProduct);
                  
                  if (selectedProduct) {
                    const unitPrice = parseFloat(selectedProduct.price);
                    const totalPrice = unitPrice * newItem.quantity;
                    console.log('💰 Price calculation:', { unitPrice, quantity: newItem.quantity, totalPrice });
                    
                    return (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{selectedProduct.name}</div>
                            <div className="text-sm text-gray-500">{selectedProduct.category || 'Brennholz'}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">€{unitPrice.toFixed(2)} / {selectedProduct.unit || 'Stück'}</div>
                            <div className="text-lg font-bold text-[#C04020]">€{totalPrice.toFixed(2)}</div>
                            <div className="text-xs text-gray-500">{newItem.quantity} × €{unitPrice.toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    console.log('❌ Product not found in products array');
                  }
                }
                return null;
              })()}
            </div>

            {/* Items List */}
            {formData.items.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 font-medium text-sm text-gray-700 grid grid-cols-12 gap-4">
                  <div className="col-span-5">Produkt</div>
                  <div className="col-span-2">Menge</div>
                  <div className="col-span-2">Einzelpreis</div>
                  <div className="col-span-2">Gesamt</div>
                  <div className="col-span-1">Aktion</div>
                </div>
                {formData.items.map((item, index) => (
                  <div key={index} className="px-4 py-3 border-t border-gray-200 grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-5">
                      <div className="font-medium">{item.product_name}</div>
                      <div className="text-sm text-gray-500">{item.product_category}</div>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div className="col-span-2">€{item.unit_price.toFixed(2)}</div>
                    <div className="col-span-2 font-medium">€{(item.quantity * item.unit_price).toFixed(2)}</div>
                    <div className="col-span-1">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-800 cursor-pointer"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delivery */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lieferart</label>
              <select
                value={formData.delivery_type}
                onChange={e => setFormData({ ...formData, delivery_type: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors text-sm"
              >
                <option value="standard">Standard Lieferung</option>
                <option value="express">Express Lieferung</option>
                <option value="pickup">Selbstabholung</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lieferkosten (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.delivery_price}
                onChange={e => setFormData({ ...formData, delivery_price: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] transition-colors text-sm"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notizen</label>
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
              <span>Gesamtsumme:</span>
              <span className="text-[#C04020]">€{calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={saving || formData.items.length === 0}
              className="flex-1 bg-[#C04020] hover:bg-[#A03318] text-white py-3 px-4 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              {saving ? (
                <>
                  <i className="ri-loader-4-line mr-2 animate-spin"></i>
                  Erstelle...
                </>
              ) : (
                <>
                  <i className="ri-add-line mr-2"></i>
                  Bestellung erstellen
                </>
              )}
            </button>
          </div>
        </form>
          </div>
        </div>
      </div>
    </div>
  );
}
