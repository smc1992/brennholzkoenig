import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getEmailTemplate } from '@/lib/emailTemplateService';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug: Checking email templates...');
    
    // 1. Check if email_templates table exists and get all templates
    const { data: allTemplates, error: templatesError } = await supabase
      .from('email_templates')
      .select('*');
    
    console.log('📋 All templates from database:', allTemplates);
    console.log('❌ Templates error:', templatesError);
    
    // 2. Test specific template lookups
    const testTemplates = ['order_confirmation', 'admin_new_order'];
    const templateTests = [];
    
    for (const templateKey of testTemplates) {
      try {
        console.log(`🔍 Testing template lookup for: ${templateKey}`);
        const template = await getEmailTemplate(templateKey);
        templateTests.push({
          templateKey,
          found: !!template,
          template: template || null
        });
        console.log(`✅ Template ${templateKey}:`, template ? 'FOUND' : 'NOT FOUND');
      } catch (error) {
        console.error(`❌ Error testing template ${templateKey}:`, error);
        templateTests.push({
          templateKey,
          found: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    // 3. Check app_settings for email templates (legacy)
    const { data: appSettings, error: settingsError } = await supabase
      .from('app_settings')
      .select('*')
      .eq('setting_type', 'email_template');
    
    console.log('📋 App settings email templates:', appSettings);
    console.log('❌ App settings error:', settingsError);
    
    return NextResponse.json({
      success: true,
      data: {
        allTemplates: {
          data: allTemplates,
          error: templatesError
        },
        templateTests,
        appSettings: {
          data: appSettings,
          error: settingsError
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Debug email templates error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}