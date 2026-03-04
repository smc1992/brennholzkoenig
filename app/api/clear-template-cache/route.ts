import { NextRequest, NextResponse } from 'next/server';
import { getInvoiceBuilder } from '@/lib/invoiceBuilder';

export async function POST(request: NextRequest) {
  try {
    const invoiceBuilder = getInvoiceBuilder();
    invoiceBuilder.clearTemplateCache();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Template-Cache wurde erfolgreich geleert' 
    });
  } catch (error) {
    console.error('Fehler beim Leeren des Template-Cache:', error);
    return NextResponse.json(
      { success: false, error: 'Fehler beim Leeren des Template-Cache' },
      { status: 500 }
    );
  }
}