import { NextRequest, NextResponse } from 'next/server';
import { processOrderLoyaltyPoints } from '@/lib/loyaltyService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, orderNumber, orderTotal, orderItems } = body;

    // Validierung
    if (!customerId || !orderNumber || !orderTotal || !orderItems) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Fehlende Parameter: customerId, orderNumber, orderTotal, orderItems erforderlich' 
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'orderItems muss ein nicht-leeres Array sein' 
        },
        { status: 400 }
      );
    }

    // Validiere orderItems Struktur
    for (const item of orderItems) {
      if (!item.product_name || typeof item.quantity !== 'number' || typeof item.unit_price !== 'number') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Jedes orderItem muss product_name, quantity und unit_price enthalten' 
          },
          { status: 400 }
        );
      }
    }

    console.log(`🎯 API: Verarbeite Loyalty-Punkte für Bestellung ${orderNumber}`);

    // Verarbeite Punktevergabe
    const result = await processOrderLoyaltyPoints(
      customerId,
      orderNumber,
      parseFloat(orderTotal.toString()),
      orderItems
    );

    if (result.success) {
      console.log(`✅ API: ${result.pointsAwarded} Punkte erfolgreich vergeben`);
      return NextResponse.json({
        success: true,
        pointsAwarded: result.pointsAwarded,
        message: `${result.pointsAwarded} Treuepunkte erfolgreich vergeben`
      });
    } else {
      console.error(`❌ API: Fehler bei Punktevergabe:`, result.error);
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Unbekannter Fehler bei der Punktevergabe' 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ API: Fehler in award-points route:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Interner Serverfehler' 
      },
      { status: 500 }
    );
  }
}

// GET-Route für Tests
export async function GET() {
  return NextResponse.json({
    message: 'Loyalty Points Award API',
    usage: 'POST mit { customerId, orderNumber, orderTotal, orderItems }',
    example: {
      customerId: 'CUST123456',
      orderNumber: 'ORD-2024-001',
      orderTotal: 150.00,
      orderItems: [
        {
          product_name: 'Premium Brennholz',
          product_category: 'Brennholz',
          quantity: 2,
          unit_price: 75.00,
          total_price: 150.00
        }
      ]
    }
  });
}