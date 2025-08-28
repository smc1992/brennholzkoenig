'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { calculatePriceWithTiers } from '../../lib/pricing';

// Using the centralized Supabase client from lib/supabase.ts

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  unit: string;
}

interface DeliveryData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  deliveryNotes: string;
  preferredDeliveryMonth: string;
  preferredDeliveryYear: string;
}

interface BillingData {
  sameBilling: boolean;
  firstName: string;
  lastName: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  company: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { products, subscribeToChanges, unsubscribeFromChanges } = useRealtimeSync();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [user, setUser] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [selectedDelivery, setSelectedDelivery] = useState('standard');
  const [minOrderQuantity, setMinOrderQuantity] = useState(3);
  const [pricingTiers, setPricingTiers] = useState<any[]>([]);
  const [shippingCosts, setShippingCosts] = useState({ standard: 43.5, express: 139 });

  // Lieferoptionen - werden dynamisch aus der Datenbank geladen
  const getDeliveryOptions = () => [
    { type: 'standard', name: 'Standard Lieferung (1-3 Wochen)', price: shippingCosts.standard },
    { type: 'express', name: 'Express Lieferung (24-48h)', price: shippingCosts.express },
  ];
  const [deliveryData, setDeliveryData] = useState<DeliveryData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    houseNumber: '',
    postalCode: '',
    city: '',
    deliveryNotes: '',
    preferredDeliveryMonth: '',
    preferredDeliveryYear: new Date().getFullYear().toString(),
  });
  const [billingData, setBillingData] = useState<BillingData>({
    sameBilling: true,
    firstName: '',
    lastName: '',
    street: '',
    houseNumber: '',
    postalCode: '',
    city: '',
    company: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('bar');
  const [agbAccepted, setAgbAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      // Lade Mindestbestellmenge und Versandkosten aus dem Backend
      const { data: settingsData } = await supabase
        .from('app_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['minimum_order_quantity', 'shipping_cost_standard', 'shipping_cost_express']);

      if (settingsData) {
        const settings: any = {};
        settingsData.forEach((item: any) => {
          settings[item.setting_key] = item.setting_value;
        });

        if (settings.minimum_order_quantity) {
          const parsed = parseInt(settings.minimum_order_quantity, 10);
          setMinOrderQuantity(isNaN(parsed) ? 3 : parsed);
        }

        setShippingCosts({
          standard: parseFloat(settings.shipping_cost_standard) || 43.5,
          express: parseFloat(settings.shipping_cost_express) || 139
        });
      }

      // Lade Preisstaffeln
      const { data: tiersData } = await supabase
        .from('pricing_tiers')
        .select('*')
        .eq('is_active', true)
        .order('min_quantity');

      if (tiersData) {
        setPricingTiers(tiersData);
      }

      // Lade Warenkorb
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        // Stelle sicher, dass price als number behandelt wird
        const normalizedCart = parsedCart.map((item: any) => ({
          ...item,
          price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
          quantity: typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity
        }));
        setCartItems(normalizedCart);
      }
    };

    loadData();

    // Aktuellen User laden
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        // User-Daten vorausfüllen
        const { data: customer } = await supabase
          .from('customers')
          .select('*')
          .eq('email', user.email as string)
          .single();

        if (customer) {
          setDeliveryData((prev) => ({
            ...prev,
            firstName: String(customer.first_name || ''),
            lastName: String(customer.last_name || ''),
            email: String(customer.email || ''),
            phone: String(customer.phone || ''),
            street: String(customer.street || ''),
            houseNumber: String(customer.house_number || ''),
            postalCode: String(customer.postal_code || ''),
            city: String(customer.city || ''),
          }));
        }
      }
    };

    getCurrentUser();
  }, []);

  // Real-time Synchronisation für Checkout
  useEffect(() => {
    subscribeToChanges();
    return () => {
      unsubscribeFromChanges();
    };
  }, [subscribeToChanges, unsubscribeFromChanges]);

  // Synchronisiere Checkout-Artikel mit Real-time Produktdaten
  useEffect(() => {
    if (products.length > 0 && cartItems.length > 0) {
      const updatedCartItems = cartItems.map(cartItem => {
        const realtimeProduct = products.find(p => p.id.toString() === cartItem.id.toString());
        if (realtimeProduct) {
          console.log(`Aktualisiere Checkout-Artikel: ${cartItem.name} -> ${realtimeProduct.name}, Preis: ${cartItem.price} -> ${realtimeProduct.price}`);
          return {
            ...cartItem,
            name: realtimeProduct.name,
            price: typeof realtimeProduct.price === 'string' ? parseFloat(realtimeProduct.price) : realtimeProduct.price,
            image: realtimeProduct.image_url
          };
        }
        return cartItem;
      });
      
      // Nur aktualisieren wenn sich etwas geändert hat
      const hasChanges = updatedCartItems.some((item, index) => 
        item.name !== cartItems[index]?.name || 
        item.price !== cartItems[index]?.price ||
        item.image !== cartItems[index]?.image
      );
      
      if (hasChanges) {
        setCartItems(updatedCartItems);
        // Auch localStorage aktualisieren für Konsistenz
        localStorage.setItem('cart', JSON.stringify(updatedCartItems));
      }
    }
  }, [products]); // Entferne cartItems aus Dependencies um Loop zu vermeiden

  const calculateTotal = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const selectedOption = getDeliveryOptions().find((opt) => opt.type === selectedDelivery);
    const shipping = selectedOption ? selectedOption.price : 43.5;
    return { subtotal, shipping, total: subtotal + shipping };
  };

  // Prüft, ob die Gesamtmenge der Bestellung die Mindestbestellmenge erfüllt
  const validateMinimumOrderQuantity = () => {
    const totalQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);
    return totalQuantity >= minOrderQuantity;
  };

  const validateStep1 = () => {
    const newErrors: { [key: string]: string } = {};
    
    // Prüfe Mindestbestellmenge
    if (!validateMinimumOrderQuantity()) {
      const unit = cartItems.length > 0 ? cartItems[0].unit : 'SRM';
      newErrors.minQuantity = `Die Mindestbestellmenge beträgt ${minOrderQuantity} ${unit}. Ihre aktuelle Bestellung enthält nur ${cartItems.reduce((total, item) => total + item.quantity, 0)} ${unit}.`;
    }

    if (!deliveryData.firstName.trim()) {
      newErrors.firstName = 'Vorname ist erforderlich';
    }
    if (!deliveryData.lastName.trim()) {
      newErrors.lastName = 'Nachname ist erforderlich';
    }
    if (!deliveryData.email.trim()) {
      newErrors.email = 'E-Mail ist erforderlich';
    } else {
      // Robuste E-Mail-Validierung - einfache und zuverlässige RegEx
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(deliveryData.email.trim())) {
        newErrors.email = 'Bitte geben Sie eine gültige E-Mail-Adresse ein';
      }
    }
    if (!deliveryData.phone.trim()) {
      newErrors.phone = 'Telefonnummer ist erforderlich';
    }
    if (!deliveryData.street.trim()) {
      newErrors.street = 'Straße ist erforderlich';
    }
    if (!deliveryData.houseNumber.trim()) {
      newErrors.houseNumber = 'Hausnummer ist erforderlich';
    }
    if (!deliveryData.postalCode.trim()) {
      newErrors.postalCode = 'PLZ ist erforderlich';
    }
    if (!deliveryData.city.trim()) {
      newErrors.city = 'Stadt ist erforderlich';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    if (billingData.sameBilling) return true;

    const newErrors: { [key: string]: string } = {};

    if (!billingData.firstName.trim()) {
      newErrors.billingFirstName = 'Vorname ist erforderlich';
    }
    if (!billingData.lastName.trim()) {
      newErrors.billingLastName = 'Nachname ist erforderlich';
    }
    if (!billingData.street.trim()) {
      newErrors.billingStreet = 'Straße ist erforderlich';
    }
    if (!billingData.houseNumber.trim()) {
      newErrors.billingHouseNumber = 'Hausnummer ist erforderlich';
    }
    if (!billingData.postalCode.trim()) {
      newErrors.billingPostalCode = 'PLZ ist erforderlich';
    }
    if (!billingData.city.trim()) {
      newErrors.billingCity = 'Stadt ist erforderlich';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: { [key: string]: string } = {};

    if (!agbAccepted) {
      newErrors.agb = 'Bitte akzeptieren Sie die AGB';
    }
    if (!privacyAccepted) {
      newErrors.privacy = 'Bitte akzeptieren Sie die Datenschutzerklärung';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) throw error;

      setUser(data.user);
      setShowLogin(false);

      // User-Daten laden und vorausfüllen
      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('email', (data.user.email as string))
        .single();

      if (customer) {
        setDeliveryData((prev) => ({
          ...prev,
          firstName: (customer.first_name as string) || '',
          lastName: (customer.last_name as string) || '',
          email: (customer.email as string) || '',
          phone: (customer.phone as string) || '',
          street: (customer.street as string) || '',
          houseNumber: (customer.house_number as string) || '',
          postalCode: (customer.postal_code as string) || '',
          city: (customer.city as string) || '',
        }));
      }
    } catch (error: any) {
      setErrors({ login: 'Anmeldung fehlgeschlagen. Überprüfen Sie Ihre Daten.' });
    }
  };

  const handleNextStep = () => {
    let isValid = false;

    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
    }

    if (isValid) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const saveCustomerData = async (customerId?: string) => {
    const customerData = {
      email: deliveryData.email,
      first_name: deliveryData.firstName,
      last_name: deliveryData.lastName,
      phone: deliveryData.phone,
      street: deliveryData.street,
      house_number: deliveryData.houseNumber,
      postal_code: deliveryData.postalCode,
      city: deliveryData.city,
      preferred_delivery_month: deliveryData.preferredDeliveryMonth,
      preferred_delivery_year: deliveryData.preferredDeliveryYear,
      billing_same_as_delivery: billingData.sameBilling,
      billing_company: billingData.company,
      billing_first_name: billingData.sameBilling ? deliveryData.firstName : billingData.firstName,
      billing_last_name: billingData.sameBilling ? deliveryData.lastName : billingData.lastName,
      billing_street: billingData.sameBilling ? deliveryData.street : billingData.street,
      billing_house_number: billingData.sameBilling ? deliveryData.houseNumber : billingData.houseNumber,
      billing_postal_code: billingData.sameBilling ? deliveryData.postalCode : billingData.postalCode,
      billing_city: billingData.sameBilling ? deliveryData.city : billingData.city,
      updated_at: new Date().toISOString(),
    };

    if (customerId) {
      // Update existing customer
      const { data, error } = await supabase
        .from('customers')
        .update(customerData)
        .eq('id', customerId)
        .select()
        .single();

      return { data, error };
    } else {
      // Create new customer
      const { data, error } = await supabase
        .from('customers')
        .insert({
          ...customerData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      return { data, error };
    }
  };

  const handleSubmitOrder = async () => {
    if (!validateStep3()) return;
    
    // Prüfe Mindestbestellmenge vor dem Absenden
    if (!validateMinimumOrderQuantity()) {
      setErrors({ minQuantity: `Die Mindestbestellmenge beträgt ${minOrderQuantity} SRM. Ihre aktuelle Bestellung enthält nur ${cartItems.reduce((total, item) => total + item.quantity, 0)} SRM.` });
      setCurrentStep(1); // Zurück zum ersten Schritt
      return;
    }

    setIsProcessing(true);

    try {
      let customerId = null;

      // Check if user is logged in
      if (user) {
        // Get customer by user email
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('email', user.email)
          .single();

        if (existingCustomer) {
          customerId = String(existingCustomer.id);
          await saveCustomerData(customerId);
        } else {
          const { data: newCustomer, error: customerError } = await saveCustomerData();
          if (customerError) {
            console.error('Fehler beim Erstellen des Kunden:', {
              code: customerError.code,
              message: customerError.message,
              hint: customerError.hint,
              details: customerError.details
            });
            
            // Fallback: Versuche Bestellung ohne Kundenerstellung
            if (customerError.code === '42501' || customerError.code === '401') {
              console.warn('RLS-Policy-Problem erkannt, verwende Fallback-Mechanismus');
              // Setze customer_id auf null für anonyme Bestellungen
              customerId = null;
              console.log('Anonyme Bestellung ohne Customer-ID');
            } else {
              throw new Error(`Fehler beim Speichern der Kundendaten: ${customerError.message}`);
            }
          } else {
            customerId = newCustomer?.id;
          }
        }
      } else {
        // Check if customer exists by email
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('email', deliveryData.email)
          .single();

        if (existingCustomer) {
          customerId = String(existingCustomer.id);
          await saveCustomerData(customerId);
        } else {
          const { data: newCustomer, error: customerError } = await saveCustomerData();
          if (customerError) {
            console.error('Fehler beim Erstellen des Kunden:', {
              code: customerError.code,
              message: customerError.message,
              hint: customerError.hint,
              details: customerError.details
            });
            
            // Fallback: Versuche Bestellung ohne Kundenerstellung
            if (customerError.code === '42501' || customerError.code === '401') {
              console.warn('RLS-Policy-Problem erkannt, verwende Fallback-Mechanismus');
              // Setze customer_id auf null für anonyme Bestellungen
              customerId = null;
              console.log('Anonyme Bestellung ohne Customer-ID');
            } else {
              throw new Error(`Fehler beim Speichern der Kundendaten: ${customerError.message}`);
            }
          } else {
            customerId = newCustomer?.id;
          }
        }
      }

      // customerId kann null sein für anonyme Bestellungen
      if (customerId === undefined) {
        throw new Error('Kunde konnte nicht erstellt oder gefunden werden');
      }

      // Create order
      const orderNumber = 'BK-' + Date.now();
      const { subtotal, shipping, total } = calculateTotal();

      const orderData = {
        order_number: orderNumber,
        customer_id: customerId,
        status: 'pending',
        payment_method: paymentMethod,
        delivery_first_name: deliveryData.firstName,
        delivery_last_name: deliveryData.lastName,
        delivery_email: deliveryData.email,
        delivery_phone: deliveryData.phone,
        delivery_street: deliveryData.street,
        delivery_house_number: deliveryData.houseNumber,
        delivery_postal_code: deliveryData.postalCode,
        delivery_city: deliveryData.city,
        delivery_notes: deliveryData.deliveryNotes || '',
        preferred_delivery_month: deliveryData.preferredDeliveryMonth,
        preferred_delivery_year: deliveryData.preferredDeliveryYear,
        billing_same_as_delivery: billingData.sameBilling,
        billing_company: billingData.company || '',
        billing_first_name: billingData.sameBilling ? deliveryData.firstName : billingData.firstName,
        billing_last_name: billingData.sameBilling ? deliveryData.lastName : billingData.lastName,
        billing_street: billingData.sameBilling ? deliveryData.street : billingData.street,
        billing_house_number: billingData.sameBilling ? deliveryData.houseNumber : billingData.houseNumber,
        billing_postal_code: billingData.sameBilling ? deliveryData.postalCode : billingData.postalCode,
        billing_city: billingData.sameBilling ? deliveryData.city : billingData.city,
        subtotal_amount: parseFloat(subtotal.toFixed(2)),
        delivery_price: parseFloat(shipping.toFixed(2)),
        total_amount: parseFloat(total.toFixed(2)),
        delivery_method: selectedDelivery,
        delivery_type: selectedDelivery,
        created_at: new Date().toISOString(),
      };

      console.log('Bestelldaten:', orderData);

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error('Bestellfehler:', orderError);
        throw new Error(`Fehler beim Erstellen der Bestellung: ${orderError.message}`);
      }

      console.log('Bestellung erstellt:', order);

      // Add order items
      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        product_name: item.name,
        product_category: 'Brennholz', // Default category, could be enhanced to get from product data
        quantity: item.quantity,
        unit_price: parseFloat(item.price.toFixed(2)),
        total_price: parseFloat((item.price * item.quantity).toFixed(2)),
        created_at: new Date().toISOString(),
      }));

      console.log('Bestellpositionen:', orderItems);

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Fehler bei Bestellpositionen:', itemsError);
        throw new Error(`Fehler beim Speichern der Bestellpositionen: ${itemsError.message}`);
      }

      // Send order confirmation email
      try {
        const emailData = {
          orderData: {
            orderNumber: orderNumber,
            items: cartItems.map((item) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              unit: 'Stück',
            })),
            totalAmount: total,
            deliveryAddress: `${deliveryData.firstName} ${deliveryData.lastName}\n${deliveryData.street} ${deliveryData.houseNumber}\n${deliveryData.postalCode} ${deliveryData.city}`,
          },
          customerEmail: deliveryData.email,
          customerName: `${deliveryData.firstName} ${deliveryData.lastName}`,
        };

        // Send confirmation email
        await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-order-confirmation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify(emailData),
        });
      } catch (emailError) {
        console.error('E-Mail Fehler (nicht kritisch):', emailError);
        // E-Mail Fehler ist nicht kritisch, Bestellung wird trotzdem fortgesetzt
      }

      // Clear cart
      localStorage.removeItem('cart');

      // Redirect to confirmation page with order number
      router.push(`/bestellbestaetigung?order=${orderNumber}`);
    } catch (error: any) {
      console.error('Fehler beim Verarbeiten der Bestellung:', error);
      setErrors({ submit: error.message || 'Fehler beim Verarbeiten der Bestellung. Bitte versuchen Sie es erneut.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const { subtotal, shipping, total } = calculateTotal();

  // Prüfe, ob der Warenkorb leer ist oder die Mindestbestellmenge nicht erreicht wird
  const totalQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);
  const isCartEmpty = cartItems.length === 0;
  const isBelowMinimumQuantity = totalQuantity < minOrderQuantity;
  
  if (isCartEmpty || isBelowMinimumQuantity) {
    return (
      <div className="min-h-screen bg-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <div className="w-16 h-16 flex items-center justify-center bg-amber-100 rounded-full mx-auto mb-6">
              <i className="ri-shopping-cart-line text-2xl text-amber-600"></i>
            </div>
            {isCartEmpty ? (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Ihr Warenkorb ist leer</h1>
                <p className="text-gray-600 mb-8">Fügen Sie Produkte zu Ihrem Warenkorb hinzu, bevor Sie zur Kasse gehen.</p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Mindestbestellmenge nicht erreicht</h1>
                <p className="text-gray-600 mb-8">
                  Die Mindestbestellmenge beträgt {minOrderQuantity} SRM. Ihre aktuelle Bestellung enthält nur {totalQuantity} SRM.
                  Bitte erhöhen Sie die Menge im Warenkorb.
                </p>
              </>
            )}
            <Link href="/shop" className="inline-block bg-amber-600 text-white px-8 py-3 rounded-lg hover:bg-amber-700 transition-colors whitespace-nowrap">
              Zum Shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Fortschrittsanzeige */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6 md:mb-8">
          {/* Mobile Progress Indicator */}
          <div className="block md:hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-gray-600">
                Schritt {currentStep} von 4
              </div>
              <div className="text-sm font-medium text-amber-600">
                {currentStep === 1 && 'Lieferadresse'}
                {currentStep === 2 && 'Rechnungsadresse'}
                {currentStep === 3 && 'Lieferart & Zahlungsart'}
                {currentStep === 4 && 'Bestätigung'}
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              ></div>
            </div>
          </div>
          
          {/* Desktop Progress Indicator */}
          <div className="hidden md:flex items-center justify-between">
            {[1, 2, 3, 4].map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step}
                </div>
                <div className={`ml-3 text-sm font-medium ${currentStep >= step ? 'text-amber-600' : 'text-gray-500'}`}>
                  {step === 1 && 'Lieferadresse'}
                  {step === 2 && 'Rechnungsadresse'}
                  {step === 3 && 'Lieferart & Zahlungsart'}
                  {step === 4 && 'Bestätigung'}
                </div>
                {index < 3 && (
                  <div className={`mx-4 h-px flex-1 ${currentStep > step ? 'bg-amber-600' : 'bg-gray-200'}`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Checkout Formular */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
              {/* Login-Option */}
              {!user && currentStep === 1 && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-blue-900">Bereits Kunde?</h3>
                      <p className="text-sm text-blue-700">Melden Sie sich an, um Ihre Daten automatisch zu übernehmen.</p>
                    </div>
                    <button
                      onClick={() => setShowLogin(!showLogin)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                      {showLogin ? 'Schließen' : 'Anmelden'}
                    </button>
                  </div>

                  {showLogin && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <input
                          type="email"
                          placeholder="E-Mail"
                          value={loginData.email}
                          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <input
                          type="password"
                          placeholder="Passwort"
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <button
                          onClick={handleLogin}
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                        >
                          Anmelden
                        </button>
                        {errors.login && <p className="text-red-500 text-sm mt-2">{errors.login}</p>}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {user && (
                <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center">
                    <i className="ri-user-check-line text-green-600 text-xl mr-3"></i>
                    <div>
                      <p className="font-medium text-green-900">Angemeldet als {user.email}</p>
                      <p className="text-sm text-green-700">Ihre Bestellung wird automatisch mit Ihrem Konto verknüpft.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Schritt 1: Lieferadresse */}
              {currentStep === 1 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Lieferadresse</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vorname *
                      </label>
                      <input
                        type="text"
                        value={deliveryData.firstName}
                        onChange={(e) => setDeliveryData({ ...deliveryData, firstName: e.target.value })}
                        className={`w-full px-4 py-3 md:py-3 border rounded-lg text-base md:text-sm ${
                          errors.firstName ? 'border-red-500' : 'border-gray-300'
                        } focus:ring-2 focus:ring-amber-500 focus:border-transparent`}
                      />
                      {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nachname *
                      </label>
                      <input
                        type="text"
                        value={deliveryData.lastName}
                        onChange={(e) => setDeliveryData({ ...deliveryData, lastName: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-lg text-sm ${
                          errors.lastName ? 'border-red-500' : 'border-gray-300'
                        } focus:ring-2 focus:ring-amber-500 focus:border-transparent`}
                      />
                      {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        E-Mail *
                      </label>
                      <input
                        type="email"
                        value={deliveryData.email}
                        onChange={(e) => setDeliveryData({ ...deliveryData, email: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-lg text-sm ${
                          errors.email ? 'border-red-500' : 'border-gray-300'
                        } focus:ring-2 focus:ring-amber-500 focus:border-transparent`}
                      />
                      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefon *
                      </label>
                      <input
                        type="tel"
                        value={deliveryData.phone}
                        onChange={(e) => setDeliveryData({ ...deliveryData, phone: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-lg text-sm ${
                          errors.phone ? 'border-red-500' : 'border-gray-300'
                        } focus:ring-2 focus:ring-amber-500 focus:border-transparent`}
                      />
                      {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Straße *
                      </label>
                      <input
                        type="text"
                        value={deliveryData.street}
                        onChange={(e) => setDeliveryData({ ...deliveryData, street: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-lg text-sm ${
                          errors.street ? 'border-red-500' : 'border-gray-300'
                        } focus:ring-2 focus:ring-amber-500 focus:border-transparent`}
                      />
                      {errors.street && <p className="text-red-500 text-sm mt-1">{errors.street}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hausnummer *
                      </label>
                      <input
                        type="text"
                        value={deliveryData.houseNumber}
                        onChange={(e) => setDeliveryData({ ...deliveryData, houseNumber: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-lg text-sm ${
                          errors.houseNumber ? 'border-red-500' : 'border-gray-300'
                        } focus:ring-2 focus:ring-amber-500 focus:border-transparent`}
                      />
                      {errors.houseNumber && <p className="text-red-500 text-sm mt-1">{errors.houseNumber}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PLZ *
                      </label>
                      <input
                        type="text"
                        value={deliveryData.postalCode}
                        onChange={(e) => setDeliveryData({ ...deliveryData, postalCode: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-lg text-sm ${
                          errors.postalCode ? 'border-red-500' : 'border-gray-300'
                        } focus:ring-2 focus:ring-amber-500 focus:border-transparent`}
                      />
                      {errors.postalCode && <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stadt *
                      </label>
                      <input
                        type="text"
                        value={deliveryData.city}
                        onChange={(e) => setDeliveryData({ ...deliveryData, city: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-lg text-sm ${
                          errors.city ? 'border-red-500' : 'border-gray-300'
                        } focus:ring-2 focus:ring-amber-500 focus:border-transparent`}
                      />
                      {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Wunschliefermonat (optional)
                      </label>
                      <select
                        value={deliveryData.preferredDeliveryMonth}
                        onChange={(e) => setDeliveryData({ ...deliveryData, preferredDeliveryMonth: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      >
                        <option value="">Bitte wählen...</option>
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Wunschlieferjahr (optional)
                      </label>
                      <select
                        value={deliveryData.preferredDeliveryYear}
                        onChange={(e) => setDeliveryData({ ...deliveryData, preferredDeliveryYear: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      >
                        <option value={new Date().getFullYear().toString()}>{new Date().getFullYear()}</option>
                        <option value={(new Date().getFullYear() + 1).toString()}>{new Date().getFullYear() + 1}</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lieferhinweise (optional)
                      </label>
                      <textarea
                        value={deliveryData.deliveryNotes}
                        onChange={(e) => setDeliveryData({ ...deliveryData, deliveryNotes: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="z.B. Hinterhof, 2. Stock links, bei Nachbarn abgeben..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end mt-8">
                    <button
                      onClick={handleNextStep}
                      className="bg-amber-600 text-white px-8 py-3 rounded-lg hover:bg-amber-700 transition-colors whitespace-nowrap"
                    >
                      Weiter
                    </button>
                  </div>
                </div>
              )}

              {/* Schritt 2: Rechnungsadresse */}
              {currentStep === 2 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Rechnungsadresse</h2>

                  <div className="mb-6">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={billingData.sameBilling}
                        onChange={(e) => setBillingData({ ...billingData, sameBilling: e.target.checked })}
                        className="mr-3 w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Rechnungsadresse ist identisch mit Lieferadresse
                      </span>
                    </label>
                  </div>

                  {!billingData.sameBilling && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Firma (optional)
                        </label>
                        <input
                          type="text"
                          value={billingData.company}
                          onChange={(e) => setBillingData({ ...billingData, company: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                      </div>

                      <div></div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Vorname *
                        </label>
                        <input
                          type="text"
                          value={billingData.firstName}
                          onChange={(e) => setBillingData({ ...billingData, firstName: e.target.value })}
                          className={`w-full px-4 py-3 border rounded-lg text-sm ${
                            errors.billingFirstName ? 'border-red-500' : 'border-gray-300'
                          } focus:ring-2 focus:ring-amber-500 focus:border-transparent`}
                        />
                        {errors.billingFirstName && <p className="text-red-500 text-sm mt-1">{errors.billingFirstName}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nachname *
                        </label>
                        <input
                          type="text"
                          value={billingData.lastName}
                          onChange={(e) => setBillingData({ ...billingData, lastName: e.target.value })}
                          className={`w-full px-4 py-3 border rounded-lg text-sm ${
                            errors.billingLastName ? 'border-red-500' : 'border-gray-300'
                          } focus:ring-2 focus:ring-amber-500 focus:border-transparent`}
                        />
                        {errors.billingLastName && <p className="text-red-500 text-sm mt-1">{errors.billingLastName}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Straße *
                        </label>
                        <input
                          type="text"
                          value={billingData.street}
                          onChange={(e) => setBillingData({ ...billingData, street: e.target.value })}
                          className={`w-full px-4 py-3 border rounded-lg text-sm ${
                            errors.billingStreet ? 'border-red-500' : 'border-gray-300'
                          } focus:ring-2 focus:ring-amber-500 focus:border-transparent`}
                        />
                        {errors.billingStreet && <p className="text-red-500 text-sm mt-1">{errors.billingStreet}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hausnummer *
                        </label>
                        <input
                          type="text"
                          value={billingData.houseNumber}
                          onChange={(e) => setBillingData({ ...billingData, houseNumber: e.target.value })}
                          className={`w-full px-4 py-3 border rounded-lg text-sm ${
                            errors.billingHouseNumber ? 'border-red-500' : 'border-gray-300'
                          } focus:ring-2 focus:ring-amber-500 focus:border-transparent`}
                        />
                        {errors.billingHouseNumber && <p className="text-red-500 text-sm mt-1">{errors.billingHouseNumber}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          PLZ *
                        </label>
                        <input
                          type="text"
                          value={billingData.postalCode}
                          onChange={(e) => setBillingData({ ...billingData, postalCode: e.target.value })}
                          className={`w-full px-4 py-3 border rounded-lg text-sm ${
                            errors.billingPostalCode ? 'border-red-500' : 'border-gray-300'
                          } focus:ring-2 focus:ring-amber-500 focus:border-transparent`}
                        />
                        {errors.billingPostalCode && <p className="text-red-500 text-sm mt-1">{errors.billingPostalCode}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Stadt *
                        </label>
                        <input
                          type="text"
                          value={billingData.city}
                          onChange={(e) => setBillingData({ ...billingData, city: e.target.value })}
                          className={`w-full px-4 py-3 border rounded-lg text-sm ${
                            errors.billingCity ? 'border-red-500' : 'border-gray-300'
                          } focus:ring-2 focus:ring-amber-500 focus:border-transparent`}
                        />
                        {errors.billingCity && <p className="text-red-500 text-sm mt-1">{errors.billingCity}</p>}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 mt-6 md:mt-8">
                    <button
                      onClick={handlePrevStep}
                      className="w-full sm:w-auto bg-gray-300 text-gray-700 px-6 md:px-8 py-3 md:py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium text-center order-2 sm:order-1"
                    >
                      Zurück
                    </button>
                    <button
                      onClick={handleNextStep}
                      className="w-full sm:w-auto bg-amber-600 text-white px-6 md:px-8 py-3 md:py-3 rounded-lg hover:bg-amber-700 transition-colors font-medium text-center order-1 sm:order-2"
                    >
                      Weiter
                    </button>
                  </div>
                </div>
              )}

              {/* Schritt 3: Lieferart & Zahlungsart */}
              {currentStep === 3 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Lieferart & Zahlungsart</h2>

                  {/* Lieferart Auswahl */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Lieferart wählen</h3>
                    <div className="space-y-3">
                      {getDeliveryOptions().map((option) => (
                        <label key={option.type} className="block cursor-pointer">
                          <div
                            className={`border-2 rounded-lg p-4 transition-colors ${
                              selectedDelivery === option.type ? 'border-amber-600 bg-amber-50' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <input
                                  type="radio"
                                  name="delivery"
                                  value={option.type}
                                  checked={selectedDelivery === option.type}
                                  onChange={(e) => setSelectedDelivery(e.target.value)}
                                  className="mr-4 w-4 h-4 text-amber-600 border-gray-300 focus:ring-amber-500"
                                />
                                <div>
                                  <div className="font-medium text-gray-900">{option.name}</div>
                                  <div className="text-sm text-gray-600">
                                    {option.type === 'express' ? 'Schnellste Option' : 'Günstigste Option'}
                                  </div>
                                </div>
                              </div>
                              <div className="font-bold text-amber-600">€{option.price.toFixed(2)}</div>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Zahlungsart */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Zahlungsart</h3>
                    <div className="space-y-4">
                      {[
                        {
                          id: 'bar',
                          name: 'Barzahlung bei Lieferung',
                          icon: 'ri-money-euro-circle-line',
                          desc: 'Zahlung in bar oder mit EC-Karte bei der Lieferung',
                        },
                      ].map((method) => (
                        <label key={method.id} className="block cursor-pointer">
                          <div
                            className={`border-2 rounded-lg p-4 transition-colors ${
                              paymentMethod === method.id ? 'border-amber-600 bg-amber-50' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center">
                              <input
                                type="radio"
                                name="payment"
                                value={method.id}
                                checked={paymentMethod === method.id}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="mr-4 w-4 h-4 text-amber-600 border-gray-300 focus:ring-amber-500"
                              />
                              <div className="w-6 h-6 flex items-center justify-center mr-3">
                                <i className={`${method.icon} text-xl text-gray-600`}></i>
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{method.name}</div>
                                <div className="text-sm text-gray-600">{method.desc}</div>
                              </div>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* AGB und Datenschutz */}
                  <div className="border-t pt-6">
                    <div className="space-y-4">
                      <label className="flex items-start cursor-pointer">
                        <input
                          type="checkbox"
                          checked={agbAccepted}
                          onChange={(e) => setAgbAccepted(e.target.checked)}
                          className={`mr-3 mt-1 w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500 ${
                            errors.agb ? 'border-red-500' : ''
                          }`}
                        />
                        <span className="text-sm text-gray-700">
                          Ich akzeptiere die{' '}
                          <Link href="/agb" className="text-amber-600 hover:underline">
                            Allgemeinen Geschäftsbedingungen
                          </Link>{' '}
                          und das{' '}
                          <Link href="/widerrufsrecht" className="text-amber-600 hover:underline">
                            Widerrufsrecht
                          </Link>
                          . *
                        </span>
                      </label>
                      {errors.agb && <p className="text-red-500 text-sm ml-7">{errors.agb}</p>}

                      <label className="flex items-start cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacyAccepted}
                          onChange={(e) => setPrivacyAccepted(e.target.checked)}
                          className={`mr-3 mt-1 w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500 ${
                            errors.privacy ? 'border-red-500' : ''
                          }`}
                        />
                        <span className="text-sm text-gray-700">
                          Ich habe die{' '}
                          <Link href="/datenschutz" className="text-amber-600 hover:underline">
                            Datenschutzerklärung
                          </Link>{' '}
                          gelesen und akzeptiert. *
                        </span>
                      </label>
                      {errors.privacy && <p className="text-red-500 text-sm ml-7">{errors.privacy}</p>}
                    </div>
                  </div>

                  <div className="flex justify-between mt-8">
                    <button
                      onClick={handlePrevStep}
                      className="bg-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-400 transition-colors whitespace-nowrap"
                    >
                      Zurück
                    </button>
                    <button
                      onClick={handleNextStep}
                      className="bg-amber-600 text-white px-8 py-3 rounded-lg hover:bg-amber-700 transition-colors whitespace-nowrap"
                    >
                      Weiter
                    </button>
                  </div>
                </div>
              )}

              {/* Schritt 4: Bestätigung */}
              {currentStep === 4 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Bestellung bestätigen</h2>

                  {errors.submit && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700">{errors.submit}</p>
                    </div>
                  )}

                  <div className="space-y-6">
                    {/* Lieferadresse */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Lieferadresse</h3>
                      <p className="text-sm text-gray-700">
                        {deliveryData.firstName} {deliveryData.lastName}
                        <br />
                        {deliveryData.street} {deliveryData.houseNumber}
                        <br />
                        {deliveryData.postalCode} {deliveryData.city}
                        <br />
                        {deliveryData.email}
                        <br />
                        {deliveryData.phone}
                      </p>
                    </div>

                    {/* Rechnungsadresse */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Rechnungsadresse</h3>
                      {billingData.sameBilling ? (
                        <p className="text-sm text-gray-700">Identisch mit Lieferadresse</p>
                      ) : (
                        <p className="text-sm text-gray-700">
                          {billingData.company && `${billingData.company}\n`}
                          {billingData.firstName} {billingData.lastName}
                          <br />
                          {billingData.street} {billingData.houseNumber}
                          <br />
                          {billingData.postalCode} {billingData.city}
                        </p>
                      )}
                    </div>

                    {/* Zahlungsart */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Zahlungsart</h3>
                      <p className="text-sm text-gray-700">Barzahlung bei Lieferung</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 mt-6 md:mt-8">
                    <button
                      onClick={handlePrevStep}
                      className="w-full sm:w-auto bg-gray-300 text-gray-700 px-6 md:px-8 py-3 md:py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium text-center order-2 sm:order-1"
                    >
                      Zurück
                    </button>
                    <button
                      onClick={handleSubmitOrder}
                      disabled={isProcessing}
                      className="w-full sm:w-auto bg-green-600 text-white px-6 md:px-8 py-4 md:py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium text-center order-1 sm:order-2 text-sm md:text-base"
                    >
                      {isProcessing ? 'Verarbeitung...' : (
                        <>
                          <span className="block sm:hidden">Jetzt bestellen</span>
                          <span className="hidden sm:block">Jetzt kostenpflichtig bestellen</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bestellübersicht */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 lg:sticky lg:top-8">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6">Ihre Bestellung</h3>

              {/* Mobile: Kompakte Darstellung */}
              <div className="block md:hidden mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      {cartItems.length} {cartItems.length === 1 ? 'Artikel' : 'Artikel'}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {cartItems.reduce((total, item) => total + item.quantity, 0)} SRM
                    </span>
                  </div>
                  <div className="text-lg font-bold text-amber-600">
                    {subtotal.toFixed(2)} €
                  </div>
                </div>
                
                {/* Expandable Items List */}
                <details className="mt-3">
                  <summary className="text-sm text-amber-600 cursor-pointer hover:text-amber-700">
                    Details anzeigen
                  </summary>
                  <div className="mt-3 space-y-3">
                    {cartItems.map((item) => (
                      <div key={`mobile-${item.id}`} className="flex items-center space-x-3 text-sm">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{item.name}</p>
                          <p className="text-gray-600">{item.quantity} × {item.price.toFixed(2)} €</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {(item.price * item.quantity).toFixed(2)} €
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              </div>

              {/* Desktop: Vollständige Darstellung */}
              <div className="hidden md:block space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={`desktop-${item.id}`} className="flex items-center space-x-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">{item.name}</h4>
                      <p className="text-gray-600 text-sm">Menge: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {(item.price * item.quantity).toFixed(2)} €
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Zwischensumme</span>
                  <span className="text-gray-900">{subtotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-sm mb-4">
                  <span className="text-gray-600">Versandkosten</span>
                  <span className="text-gray-900">
                    €{shipping.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-4">
                  <span>Gesamtsumme</span>
                  <span>{total.toFixed(2)} €</span>
                </div>
              </div>

              {subtotal < 100 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <i className="ri-information-line mr-1"></i>
                    Noch {(100 - subtotal).toFixed(2)} € bis zum kostenlosen Versand!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
