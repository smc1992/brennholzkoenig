import { NextRequest, NextResponse } from 'next/server';
import { createEmailTransporter } from '@/lib/emailService';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Testing SMTP connection...');
    
    // Create transporter
    const transporterResult = await createEmailTransporter();
    
    if (!transporterResult || !transporterResult.transporter) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create email transporter'
      }, { status: 500 });
    }

    // Verify SMTP connection
    const isConnected = await transporterResult.transporter.verify();
    
    if (isConnected) {
      console.log('✅ SMTP connection successful');
      return NextResponse.json({
        success: true,
        message: 'SMTP connection successful',
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('❌ SMTP connection failed');
      return NextResponse.json({
        success: false,
        error: 'SMTP connection verification failed'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ SMTP test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown SMTP error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}