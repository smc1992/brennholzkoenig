'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { safeJsonParse } from '@/lib/jsonHelper';
import { supabase } from '@/lib/supabase';

export default function Header() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const isMountedRef = useRef(false);
  const accountDropdownRef = useRef<HTMLDivElement>(null);

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

    const handleClickOutside = (event: MouseEvent) => {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) {
        setIsAccountDropdownOpen(false);
      }
    };

    updateCartCount();
    handleScroll();

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('cartUpdated', handleCartUpdate);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('cartUpdated', handleCartUpdate);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navigation = [
    { name: 'Startseite', href: '/' },
    { name: 'Shop', href: '/shop' },
    { name: 'Blog', href: '/blog' },
    { name: 'Über uns', href: '/ueber-uns' },
    { name: 'Kontakt', href: '/kontakt' }
  ];

  const accountMenuItems = [
    { name: 'Dashboard', href: '/konto/dashboard', icon: 'ri-dashboard-line' },
    { name: 'Profil verwalten', href: '/konto/profil', icon: 'ri-user-line' },
    { name: 'Adressbuch', href: '/konto/adressen', icon: 'ri-map-pin-line' },
    { name: 'Bestellungen', href: '/konto/bestellverlauf', icon: 'ri-shopping-bag-line' },
    { name: 'Wunschliste', href: '/konto/wunschliste', icon: 'ri-heart-line' },
    { name: 'Support', href: '/konto/support', icon: 'ri-customer-service-2-line' },
    { name: 'FAQ', href: '/konto/faq', icon: 'ri-question-answer-line' },
  ];

  useEffect(() => {
    if (!isMountedRef.current || typeof document === 'undefined') return;

    // Account dropdown has priority over mobile menu
    if (isAccountDropdownOpen) {
      document.body.style.overflow = 'unset'; // Allow scrolling for dropdown
    } else if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen, isAccountDropdownOpen]);

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

              {/* Account Dropdown */}
              <div className="relative z-[9999]" ref={accountDropdownRef}>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🔍 Account dropdown button clicked, current state:', isAccountDropdownOpen);
                    setIsAccountDropdownOpen(!isAccountDropdownOpen);
                    console.log('🔍 Account dropdown new state:', !isAccountDropdownOpen);
                  }}
                  className={`flex items-center space-x-1 sm:space-x-2 hover:text-orange-600 transition-colors cursor-pointer ${isScrolled ? 'text-gray-700' : 'text-white'}`}
                >
                  <div className="w-6 h-6 sm:w-5 sm:h-5 flex items-center justify-center flex-shrink-0">
                    <i className="ri-user-line text-lg sm:text-xl"></i>
                  </div>
                  <span className="hidden sm:inline">Mein Konto</span>
                  <div className="w-5 h-5 sm:w-4 sm:h-4 flex items-center justify-center flex-shrink-0">
                    <i className={`ri-arrow-down-s-line text-sm transition-transform ${isAccountDropdownOpen ? 'rotate-180' : ''}`}></i>
                  </div>
                </button>


              </div>

              <button
                className="lg:hidden flex flex-col space-y-1 cursor-pointer p-2 z-50 relative flex-shrink-0"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <span className={`block w-6 h-0.5 transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''} ${isScrolled ? 'bg-[#C04020]' : 'bg-white drop-shadow-lg'}`}></span>
                <span className={`block w-6 h-0.5 transition-all duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'} ${isScrolled ? 'bg-[#C04020]' : 'bg-white drop-shadow-lg'}`}></span>
                <span className={`block w-6 h-0.5 transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''} ${isScrolled ? 'bg-[#C04020]' : 'bg-white drop-shadow-lg'}`}></span>
              </button>
            </div>
          </div>
        </div>
      </header>



      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" style={{overflow: 'hidden'}}>
          <div className="bg-[#F5F0E0] h-screen w-full pt-20 relative" style={{overflow: 'hidden', height: '100vh', maxHeight: '100vh'}}>
            {/* Schließen Button */}
            <button
              onClick={() => setIsMenuOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors z-50"
            >
              <i className="ri-close-line text-xl text-gray-600"></i>
            </button>
            <div className="px-6 py-8 h-full" style={{overflow: 'hidden', height: 'calc(100vh - 5rem)', maxHeight: 'calc(100vh - 5rem)'}}>
              <div className="mb-8">
                <h3 className="text-xs font-bold text-[#C04020] uppercase tracking-wider mb-4">Navigation</h3>
                <div className="space-y-4" style={{overflow: 'hidden'}}>
                  {navigation.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center text-lg font-medium text-[#1A1A1A] hover:text-[#C04020] transition-colors py-3 border-b border-gray-200 min-w-0"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="w-8 h-8 flex items-center justify-center mr-4 flex-shrink-0">
                        <i className={`ri-${item.href === '/' ? 'home-4-line' : item.href === '/shop' ? 'store-line' : item.href === '/blog' ? 'file-line' : item.href === '/ueber-uns' ? 'team-line' : 'mail-line'} text-xl text-[#C04020]`}></i>
                      </div>
                      <span className="break-words min-w-0 flex-1">{item.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
              <div className="mb-8">
                <h3 className="text-xs font-bold text-[#C04020] uppercase tracking-wider mb-4">Schnell-Aktionen</h3>
                <div className="space-y-3">
                  <Link
                    href="/shop"
                    className="w-full bg-[#C04020] text-white px-4 py-4 rounded-xl font-bold hover:bg-[#A03318] transition-colors flex items-center justify-center cursor-pointer min-w-0"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="w-7 h-7 flex items-center justify-center mr-3 flex-shrink-0">
                      <i className="ri-fire-line text-xl"></i>
                    </div>
                    <span className="break-words min-w-0 flex-1 text-center">Brennholz kaufen</span>
                  </Link>
                  <Link
                    href="/kontakt"
                    className="w-full bg-white text-[#C04020] border-2 border-[#C04020] px-4 py-4 rounded-xl font-bold hover:bg-gray-50 transition-colors flex items-center justify-center cursor-pointer min-w-0"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="w-7 h-7 flex items-center justify-center mr-3 flex-shrink-0">
                      <i className="ri-phone-line text-xl"></i>
                    </div>
                    <span className="break-words min-w-0 flex-1 text-center">Beratung anrufen</span>
                  </Link>
                </div>
              </div>
              <div className="mb-8">
                <h3 className="text-xs font-bold text-[#C04020] uppercase tracking-wider mb-4">Beliebte Produkte</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 min-w-0">
                    <div className="w-12 h-12 flex items-center justify-center bg-[#C04020]/10 rounded-full mb-3 mx-auto">
                      <i className="ri-fire-line text-[#C04020] text-xl"></i>
                    </div>
                    <h4 className="text-sm font-bold text-[#1A1A1A] mb-1 text-center break-words">Buche Klasse I</h4>
                    <p className="text-xs text-gray-600 text-center break-words">Premium Qualität</p>
                    <p className="text-lg font-bold text-[#C04020] mt-2 text-center">€115</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 min-w-0">
                    <div className="w-12 h-12 flex items-center justify-center bg-[#C04020]/10 rounded-full mb-3 mx-auto">
                      <i className="ri-leaf-line text-[#C04020] text-xl"></i>
                    </div>
                    <h4 className="text-sm font-bold text-[#1A1A1A] mb-1 text-center break-words">Buche Mix</h4>
                    <p className="text-xs text-gray-600 text-center break-words">Preis-Leistung</p>
                    <p className="text-lg font-bold text-[#C04020] mt-2 text-center">€90</p>
                  </div>
                </div>
              </div>
              <div className="mb-8">
                <h3 className="text-xs font-bold text-[#C04020] uppercase tracking-wider mb-4">Warum uns wählen?</h3>
                <div className="space-y-3">
                  <div className="flex items-center bg-white rounded-lg p-3 min-w-0">
                    <div className="w-10 h-10 flex items-center justify-center bg-[#C04020]/10 rounded-full mr-3 flex-shrink-0">
                      <i className="ri-truck-line text-[#C04020]"></i>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#1A1A1A] break-words">Kostengünstige Lieferung</p>
                      <p className="text-xs text-gray-600 break-words">ab 3 Schüttraummeter</p>
                    </div>
                  </div>
                  <div className="flex items-center bg-white rounded-lg p-3 min-w-0">
                    <div className="w-10 h-10 flex items-center justify-center bg-[#C04020]/10 rounded-full mr-3 flex-shrink-0">
                      <i className="ri-award-line text-[#C04020]"></i>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#1A1A1A] break-words">27 Jahre Erfahrung</p>
                      <p className="text-xs text-gray-600 break-words">Familientradition</p>
                    </div>
                  </div>
                  <div className="flex items-center bg-white rounded-lg p-3 min-w-0">
                    <div className="w-10 h-10 flex items-center justify-center bg-[#C04020]/10 rounded-full mr-3 flex-shrink-0">
                      <i className="ri-star-fill text-[#C04020]"></i>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#1A1A1A] break-words">★★★★★ 4.9/5</p>
                      <p className="text-xs text-gray-600 break-words">6.847 zufriedene Kunden</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-[#C04020] to-[#A03318] rounded-xl p-4 text-white max-w-full">
                <h3 className="font-bold mb-3 text-center break-words">Sofort-Kontakt</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-center min-w-0">
                    <div className="w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0">
                      <i className="ri-phone-fill"></i>
                    </div>
                    <span className="break-words">+49 176 71085234</span>
                  </div>
                  <div className="flex items-center justify-center min-w-0">
                    <div className="w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0">
                      <i className="ri-time-line"></i>
                    </div>
                    <span className="break-words text-center">Mo-Fr: 7-18 Uhr, Sa: 8-16 Uhr</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {isMenuOpen && (
        <div className="xl:hidden absolute top-full left-0 right-0 bg-[#C04020] border-t border-white/20">
          <div className="px-4 py-4 space-y-4">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block text-white hover:text-white/80 transition-colors cursor-pointer font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
      
      {/* PORTAL DROPDOWN - GARANTIERT SICHTBAR */}
      {isAccountDropdownOpen && typeof window !== 'undefined' && createPortal(
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999999,
            pointerEvents: 'none'
          }}
        >
          <div 
            style={{
              position: 'absolute',
              top: '80px',
              right: '16px',
              width: '256px',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e5e7eb',
              padding: '8px 0',
              zIndex: 999999,
              pointerEvents: 'auto'
            }}
          >
            {!isLoggedIn ? (
              <div style={{padding: '12px 16px'}}>
                <button
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#111827',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    width: '100%',
                    textAlign: 'left'
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🔍 Anmelden/Registrieren Button clicked');
                    setIsAccountDropdownOpen(false);
                    try {
                      router.push('/konto');
                      console.log('✅ Navigation to /konto initiated');
                    } catch (error) {
                      console.error('❌ Navigation error:', error);
                      // Fallback navigation
                      window.location.href = '/konto';
                    }
                  }}
                  onMouseEnter={(e) => {
                    const target = e.target as HTMLElement;
                    target.style.color = '#ea580c';
                  }}
                  onMouseLeave={(e) => {
                    const target = e.target as HTMLElement;
                    target.style.color = '#111827';
                  }}
                >
                  Anmelden / Registrieren
                </button>
                <p style={{fontSize: '12px', color: '#6b7280', marginTop: '4px'}}>Zugang zu Ihrem Konto</p>
              </div>
            ) : (
              <>
                <div style={{padding: '12px 16px', borderBottom: '1px solid #f3f4f6'}}>
                  <p style={{fontSize: '14px', fontWeight: '600', color: '#111827'}}>Willkommen zurück!</p>
                  <p style={{fontSize: '12px', color: '#6b7280', marginTop: '4px'}}>Verwalten Sie Ihr Konto</p>
                </div>
                <div style={{padding: '8px 0'}}>
                  {accountMenuItems.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px 16px',
                        fontSize: '14px',
                        color: '#374151',
                        textDecoration: 'none',
                        cursor: 'pointer'
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        setIsAccountDropdownOpen(false);
                        window.location.href = item.href;
                      }}
                      onMouseEnter={(e) => {
                         const target = e.target as HTMLElement;
                         target.style.backgroundColor = '#f9fafb';
                         target.style.color = '#ea580c';
                       }}
                       onMouseLeave={(e) => {
                         const target = e.target as HTMLElement;
                         target.style.backgroundColor = 'transparent';
                         target.style.color = '#374151';
                       }}
                    >
                      <div style={{width: '20px', height: '20px', marginRight: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        <i className={`${item.icon}`} style={{color: '#9ca3af'}}></i>
                      </div>
                      {item.name}
                    </a>
                  ))}
                  
                  {/* Logout Button */}
                  <button
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 16px',
                      fontSize: '14px',
                      color: '#dc2626',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      background: 'none',
                      border: 'none',
                      width: '100%',
                      textAlign: 'left',
                      borderTop: '1px solid #f3f4f6',
                      marginTop: '8px',
                      paddingTop: '12px'
                    }}
                    onClick={async (e) => {
                      e.preventDefault();
                      setIsAccountDropdownOpen(false);
                      console.log('🔍 Logout button clicked');
                      try {
                        await supabase.auth.signOut();
                        console.log('✅ Logout successful');
                        window.location.href = '/';
                      } catch (error) {
                        console.error('❌ Logout error:', error);
                      }
                    }}
                    onMouseEnter={(e) => {
                       const target = e.target as HTMLElement;
                       target.style.backgroundColor = '#fef2f2';
                       target.style.color = '#b91c1c';
                     }}
                     onMouseLeave={(e) => {
                       const target = e.target as HTMLElement;
                       target.style.backgroundColor = 'transparent';
                       target.style.color = '#dc2626';
                     }}
                  >
                    <div style={{width: '20px', height: '20px', marginRight: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                      <i className="ri-logout-box-line" style={{color: '#dc2626'}}></i>
                    </div>
                    Abmelden
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}