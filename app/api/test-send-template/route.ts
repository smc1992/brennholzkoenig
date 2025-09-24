import { NextRequest, NextResponse } from 'next/server';
import { sendTemplateEmail } from '../../../lib/emailTemplateEngine';

export async function POST(request: NextRequest) {
  try {
    const { templateType, recipient, testData } = await request.json();

    console.log('Testing sendTemplateEmail with:', {
      templateType,
      recipient,
      testData
    });

    const result = await sendTemplateEmail(templateType, recipient, testData);

    console.log('sendTemplateEmail result:', result);

    return NextResponse.json({
      success: true,
      result,
      templateType,
      recipient
    });
  } catch (error) {
    console.error('Test sendTemplateEmail Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      templateType: 'unknown',
      recipient: 'unknown'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint with templateType, recipient, and testData to test sendTemplateEmail function',
    example: {
      templateType: 'customer_order_cancellation',
      recipient: 'test@example.com',
      testData: {
        customer_name: 'Max Mustermann',
        order_number: 'BK-2024-001',
        cancellation_date: '2024-01-15',
        total_amount: '99.99'
      }
    }
  });
}