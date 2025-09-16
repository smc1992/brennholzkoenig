import { QueryClient, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { productKeys } from './keys';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock_quantity: number;
  unit: string;
  specifications?: any;
  features?: string[];
  delivery_info?: string;
  meta_title?: string;
  meta_description?: string;
  detailed_description?: string;
  technical_specs?: { [key: string]: string };
  additional_images?: string[];
  original_price?: number;
  has_quantity_discount?: boolean;
  slug?: string;
  wood_type?: string;
  size?: string;
  sku?: string;
  cost_price?: number;
  max_stock_level?: number;
  supplier_id?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  min_stock_level?: number;
  availability?: string;
  in_stock?: boolean;
}

export interface PricingTier {
  id: string;
  product_id: string;
  min_quantity: number;
  max_quantity?: number;
  price_per_unit?: number;
  adjustment_type: 'percentage' | 'fixed';
  adjustment_value: number;
  description: string;
}

export async function getProduct(id: string, signal?: AbortSignal): Promise<Product> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  if (!data) throw new Error('Product not found');
  
  return data as Product;
}

export async function getProductPricingTiers(productId: string, signal?: AbortSignal): Promise<PricingTier[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('pricing_tiers')
    .select('*')
    .eq('product_id', productId);
  
  if (error) throw error;
  return data as PricingTier[] || [];
}

export const useProductQuery = <TData = Product>({
  id,
  enabled = true,
  ...options
}: {
  id: string;
  enabled?: boolean;
} & UseQueryOptions<Product, Error, TData>) => {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: ({ signal }) => getProduct(id, signal),
    enabled: enabled && !!id,
    staleTime: 30 * 60 * 1000, // 30 Minuten
    ...options,
  });
};

export const useProductPricingTiersQuery = ({
  productId,
  enabled = true,
  ...options
}: {
  productId: string;
  enabled?: boolean;
} & UseQueryOptions<PricingTier[], Error>) => {
  return useQuery({
    queryKey: [...productKeys.detail(productId), 'pricing'],
    queryFn: ({ signal }) => getProductPricingTiers(productId, signal),
    enabled: enabled && !!productId,
    staleTime: 30 * 60 * 1000, // 30 Minuten
    ...options,
  });
};

export function invalidateProductQuery(client: QueryClient, id: string) {
  return client.invalidateQueries({ queryKey: productKeys.detail(id) });
}

export function invalidateProductsQuery(client: QueryClient) {
  return client.invalidateQueries({ queryKey: productKeys.all });
}