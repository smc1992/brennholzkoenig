import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug: Fetching email templates...');
    
    // Fetch all email templates
    const { data: templates, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('setting_type', 'email_template');

    if (error) {
      console.error('❌ Error fetching templates:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('📧 Found templates:', templates?.length || 0);

    const results = [];
    
    for (const template of templates || []) {
      const result = {
        id: template.id,
        setting_key: template.setting_key,
        setting_value: template.setting_value,
        isValidJSON: false,
        parsedData: null as any,
        error: null as string | null
      };

      try {
        const parsed = JSON.parse(template.setting_value);
        result.isValidJSON = true;
        result.parsedData = parsed;
        console.log(`✅ ${template.setting_key}: Valid JSON`);
      } catch (parseError) {
        result.error = parseError instanceof Error ? parseError.message : String(parseError);
        console.log(`❌ ${template.setting_key}: Invalid JSON - ${result.error}`);
        console.log(`❌ Raw value: ${template.setting_value}`);
      }

      results.push(result);
    }

    return NextResponse.json({
      success: true,
      templates: results,
      summary: {
        total: results.length,
        valid: results.filter(r => r.isValidJSON).length,
        invalid: results.filter(r => !r.isValidJSON).length
      }
    });

  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { templateKey, newValue } = await request.json();
    
    if (!templateKey || !newValue) {
      return NextResponse.json({ 
        error: 'templateKey and newValue are required' 
      }, { status: 400 });
    }

    // Validate JSON first
    try {
      JSON.parse(newValue);
    } catch (parseError) {
      return NextResponse.json({ 
        error: 'Invalid JSON provided',
        details: parseError instanceof Error ? parseError.message : String(parseError)
      }, { status: 400 });
    }

    // Update the template
    const { data, error } = await supabase
      .from('app_settings')
      .update({ setting_value: newValue })
      .eq('setting_type', 'email_template')
      .eq('setting_key', templateKey)
      .select();

    if (error) {
      console.error('❌ Error updating template:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`✅ Updated template: ${templateKey}`);
    
    return NextResponse.json({
      success: true,
      message: `Template ${templateKey} updated successfully`,
      data
    });

  } catch (error) {
    console.error('❌ Update endpoint error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}