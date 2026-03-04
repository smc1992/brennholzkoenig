import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { templateKey, fixedValue } = await request.json();
    
    if (!templateKey || !fixedValue) {
      return NextResponse.json(
        { error: 'Template key and fixed value are required' },
        { status: 400 }
      );
    }

    // Validate that the fixed value is valid JSON
    try {
      JSON.parse(fixedValue);
    } catch (e) {
      return NextResponse.json(
        { error: 'Fixed value is not valid JSON' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update the template in the database
    const { data, error } = await supabase
      .from('app_settings')
      .update({ setting_value: fixedValue })
      .eq('setting_key', templateKey)
      .select();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to update template in database', details: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    console.log(`✅ Successfully updated template: ${templateKey}`);
    
    return NextResponse.json({
      success: true,
      message: `Template ${templateKey} has been fixed`,
      updatedTemplate: data[0]
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}