
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { getCDNUrl } from '@/utils/cdn';
import { trackAddToCart } from '@/components/GoogleAnalytics';

// Using the centralized Supabase client from lib/supabase.ts

interface WishlistItem {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string;
    category: string;
    unit?: string;
    stock_quantity?: number;
    min_stock_level?: number;
    description?: string;
  };
  created_at: string;
}

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          id,
          created_at,
          product:products(
            id,
            name,
            price,
            image_url,
            category,
            unit,
            stock_quantity,
            description
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transformiere die Daten in das erwartete Format
      const formattedData: WishlistItem[] = (data || []).map((item: any) => ({
        id: item.id,
        created_at: item.created_at,
        product: item.product ? {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          image_url: item.product.image_url,
          category: item.product.category,
          unit: item.product.unit || 'SRM',
          stock_quantity: item.product.stock_quantity || 0,
          description: item.product.description || ''
        } : {
          id: '',
          name: 'Produkt nicht verfügbar',
          price: 0,
          image_url: '',
          category: '',
          unit: 'SRM',
          stock_quantity: 0,
          description: ''
        }
      }));
      
      console.log('Wunschliste geladen:', formattedData);
      
      setWishlistItems(formattedData);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (wishlistId: string) => {
    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', wishlistId);

      if (error) throw error;
      
      setWishlistItems(prev => prev.filter(item => item.id !== wishlistId));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  const addToCart = async (productId: string) => {
    try {
      // Finde das Produkt in der Wunschliste
      const wishlistItem = wishlistItems.find(item => item.product.id === productId);
      if (!wishlistItem) {
        alert('Produkt nicht gefunden!');
        return;
      }

      const product = wishlistItem.product;
      const quantity = 1; // Standard-Menge

      // Bestandsprüfung: Aktuellen Lagerbestand aus der Datenbank abrufen
      const { data: currentProduct, error } = await supabase
        .from('products')
        .select('stock_quantity, name')
        .eq('id', productId)
        .single();

      if (error) {
        console.error('Fehler beim Abrufen des Lagerbestands:', error);
        alert('Fehler beim Überprüfen des Lagerbestands. Bitte versuchen Sie es erneut.');
        return;
      }

      if (!currentProduct) {
        alert('Produkt nicht gefunden.');
        return;
      }

      // Prüfe ob Produkt ausverkauft ist
      if (currentProduct.stock_quantity === 0) {
        alert(`"${currentProduct.name}" ist ausverkauft und kann nicht in den Warenkorb gelegt werden.`);
        return;
      }

      // Warenkorb aus localStorage laden und Bestandsprüfung
      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
      const existingItemIndex = existingCart.findIndex((item: any) => item.id === productId);
      
      let totalQuantityNeeded = quantity;
      if (existingItemIndex > -1) {
        totalQuantityNeeded = existingCart[existingItemIndex].quantity + quantity;
      }

      if (totalQuantityNeeded > currentProduct.stock_quantity) {
        alert(`Nur noch ${currentProduct.stock_quantity} ${product.unit || 'Stück'} von "${currentProduct.name}" verfügbar.`);
        return;
      }
      
      if (existingItemIndex > -1) {
        // Menge erhöhen
        existingCart[existingItemIndex].quantity += quantity;
      } else {
        // Neues Produkt hinzufügen
        existingCart.push({
          id: productId,
          name: product.name,
          category: product.category,
          price: product.price.toString(),
          basePrice: product.price,
          image_url: product.image_url,
           unit: product.unit || 'SRM',
           quantity: quantity,
           stock_quantity: product.stock_quantity || 999
        });
      }
      
      // Warenkorb speichern
      localStorage.setItem('cart', JSON.stringify(existingCart));
      
      // Google Analytics Event tracken
      trackAddToCart(
        productId,
        product.name,
        product.category,
        quantity,
        product.price
      );
      
      // Erfolgs-Benachrichtigung
      alert(`${product.name} wurde zum Warenkorb hinzugefügt!`);
      
    } catch (error) {
      console.error('Fehler beim Hinzufügen zum Warenkorb:', error);
      alert('Fehler beim Hinzufügen zum Warenkorb');
    }
  };

  // Hilfsfunktion für CDN-URLs
  const getImageUrl = (url: string) => {
    if (!url) return '/api/placeholder?width=400&height=400&text=Bild+nicht+verfügbar';
    // Wenn es bereits eine vollständige URL ist, verwende sie direkt
    if (url.startsWith('http')) return url;
    // Wenn es ein absoluter Pfad ist (beginnt mit /), verwende ihn direkt
    if (url.startsWith('/')) return url;
    // Wenn es ein Storage-Filename ist, konvertiere zu CDN-URL
    return getCDNUrl(`products/${url}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 sm:pt-24 md:pt-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <Link href="/konto/dashboard" className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-3 sm:mb-4 text-sm sm:text-base">
            <i className="ri-arrow-left-line mr-2"></i>
            <span className="truncate">Zurück zum Dashboard</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Meine Wunschliste</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">Ihre gespeicherten Lieblingsprodukte</p>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <i className="ri-heart-line text-2xl text-gray-400"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ihre Wunschliste ist leer</h3>
            <p className="text-gray-600 mb-6">Entdecken Sie unsere Produkte und fügen Sie Ihre Favoriten hinzu</p>
            <Link 
              href="/shop" 
              className="inline-flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <i className="ri-shopping-bag-line mr-2"></i>
              Zum Shop
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col min-h-[450px] sm:min-h-[500px] lg:min-h-[550px]">
                <div className="relative flex-shrink-0">
                  <img 
                    src={getImageUrl(item.product.image_url)} 
                    alt={item.product.name}
                    className="w-full h-36 sm:h-40 lg:h-44 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/api/placeholder?width=400&height=400&text=Bild+nicht+verfügbar';
                    }}
                  />
                  <button
                    onClick={() => removeFromWishlist(item.id)}
                    className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-red-50 transition-colors"
                  >
                    <i className="ri-heart-fill text-red-500"></i>
                  </button>
                </div>
                
                <div className="p-4 sm:p-5 lg:p-6 flex-1 flex flex-col justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 lg:mb-4 line-clamp-2">{item.product.name}</h3>
                    
                    {item.product.description && (
                      <p className="text-sm text-gray-600 mb-3 sm:mb-4 lg:mb-5 line-clamp-2">{item.product.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-5">
                      <div>
                        <span className="text-2xl font-bold text-orange-600">
                          {item.product.price}€
                        </span>
                        <span className="text-sm text-gray-500 ml-1">/ {item.product.unit}</span>
                      </div>
                      
                      {item.product.stock_quantity !== undefined && (
                         item.product.stock_quantity === 0 ? (
                           <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                             Ausverkauft
                           </div>
                         ) : item.product.stock_quantity <= (item.product.min_stock_level || 0) ? (
                           <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                             Limitiert verfügbar
                           </div>
                         ) : null
                       )}
                    </div>
                    
                    <div className="mb-3 sm:mb-4 lg:mb-5">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {item.product.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-auto">
                    <div className="flex gap-2 mb-2 sm:mb-3 lg:mb-4">
                      <Link 
                        href={`/shop/${item.product.id}`}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center whitespace-nowrap"
                      >
                        Details
                      </Link>
                      <button
                        onClick={() => addToCart(item.product.id)}
                        disabled={item.product.stock_quantity === 0}
                        className={`flex-1 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                          item.product.stock_quantity === 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-orange-600 text-white hover:bg-orange-700'
                        }`}
                      >
                        <i className="ri-shopping-cart-line mr-1"></i>
                        {item.product.stock_quantity === 0 ? 'Ausverkauft' : 'In den Warenkorb'}
                      </button>
                    </div>
                    
                    <p className="text-xs text-gray-500">
                      Hinzugefügt am {new Date(item.created_at).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
