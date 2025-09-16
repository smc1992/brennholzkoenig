
import { createClient } from '@/utils/supabase/server';
import ProductDetailClient from './ProductDetailClient';
import { notFound } from 'next/navigation';

const urlToProductId: { [key: string]: string } = {
  'industrieholz-buche-klasse-1': '1',
  'industrieholz-buche-klasse-2': '2',
  'scheitholz-buche-33cm': '3',
  'scheitholz-buche-25cm': '4',
  'scheitholz-industrieholz-mix-33cm': '5',
  'scheitholz-fichte-33cm': '6'
};

export async function generateStaticParams() {
  return [
    { id: 'industrieholz-buche-klasse-1' },
    { id: 'industrieholz-buche-klasse-2' },
    { id: 'scheitholz-buche-33cm' },
    { id: 'scheitholz-buche-25cm' },
    { id: 'scheitholz-industrieholz-mix-33cm' },
    { id: 'scheitholz-fichte-33cm' },
  ];
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const actualProductId = urlToProductId[params.id] || params.id;
  
  // Server-side data fetching mit automatischem Caching
  const [productResult, pricingResult] = await Promise.all([
    supabase
      .from('products')
      .select('*')
      .eq('id', actualProductId)
      .single(),
    supabase
      .from('pricing_tiers')
      .select('*')
      .eq('product_id', actualProductId)
  ]);

  if (productResult.error || !productResult.data) {
    console.log('Product not found:', actualProductId, productResult.error);
    notFound();
  }

  return (
    <ProductDetailClient 
      product={productResult.data}
      pricingTiers={pricingResult.data || []}
      productId={params.id}
    />
  );
}
