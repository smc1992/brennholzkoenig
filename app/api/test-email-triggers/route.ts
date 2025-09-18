import { NextRequest, NextResponse } from 'next/server';
import { 
  triggerOrderConfirmation, 
  triggerShippingNotification, 
  triggerLowStockAlert,
  getActiveTemplatesWithTriggers 
} from '@/lib/emailTriggerEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Lade alle aktiven Templates mit Triggern
    const templates = await getActiveTemplatesWithTriggers();
    
    return NextResponse.json({
      success: true,
      message: 'E-Mail-Trigger-System Status',
      data: {
        activeTemplates: templates.length,
        templates: templates.map(t => ({
          id: t.id,
          name: t.setting_name,
          type: t.template.type,
          active: t.template.active,
          triggers: t.template.triggers || 'Keine Trigger konfiguriert'
        }))
      }
    });
  } catch (error) {
    console.error('Fehler beim Laden der Templates:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Laden der Templates',
      details: (error as Error).message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { triggerType, testData } = await request.json();
    
    let result;
    
    switch (triggerType) {
      case 'order_confirmation':
        const orderData = testData ? {
          id: testData.orderId || 'test_order_123',
          number: testData.orderId || 'BK-TEST-001',
          total: testData.totalAmount || 89.99,
          date: new Date().toISOString(),
          customer: {
            name: testData.customerName || 'Max Mustermann',
            email: testData.customerEmail || 'test@example.com'
          },
          products: testData.products || [
            {
              name: 'Brennholz Buche 25cm',
              quantity: 1,
              price: 79.99
            }
          ],
          delivery_address: testData.deliveryAddress ? 
            `${testData.deliveryAddress.street}, ${testData.deliveryAddress.zipCode} ${testData.deliveryAddress.city}` :
            'Musterstraße 123, 12345 Musterstadt'
        } : {
          id: 'test_order_123',
          number: 'BK-TEST-001',
          total: 89.99,
          date: new Date().toISOString(),
          customer: {
            name: 'Max Mustermann',
            email: 'test@example.com'
          },
          products: [
            {
              name: 'Brennholz Buche 25cm',
              quantity: 1,
              price: 79.99
            },
            {
              name: 'Anzündholz',
              quantity: 2,
              price: 5.00
            }
          ],
          delivery_address: 'Musterstraße 123, 12345 Musterstadt'
        };
        
        result = await triggerOrderConfirmation(orderData);
        break;
        
      case 'shipping_notification':
        const shippingData = testData || {
          order_number: 'BK-TEST-001',
          tracking_number: 'DHL123456789',
          carrier: 'DHL',
          customer: {
            name: 'Max Mustermann',
            email: 'test@example.com'
          }
        };
        
        result = await triggerShippingNotification(shippingData);
        break;
        
      case 'low_stock':
        const stockData = testData || {
          product_name: 'Brennholz Buche 25cm',
          current_stock: 3,
          minimum_stock: 10,
          admin_email: 'admin@brennholz-koenig.de'
        };
        
        result = await triggerLowStockAlert(stockData);
        break;
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Unbekannter Trigger-Typ',
          availableTypes: ['order_confirmation', 'shipping_notification', 'low_stock']
        }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      message: `${triggerType} Trigger erfolgreich getestet`,
      result: result,
      triggerType: triggerType
    });
    
  } catch (error) {
    console.error('Fehler beim Testen des Triggers:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Testen des Triggers',
      details: (error as Error).message
    }, { status: 500 });
  }
}