import { NextRequest, NextResponse } from 'next/server';
import { checkProductLowStockById } from '@/lib/stockMonitoring';

export async function POST(request: NextRequest) {
  try {
    const { productId } = await request.json();
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // checkProductLowStockById gibt jetzt boolean zurück
    const alertSent = await checkProductLowStockById(productId);
    
    return NextResponse.json({ 
      success: true, 
      alertSent 
    });
  } catch (error) {
    console.error('Stock monitoring error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}