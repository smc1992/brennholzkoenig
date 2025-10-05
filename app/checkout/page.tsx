'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { calculatePriceWithTiers } from '../../lib/pricing';
import { trackPurchase } from '@/components/GoogleAnalytics';
import { getCDNUrl } from '@/utils/cdn';
import { processOrderLoyaltyPoints } from '@/lib/loyaltyService';
// Stock monitoring wird über API-Route gehandhabt

// Funktion zur Generierung einer Kundennummer basierend auf Email
function generateCustomerNumber(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const numericPart = Math.abs(hash) % 89999 + 10000;
  return `KD-${String(numericPart).padStart(5, '0')}`;
}

// Funktion zum Abrufen oder Erstellen einer Kundennummer
async function getOrCreateCustomerNumber(email: string): Promise<string> {
  if (!email) return 'KD-GAST';
  
  try {
    console.log('🔍 Fetching customer for email:', email);
    
    // Prüfe ob Kunde bereits existiert und hole customer_number falls vorhanden
    const { data: existingCustomer, error: fetchError } = await supabase
      .from('customers')
      .select('id, customer_number, email')
      .eq('email', email)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Error fetching customer:', fetchError);
    }

    // Wenn Kunde existiert und bereits eine customer_number hat, verwende diese
    if (existingCustomer && existingCustomer.customer_number) {
      console.log('✅ Found existing customer with number:', existingCustomer.customer_number);
      return existingCustomer.customer_number;
    }

    // Generiere neue Kundennummer
    const newCustomerNumber = generateCustomerNumber(email);
    console.log('🔢 Generated new customer number:', newCustomerNumber);
    
    if (existingCustomer) {
      // Kunde existiert, aber hat keine customer_number - aktualisiere ihn
      try {
        const { error: updateError } = await supabase
          .from('customers')
          .update({ customer_number: newCustomerNumber })
          .eq('id', existingCustomer.id);
        
        if (updateError) {
          console.log('ℹ️ Could not update customer_number (column may not exist):', updateError.message);
        } else {
          console.log('✅ Updated existing customer with customer_number');
        }
      } catch (updateError) {
        console.log('ℹ️ customer_number column not available for update');
      }
    } else {
      // Kunde existiert nicht - erstelle neuen Kunden
      try {
        const { error: insertError } = await supabase
          .from('customers')
          .insert({
            email: email,
            customer_number: newCustomerNumber,
            first_name: '',
            last_name: ''
          });
        
        if (insertError) {
          console.log('ℹ️ Could not insert with customer_number (column may not exist):', insertError.message);
          // Fallback: Erstelle Kunde ohne customer_number
          await supabase
            .from('customers')
            .insert({
              email: email,
              first_name: '',
              last_name: ''
            });
        } else {
          console.log('✅ Created new customer with customer_number');
        }
      } catch (insertError) {
        console.log('ℹ️ customer_number column not available for insert');
      }
    }
    
    return newCustomerNumber;
  } catch (error) {
    console.error('💥 Error in getOrCreateCustomerNumber:', error);
    return generateCustomerNumber(email);
  }
}

// Using the centralized Supabase client from lib/supabase.ts

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
  unit: string;
  has_quantity_discount?: boolean;
}

interface DeliveryData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
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

// Typen für Lagerbestandsprüfungen (verhindert implizites any in Callbacks)
interface ProductStock {
  id: string;
  name: string;
  sku: string;
  stock_quantity: number;
}

type MovementType = 'in' | 'out' | 'adjustment';

interface InventoryMovement {
  movement_type: MovementType;
  quantity: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { products, subscribeToChanges, unsubscribeFromChanges } = useRealtimeSync();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Hilfsfunktion für CDN-URLs
  const getImageUrl = (url: string) => {
    if (!url) return '/api/placeholder?width=400&height=400&text=Bild+nicht+verfügbar';
    // Wenn es bereits eine vollständige URL ist, verwende sie direkt
    if (url.startsWith('http')) return url;
    // Wenn es ein absoluter Pfad ist (beginnt mit /), verwende ihn direkt
    if (url.startsWith('/')) return url;
    // Wenn es ein Storage-Filename ist, konvertiere zu CDN-URL
    return getCDNUrl(`products/${url}`);
  };
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
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [vatRate, setVatRate] = useState(19); // Standard-Steuersatz, wird aus DB geladen
  const [taxIncluded, setTaxIncluded] = useState(false); // Ob Preise Bruttopreise sind

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
    company: '',
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
      
      // Lade Steuersatz und Steuereinstellungen aus invoice_settings
      const { data: invoiceSettings } = await supabase
        .from('invoice_settings')
        .select('vat_rate, default_tax_included')
        .single();

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
      
      // Setze Steuersatz und Steuereinstellungen aus invoice_settings
        if (invoiceSettings) {
          if (invoiceSettings.vat_rate) {
            setVatRate(parseFloat(invoiceSettings.vat_rate));
            console.log('✅ Steuersatz geladen:', invoiceSettings.vat_rate + '%');
          }
          if (invoiceSettings.default_tax_included !== undefined) {
            setTaxIncluded(invoiceSettings.default_tax_included);
            console.log('✅ Steuereinstellung geladen: Preise sind', invoiceSettings.default_tax_included ? 'Brutto' : 'Netto');
            console.log('🔍 Debug: taxIncluded =', invoiceSettings.default_tax_included, 'vatRate =', invoiceSettings.vat_rate);
          }
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
          quantity: typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity,
          has_quantity_discount: item.has_quantity_discount || false
        }));
        setCartItems(normalizedCart);
      }

      // Lade angewendeten Rabattcode aus localStorage
      const savedDiscount = localStorage.getItem('appliedDiscount');
      if (savedDiscount) {
        try {
          setAppliedDiscount(JSON.parse(savedDiscount));
        } catch (error) {
          console.error('Error parsing saved discount:', error);
        }
      }
      
      setIsLoading(false);
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
      // Gesamtmenge NUR der SRM-Artikel für korrekte Tier-Logik
      const totalSRMQuantity = cartItems
        .filter((item) => item.unit === 'SRM')
        .reduce((total, item) => total + item.quantity, 0);

      const updatedCartItems = cartItems.map((cartItem) => {
        const realtimeProduct =
          products.find((p) => p.id && cartItem.id && p.id.toString() === cartItem.id.toString()) ||
          // Fallback: versuche über Namen zuzuordnen, falls IDs inkonsistent sind
          products.find((p) => p.name === cartItem.name);
        if (realtimeProduct) {
          // Neuberechnung: SRM-Artikel nutzen Gesamt-SRM-Menge, sonst eigene Menge
          const basePrice =
            typeof realtimeProduct.price === 'string'
              ? parseFloat(realtimeProduct.price)
              : realtimeProduct.price;
          const hasQuantityDiscount = (realtimeProduct as any).has_quantity_discount || false;
          const isSRM = (cartItem.unit || '').toUpperCase() === 'SRM';
          const quantityForTier = isSRM ? totalSRMQuantity : cartItem.quantity;
          const pricing = calculatePriceWithTiers(
            basePrice,
            quantityForTier,
            pricingTiers,
            minOrderQuantity,
            hasQuantityDiscount
          );

          return {
            ...cartItem,
            name: realtimeProduct.name,
            price: pricing.price,
            image_url: realtimeProduct.image_url,
            has_quantity_discount: hasQuantityDiscount,
          };
        }
        return cartItem;
      });

      // Nur aktualisieren wenn sich etwas geändert hat
      const hasChanges = updatedCartItems.some((item, index) =>
        item.name !== cartItems[index]?.name ||
        item.price !== cartItems[index]?.price ||
        item.image_url !== cartItems[index]?.image_url
      );

      if (hasChanges) {
        setCartItems(updatedCartItems);
        // Auch localStorage aktualisieren für Konsistenz
        localStorage.setItem('cart', JSON.stringify(updatedCartItems));
      }
    }
  }, [products, cartItems, pricingTiers, minOrderQuantity]);

  const calculateTotal = () => {
    const subtotalBrutto = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    const selectedOption = getDeliveryOptions().find((opt) => opt.type === selectedDelivery);
    const shippingBrutto = selectedOption ? selectedOption.price : 43.5;
    
    if (taxIncluded) {
      // Bruttopreise: Steuer ist bereits in den Preisen enthalten
      
      // 1. Rabatt vom Bruttopreis abziehen (wie gefordert)
      let discountAmountBrutto = 0;
      if (appliedDiscount) {
        if (appliedDiscount.discount_type === 'percentage') {
          discountAmountBrutto = Math.round((subtotalBrutto * appliedDiscount.discount_value) / 100 * 100) / 100;
        } else {
          discountAmountBrutto = Math.round(appliedDiscount.discount_value * 100) / 100;
        }
      }
      
      // 2. Zwischensumme brutto nach Rabatt
      const subtotalAfterDiscountBrutto = Math.max(0, subtotalBrutto - discountAmountBrutto);
      
      // 3. Netto-Beträge berechnen (mit korrekter Rundung)
      const subtotalAfterDiscountNetto = Math.round((subtotalAfterDiscountBrutto / (1 + vatRate / 100)) * 100) / 100;
      const shippingNetto = Math.round((shippingBrutto / (1 + vatRate / 100)) * 100) / 100;
      
      // 4. Gesamt-Netto-Betrag (Waren + Versand)
      const totalNetto = Math.round((subtotalAfterDiscountNetto + shippingNetto) * 100) / 100;
      
      // 5. MwSt.-Betrag berechnen (Waren + Versand)
      const taxAmountWaren = Math.round((subtotalAfterDiscountNetto * vatRate / 100) * 100) / 100;
      const taxAmountVersand = Math.round((shippingNetto * vatRate / 100) * 100) / 100;
      const taxAmountGesamt = Math.round((taxAmountWaren + taxAmountVersand) * 100) / 100;
      
      // 6. Gesamt-Brutto-Betrag
      const totalBrutto = Math.round((subtotalAfterDiscountBrutto + shippingBrutto) * 100) / 100;
      
      console.log('🧮 Brutto-Berechnung (Transparent):', {
        subtotalBrutto,
        discountAmountBrutto,
        subtotalAfterDiscountBrutto,
        subtotalAfterDiscountNetto,
        shippingBrutto,
        shippingNetto,
        totalNetto,
        taxAmountWaren,
        taxAmountVersand,
        taxAmountGesamt,
        totalBrutto,
        vatRate
      });
      
      return { 
        subtotal: subtotalBrutto, // Zwischensumme vor Rabatt (brutto)
        subtotalAfterDiscount: subtotalAfterDiscountBrutto, // Zwischensumme nach Rabatt (brutto)
        subtotalNetto: subtotalAfterDiscountNetto, // Netto-Zwischensumme nach Rabatt
        discountAmount: discountAmountBrutto, 
        shipping: shippingBrutto, 
        shippingNetto: shippingNetto,
        netAmount: totalNetto, 
        taxAmount: taxAmountGesamt, // MwSt. gesamt (Waren + Versand)
        taxAmountWaren: taxAmountWaren, // MwSt. nur Waren
        taxAmountVersand: taxAmountVersand, // MwSt. nur Versand
        taxRate: vatRate,
        total: totalBrutto 
      };
    } else {
      // Nettopreise: Steuer muss hinzugerechnet werden
      let discountAmount = 0;
      if (appliedDiscount) {
        if (appliedDiscount.discount_type === 'percentage') {
          discountAmount = Math.round((subtotalBrutto * appliedDiscount.discount_value) / 100 * 100) / 100;
        } else {
          discountAmount = Math.round(appliedDiscount.discount_value * 100) / 100;
        }
      }
      
      const subtotalAfterDiscount = Math.max(0, subtotalBrutto - discountAmount);
      const netAmount = Math.max(0, subtotalBrutto - discountAmount + shippingBrutto);
      const taxAmount = Math.round((netAmount * vatRate / 100) * 100) / 100;
      const total = Math.round((netAmount + taxAmount) * 100) / 100;
      
      return { 
        subtotal: subtotalBrutto, 
        subtotalAfterDiscount: subtotalAfterDiscount,
        subtotalNetto: subtotalAfterDiscount,
        discountAmount, 
        shipping: shippingBrutto, 
        shippingNetto: shippingBrutto,
        netAmount, 
        taxAmount, 
        taxAmountWaren: Math.round((subtotalAfterDiscount * vatRate / 100) * 100) / 100,
        taxAmountVersand: Math.round((shippingBrutto * vatRate / 100) * 100) / 100,
        taxRate: vatRate,
        total 
      };
    }
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
      // Scroll to top when moving to next step
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
    // Scroll to top when moving to previous step
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      // Create new customer with UPSERT logic
      const { data, error } = await supabase
        .from('customers')
        .upsert({
          ...customerData,
          created_at: new Date().toISOString(),
        }, {
          onConflict: 'email',
          ignoreDuplicates: false
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

    // 🛡️ KRITISCHE BESTANDSPRÜFUNG - Verhindert Überverkäufe
    try {
      console.log('🔍 Führe Bestandsprüfung durch...');
      
      // Hole aktuelle Bestände für alle Warenkorb-Artikel
      // IDs aus dem Warenkorb robust in Zahlen konvertieren, um Typ-Mismatches zu vermeiden
      const productIds = cartItems
        .map(item => Number(item.id))
        .filter(id => !Number.isNaN(id));
      const { data: currentProductsRaw, error: stockError } = await supabase
        .from('products')
        .select('id, name, sku, stock_quantity')
        .in('id', productIds);

      const currentProducts: ProductStock[] | null = (currentProductsRaw as ProductStock[] | null);

      if (stockError) {
        throw new Error(`Fehler beim Prüfen der Lagerbestände: ${stockError.message}`);
      }

      // Prüfe jeden Artikel auf verfügbaren Bestand
      const stockIssues: string[] = [];
      
      for (const cartItem of cartItems) {
        // Vergleiche IDs robust als String, da DB-IDs numerisch sein können
        const product = currentProducts?.find((p: ProductStock) => p.id?.toString() === cartItem.id?.toString());
        
        if (!product) {
          stockIssues.push(`Produkt "${cartItem.name}" wurde nicht gefunden.`);
          continue;
        }

        // Berechne aktuellen Bestand basierend auf Lagerbewegungen
        const { data: movementsRaw, error: movementError } = await supabase
          .from('inventory_movements')
          .select('movement_type, quantity')
          .eq('product_id', product.id);

        const movements: InventoryMovement[] | null = (movementsRaw as InventoryMovement[] | null);

        if (movementError) {
          console.error('Fehler beim Laden der Lagerbewegungen:', movementError);
          // Fallback auf stock_quantity aus products-Tabelle
        }

        let actualStock = product.stock_quantity;
        
        // Berechne aktuellen Bestand aus Bewegungen (genauer)
        if (movements && movements.length > 0) {
          actualStock = movements.reduce((stock: number, movement: InventoryMovement) => {
            if (movement.movement_type === 'in' || movement.movement_type === 'adjustment') {
              return stock + movement.quantity;
            } else if (movement.movement_type === 'out') {
              return stock - movement.quantity;
            }
            return stock;
          }, 0);
        }

        // Prüfe ob genügend Bestand vorhanden ist
        if (actualStock < cartItem.quantity) {
          if (actualStock <= 0) {
            stockIssues.push(`"${product.name}" ist ausverkauft (0 verfügbar, ${cartItem.quantity} angefordert).`);
          } else {
            stockIssues.push(`"${product.name}": Nur noch ${actualStock} ${cartItem.unit || 'Stück'} verfügbar, aber ${cartItem.quantity} angefordert.`);
          }
        }
      }

      // Wenn Bestandsprobleme gefunden wurden, Bestellung abbrechen
      if (stockIssues.length > 0) {
        setIsProcessing(false);
        
        const errorMessage = `❌ Bestellung kann nicht abgeschlossen werden:\n\n${stockIssues.join('\n')}\n\nBitte passen Sie Ihren Warenkorb an und versuchen Sie es erneut.`;
        
        alert(errorMessage);
        
        // Zurück zum Warenkorb-Schritt
        setCurrentStep(1);
        return;
      }

      console.log('✅ Bestandsprüfung erfolgreich - alle Artikel verfügbar');
      
    } catch (error) {
      console.error('❌ Kritischer Fehler bei der Bestandsprüfung:', error);
      setIsProcessing(false);
      alert('Fehler bei der Bestandsprüfung. Bitte versuchen Sie es erneut oder kontaktieren Sie den Support.');
      return;
    }

    try {
      let customerId = null;

      // Optimierte Kundenerstellung/Validierung
      const handleCustomerCreation = async () => {
        if (user) {
          // Get customer by user email
          const { data: existingCustomer } = await supabase
            .from('customers')
            .select('id')
            .eq('email', user.email)
            .single();

          if (existingCustomer && existingCustomer.id) {
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

          if (existingCustomer && existingCustomer.id) {
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
        return customerId;
      };

      // Kundenerstellung
      customerId = await handleCustomerCreation();
      const finalCustomerId = customerId === undefined ? null : customerId;
      
      console.log('Final Customer ID:', finalCustomerId, 'Type:', typeof finalCustomerId);

      // Create order with improved order number format
      const generateOrderNumber = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const randomNum = Math.floor(Math.random() * 9000) + 1000; // 4-digit random number
        return `BK-${year}${month}-${randomNum}`;
      };
      
      const orderNumber = generateOrderNumber();
      const { subtotal, discountAmount, shipping, netAmount, taxAmount, taxRate, total } = calculateTotal();

      // Validiere und bereinige alle Datenfelder für UUID-Kompatibilität
      const orderData = {
        order_number: orderNumber || `BK-${Date.now()}`,
        customer_id: finalCustomerId,
        status: 'pending',
        payment_method: paymentMethod || 'bar',
        delivery_first_name: deliveryData.firstName || '',
        delivery_last_name: deliveryData.lastName || '',
        delivery_email: deliveryData.email || '',
        delivery_phone: deliveryData.phone || '',
        delivery_company: deliveryData.company || '',
        delivery_street: deliveryData.street || '',
        delivery_house_number: deliveryData.houseNumber || '',
        delivery_postal_code: deliveryData.postalCode || '',
        delivery_city: deliveryData.city || '',
        delivery_notes: deliveryData.deliveryNotes || '',
        preferred_delivery_month: deliveryData.preferredDeliveryMonth || '',
        preferred_delivery_year: deliveryData.preferredDeliveryYear || new Date().getFullYear().toString(),
        billing_same_as_delivery: billingData.sameBilling !== undefined ? billingData.sameBilling : true,
        billing_company: billingData.company || '',
        billing_first_name: billingData.sameBilling ? (deliveryData.firstName || '') : (billingData.firstName || ''),
        billing_last_name: billingData.sameBilling ? (deliveryData.lastName || '') : (billingData.lastName || ''),
        billing_street: billingData.sameBilling ? (deliveryData.street || '') : (billingData.street || ''),
        billing_house_number: billingData.sameBilling ? (deliveryData.houseNumber || '') : (billingData.houseNumber || ''),
        billing_postal_code: billingData.sameBilling ? (deliveryData.postalCode || '') : (billingData.postalCode || ''),
        billing_city: billingData.sameBilling ? (deliveryData.city || '') : (billingData.city || ''),
        subtotal_amount: isNaN(subtotal) ? 0 : parseFloat(subtotal.toFixed(2)),
        discount_amount: isNaN(discountAmount) ? 0 : parseFloat((discountAmount || 0).toFixed(2)),
        discount_code_id: (appliedDiscount && appliedDiscount.id !== undefined && appliedDiscount.id !== null) ? appliedDiscount.id : null,
        delivery_price: isNaN(shipping) ? 0 : parseFloat(shipping.toFixed(2)),
        total_amount: isNaN(total) ? 0 : parseFloat(total.toFixed(2)),
        delivery_method: selectedDelivery || 'standard',
        delivery_type: selectedDelivery || 'standard',
      };
      
      console.log('🔍 Order Data Validation:');
      console.log('customer_id:', finalCustomerId, 'Type:', typeof finalCustomerId);
      console.log('discount_code_id:', orderData.discount_code_id, 'Type:', typeof orderData.discount_code_id);
      console.log('payment_method:', orderData.payment_method, 'Type:', typeof orderData.payment_method);
      console.log('delivery_method:', orderData.delivery_method, 'Type:', typeof orderData.delivery_method);
      console.log('delivery_type:', orderData.delivery_type, 'Type:', typeof orderData.delivery_type);
      console.log('Complete orderData:', orderData);

      console.log('Bestelldaten:', orderData);

      // Erstelle Bestellung
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error('Bestellfehler:', orderError);
        throw new Error(`Fehler beim Erstellen der Bestellung: ${orderError.message}`);
      }

      if (!order || !order.id) {
        console.error('Bestellung konnte nicht erstellt werden: order ist null oder hat keine ID');
        throw new Error('Bestellung konnte nicht erstellt werden: Keine gültige Bestell-ID erhalten');
      }

      console.log('Bestellung erstellt:', order);

      // Lade Steuereinstellungen für tax_included
      const { data: taxSettings } = await supabase
        .from('invoice_settings')
        .select('default_tax_included')
        .single();
      
      const defaultTaxIncluded = taxSettings?.default_tax_included || false;
      
      // Erstelle oder hole Kundennummer für diese Email
      const customerNumber = await getOrCreateCustomerNumber(deliveryData.email);
      console.log('📋 Customer number for order:', customerNumber);
      
      // Aktualisiere Order mit Kundennummer (falls Spalte existiert)
      try {
        await supabase
          .from('orders')
          .update({ customer_number: customerNumber })
          .eq('id', order.id);
      } catch (error) {
        console.log('ℹ️ customer_number column not available yet:', error);
      }
      
      // Add order items
      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        product_name: item.name,
        product_category: 'Brennholz',
        quantity: item.quantity,
        unit_price: parseFloat(item.price.toFixed(2)),
        total_price: parseFloat((item.price * item.quantity).toFixed(2)),
        tax_included: defaultTaxIncluded,
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

      // Clear cart and discount BEFORE redirect for immediate UI feedback
      localStorage.removeItem('cart');
      localStorage.removeItem('appliedDiscount');

      // Enhanced Conversions: speichere Kundendaten kurzzeitig für die Bestätigungsseite
      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          const ecUserData = {
            email: deliveryData.email || '',
            phone: deliveryData.phone || '',
            first_name: deliveryData.firstName || '',
            last_name: deliveryData.lastName || '',
            street: `${deliveryData.street || ''} ${deliveryData.houseNumber || ''}`.trim(),
            city: deliveryData.city || '',
            postal_code: deliveryData.postalCode || '',
            country: 'DE'
          };
          window.sessionStorage.setItem('ec_user_data', JSON.stringify(ecUserData));
        }
      } catch (e) {
        console.warn('Enhanced Conversions: SessionStorage nicht verfügbar oder fehlgeschlagen:', e);
      }

      // FRÜHE WEITERLEITUNG - Benutzer sieht sofort die Bestätigungsseite
      router.push(`/bestellbestaetigung?order=${orderNumber}`);

      // Alle weiteren Operationen im Hintergrund (non-blocking)
      Promise.allSettled([
        // Lagerbestand-Updates parallel verarbeiten
        Promise.all(cartItems.map(async (item) => {
          try {
            // Get current product data
            const { data: productData, error: productError } = await supabase
              .from('products')
              .select('stock_quantity')
              .eq('id', item.id)
              .single();

            if (productError) {
              console.error('Fehler beim Laden der Produktdaten:', productError);
              return;
            }

            const currentStock = productData?.stock_quantity || 0;
            const newStock = Math.max(0, currentStock - item.quantity);

            // Update product stock
            const { error: stockError } = await supabase
              .from('products')
              .update({ 
                stock_quantity: newStock,
                updated_at: new Date().toISOString()
              })
              .eq('id', item.id);

            if (stockError) {
              console.error('Fehler beim Aktualisieren des Lagerbestands:', stockError);
              return;
            }

            // Create inventory movement record
            const { error: movementError } = await supabase
              .from('inventory_movements')
              .insert({
                product_id: item.id,
                movement_type: 'out',
                quantity: item.quantity,
                reference_id: order.id,
                notes: `Verkauf - Bestellung ${orderNumber}`,
                created_by: 'system',
                created_at: new Date().toISOString()
              });

            if (movementError) {
              console.error('Fehler beim Erstellen der Lagerbewegung:', movementError);
            }

            console.log(`Lagerbestand aktualisiert für ${item.name}: ${currentStock} → ${newStock}`);
            
            // Check for low stock and send alert if necessary
            try {
              const response = await fetch('/api/stock-monitoring/check', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ productId: item.id }),
              });
              
              if (!response.ok) {
                console.warn(`Stock-Monitoring-API-Aufruf fehlgeschlagen für ${item.name}`);
              }
            } catch (stockCheckError) {
              console.error(`Fehler bei der Lagerbestand-Prüfung für ${item.name}:`, stockCheckError);
            }
          } catch (error) {
            console.error(`Fehler beim Aktualisieren des Lagers für ${item.name}:`, error);
          }
        })),

        // E-Mail-Versand im Hintergrund (nutzt persistierte DB-Order-Items)
        (async () => {
          try {
            // Lade die gespeicherten Order-Items aus der DB, um konsistente Preise (unit_price) zu verwenden
            const { data: dbOrderItems, error: loadItemsError } = await supabase
              .from('order_items')
              .select('product_name, quantity, unit_price')
              .eq('order_id', order.id);

            if (loadItemsError) {
              console.warn('⚠️ Konnte Order-Items für E-Mail nicht laden, verwende Checkout-Daten:', loadItemsError);
            }

            const emailItems = (dbOrderItems && Array.isArray(dbOrderItems) && dbOrderItems.length > 0)
              ? dbOrderItems.map((item: any) => ({
                  name: item.product_name,
                  quantity: item.quantity,
                  // Unit-Preis aus DB bevorzugen
                  unit_price: typeof item.unit_price === 'string' ? parseFloat(item.unit_price) : item.unit_price,
                  unit: 'SRM',
                }))
              : cartItems.map((item) => ({
                  name: item.name,
                  quantity: item.quantity,
                  unit_price: item.price,
                  unit: item.unit || 'SRM',
                }));

            const emailData = {
              orderData: {
                orderNumber: orderNumber,
                id: order.id,
                total: total,
                // Route akzeptiert sowohl unit_price als auch price; wir senden unit_price explizit
                items: emailItems,
                totalAmount: total.toString(),
                deliveryAddress: `${deliveryData.firstName} ${deliveryData.lastName}\n${deliveryData.street} ${deliveryData.houseNumber}\n${deliveryData.postalCode} ${deliveryData.city}`,
              },
              customerData: {
                name: `${deliveryData.firstName} ${deliveryData.lastName}`,
                email: deliveryData.email,
                phone: deliveryData.phone,
                address: `${deliveryData.street} ${deliveryData.houseNumber}`,
                postalCode: deliveryData.postalCode,
                city: deliveryData.city
              },
              customerEmail: deliveryData.email,
              customerName: `${deliveryData.firstName} ${deliveryData.lastName}`,
              templateType: 'order_confirmation'
            };

            console.log('Sende Bestellbestätigung an:', deliveryData.email);

            const emailResponse = await fetch('/api/send-order-email', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(emailData),
            });

            const emailResult = await emailResponse.json();

            if (emailResult.success) {
              console.log('✅ Bestellbestätigung erfolgreich gesendet');
            } else {
              console.error('❌ E-Mail-Versand fehlgeschlagen:', emailResult.error);
            }
          } catch (emailError) {
            console.error('❌ Fehler beim E-Mail-Versand:', emailError);
          }
        })(),

        // Discount-Update im Hintergrund
        (async () => {
          if (appliedDiscount && appliedDiscount.id) {
            try {
              await supabase
                .from('discount_codes')
                .update({ 
                  usage_count: (appliedDiscount.usage_count || 0) + 1,
                  updated_at: new Date().toISOString()
                })
                .eq('id', appliedDiscount.id);
            } catch (error) {
              console.error('Error updating discount usage:', error);
            }
          }
        })(),

        // Analytics-Tracking im Hintergrund
        (async () => {
          try {
            const purchaseItems = cartItems.map(item => ({
              id: item.id,
              name: item.name,
              category: 'Brennholz',
              quantity: item.quantity,
              price: parseFloat(item.price.toString())
            }));

            trackPurchase(
              orderNumber,
              total,
              purchaseItems,
              taxAmount,
              shipping
            );
          } catch (error) {
            console.error('Error tracking purchase event:', error);
          }
        })(),

        // Loyalty-Punktevergabe im Hintergrund
        (async () => {
          try {
            console.log('🎯 Starte Loyalty-Punktevergabe für Bestellung:', orderNumber);
            
            const orderItems = cartItems.map(item => ({
              product_name: item.name,
              product_category: 'Brennholz', // Kann später erweitert werden
              quantity: item.quantity,
              unit_price: item.price,
              total_price: item.price * item.quantity
            }));

            const loyaltyResult = await processOrderLoyaltyPoints(
              customerNumber,
              orderNumber,
              total,
              orderItems
            );

            if (loyaltyResult.success && loyaltyResult.pointsAwarded > 0) {
              console.log(`🎉 ${loyaltyResult.pointsAwarded} Treuepunkte erfolgreich vergeben!`);
            } else if (loyaltyResult.error) {
              console.error('❌ Fehler bei Loyalty-Punktevergabe:', loyaltyResult.error);
            } else {
              console.log('ℹ️ Keine Punkte vergeben (Programm deaktiviert oder 0 Punkte)');
            }
          } catch (error) {
            console.error('❌ Fehler bei Loyalty-Punktevergabe:', error);
          }
        })()
      ]).then((results) => {
        console.log('🔄 Hintergrund-Operationen abgeschlossen:');
        results.forEach((result, index) => {
          const operations = ['Lagerbestand-Updates', 'E-Mail-Versand', 'Discount-Update', 'Analytics-Tracking'];
          if (result.status === 'fulfilled') {
            console.log(`✅ ${operations[index]} erfolgreich`);
          } else {
            console.error(`❌ ${operations[index]} fehlgeschlagen:`, result.reason);
          }
        });
      });

    } catch (error: any) {
      console.error('Fehler beim Verarbeiten der Bestellung:', error);
      setErrors({ submit: error.message || 'Fehler beim Verarbeiten der Bestellung. Bitte versuchen Sie es erneut.' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Berechne Preise für die Anzeige mit useMemo für Performance
  const { subtotal, discountAmount, shipping, total } = useMemo(() => calculateTotal(), [cartItems, appliedDiscount, selectedDelivery]);

  // Prüfe, ob der Warenkorb leer ist oder die Mindestbestellmenge nicht erreicht wird
  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const isCartEmpty = cartItems.length === 0 && !isLoading;
  const isBelowMinimumQuantity = totalQuantity < minOrderQuantity && !isLoading;
  
  // Zeige Loading-Spinner während des Ladens
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C04020]"></div>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">Warenkorb wird geladen...</h1>
            <p className="text-gray-600">Bitte warten Sie einen Moment.</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (isCartEmpty || isBelowMinimumQuantity) {
    return (
      <div className="min-h-screen bg-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <div className="w-16 h-16 flex items-center justify-center bg-red-100 rounded-full mx-auto mb-6">
          <i className="ri-shopping-cart-line text-2xl text-[#C04020]"></i>
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
            <Link href="/shop" className="inline-block bg-[#C04020] text-white px-8 py-3 rounded-lg hover:bg-[#A03318] transition-colors whitespace-nowrap">
              Zum Shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8" style={{overflow: 'hidden', paddingTop: '120px'}}>
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12" style={{overflow: 'hidden'}}>
        {/* Fortschrittsanzeige */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6 md:mb-8">
          {/* Mobile Progress Indicator */}
          <div className="block md:hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-gray-600">
                Schritt {currentStep} von 4
              </div>
              <div className="text-sm font-medium text-[#C04020]">
                {currentStep === 1 && 'Lieferadresse'}
                {currentStep === 2 && 'Rechnungsadresse'}
                {currentStep === 3 && 'Lieferart & Zahlungsart'}
                {currentStep === 4 && 'Bestätigung'}
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-[#C04020] h-2 rounded-full transition-all duration-300"
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
                    currentStep >= step ? 'bg-[#C04020] text-white' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step}
                </div>
                <div className={`ml-3 text-sm font-medium ${currentStep >= step ? 'text-[#C04020]' : 'text-gray-500'}`}>
                  {step === 1 && 'Lieferadresse'}
                  {step === 2 && 'Rechnungsadresse'}
                  {step === 3 && 'Lieferart & Zahlungsart'}
                  {step === 4 && 'Bestätigung'}
                </div>
                {index < 3 && (
                  <div className={`mx-4 h-px flex-1 ${currentStep > step ? 'bg-[#C04020]' : 'bg-gray-200'}`}></div>
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
                <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-blue-900">Bereits Kunde?</h3>
                      <p className="text-sm text-blue-700">Melden Sie sich an, um Ihre Daten automatisch zu übernehmen.</p>
                    </div>
                    <button
                      onClick={() => setShowLogin(!showLogin)}
                      className="bg-[#C04020] text-white px-4 py-2 rounded-lg hover:bg-[#A03318] transition-colors whitespace-nowrap text-sm font-medium w-full sm:w-auto"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <input
                          type="password"
                          placeholder="Passwort"
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <button
                          onClick={handleLogin}
                          className="bg-[#C04020] text-white px-4 py-2 rounded-lg hover:bg-[#A03318] transition-colors whitespace-nowrap text-sm font-medium w-full sm:w-auto"
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
                <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
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
                        } focus:ring-2 focus:ring-[#C04020] focus:border-transparent`}
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

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Firmenname (optional)
                      </label>
                      <input
                        type="text"
                        value={deliveryData.company}
                        onChange={(e) => setDeliveryData({ ...deliveryData, company: e.target.value })}
                        placeholder="Firmenname eingeben..."
                        className="w-full px-4 py-3 border rounded-lg text-sm border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
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
                      className="bg-[#C04020] text-white px-8 py-3 rounded-lg hover:bg-[#A03318] transition-colors whitespace-nowrap"
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
                      className="w-full sm:w-auto bg-gray-200 text-gray-800 px-6 md:px-8 py-3 md:py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium text-center order-2 sm:order-1"
                    >
                      Zurück
                    </button>
                    <button
                      onClick={handleNextStep}
                      className="w-full sm:w-auto bg-[#C04020] text-white px-6 md:px-8 py-3 md:py-3 rounded-lg hover:bg-[#A03318] transition-colors font-medium text-center order-1 sm:order-2"
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
                            className={`border-2 rounded-lg p-3 sm:p-4 transition-colors ${
                              selectedDelivery === option.type ? 'border-amber-600 bg-amber-50' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="flex items-start sm:items-center">
                                <input
                                  type="radio"
                                  name="delivery"
                                  value={option.type}
                                  checked={selectedDelivery === option.type}
                                  onChange={(e) => setSelectedDelivery(e.target.value)}
                                  className="mr-3 sm:mr-4 w-4 h-4 text-amber-600 border-gray-300 focus:ring-amber-500 mt-0.5 sm:mt-0 flex-shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-gray-900 text-sm sm:text-base">{option.name}</div>
                                  <div className="text-xs sm:text-sm text-gray-600">
                                    {option.type === 'express' ? 'Schnellste Option' : 'Günstigste Option'}
                                  </div>
                                </div>
                              </div>
                              <div className="font-bold text-amber-600 text-base sm:text-lg text-center sm:text-right">€{option.price.toFixed(2)}</div>
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
                          desc: 'nur zahlen in bar',
                        },
                      ].map((method) => (
                        <label key={method.id} className="block cursor-pointer">
                          <div
                            className={`border-2 rounded-lg p-3 sm:p-4 transition-colors ${
                              paymentMethod === method.id ? 'border-amber-600 bg-amber-50' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-start sm:items-center">
                              <input
                                type="radio"
                                name="payment"
                                value={method.id}
                                checked={paymentMethod === method.id}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="mr-3 sm:mr-4 w-4 h-4 text-amber-600 border-gray-300 focus:ring-amber-500 mt-0.5 sm:mt-0 flex-shrink-0"
                              />
                              <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                                <i className={`${method.icon} text-lg sm:text-xl text-gray-600`}></i>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-gray-900 text-sm sm:text-base">{method.name}</div>
                                <div className="text-xs sm:text-sm text-gray-600">{method.desc}</div>
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
                          className={`mr-3 mt-0.5 w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500 flex-shrink-0 ${
                            errors.agb ? 'border-red-500' : ''
                          }`}
                        />
                        <span className="text-xs sm:text-sm text-gray-700 leading-relaxed">
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
                      {errors.agb && <p className="text-red-500 text-xs sm:text-sm ml-7">{errors.agb}</p>}

                      <label className="flex items-start cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacyAccepted}
                          onChange={(e) => setPrivacyAccepted(e.target.checked)}
                          className={`mr-3 mt-0.5 w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500 flex-shrink-0 ${
                            errors.privacy ? 'border-red-500' : ''
                          }`}
                        />
                        <span className="text-xs sm:text-sm text-gray-700 leading-relaxed">
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
                      className="bg-gray-200 text-gray-800 px-8 py-3 rounded-lg hover:bg-gray-300 transition-colors whitespace-nowrap"
                    >
                      Zurück
                    </button>
                    <button
                      onClick={handleNextStep}
                      className="bg-[#C04020] text-white px-8 py-3 rounded-lg hover:bg-[#A03318] transition-colors whitespace-nowrap"
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
                      className="w-full sm:w-auto bg-gray-200 text-gray-800 px-6 md:px-8 py-3 md:py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium text-center order-2 sm:order-1"
              >
                Zurück
              </button>
              <button
                 onClick={handleSubmitOrder}
                 disabled={isProcessing}
                 className="w-full sm:w-auto bg-[#C04020] text-white px-6 md:px-8 py-4 md:py-3 rounded-lg hover:bg-[#A03318] transition-colors disabled:opacity-50 font-medium text-center order-1 sm:order-2 text-sm md:text-base"
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
                  {appliedDiscount && (
                    <div className="mt-2 text-sm text-green-600">
                      Rabatt ({appliedDiscount.code}): -{discountAmount.toFixed(2)} €
                    </div>
                  )}
                </div>
                
                {/* Expandable Items List */}
                <details className="mt-3">
                  <summary className="text-sm text-amber-600 cursor-pointer hover:text-amber-700">
                    Details anzeigen
                  </summary>
                  <div className="mt-3 space-y-3">
                    {cartItems.map((item) => (
                      <div key={`mobile-${item.id}`} className="flex items-center space-x-3 text-sm">
                        <div className="w-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0" style={{height: '80px'}}>
                          <img
                            src={getImageUrl(item.image_url)}
                            alt={item.name}
                            className="w-full object-cover object-center"
                            style={{height: '80px'}}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/api/placeholder?width=80&height=80';
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{item.name}</p>
                          <p className="text-gray-600">{item.quantity} × {item.price.toFixed(2)} €</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900 whitespace-nowrap">
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
                    <div className="w-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0" style={{height: '96px'}}>
                      <img
                        src={getImageUrl(item.image_url)}
                        alt={item.name}
                        className="w-full object-cover object-center hover:scale-105 transition-transform duration-300"
                        style={{height: '96px'}}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/api/placeholder?width=96&height=96';
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">{item.name}</h4>
                      <p className="text-gray-600 text-sm">Menge: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 whitespace-nowrap">
                        {(item.price * item.quantity).toFixed(2)} €
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                {/* Zwischensumme */}
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Zwischensumme</span>
                  <span className="text-gray-900 whitespace-nowrap">
                    {calculateTotal().subtotal.toFixed(2)} €
                  </span>
                </div>
                
                {/* Rabatt */}
                {appliedDiscount && (
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-green-600">Rabatt ({appliedDiscount.code})</span>
                    <span className="text-green-600 whitespace-nowrap">–{calculateTotal().discountAmount.toFixed(2)} €</span>
                  </div>
                )}
                
                {/* Versandkosten */}
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Versandkosten</span>
                  <span className="text-gray-900 whitespace-nowrap">
                    {calculateTotal().shipping.toFixed(2)} €
                  </span>
                </div>
                
                {/* MwSt. Hinweis */}
                <div className="flex justify-between text-xs text-gray-500 mb-4">
                  <span>inkl. {calculateTotal().taxRate}% MwSt.</span>
                  <span className="whitespace-nowrap">{calculateTotal().taxAmount.toFixed(2)} €</span>
                </div>
                {/* Gesamtsumme */}
                <div className="flex justify-between text-lg font-bold border-t pt-4">
                  <span>Gesamtsumme</span>
                  <div className="text-right">
                    <div className="text-lg font-bold whitespace-nowrap">{calculateTotal().total.toFixed(2)} €</div>
                  </div>
                </div>
              </div>

              {subtotal < 100 && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg">
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
