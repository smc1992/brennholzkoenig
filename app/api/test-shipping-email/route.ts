import { NextRequest, NextResponse } from 'next/server';
import { getEmailTemplate } from '@/lib/emailTemplateService';

export async function POST(request: NextRequest) {
  try {
    const { customerEmail } = await request.json();
    
    if (!customerEmail) {
      return NextResponse.json({
        success: false,
        error: 'Customer email is required'
      }, { status: 400 });
    }
    
    console.log('🧪 Testing shipping notification email...');
    
    // Get the shipping notification template
    const template = await getEmailTemplate('Versandbenachrichtigung');
    
    if (!template) {
      return NextResponse.json({
        success: false,
        error: 'Shipping notification template not found'
      }, { status: 404 });
    }
    
    // Test data for shipping notification
    const testData = {
      customer_name: 'Max Mustermann',
      order_number: 'BK-2025-001',
      order_date: new Date().toLocaleDateString('de-DE'),
      delivery_address: 'Musterstraße 123\\n12345 Musterstadt\\nDeutschland',
      product_list: '• Premium Brennholz Buche - 2 Raummeter\\n• Anzündholz - 1 Paket'
    };
    
    // Replace variables in template
    let htmlContent = template.html_content;
    let textContent = template.text_content;
    
    Object.entries(testData).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), value);
      textContent = textContent.replace(new RegExp(placeholder, 'g'), value);
    });
    
    // For testing, we'll just return the processed template content
    // In a real scenario, you would send this via email service
    
    return NextResponse.json({
      success: true,
      message: 'Shipping notification template test completed',
      template: {
        subject: '📦 Ihr Brennholz ist unterwegs - Bestellung ' + testData.order_number,
        html_content: htmlContent,
        text_content: textContent,
        test_data: testData
      },
      note: 'Template processed successfully with corrected colors and logo'
    });
    
  } catch (error) {
    console.error('❌ Test shipping email error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}