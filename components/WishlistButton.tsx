
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface WishlistButtonProps {
  productId: string | number;
  className?: string;
}

export default function WishlistButton({ productId, className = '' }: WishlistButtonProps) {
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuthAndWishlist();
  }, [productId]);

  const checkAuthAndWishlist = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data } = await supabase
          .from('wishlist')
          .select('id')
          .eq('customer_id', user.id)
          .eq('product_id', productId)
          .single();
        
        setIsInWishlist(!!data);
      }
    } catch (error) {
      console.error('Error checking wishlist:', error);
    }
  };

  const toggleWishlist = async () => {
    if (!user) {
      alert('Bitte melden Sie sich an, um Produkte zur Wunschliste hinzuzufügen');
      return;
    }

    setLoading(true);
    
    try {
      if (isInWishlist) {
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .eq('customer_id', user.id)
          .eq('product_id', productId);
        
        if (error) throw error;
        setIsInWishlist(false);
      } else {
        const { error } = await supabase
          .from('wishlist')
          .insert({
            customer_id: user.id,
            product_id: productId
          });
        
        if (error) throw error;
        setIsInWishlist(true);
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      alert('Fehler beim Aktualisieren der Wunschliste');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleWishlist}
      disabled={loading}
      className={`w-10 h-10 flex items-center justify-center rounded-full border transition-all ${
        isInWishlist 
          ? 'bg-red-50 border-red-200 text-red-500' 
          : 'bg-white border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200'
      } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      title={isInWishlist ? 'Von Wunschliste entfernen' : 'Zur Wunschliste hinzufügen'}
    >
      <i className={`${isInWishlist ? 'ri-heart-fill' : 'ri-heart-line'} text-lg`}></i>
    </button>
  );
}
