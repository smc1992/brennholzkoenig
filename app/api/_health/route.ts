import { NextResponse } from 'next/server';
import { getInvoiceBuilder } from '@/lib/invoiceBuilder';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        pdf: 'unknown',
        database: 'unknown',
        environment: process.env.NODE_ENV || 'unknown'
      },
      version: process.env.npm_package_version || '1.0.0'
    };

    // Test Database Connection
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id')
        .limit(1);
      
      if (error) throw error;
      healthStatus.services.database = 'operational';
    } catch (dbError) {
      console.error('Database health check failed:', dbError);
      healthStatus.services.database = 'error';
      healthStatus.status = 'degraded';
    }

    // Test PDF Generation (lightweight test)
    try {
      const builder = getInvoiceBuilder();
      // Just check if we can initialize - don't generate actual PDF
      if (builder) {
        healthStatus.services.pdf = 'operational';
      } else {
        healthStatus.services.pdf = 'error';
        healthStatus.status = 'degraded';
      }
    } catch (pdfError) {
      console.error('PDF health check failed:', pdfError);
      healthStatus.services.pdf = 'error';
      healthStatus.status = 'degraded';
    }

    // Determine overall status
    const hasErrors = Object.values(healthStatus.services).some(status => status === 'error');
    if (hasErrors) {
      healthStatus.status = 'unhealthy';
    }

    const statusCode = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 200 : 503;

    return NextResponse.json(healthStatus, { status: statusCode });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      services: {
        pdf: 'error',
        database: 'error',
        environment: process.env.NODE_ENV || 'unknown'
      }
    }, { status: 503 });
  }
}

// Also support HEAD requests for simple health checks
export async function HEAD() {
  try {
    // Quick health check without detailed testing
    return new Response(null, { status: 200 });
  } catch (error) {
    return new Response(null, { status: 503 });
  }
}