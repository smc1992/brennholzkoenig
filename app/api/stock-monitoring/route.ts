import { NextRequest, NextResponse } from 'next/server';
import { checkAllProductsLowStock, checkProductLowStockById, checkMultipleProductsLowStock } from '@/lib/stockMonitoring';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const productIds = searchParams.get('productIds');
    
    let result: any;
    
    if (productId) {
      // Check single product
      const alertSent = await checkProductLowStockById(productId);
      result = {
        type: 'single',
        productId,
        alertSent,
        checked: 1,
        alerts: alertSent ? 1 : 0
      };
    } else if (productIds) {
      // Check multiple products
      const ids = productIds.split(',').filter(id => id.trim());
      const checkResult = await checkMultipleProductsLowStock(ids);
      result = {
        ...checkResult,
        type: 'multiple',
        productIds: ids
      };
    } else {
      // Check all products
      const checkResult = await checkAllProductsLowStock();
      result = {
        ...checkResult,
        type: 'all'
      };
    }
    
    return NextResponse.json({
      success: true,
      message: `Lagerbestand-Prüfung abgeschlossen: ${result.checked} Produkte geprüft, ${result.alerts} Warnungen gesendet`,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Fehler bei der Lagerbestand-Überwachung:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Fehler bei der Lagerbestand-Überwachung',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, productId, productIds } = body;
    
    let result: any;
    
    switch (action) {
      case 'check-single':
        if (!productId) {
          return NextResponse.json(
            { success: false, error: 'productId ist erforderlich für check-single' },
            { status: 400 }
          );
        }
        const alertSent = await checkProductLowStockById(productId);
        result = {
          type: 'single',
          productId,
          alertSent,
          checked: 1,
          alerts: alertSent ? 1 : 0
        };
        break;
        
      case 'check-multiple':
        if (!productIds || !Array.isArray(productIds)) {
          return NextResponse.json(
            { success: false, error: 'productIds Array ist erforderlich für check-multiple' },
            { status: 400 }
          );
        }
        const checkMultipleResult = await checkMultipleProductsLowStock(productIds);
        result = {
          ...checkMultipleResult,
          type: 'multiple',
          productIds: productIds
        };
        break;
        
      case 'check-all':
      default:
        const checkAllResult = await checkAllProductsLowStock();
        result = {
          ...checkAllResult,
          type: 'all'
        };
        break;
    }
    
    return NextResponse.json({
      success: true,
      message: `Lagerbestand-Prüfung (${action}) abgeschlossen: ${result.checked} Produkte geprüft, ${result.alerts} Warnungen gesendet`,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Fehler bei der Lagerbestand-Überwachung:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Fehler bei der Lagerbestand-Überwachung',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}