
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface WishlistItem {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string;
    category: string;
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
            category
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transformiere die Daten in das erwartete Format
      const formattedData: WishlistItem[] = (data || []).map(item => ({
        id: item.id,
        created_at: item.created_at,
        product: Array.isArray(item.product) && item.product.length > 0 ? {
          id: item.product[0].id,
          name: item.product[0].name,
          price: item.product[0].price,
          image_url: item.product[0].image_url,
          category: item.product[0].category
        } : {
          id: '',
          name: 'Produkt nicht verfügbar',
          price: 0,
          image_url: '',
          category: ''
        }
      }));
      
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
    // Hier würde die Warenkorb-Logik implementiert werden
    alert('Produkt wurde zum Warenkorb hinzugefügt!');
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <Link href="/konto/dashboard" className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-4">
            <i className="ri-arrow-left-line mr-2"></i>
            Zurück zum Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Meine Wunschliste</h1>
          <p className="text-gray-600 mt-2">Ihre gespeicherten Lieblingsprodukte</p>
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
              <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative">
                  <img 
                    src={item.product.image_url} 
                    alt={item.product.name}
                    className="w-full h-48 object-cover"
                  />
                  <button
                    onClick={() => removeFromWishlist(item.id)}
                    className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-red-50 transition-colors"
                  >
                    <i className="ri-heart-fill text-red-500"></i>
                  </button>
                </div>
                
                <div className="p-6">
                  <div className="mb-2">
                    <span className="inline-block px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                      {item.product.category}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2">{item.product.name}</h3>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-orange-600">
                      {item.product.price}€
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link 
                      href={`/shop/${item.product.id}`}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center whitespace-nowrap"
                    >
                      Details
                    </Link>
                    <button
                      onClick={() => addToCart(item.product.id)}
                      className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors whitespace-nowrap"
                    >
                      <i className="ri-shopping-cart-line mr-1"></i>
                      In den Warenkorb
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-3">
                    Hinzugefügt am {new Date(item.created_at).toLocaleDateString('de-DE')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
