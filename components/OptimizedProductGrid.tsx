'use client';
import { useState, useEffect, useMemo } from 'react';
import { useProducts, useProductCategories, useShopSettings, usePrefetchCriticalData } from '@/hooks/useOptimizedQueries';
import { calculatePriceWithTiers } from '@/lib/pricing';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock_quantity: number;
  unit: string;
  features?: string[];
  specifications?: { [key: string]: string };
  original_price?: number;
  is_active: boolean;
  in_stock?: boolean;
  created_at: string;
  has_quantity_discount?: boolean;
}

interface OptimizedProductGridProps {
  initialCategory?: string;
  showFilters?: boolean;
  maxProducts?: number;
  initialProducts?: Product[];
  loadTime?: number;
  error?: string | null;
}

export default function OptimizedProductGrid({ 
  initialCategory = 'Alle',
  showFilters = true,
  maxProducts,
  initialProducts = [],
  loadTime = 0,
  error = null
}: OptimizedProductGridProps) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Prefetch kritische Daten beim Mount
  const { prefetchAll } = usePrefetchCriticalData();
  
  useEffect(() => {
    prefetchAll();
  }, [prefetchAll]);
  
  // Optimierte Queries mit Caching
  const { 
    data: realtimeProducts = [], 
    isLoading: productsLoading, 
    error: productsError 
  } = useProducts({ 
    category: selectedCategory === 'Alle' ? undefined : selectedCategory,
    active: true 
  });
  
  const { 
    data: categories = [], 
    isLoading: categoriesLoading 
  } = useProductCategories();
  
  const { 
    data: shopSettings,
    isLoading: settingsLoading 
  } = useShopSettings();
  
  // Kombiniere Server-Side und Client-Side Daten
  const products = useMemo(() => {
    // Verwende Server-Side Daten wenn verfügbar, sonst Real-time Daten
    if (initialProducts.length > 0) {
      return initialProducts;
    }
    return realtimeProducts;
  }, [initialProducts, realtimeProducts]);
  
  // Kombiniere Fehler-States
  const combinedError = error || productsError;
  
  // Memoized gefilterte Produkte für Performance
  const filteredProducts = useMemo(() => {
    let filtered = products as unknown as Product[];
    
    // Suchfilter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        (product.name as string).toLowerCase().includes(searchLower) ||
        (product.description as string).toLowerCase().includes(searchLower) ||
        (product.category as string).toLowerCase().includes(searchLower)
      );
    }
    
    // Limit anwenden
    if (maxProducts) {
      filtered = filtered.slice(0, maxProducts);
    }
    
    return filtered;
  }, [products, searchTerm, maxProducts]);
  
  // Memoized Kategorien mit "Alle" Option
  const allCategories = useMemo(() => {
    const categoryNames = categories.map((cat: any) => cat.name as string);
    return ['Alle', ...categoryNames];
  }, [categories]);
  
  // Loading State (nur wenn keine Server-Side Daten verfügbar)
  if ((productsLoading || categoriesLoading || settingsLoading) && initialProducts.length === 0) {
    return (
      <div className="space-y-6">
        {/* Loading Skeleton für Filter */}
        {showFilters && (
          <div className="flex flex-wrap gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        )}
        
        {/* Loading Skeleton für Produkte */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-48 bg-gray-200 animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Error State
  if (combinedError && products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 flex items-center justify-center bg-red-100 rounded-full mx-auto mb-4">
          <i className="ri-error-warning-line text-2xl text-red-600"></i>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Fehler beim Laden der Produkte</h3>
        <p className="text-red-600 mb-4">Fehler beim Laden der Produkte: {typeof combinedError === 'string' ? combinedError : combinedError.message}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Seite neu laden
        </button>
      </div>
    );
  }
  
  // Preisberechnung mit Caching
  const calculateProductPrice = (product: Product, quantity: number = 1) => {
    if (!shopSettings) return { price: product.price, adjustmentText: '' };
    
    return calculatePriceWithTiers(
      product.price,
      quantity,
      [], // Preisstaffeln werden separat geladen
      shopSettings.minOrderQuantity,
      product.has_quantity_discount || false
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Unsere Produkte</h2>
      </div>
      {/* Filter Section */}
      {showFilters && (
        <div className="space-y-4">
          {/* Suchfeld */}
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="ri-search-line text-gray-400"></i>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Produkte durchsuchen..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Kategorie-Filter */}
          <div className="flex flex-wrap gap-3">
            {allCategories.map((category: string) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Produkt-Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
            <i className="ri-search-line text-2xl text-gray-400"></i>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Keine Produkte gefunden</h3>
          <p className="text-gray-600">
            {searchTerm 
              ? `Keine Produkte für "${searchTerm}" gefunden.`
              : 'In dieser Kategorie sind keine Produkte verfügbar.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product: Product) => {
            const pricing = calculateProductPrice(product);
            
            return (
              <Link 
                key={product.id} 
                href={`/shop/${product.id}`}
                className="group bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Produktbild */}
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={product.image_url || '/placeholder-product.jpg'}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    loading="lazy"
                  />
                  
                  {/* Verfügbarkeits-Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      product.stock_quantity > 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.stock_quantity > 0 ? 'Verfügbar' : 'Ausverkauft'}
                    </span>
                  </div>
                </div>
                
                {/* Produktinfo */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {product.name}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold text-gray-900">
                        €{pricing.price.toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">/ {product.unit}</span>
                      
                      {pricing.adjustmentText && (
                        <div className="text-xs text-blue-600 mt-1">
                          {pricing.adjustmentText}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xs text-gray-500">
                        Lager: {product.stock_quantity}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      
      {/* Ergebnis-Info */}
      <div className="text-center text-sm text-gray-500">
        {filteredProducts.length} von {products.length} Produkten angezeigt
        {maxProducts && products.length > maxProducts && (
          <span className="ml-2">
            • <Link href="/shop" className="text-blue-600 hover:underline">Alle Produkte anzeigen</Link>
          </span>
        )}
      </div>
    </div>
  );
}