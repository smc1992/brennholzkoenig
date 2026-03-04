import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const { productId, syncAll } = await request.json();
    
    console.log('🔄 Starting product image synchronization...', { productId, syncAll });
    
    if (syncAll) {
      // Synchronisiere alle Produkte
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name')
        .eq('is_active', true);
      
      if (productsError) {
        throw new Error(`Error loading products: ${productsError.message}`);
      }
      
      const results = [];
      
      for (const product of products || []) {
        const result = await syncSingleProduct(supabase, product.id);
        results.push({
          productId: product.id,
          productName: product.name,
          success: result.success,
          message: result.message
        });
      }
      
      const successCount = results.filter(r => r.success).length;
      
      return NextResponse.json({
        success: true,
        message: `Synchronized ${successCount}/${results.length} products`,
        results
      });
    } else if (productId) {
      // Synchronisiere einzelnes Produkt
      const result = await syncSingleProduct(supabase, productId);
      
      return NextResponse.json({
        success: result.success,
        message: result.message,
        productId
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Either productId or syncAll must be provided' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in sync-product-images:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function syncSingleProduct(supabase: any, productId: number) {
  try {
    console.log(`🔄 Synchronizing product ${productId}...`);
    
    // Lade aktuelle Daten aus beiden Tabellen
    const [mappingResult, productResult] = await Promise.all([
      supabase
        .from('image_mappings')
        .select('seo_slug, is_main_image, image_order')
        .eq('product_id', productId)
        .order('image_order', { ascending: true }),
      supabase
        .from('products')
        .select('id, name, image_url, additional_images')
        .eq('id', productId)
        .single()
    ]);
    
    if (mappingResult.error || productResult.error) {
      return {
        success: false,
        message: `Error loading data: ${mappingResult.error?.message || productResult.error?.message}`
      };
    }
    
    const mappingData = mappingResult.data || [];
    const productData = productResult.data;
    
    if (!productData) {
      return {
        success: false,
        message: `Product ${productId} not found`
      };
    }
    
    // Erstelle konsistente Bildliste aus image_mappings (Single Source of Truth)
    const mappingImages = mappingData.map((item: any) => `/images/${item.seo_slug}`);
    const mainImage = mappingData.find((item: any) => item.is_main_image);
    
    // Aktualisiere products Tabelle basierend auf image_mappings
    const newImageUrl = mainImage ? `/images/${mainImage.seo_slug}` : null;
    const newAdditionalImages = mappingImages.filter((img: string) => img !== newImageUrl);
    
    // Update nur wenn sich etwas geändert hat
    const needsUpdate = 
      productData.image_url !== newImageUrl ||
      JSON.stringify(productData.additional_images || []) !== JSON.stringify(newAdditionalImages);
    
    if (needsUpdate) {
      const { error: updateError } = await supabase
        .from('products')
        .update({
          image_url: newImageUrl,
          additional_images: newAdditionalImages,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);
      
      if (updateError) {
        return {
          success: false,
          message: `Error updating product: ${updateError.message}`
        };
      }
      
      console.log(`✅ Synchronized product ${productId} (${productData.name}):`, {
        mainImage: newImageUrl,
        additionalImages: newAdditionalImages.length,
        totalImages: mappingImages.length
      });
      
      return {
        success: true,
        message: `Updated ${productData.name}: ${mappingImages.length} images (${newAdditionalImages.length} additional)`
      };
    } else {
      return {
        success: true,
        message: `${productData.name} already in sync`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Error syncing product ${productId}: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Product Image Sync API',
    usage: {
      'POST /api/sync-product-images': {
        'Sync single product': { productId: 'number' },
        'Sync all products': { syncAll: true }
      }
    }
  });
}