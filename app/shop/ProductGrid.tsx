
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { calculatePriceWithTiers } from '../../lib/pricing';
import WishlistButton from '../../components/WishlistButton';
import { getCDNUrl } from '../../utils/cdn';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';

// SEO-freundliche URL-Zuordnung
const productUrlMapping: { [key: number]: string } = {
  1: 'industrieholz-buche-klasse-1',
  2: 'industrieholz-buche-klasse-2',
  3: 'scheitholz-buche-33cm',
  4: 'scheitholz-buche-25cm',
  5: 'scheitholz-industrieholz-mix-33cm',
  6: 'scheitholz-fichte-33cm'
};

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock_quantity: number;
  min_stock_level?: number;
  features?: string[];
  specifications?: { [key: string]: string };
  unit: string;
  original_price?: number;
  is_active: boolean;
  in_stock?: boolean;
  created_at: string;
}

interface PricingTier {
  id: number;
  name: string;
  min_quantity: number;
  max_quantity?: number;
  adjustment_type: 'percentage' | 'fixed';
  adjustment_value: number;
  is_active: boolean;
}

export default function ProductGrid() {
  // Fallback-Produkte, falls keine aus der Datenbank geladen werden können
  const fallbackProducts: Product[] = [
    {
      id: 1,
      name: 'Industrieholz Buche Klasse 1',
      description: 'Hochwertiges Industrieholz aus Buche, Klasse 1',
      price: 115.00,
      image_url: '/images/industrieholz-buche-klasse-1-1756333840437.png',
      category: 'Industrieholz',
      stock_quantity: 100,
      features: ['Kammergetrocknet', 'Sofort verfügbar', 'Premium Qualität'],
      unit: 'pro Schüttraummeter',
      is_active: true,
      in_stock: true,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Industrieholz Buche Klasse 2',
      description: 'Industrieholz aus Buche, Klasse 2',
      price: 90.00,
      image_url: '/images/industrieholz-buche-klasse-ii-1756679693263.webp',
      category: 'Industrieholz',
      stock_quantity: 150,
      features: ['Kammergetrocknet', 'Sofort verfügbar'],
      unit: 'pro Schüttraummeter',
      is_active: true,
      in_stock: true,
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      name: 'Scheitholz Buche 33cm',
      description: 'Klassisches Scheitholz aus Buche, 33cm Länge',
      price: 99.99,
      image_url: '/images/scheitholz-buche-33-cm-1756681329634.webp',
      category: 'Scheitholz',
      stock_quantity: 25,
      unit: 'SRM',
      is_active: true,
      in_stock: true,
      created_at: new Date().toISOString()
    },
    {
      id: 4,
      name: 'Scheitholz Buche 25 cm',
      description: 'Premium Buchenscheitholz in kompakter 25 cm Länge',
      price: 90.00,
      image_url: '/images/scheitholz-buche-25-cm-1756684793745.webp',
      category: 'Scheitholz',
      stock_quantity: 22,
      unit: 'SRM',
      is_active: true,
      in_stock: true,
      created_at: new Date().toISOString()
    },
    {
      id: 5,
      name: 'Scheitholz - Industrieholz Mix 33 cm',
      description: 'Optimale Mischung aus 70% Industrieholz und 30% Fichte',
      price: 90.00,
      image_url: '/images/scheitholz-industrieholz-mix-33-cm-1756683834112.jpg',
      category: 'Mix-Sortiment',
      stock_quantity: 38,
      unit: 'SRM',
      is_active: true,
      in_stock: true,
      created_at: new Date().toISOString()
    },
    {
      id: 6,
      name: 'Scheitholz Fichte 33 cm',
      description: 'Hochwertiges Fichtenscheitholz, 33cm Länge',
      price: 75.00,
      image_url: '/images/scheitholz-fichte-33-cm-1756684168933.webp',
      category: 'Scheitholz',
      stock_quantity: 30,
      unit: 'SRM',
      is_active: true,
      in_stock: true,
      created_at: new Date().toISOString()
    }
   ];

  const { products: realtimeProducts, isLoading: realtimeLoading, error: realtimeError } = useRealtimeSync();
  
  // Debug: Prüfe useRealtimeSync Rückgabe
  console.log('🔍 ProductGrid: useRealtimeSync result:', {
    realtimeProducts,
    realtimeLoading,
    realtimeError,
    productsLength: realtimeProducts?.length || 0
  });
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Alle');
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [minOrderQuantity, setMinOrderQuantity] = useState<number>(3);
  const [loading, setLoading] = useState<boolean>(true);

  // Debug: Prüfe Real-time-Produkte
  console.log('🔍 ProductGrid: realtimeProducts:', realtimeProducts);
  console.log('🔍 ProductGrid: realtimeProducts.length:', realtimeProducts.length);
  console.log('🔍 ProductGrid: fallbackProducts:', fallbackProducts);
  
  // Verwende Real-time-Produkte oder Fallback
  const products = realtimeProducts.length > 0 ? realtimeProducts : fallbackProducts;
  
  console.log('🔍 ProductGrid: Final products used:', products);
  console.log('🔍 ProductGrid: Product 4 details:', products.find(p => p.id === 4));


  useEffect(() => {
    setLoading(realtimeLoading);
  }, [realtimeLoading]);

  useEffect(() => {
    if (selectedCategory === 'Alle') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(product => product.category === selectedCategory));
    }
  }, [products, selectedCategory]);

  const categories = ['Alle', ...Array.from(new Set(products.map(product => product.category)))];

  const getProductUrl = (productId: number): string => {
    return productUrlMapping[productId] || `product-${productId}`;
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(price);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#C04020] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Produkte werden geladen...</p>
        </div>
      </div>
    );
  }

  if (realtimeError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>Fehler beim Laden der Produkte: {realtimeError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Category Filter */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-[#C04020] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <i className="ri-inbox-line text-4xl mb-4"></i>
            <p className="text-lg">Keine Produkte in dieser Kategorie gefunden.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 product-grid">
          {filteredProducts.map((product) => {
            const productUrl = getProductUrl(product.id);
            const imageUrl = getCDNUrl(product.image_url);
            
            // Debug-Logging für Bildladung
            console.log(`🖼️ ProductGrid: Product ${product.id} (${product.name}):`, {
              original_image_url: product.image_url,
              processed_imageUrl: imageUrl,
              productUrl
            });
            
            return (
              <div key={product.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                {/* Product Image */}
                <div className="relative bg-gray-100 product-image-container">
                  <Link href={`/shop/${productUrl}`}>
                    <Image
                      src={imageUrl}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="hover:scale-105 transition-transform duration-300 cursor-pointer product-image"
                      style={{
                        objectFit: 'cover',
                        objectPosition: 'center'
                      }}
                      priority={false}
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                      onError={() => {
                        // Fallback handled by Next.js Image component
                      }}
                    />
                  </Link>
                  
                  {/* Wishlist Button */}
                  <div className="absolute top-4 right-4">
                    <WishlistButton productId={product.id} />
                  </div>

                  {/* Stock Status */}
                  {product.stock_quantity === 0 ? (
                    <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Ausverkauft
                    </div>
                  ) : product.stock_quantity <= (product.min_stock_level || 0) ? (
                    <div className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Limitiert verfügbar
                    </div>
                  ) : null}
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <div className="mb-2">
                    <span className="text-sm font-medium text-[#C04020] uppercase tracking-wider">
                      {product.category}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    <Link href={`/shop/${productUrl}`} className="hover:text-[#C04020] transition-colors">
                      {product.name}
                    </Link>
                  </h3>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {product.description}
                  </p>

                  {/* Features */}
                  {product.features && product.features.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {product.features.slice(0, 3).map((feature, index) => (
                          <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-[#C04020]">
                        {formatPrice(product.price)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {product.unit === 'SRM' ? 'pro Schüttraummeter' : 
                         product.unit === 'RM' ? 'pro Raummeter' :
                         product.unit === 'FM' ? 'pro Festmeter' :
                         product.unit === 'kg' ? 'pro Kilogramm' :
                         product.unit === 'Stück' ? 'pro Stück' :
                         product.unit === 'Palette' ? 'pro Palette' :
                         product.unit === 'm³' ? 'pro Kubikmeter' :
                         product.unit || 'pro Schüttraummeter'}
                      </div>
                    </div>
                    
                    <Link 
                      href={`/shop/${productUrl}`}
                      className="bg-[#C04020] text-white px-6 py-2 rounded-lg hover:bg-[#A03318] transition-colors font-medium"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Count */}
      <div className="mt-8 text-center text-gray-600">
        <p>{filteredProducts.length} von {products.length} Produkten angezeigt</p>
      </div>
    </div>
  );
}
