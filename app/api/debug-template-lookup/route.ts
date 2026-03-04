import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateKey = searchParams.get('key') || 'order-confirmation';
    
    console.log('🔍 Debug template lookup for:', templateKey);
    
    // Step 1: Check raw database query
    console.log('📋 Step 1: Raw database query...');
    const { data: rawData, error: rawError } = await supabase
      .from('app_settings')
      .select('*')
      .eq('setting_type', 'email_template')
      .eq('setting_key', templateKey);
    
    console.log('📋 Raw query result:', { data: rawData, error: rawError });
    
    // Step 2: Check with single() method
    console.log('📋 Step 2: Single query...');
    const { data: singleData, error: singleError } = await supabase
      .from('app_settings')
      .select('*')
      .eq('setting_type', 'email_template')
      .eq('setting_key', templateKey)
      .single();
    
    console.log('📋 Single query result:', { data: singleData, error: singleError });
    
    // Step 3: List all email templates
    console.log('📋 Step 3: All email templates...');
    const { data: allTemplates, error: allError } = await supabase
      .from('app_settings')
      .select('*')
      .eq('setting_type', 'email_template');
    
    console.log('📋 All templates:', allTemplates);
    
    // Step 4: Try to parse the template if found
    let parsedTemplate = null;
    let parseError = null;
    
    if (singleData && singleData.setting_value) {
      try {
        parsedTemplate = JSON.parse(singleData.setting_value);
        console.log('✅ Template parsed successfully:', parsedTemplate);
      } catch (error) {
        parseError = error instanceof Error ? error.message : String(error);
        console.error('❌ Template parse error:', parseError);
      }
    }
    
    return NextResponse.json({
      success: true,
      templateKey,
      steps: {
        rawQuery: {
          data: rawData,
          error: rawError,
          found: !!rawData && rawData.length > 0
        },
        singleQuery: {
          data: singleData,
          error: singleError,
          found: !!singleData
        },
        allTemplates: {
          data: allTemplates,
          error: allError,
          count: allTemplates?.length || 0,
          keys: allTemplates?.map((t: any) => t.setting_key) || []
        },
        parsing: {
          parsedTemplate,
          parseError,
          success: !!parsedTemplate
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Debug template lookup error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}