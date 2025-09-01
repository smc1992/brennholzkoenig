import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

// Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting automatic image synchronization...');
    
    // 1. Hole alle image_mappings ohne product_id
    const { data: orphanedMappings, error: mappingsError } = await supabase
      .from('image_mappings')
      .select('*')
      .is('product_id', null);
    
    // 2. Hole auch alle image_mappings mit product_id für Hauptbild-Updates
    const { data: allMappings, error: allMappingsError } = await supabase
      .from('image_mappings')
      .select('*')
      .not('product_id', 'is', null)
      .order('created_at', { ascending: false });
    
    if (mappingsError) {
      throw new Error(`Error fetching mappings: ${mappingsError.message}`);
    }
    
    console.log(`📋 Found ${orphanedMappings?.length || 0} orphaned image mappings`);
    
    // 2. Hole alle Produkte
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, image_url')
      .eq('is_active', true);
    
    if (productsError) {
      throw new Error(`Error fetching products: ${productsError.message}`);
    }
    
    console.log(`📦 Found ${products?.length || 0} active products`);
    
    let syncedCount = 0;
    let updatedProducts = 0;
    let autoUpdatedProducts = 0;
    
    // 3. Automatische Hauptbild-Updates für Produkte mit Mappings
     if (allMappings && !allMappingsError) {
       const productGroups = allMappings.reduce((groups, mapping: any) => {
         if (!groups[mapping.product_id]) {
           groups[mapping.product_id] = [];
         }
         groups[mapping.product_id].push(mapping);
         return groups;
       }, {} as Record<number, any[]>);
       
       for (const [productId, mappings] of Object.entries(productGroups)) {
         const latestMapping = (mappings as any[])[0]; // Neuestes Bild (sortiert nach created_at DESC)
         const newImageUrl = `/images/${latestMapping.seo_slug}`;
        
        // Prüfe aktuelles Hauptbild
        const { data: currentProduct } = await supabase
          .from('products')
          .select('image_url')
          .eq('id', parseInt(productId))
          .single();
        
        // Aktualisiere nur wenn sich das Bild geändert hat
        if (currentProduct && currentProduct.image_url !== newImageUrl) {
          const { error: updateError } = await supabase
            .from('products')
            .update({ 
              image_url: newImageUrl,
              updated_at: new Date().toISOString()
            })
            .eq('id', parseInt(productId));
          
          if (!updateError) {
            autoUpdatedProducts++;
            console.log(`🔄 Auto-updated product ${productId} to latest image: ${newImageUrl}`);
          }
        }
      }
    }
    
    // 4. Versuche, orphaned mappings mit Produkten zu verknüpfen
    for (const mapping of orphanedMappings || []) {
      // Suche nach Produkten, die dieses Bild verwenden
      const matchingProduct = products?.find(product => 
        product.image_url && product.image_url.includes(mapping.seo_slug)
      );
      
      if (matchingProduct) {
        // Aktualisiere das mapping mit der product_id
        const { error: updateMappingError } = await supabase
          .from('image_mappings')
          .update({ product_id: matchingProduct.id })
          .eq('id', mapping.id);
        
        if (!updateMappingError) {
          syncedCount++;
          console.log(`✅ Synced mapping ${mapping.seo_slug} with product ${matchingProduct.id}`);
        } else {
          console.error(`❌ Failed to sync mapping ${mapping.seo_slug}:`, updateMappingError);
        }
      }
    }
    
    // 4. Aktualisiere Produkte mit veralteten Bildpfaden
    const imageUpdates = [];
    
    for (const product of products || []) {
      if (product.image_url) {
        // Prüfe, ob das Bild eine veraltete URL hat
        const isOldFormat = product.image_url.includes('.jpg') || 
                           product.image_url.includes('.jpeg') || 
                           !product.image_url.includes('-');
        
        if (isOldFormat) {
          // Suche nach einem neueren Bild für dieses Produkt
          const productNameSlug = product.name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-');
          
          const newerMapping = orphanedMappings?.find(mapping => 
            mapping.seo_slug.toLowerCase().includes(productNameSlug.split('-')[0]) ||
            mapping.seo_slug.toLowerCase().includes(productNameSlug.split('-')[1])
          );
          
          if (newerMapping) {
            const newImageUrl = `/images/${newerMapping.seo_slug}`;
            
            const { error: updateProductError } = await supabase
              .from('products')
              .update({ 
                image_url: newImageUrl,
                updated_at: new Date().toISOString()
              })
              .eq('id', product.id);
            
            if (!updateProductError) {
              // Aktualisiere auch das mapping
              await supabase
                .from('image_mappings')
                .update({ product_id: product.id })
                .eq('id', newerMapping.id);
              
              imageUpdates.push({
                productId: product.id,
                productName: product.name,
                oldUrl: product.image_url,
                newUrl: newImageUrl
              });
              
              updatedProducts++;
              console.log(`🔄 Updated product ${product.id} image: ${product.image_url} → ${newImageUrl}`);
            }
          }
        }
      }
    }
    
    // 5. Erstelle einen Bericht
    const report = {
      success: true,
      summary: {
        orphanedMappings: orphanedMappings?.length || 0,
        syncedMappings: syncedCount,
        updatedProducts: updatedProducts,
        autoUpdatedProducts: autoUpdatedProducts,
        totalProducts: products?.length || 0
      },
      details: {
        imageUpdates,
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('✅ Image synchronization completed:', report.summary);
    
    return Response.json(report);
    
  } catch (error) {
    console.error('❌ Image synchronization failed:', error);
    return Response.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// GET endpoint für Status-Check
export async function GET() {
  try {
    // Hole Statistiken
    const { data: mappingsStats } = await supabase
      .from('image_mappings')
      .select('product_id')
      .is('product_id', null);
    
    const { data: productsStats } = await supabase
      .from('products')
      .select('id, image_url')
      .eq('is_active', true);
    
    const orphanedCount = mappingsStats?.length || 0;
    const totalProducts = productsStats?.length || 0;
    const productsWithImages = productsStats?.filter(p => p.image_url)?.length || 0;
    
    return Response.json({
      status: 'healthy',
      statistics: {
        orphanedMappings: orphanedCount,
        totalProducts: totalProducts,
        productsWithImages: productsWithImages,
        syncNeeded: orphanedCount > 0
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return Response.json({ 
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}