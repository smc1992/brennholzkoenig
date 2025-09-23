import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Fixing shipping notification template...');
    
    // Get the current shipping template
    const { data: currentTemplate, error: fetchError } = await supabase
      .from('app_settings')
      .select('*')
      .eq('setting_key', 'Versandbenachrichtigung')
      .single();
    
    if (fetchError || !currentTemplate) {
      console.error('❌ Error fetching template:', fetchError);
      return NextResponse.json({
        success: false,
        error: 'Template not found'
      }, { status: 404 });
    }
    
    const templateData = JSON.parse(currentTemplate.setting_value);
    
    // Fix the HTML content - replace green colors with red Brennholzkönig colors
    let fixedHtmlContent = templateData.html_content;
    
    // Replace green colors with red
    fixedHtmlContent = fixedHtmlContent
      .replace(/#28a745/g, '#C04020')  // Main green to Brennholzkönig red
      .replace(/#155724/g, '#8B2A1A')  // Dark green to dark red
      .replace(/#d4edda/g, '#fef2f2')  // Light green background to light red
      .replace(/#c3e6cb/g, '#fecaca'); // Green border to red border
    
    // Remove the white filter from the logo to show the original colors
    fixedHtmlContent = fixedHtmlContent
      .replace(/filter: brightness\(0\) invert\(1\);?/g, '');
    
    // Update the template data
    const updatedTemplateData = {
      ...templateData,
      html_content: fixedHtmlContent
    };
    
    // Save the updated template
    const { data: updatedTemplate, error: updateError } = await supabase
      .from('app_settings')
      .update({
        setting_value: JSON.stringify(updatedTemplateData),
        updated_at: new Date().toISOString()
      })
      .eq('setting_key', 'Versandbenachrichtigung')
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error updating template:', updateError);
      return NextResponse.json({
        success: false,
        error: updateError.message
      }, { status: 500 });
    }
    
    console.log('✅ Template updated successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Shipping notification template fixed successfully',
      changes: {
        colors_fixed: 'Green colors replaced with Brennholzkönig red (#C04020)',
        logo_fixed: 'Removed white filter from logo to show original colors'
      },
      updated_template: updatedTemplate
    });
    
  } catch (error) {
    console.error('❌ Fix shipping template error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}