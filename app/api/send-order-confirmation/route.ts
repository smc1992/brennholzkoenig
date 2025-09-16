import { NextRequest, NextResponse } from 'next/server';
import { sendTemplateEmail, formatProductList, formatAddress } from '@/lib/emailTemplateEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = false;

interface OrderData {
  customer: {
    name: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  order: {
    id: string;
    number: string;
    total: number;
    date?: string;
    currency?: string;
  };
  products: Array<{
    name: string;
    quantity: number;
    price: number;
    description?: string;
  }>;
  delivery?: {
    address: any;
    method?: string;
    estimatedDate?: string;
  };
  payment?: {
    method: string;
    status: string;
  };
  adminNotification?: {
    enabled: boolean;
    email?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const orderData: OrderData = await request.json();
    
    console.log('[OrderConfirmation] Neue Bestellbestätigung angefordert:', {
      orderId: orderData.order.id,
      customerEmail: orderData.customer.email,
      total: orderData.order.total
    });

    // Validierung der erforderlichen Daten
    if (!orderData.customer?.email) {
      return NextResponse.json(
        { success: false, error: 'Kunden-E-Mail ist erforderlich' },
        { status: 400 }
      );
    }

    if (!orderData.order?.number) {
      return NextResponse.json(
        { success: false, error: 'Bestellnummer ist erforderlich' },
        { status: 400 }
      );
    }

    // Template-Daten vorbereiten
    const templateData = {
      customer_name: orderData.customer.name || 
                    (orderData.customer.firstName && orderData.customer.lastName 
                      ? `${orderData.customer.firstName} ${orderData.customer.lastName}` 
                      : 'Kunde'),
      customer_email: orderData.customer.email,
      order_number: orderData.order.number,
      order_total: `${orderData.order.total.toFixed(2)} ${orderData.order.currency || '€'}`,
      order_date: orderData.order.date || new Date().toLocaleDateString('de-DE'),
      delivery_address: orderData.delivery?.address ? formatAddress(orderData.delivery.address) : 'Keine Lieferadresse angegeben',
      product_list: formatProductList(orderData.products || []),
      tracking_number: '', // Wird später bei Versand gesetzt
      delivery_method: orderData.delivery?.method || 'Standard',
      estimated_delivery: orderData.delivery?.estimatedDate || 'Wird bekannt gegeben',
      payment_method: orderData.payment?.method || 'Unbekannt',
      payment_status: orderData.payment?.status || 'Ausstehend'
    };

    console.log('[OrderConfirmation] Template-Daten vorbereitet:', {
      customer_name: templateData.customer_name,
      order_number: templateData.order_number,
      order_total: templateData.order_total
    });

    // Admin-E-Mail-Einstellungen
    const adminNotification = {
      ccAdmin: orderData.adminNotification?.enabled || true, // Standard: Admin benachrichtigen
      adminEmail: orderData.adminNotification?.email || 'info@brennholz-koenig.de'
    };

    // Bestellbestätigung senden
    const result = await sendTemplateEmail(
      'order_confirmation',
      orderData.customer.email,
      templateData,
      adminNotification
    );

    if (result.success) {
      console.log('[OrderConfirmation] E-Mail erfolgreich gesendet:', {
        messageId: result.messageId,
        recipient: orderData.customer.email
      });

      return NextResponse.json({
        success: true,
        message: 'Bestellbestätigung erfolgreich gesendet',
        messageId: result.messageId,
        recipient: orderData.customer.email
      });
    } else {
      console.error('[OrderConfirmation] Fehler beim Senden der E-Mail:', result.error);
      
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Unbekannter Fehler beim Senden der E-Mail'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[OrderConfirmation] Unerwarteter Fehler:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Interner Serverfehler beim Senden der Bestellbestätigung'
      },
      { status: 500 }
    );
  }
}

// GET-Endpoint für Testzwecke
export async function GET() {
  return NextResponse.json({
    message: 'Order Confirmation API',
    endpoints: {
      POST: '/api/send-order-confirmation',
      description: 'Sendet automatische Bestellbestätigungen basierend auf E-Mail-Templates'
    },
    requiredFields: {
      customer: {
        name: 'string',
        email: 'string (required)'
      },
      order: {
        id: 'string',
        number: 'string (required)',
        total: 'number',
        date: 'string (optional)',
        currency: 'string (optional, default: €)'
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
        total: 89.99,
        currency: '€'
      },
      products: [
        {
          name: 'Brennholz Buche 33cm',
          quantity: 1,
          price: 79.99
        }
      ],
      delivery: {
        address: {
          name: 'Max Mustermann',
          street: 'Musterstraße 123',
          zipCode: '12345',
          city: 'Musterstadt'
        }
      },
      adminNotification: {
        enabled: true,
        email: 'admin@brennholz-koenig.de'
      }
    }
  });
}