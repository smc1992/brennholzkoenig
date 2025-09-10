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
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const isMountedRef = useRef(false);
  const accountDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    isMountedRef.current = true;
    setIsMounted(true);

    // Check login status with Supabase Auth
    const checkLoginStatus = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        // Explicitly handle mock client or missing configuration
        if (error && error.message?.includes('Mock client')) {
          console.log('🔍 Mock Client detected - Setting logged out state');
          setIsLoggedIn(false);
          return;
        }
        
        if (error) {
          console.warn('Fehler beim Überprüfen des Login-Status:', error);
          setIsLoggedIn(false);
          return;
        }
        
        const isUserLoggedIn = !!user;
        setIsLoggedIn(isUserLoggedIn);
        console.log('🔍 Login Status Check:', isUserLoggedIn ? 'Eingeloggt' : 'Nicht eingeloggt', user?.email || 'No user');
      } catch (error) {
        console.warn('Fehler beim Überprüfen des Login-Status:', error);
        setIsLoggedIn(false);
      }
    };

    checkLoginStatus();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email || 'No user');
      setIsLoggedIn(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const updateCartCount = () => {
      if (typeof window !== 'undefined') {
        const cartData = localStorage.getItem('cart');
        const cart = safeJsonParse(cartData, []);
        const totalItems = cart.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
        setCartItemCount(totalItems);
      }
    };

    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    window.addEventListener('cartUpdated', updateCartCount);

    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) {
        setIsAccountDropdownOpen(false);
      }
    };

    if (isAccountDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAccountDropdownOpen]);

  const navigation = [
    { name: 'Startseite', href: '/' },
    { name: 'Shop', href: '/shop' },
    { name: 'Blog', href: '/blog' },
    { name: 'Über uns', href: '/ueber-uns' },
    { name: 'Kontakt', href: '/kontakt' },
  ];

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
            <nav className="hidden lg:flex items-center space-x-8" style={{pointerEvents: 'auto'}}>
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
      <header className={`fixed top-0 left-0 right-0 transition-all duration-300 w-full ${isScrolled ? 'bg-[#F5F0E0] shadow-lg' : 'bg-black/30 backdrop-blur-sm'}`} style={{pointerEvents: 'auto', zIndex: 999999, position: 'fixed'}}>
        <div className="container mx-auto px-4" style={{pointerEvents: 'auto'}}>
          <div className="flex justify-between items-center h-16 md:h-20" style={{pointerEvents: 'auto'}}>
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

              {/* Account Dropdown for Desktop */}
              <div className="relative hidden sm:block" ref={accountDropdownRef} style={{pointerEvents: 'auto', zIndex: 10000}}>
                <button
                  onClick={() => {
                    console.log('Desktop account dropdown clicked:', !isAccountDropdownOpen);
                    setIsAccountDropdownOpen(!isAccountDropdownOpen);
                  }}
                  className={`flex items-center space-x-1 sm:space-x-2 hover:text-orange-600 transition-colors cursor-pointer ${isScrolled ? 'text-gray-700' : 'text-white'}`}
                  style={{pointerEvents: 'auto', zIndex: 10001, position: 'relative'}}
                >
                  <div className="w-6 h-6 sm:w-5 sm:h-5 flex items-center justify-center flex-shrink-0">
                    <i className="ri-user-line text-lg sm:text-xl"></i>
                  </div>
                  <span className="hidden sm:inline">{isLoggedIn ? 'Mein Konto' : 'Anmelden'}</span>
                  <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                    <i className={`ri-arrow-down-s-line text-sm transition-transform ${isAccountDropdownOpen ? 'rotate-180' : ''}`}></i>
                  </div>
                </button>

                {/* Desktop Dropdown Menu */}
                {isAccountDropdownOpen && (
                  <div 
                    className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 header-dropdown block"
                    style={{
                        position: 'fixed',
                        zIndex: 9999999,
                        right: '10px',
                        top: '70px',
                        overflow: 'visible',
                        pointerEvents: 'auto',
                        backgroundColor: '#ffffff',
                        maxWidth: 'calc(100vw - 20px)',
                        width: '280px',
                        display: 'block',
                        visibility: 'visible',
                        opacity: 1
                      }}
                  >
                    {!isLoggedIn ? (
                      <div className="px-4 py-3" style={{pointerEvents: 'auto'}}>
                        <Link
                          href="/konto"
                          className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
                          onClick={() => setIsAccountDropdownOpen(false)}
                          style={{pointerEvents: 'auto', cursor: 'pointer'}}
                        >
                          <div className="flex items-center">
                            <i className="ri-login-box-line text-lg mr-3 text-orange-600"></i>
                            <div>
                              <div className="font-semibold">Anmelden / Registrieren</div>
                              <div className="text-sm text-gray-500">Zugang zu Ihrem Konto</div>
                            </div>
                          </div>
                        </Link>
                      </div>
                    ) : (
                      <div className="py-2">
                        <Link href="/konto/dashboard" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setIsAccountDropdownOpen(false)}>
                          <i className="ri-dashboard-line text-lg mr-3 text-orange-600"></i>
                          Dashboard
                        </Link>
                        <Link href="/konto/profil" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setIsAccountDropdownOpen(false)}>
                          <i className="ri-user-line text-lg mr-3 text-orange-600"></i>
                          Profil
                        </Link>
                        <Link href="/konto/bestellverlauf" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setIsAccountDropdownOpen(false)}>
                          <i className="ri-file-list-line text-lg mr-3 text-orange-600"></i>
                          Bestellverlauf
                        </Link>
                        <Link href="/konto/adressen" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setIsAccountDropdownOpen(false)}>
                          <i className="ri-map-pin-line text-lg mr-3 text-orange-600"></i>
                          Adressen
                        </Link>
                        <Link href="/konto/wunschliste" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setIsAccountDropdownOpen(false)}>
                          <i className="ri-heart-line text-lg mr-3 text-orange-600"></i>
                          Wunschliste
                        </Link>
                        <Link href="/konto/benachrichtigungen" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setIsAccountDropdownOpen(false)}>
                          <i className="ri-notification-line text-lg mr-3 text-orange-600"></i>
                          Benachrichtigungen
                        </Link>
                        <Link href="/konto/support" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setIsAccountDropdownOpen(false)}>
                          <i className="ri-customer-service-line text-lg mr-3 text-orange-600"></i>
                          Support
                        </Link>
                        <Link href="/konto/faq" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setIsAccountDropdownOpen(false)}>
                          <i className="ri-question-line text-lg mr-3 text-orange-600"></i>
                          FAQ
                        </Link>
                        <div className="border-t mt-2 pt-2">
                          <button
                            onClick={async () => {
                              try {
                                await supabase.auth.signOut();
                                setIsAccountDropdownOpen(false);
                              } catch (error) {
                                console.error('Logout error:', error);
                              }
                            }}
                            className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors text-left"
                          >
                            <i className="ri-logout-box-line text-lg mr-3 text-orange-600"></i>
                            Abmelden
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Konto für Mobile */}
              {!isLoggedIn ? (
                <Link 
                  href="/konto" 
                  className={`sm:hidden flex items-center space-x-1 hover:text-orange-600 transition-colors cursor-pointer ${isScrolled ? 'text-gray-700' : 'text-white'}`}
                >
                  <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                    <i className="ri-user-line text-lg"></i>
                  </div>
                </Link>
              ) : (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Mobile Dropdown geklickt:', !isAccountDropdownOpen);
                    setIsAccountDropdownOpen(!isAccountDropdownOpen);
                  }}
                  className={`sm:hidden flex items-center space-x-1 hover:text-orange-600 transition-colors cursor-pointer ${isScrolled ? 'text-gray-700' : 'text-white'}`}
                >
                  <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                    <i className="ri-user-line text-lg"></i>
                  </div>
                  <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                    <i className={`ri-arrow-down-s-line text-sm transition-transform ${isAccountDropdownOpen ? 'rotate-180' : ''}`}></i>
                  </div>
                </button>
              )}

              <button
                className="lg:hidden flex flex-col space-y-1 cursor-pointer p-2 z-10 relative flex-shrink-0"
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

      {/* Mobile Dropdown Portal - Nur für eingeloggte Benutzer */}
      {isLoggedIn && isAccountDropdownOpen && (
        <div 
          className="fixed inset-0 sm:hidden"
          style={{zIndex: 999999999}}
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/20"
            onClick={() => setIsAccountDropdownOpen(false)}
          />
          
          {/* Dropdown */}
           <div className="absolute right-2 top-16 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[200px]">
             <div 
               className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
               onMouseDown={(e) => {
                 e.preventDefault();
                 console.log('Dashboard Navigation');
                 setIsAccountDropdownOpen(false);
                 window.location.href = '/konto/dashboard';
               }}
               onTouchStart={(e) => {
                 e.preventDefault();
                 console.log('Dashboard Touch');
                 setIsAccountDropdownOpen(false);
                 window.location.href = '/konto/dashboard';
               }}
             >
               <i className="ri-dashboard-line text-lg mr-3 text-orange-600"></i>
               Dashboard
             </div>
             
             <div 
               className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
               onMouseDown={(e) => {
                 e.preventDefault();
                 console.log('Profil Navigation');
                 setIsAccountDropdownOpen(false);
                 window.location.href = '/konto/profil';
               }}
               onTouchStart={(e) => {
                 e.preventDefault();
                 console.log('Profil Touch');
                 setIsAccountDropdownOpen(false);
                 window.location.href = '/konto/profil';
               }}
             >
               <i className="ri-user-line text-lg mr-3 text-orange-600"></i>
               Profil
             </div>
             
             <div 
               className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
               onMouseDown={(e) => {
                 e.preventDefault();
                 console.log('Bestellverlauf Navigation');
                 setIsAccountDropdownOpen(false);
                 window.location.href = '/konto/bestellverlauf';
               }}
               onTouchStart={(e) => {
                 e.preventDefault();
                 console.log('Bestellverlauf Touch');
                 setIsAccountDropdownOpen(false);
                 window.location.href = '/konto/bestellverlauf';
               }}
             >
               <i className="ri-file-list-line text-lg mr-3 text-orange-600"></i>
               Bestellverlauf
             </div>
             
             <div 
               className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
               onMouseDown={(e) => {
                 e.preventDefault();
                 console.log('Adressen Navigation');
                 setIsAccountDropdownOpen(false);
                 window.location.href = '/konto/adressen';
               }}
               onTouchStart={(e) => {
                 e.preventDefault();
                 console.log('Adressen Touch');
                 setIsAccountDropdownOpen(false);
                 window.location.href = '/konto/adressen';
               }}
             >
               <i className="ri-map-pin-line text-lg mr-3 text-orange-600"></i>
               Adressen
             </div>
             
             <div 
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                onMouseDown={(e) => {
                  e.preventDefault();
                  console.log('Wunschliste Navigation');
                  setIsAccountDropdownOpen(false);
                  window.location.href = '/konto/wunschliste';
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  console.log('Wunschliste Touch');
                  setIsAccountDropdownOpen(false);
                  window.location.href = '/konto/wunschliste';
                }}
              >
                <i className="ri-heart-line text-lg mr-3 text-orange-600"></i>
                Wunschliste
              </div>
              
              <div 
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                onMouseDown={(e) => {
                  e.preventDefault();
                  console.log('Benachrichtigungen Navigation');
                  setIsAccountDropdownOpen(false);
                  window.location.href = '/konto/benachrichtigungen';
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  console.log('Benachrichtigungen Touch');
                  setIsAccountDropdownOpen(false);
                  window.location.href = '/konto/benachrichtigungen';
                }}
              >
                <i className="ri-notification-line text-lg mr-3 text-orange-600"></i>
                Benachrichtigungen
              </div>
              
              <div 
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                onMouseDown={(e) => {
                  e.preventDefault();
                  console.log('Support Navigation');
                  setIsAccountDropdownOpen(false);
                  window.location.href = '/konto/support';
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  console.log('Support Touch');
                  setIsAccountDropdownOpen(false);
                  window.location.href = '/konto/support';
                }}
              >
                <i className="ri-customer-service-line text-lg mr-3 text-orange-600"></i>
                Support
              </div>
              
              <div 
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                onMouseDown={(e) => {
                  e.preventDefault();
                  console.log('FAQ Navigation');
                  setIsAccountDropdownOpen(false);
                  window.location.href = '/konto/faq';
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  console.log('FAQ Touch');
                  setIsAccountDropdownOpen(false);
                  window.location.href = '/konto/faq';
                }}
              >
                <i className="ri-question-line text-lg mr-3 text-orange-600"></i>
                FAQ
              </div>
              
              <div className="border-t mt-2 pt-2">
               <div
                 className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                 onMouseDown={(e) => {
                   e.preventDefault();
                   console.log('Abmelden Navigation');
                   setIsAccountDropdownOpen(false);
                   supabase.auth.signOut().then(() => {
                     window.location.href = '/';
                   });
                 }}
                 onTouchStart={(e) => {
                   e.preventDefault();
                   console.log('Abmelden Touch');
                   setIsAccountDropdownOpen(false);
                   supabase.auth.signOut().then(() => {
                     window.location.href = '/';
                   });
                 }}
               >
                 <i className="ri-logout-box-line text-lg mr-3 text-orange-600"></i>
                 Abmelden
               </div>
             </div>
           </div>
        </div>
      )}

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 lg:hidden" style={{zIndex: 9999999, overflow: 'visible'}}>
          <div className="fixed inset-0 bg-black/80" style={{zIndex: 9999999}} onClick={() => setIsMenuOpen(false)}></div>
          <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out" style={{zIndex: 9999999, overflow: 'visible', backgroundColor: '#ffffff', position: 'fixed'}}>
            <div className="flex flex-col h-full" style={{overflow: 'visible'}}>
              <div className="flex items-center justify-between p-6 border-b" style={{overflow: 'visible'}}>
                <h2 className="text-xl font-bold text-gray-900">Menü</h2>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
              <div className="flex-1 py-6" style={{overflow: 'visible'}}>
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
                  <div className="px-6 py-3">
                    <div className="text-gray-900 font-medium mb-2 flex items-center">
                      <i className="ri-user-line text-xl mr-3"></i>
                      Mein Konto
                    </div>
                    <div className="ml-8 space-y-1">
                      {!isLoggedIn ? (
                        <Link
                          href="/konto"
                          className="block py-2 text-gray-700 hover:text-orange-600 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Anmelden / Registrieren
                        </Link>
                      ) : (
                        <>
                          <Link
                            href="/konto/dashboard"
                            className="block py-2 text-gray-700 hover:text-orange-600 transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Dashboard
                          </Link>
                          <Link
                            href="/konto/profil"
                            className="block py-2 text-gray-700 hover:text-orange-600 transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Profil
                          </Link>
                          <Link
                            href="/konto/bestellverlauf"
                            className="block py-2 text-gray-700 hover:text-orange-600 transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Bestellverlauf
                          </Link>
                          <Link
                            href="/konto/adressen"
                            className="block py-2 text-gray-700 hover:text-orange-600 transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Adressen
                          </Link>
                          <Link
                            href="/konto/wunschliste"
                            className="block py-2 text-gray-700 hover:text-orange-600 transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Wunschliste
                          </Link>
                          <button
                            onClick={async () => {
                              try {
                                await supabase.auth.signOut();
                                setIsMenuOpen(false);
                              } catch (error) {
                                console.error('Logout error:', error);
                              }
                            }}
                            className="block w-full text-left py-2 text-gray-700 hover:text-orange-600 transition-colors"
                          >
                            Abmelden
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}