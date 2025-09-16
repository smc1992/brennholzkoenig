import { NextRequest, NextResponse } from 'next/server';
import { sendTemplateEmail, sendOrderConfirmation, sendShippingNotification, sendAdminNewOrderNotification } from '@/lib/emailTemplateService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, templateKey, to, variables, orderData, shippingData, adminData } = body;

    let result;

    switch (type) {
      case 'template':
        if (!templateKey || !to || !variables) {
          return NextResponse.json(
            { success: false, error: 'templateKey, to und variables sind erforderlich' },
            { status: 400 }
          );
        }
        result = await sendTemplateEmail(templateKey, to, variables);
        break;

      case 'order_confirmation':
        if (!to || !orderData) {
          return NextResponse.json(
            { success: false, error: 'to und orderData sind erforderlich' },
            { status: 400 }
          );
        }
        result = await sendOrderConfirmation(to, orderData);
        break;

      case 'shipping_notification':
        if (!to || !shippingData) {
          return NextResponse.json(
            { success: false, error: 'to und shippingData sind erforderlich' },
            { status: 400 }
          );
        }
        result = await sendShippingNotification(to, shippingData);
        break;

      case 'admin_notification':
        if (!to || !adminData) {
          return NextResponse.json(
            { success: false, error: 'to und adminData sind erforderlich' },
            { status: 400 }
          );
        }
        result = await sendAdminNewOrderNotification(to, adminData);
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Unbekannter E-Mail-Typ' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in send-template-email API:', error);
    return NextResponse.json(
      { success: false, error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

// Beispiel-Requests:
/*
// Template-basierte E-Mail
POST /api/send-template-email
{
  "type": "template",
  "templateKey": "order_confirmation",
  "to": "kunde@example.com",
  "variables": {
    "customer_name": "Max Mustermann",
    "order_id": "BHK-12345",
    "order_date": "2024-01-15",
    "total_amount": "299.50",
    "delivery_address": "Musterstraße 123, 12345 Musterstadt"
  }
}

// Bestellbestätigung
POST /api/send-template-email
{
  "type": "order_confirmation",
  "to": "kunde@example.com",
  "orderData": {
    "customer_name": "Max Mustermann",
    "order_id": "BHK-12345",
    "order_date": "2024-01-15",
    "total_amount": 299.50,
    "delivery_address": "Musterstraße 123, 12345 Musterstadt"
  }
}

// Versandbenachrichtigung
POST /api/send-template-email
{
  "type": "shipping_notification",
  "to": "kunde@example.com",
  "shippingData": {
    "customer_name": "Max Mustermann",
    "order_id": "BHK-12345",
    "tracking_number": "DHL123456789",
    "shipping_date": "2024-01-16",
    "estimated_delivery": "2024-01-18",
    "shipping_company": "DHL"
  }
}

// Admin-Benachrichtigung
POST /api/send-template-email
{
  "type": "admin_notification",
  "to": "admin@brennholzkoenig.de",
  "adminData": {
    "order_id": "BHK-12345",
    "order_date": "2024-01-15",
    "total_amount": 299.50,
    "payment_status": "Bezahlt",
    "customer_name": "Max Mustermann",
    "customer_email": "kunde@example.com",
    "customer_phone": "+49 123 456789",
    "delivery_address": "Musterstraße 123, 12345 Musterstadt",
    "order_items": "2x Buche Scheitholz 33cm (je 149,75€)"
  }
}
*/