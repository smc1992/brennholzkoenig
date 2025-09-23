import { NextRequest, NextResponse } from 'next/server';
import { sendOrderConfirmation, sendAdminNewOrderNotification } from '@/lib/emailTemplateService';

export async function POST(request: NextRequest) {
  try {
    const { customerEmail, adminEmail } = await request.json();
    
    if (!customerEmail) {
      return NextResponse.json({
        success: false,
        error: 'customerEmail is required'
      }, { status: 400 });
    }

    console.log('🧪 Testing order confirmation emails...');
    console.log('📧 Customer email:', customerEmail);
    console.log('📧 Admin email:', adminEmail);

    // Test data for the order
    const testOrderData = {
      customer_name: 'Max Mustermann',
      order_id: 'TEST-' + Date.now(),
      order_date: new Date().toLocaleDateString('de-DE'),
      total_amount: 299.99,
      delivery_address: 'Musterstraße 123\n12345 Musterstadt\nDeutschland',
      order_tracking_url: 'https://brennholzkoenig.de/tracking/TEST-123',
      order_items: '2x Brennholz Buche (1 Raummeter)\n1x Anzündholz (10kg Bündel)'
    };

    const results = {
      customerEmail: null as any,
      adminEmail: null as any
    };

    // Send customer confirmation
    console.log('📤 Sending customer confirmation...');
    try {
      const customerResult = await sendOrderConfirmation(customerEmail, testOrderData);
      results.customerEmail = customerResult;
      console.log('✅ Customer email result:', customerResult);
    } catch (error) {
      console.error('❌ Customer email error:', error);
      results.customerEmail = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }

    // Send admin notification if admin email provided
    if (adminEmail) {
      console.log('📤 Sending admin notification...');
      try {
        const adminOrderData = {
          ...testOrderData,
          payment_status: 'Bezahlt',
          customer_email: customerEmail,
          customer_phone: '+49 123 456789',
          admin_order_url: `https://brennholzkoenig.de/admin/orders/${testOrderData.order_id}`
        };
        
        const adminResult = await sendAdminNewOrderNotification(adminEmail, adminOrderData);
        results.adminEmail = adminResult;
        console.log('✅ Admin email result:', adminResult);
      } catch (error) {
        console.error('❌ Admin email error:', error);
        results.adminEmail = {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Test emails sent',
      results,
      testData: testOrderData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Test order email error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}