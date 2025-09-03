'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { safeJsonParse } from '@/lib/jsonHelper';
import { supabase } from '@/lib/supabase';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    setIsMounted(true);

    // Check login status with Supabase Auth
    const checkLoginStatus = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.warn('Fehler beim Überprüfen des Login-Status:', error);
          setIsLoggedIn(false);
          return;
        }
        setIsLoggedIn(!!user);
        console.log('🔍 Login Status Check:', user ? 'Eingeloggt' : 'Nicht eingeloggt', user?.email);
      } catch (error) {
        console.warn('Fehler beim Überprüfen des Login-Status:', error);
        setIsLoggedIn(false);
      }
    };

    checkLoginStatus();

    // Listen for Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      console.log('🔍 Auth State Change:', event, session?.user?.email);
      setIsLoggedIn(!!session?.user);
    });

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isMountedRef.current || typeof window === 'undefined') return;

    const updateCartCount = () => {
      if (!isMountedRef.current) return;

      try {
        const cartData = localStorage.getItem('cart');
        if (!cartData || cartData === 'null' || cartData === 'undefined') {
          setCartItemCount(0);
          return;
        }

        const cart = safeJsonParse(cartData, []);
        
        if (Array.isArray(cart)) {
          const totalItems = cart.reduce((sum: number, item: any) => {
            const quantity = typeof item?.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 0;
            return sum + quantity;
          }, 0);
          setCartItemCount(Math.max(0, totalItems));
        } else {
          setCartItemCount(0);
        }
      } catch (error) {
        console.warn('Fehler beim Laden des Warenkorbs:', error);
        setCartItemCount(0);
      }
    };

    const handleScroll = () => {
      if (!isMountedRef.current) return;
      setIsScrolled(window.scrollY > 50);
    };

    const handleCartUpdate = () => {
      updateCartCount();
    };

    updateCartCount();
    handleScroll();

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const navigation = [
    { name: 'Startseite', href: '/' },
    { name: 'Shop', href: '/shop' },
    { name: 'Blog', href: '/blog' },
    { name: 'Über uns', href: '/ueber-uns' },
    { name: 'Kontakt', href: '/kontakt' }
  ];

  useEffect(() => {
    if (!isMountedRef.current || typeof document === 'undefined') return;

    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  if (!isMounted) {
    return (
      <header className="sticky top-0 z-50 transition-all duration-300 w-full bg-black/30 backdrop-blur-sm">
        <div className="container mx-auto px-4" style={{overflow: 'visible'}}>
          <div className="flex justify-between items-center h-16 md:h-20" style={{overflow: 'visible'}}>
            <Link href="/" className="flex items-center flex-shrink-0">
              <img
                src="https://public.readdy.ai/ai/img_res/86db7336-c7fd-4211-8615-9dceb4ceb922.jpg"
                alt="Brennholzkönig Logo"
                className="h-12 md:h-20 w-auto object-contain"
              />
            </Link>
            <nav className="hidden lg:flex items-center space-x-8">
              <Link
                href="/"
                className="text-white hover:text-white/80 transition-colors cursor-pointer font-medium"
              >
                Home
              </Link>
              <Link
                href="/shop"
                className="text-white hover:text-white/80 transition-colors cursor-pointer font-medium"
              >
                Shop
              </Link>
              <Link
                href="/ueber-uns"
                className="text-white hover:text-white/80 transition-colors cursor-pointer font-medium"
              >
                Über uns
              </Link>
              <Link
                href="/kontakt"
                className="text-white hover:text-white/80 transition-colors cursor-pointer font-medium"
              >
                Kontakt
              </Link>
            </nav>
            <button
              className="lg:hidden flex flex-col space-y-1 cursor-pointer p-2 z-50 relative flex-shrink-0"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="block w-6 h-0.5 bg-white drop-shadow-lg transition-all duration-300"></span>
              <span className="block w-6 h-0.5 bg-white drop-shadow-lg transition-all duration-300"></span>
              <span className="block w-6 h-0.5 bg-white drop-shadow-lg transition-all duration-300"></span>
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className={`sticky top-0 z-[9999] transition-all duration-300 w-full ${isScrolled ? 'bg-[#F5F0E0] shadow-lg' : 'bg-black/30 backdrop-blur-sm'}`}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16 md:h-20">
            <Link href="/" className="flex items-center flex-shrink-0">
              <img
                src="https://public.readdy.ai/ai/img_res/86db7336-c7fd-4211-8615-9dceb4ceb922.jpg"
                alt="Brennholzkönig Logo"
                className="h-12 md:h-20 w-auto object-contain"
              />
            </Link>
            <nav className="hidden lg:flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`hover:text-white/80 transition-colors cursor-pointer font-medium ${isScrolled ? 'text-gray-800 hover:text-orange-600' : 'text-white'}`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Link href="/warenkorb" className={`flex items-center space-x-2 sm:space-x-2 hover:text-orange-600 transition-colors cursor-pointer relative ${isScrolled ? 'text-gray-700' : 'text-white'}`}>
                <div className="w-8 h-8 sm:w-6 sm:h-6 flex items-center justify-center flex-shrink-0 relative">
                  <i className="ri-shopping-cart-line text-xl sm:text-xl"></i>
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs rounded-full min-w-5 h-5 px-1 flex items-center justify-center font-bold text-[10px] leading-none">
                      {cartItemCount > 99 ? '99+' : cartItemCount}
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline">Warenkorb</span>
              </Link>

              {/* Direct Account Link - Simple Solution */}
              <Link 
                href="/konto"
                className={`flex items-center space-x-1 sm:space-x-2 hover:text-orange-600 transition-colors cursor-pointer ${isScrolled ? 'text-gray-700' : 'text-white'}`}
              >
                <div className="w-6 h-6 sm:w-5 sm:h-5 flex items-center justify-center flex-shrink-0">
                  <i className="ri-user-line text-lg sm:text-xl"></i>
                </div>
                <span className="hidden sm:inline">Mein Konto</span>
              </Link>

              <button
                className="lg:hidden flex flex-col space-y-1 cursor-pointer p-2 z-50 relative flex-shrink-0"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <span className={`block w-6 h-0.5 transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2 bg-gray-800' : isScrolled ? 'bg-gray-800' : 'bg-white drop-shadow-lg'}`}></span>
                <span className={`block w-6 h-0.5 transition-all duration-300 ${isMenuOpen ? 'opacity-0' : isScrolled ? 'bg-gray-800' : 'bg-white drop-shadow-lg'}`}></span>
                <span className={`block w-6 h-0.5 transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2 bg-gray-800' : isScrolled ? 'bg-gray-800' : 'bg-white drop-shadow-lg'}`}></span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[9998] lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMenuOpen(false)}></div>
          <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Menü</h2>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-6">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block px-6 py-3 text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="border-t mt-4 pt-4">
                  <Link
                    href="/warenkorb"
                    className="flex items-center px-6 py-3 text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <i className="ri-shopping-cart-line text-xl mr-3"></i>
                    Warenkorb
                    {cartItemCount > 0 && (
                      <span className="ml-auto bg-orange-600 text-white text-xs rounded-full min-w-5 h-5 px-1 flex items-center justify-center font-bold">
                        {cartItemCount > 99 ? '99+' : cartItemCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/konto"
                    className="flex items-center px-6 py-3 text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <i className="ri-user-line text-xl mr-3"></i>
                    Mein Konto
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}