import { NextRequest, NextResponse } from 'next/server';
import { sendTemplateEmail, formatProductList, formatAddress } from '@/lib/emailTemplateEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = false;

interface ShippingData {
  customer: {
    name: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  order: {
    id: string;
    number: string;
    total?: number;
    date?: string;
    currency?: string;
  };
  shipping: {
    trackingNumber: string;
    carrier: string;
    method?: string;
    estimatedDelivery?: string;
    trackingUrl?: string;
  };
  products?: Array<{
    name: string;
    quantity: number;
    price?: number;
    description?: string;
  }>;
  delivery?: {
    address: any;
  };
  adminNotification?: {
    enabled: boolean;
    email?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const shippingData: ShippingData = await request.json();
    
    console.log('[ShippingNotification] Neue Versandbenachrichtigung angefordert:', {
      orderId: shippingData.order.id,
      customerEmail: shippingData.customer.email,
      trackingNumber: shippingData.shipping.trackingNumber
    });

    // Validierung der erforderlichen Daten
    if (!shippingData.customer?.email) {
      return NextResponse.json(
        { success: false, error: 'Kunden-E-Mail ist erforderlich' },
        { status: 400 }
      );
    }

    if (!shippingData.order?.number) {
      return NextResponse.json(
        { success: false, error: 'Bestellnummer ist erforderlich' },
        { status: 400 }
      );
    }

    if (!shippingData.shipping?.trackingNumber) {
      return NextResponse.json(
        { success: false, error: 'Sendungsverfolgungsnummer ist erforderlich' },
        { status: 400 }
      );
    }

    // Template-Daten vorbereiten
    const templateData = {
      customer_name: shippingData.customer.name || 
                    (shippingData.customer.firstName && shippingData.customer.lastName 
                      ? `${shippingData.customer.firstName} ${shippingData.customer.lastName}` 
                      : 'Kunde'),
      customer_email: shippingData.customer.email,
      order_number: shippingData.order.number,
      order_total: shippingData.order.total ? `${shippingData.order.total.toFixed(2)} ${shippingData.order.currency || '€'}` : '',
      order_date: shippingData.order.date || new Date().toLocaleDateString('de-DE'),
      delivery_address: shippingData.delivery?.address ? formatAddress(shippingData.delivery.address) : '',
      product_list: formatProductList(shippingData.products || []),
      tracking_number: shippingData.shipping.trackingNumber,
      shipping_carrier: shippingData.shipping.carrier,
      shipping_method: shippingData.shipping.method || 'Standard',
      estimated_delivery: shippingData.shipping.estimatedDelivery || 'Wird bekannt gegeben',
      tracking_url: shippingData.shipping.trackingUrl || `https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?lang=de&idc=${shippingData.shipping.trackingNumber}`,
      shipping_date: new Date().toLocaleDateString('de-DE')
    };

    console.log('[ShippingNotification] Template-Daten vorbereitet:', {
      customer_name: templateData.customer_name,
      order_number: templateData.order_number,
      tracking_number: templateData.tracking_number
    });

    // Admin-E-Mail-Einstellungen
    const adminNotification = {
      ccAdmin: shippingData.adminNotification?.enabled || false, // Standard: Keine Admin-Benachrichtigung bei Versand
      adminEmail: shippingData.adminNotification?.email || 'info@brennholz-koenig.de'
    };

    // Versandbenachrichtigung senden
    const result = await sendTemplateEmail(
      'shipping_notification',
      shippingData.customer.email,
      templateData,
      adminNotification
    );

    if (result.success) {
      console.log('[ShippingNotification] E-Mail erfolgreich gesendet:', {
        messageId: result.messageId,
        recipient: shippingData.customer.email
      });

      return NextResponse.json({
        success: true,
        message: 'Versandbenachrichtigung erfolgreich gesendet',
        messageId: result.messageId,
        recipient: shippingData.customer.email,
        trackingNumber: shippingData.shipping.trackingNumber
      });
    } else {
      console.error('[ShippingNotification] Fehler beim Senden der E-Mail:', result.error);
      
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Unbekannter Fehler beim Senden der E-Mail'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[ShippingNotification] Unerwarteter Fehler:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Interner Serverfehler beim Senden der Versandbenachrichtigung'
      },
      { status: 500 }
    );
  }
}

// GET-Endpoint für Testzwecke
export async function GET() {
  return NextResponse.json({
    message: 'Shipping Notification API',
    endpoints: {
      POST: '/api/send-shipping-notification',
      description: 'Sendet automatische Versandbenachrichtigungen basierend auf E-Mail-Templates'
    },
    requiredFields: {
      customer: {
        name: 'string',
        email: 'string (required)'
      },
      order: {
        id: 'string',
        number: 'string (required)',
        total: 'number (optional)',
        date: 'string (optional)'
      },
      shipping: {
        trackingNumber: 'string (required)',
        carrier: 'string (required)',
        method: 'string (optional)',
        estimatedDelivery: 'string (optional)',
        trackingUrl: 'string (optional)'
      },
      products: 'array (optional)',
      delivery: 'object (optional)',
      adminNotification: 'object (optional)'
    },
    example: {
      customer: {
        name: 'Max Mustermann',
        email: 'max@example.com'
      },
      order: {
        id: 'order_123',
        number: 'BK-2024-001',
        total: 89.99
      },
      shipping: {
        trackingNumber: 'DHL123456789',
        carrier: 'DHL',
        method: 'Standard',
        estimatedDelivery: '2024-01-15',
        trackingUrl: 'https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?lang=de&idc=DHL123456789'
      },
      products: [
        {
          name: 'Brennholz Buche 33cm',
          quantity: 1,
          price: 79.99
        }
      ],
      adminNotification: {
        enabled: false
      }
    }
  });
}