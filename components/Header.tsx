'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { safeJsonParse } from '@/lib/jsonHelper';

export default function Header() {
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

    // Check login status
    const checkLoginStatus = () => {
      try {
        const userToken = localStorage.getItem('userToken');
        const userData = localStorage.getItem('userData');
        setIsLoggedIn(!!(userToken && userData));
      } catch (error) {
        console.warn('Fehler beim Überprüfen des Login-Status:', error);
        setIsLoggedIn(false);
      }
    };

    checkLoginStatus();

    // Listen for login/logout events
    const handleAuthChange = () => {
      checkLoginStatus();
    };

    window.addEventListener('authChanged', handleAuthChange);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener('authChanged', handleAuthChange);
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
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16 md:h-20">
            <Link href="/" className="flex items-center flex-shrink-0">
              <img
                src="https://public.readdy.ai/ai/img_res/86db7336-c7fd-4211-8615-9dceb4ceb922.jpg"
                alt="Brennholzkönig Logo"
                className="h-12 md:h-20 w-auto object-contain"
              />
            </Link>
            <nav className="hidden md:flex items-center space-x-8">
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
              className="md:hidden flex flex-col space-y-1 cursor-pointer p-2 z-50 relative flex-shrink-0"
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
      <header className={`sticky top-0 z-50 transition-all duration-300 w-full ${isScrolled ? 'bg-[#F5F0E0] shadow-lg' : 'bg-black/30 backdrop-blur-sm'}`}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16 md:h-20">
            <Link href="/" className="flex items-center flex-shrink-0">
              <img
                src="https://public.readdy.ai/ai/img_res/86db7336-c7fd-4211-8615-9dceb4ceb922.jpg"
                alt="Brennholzkönig Logo"
                className="h-12 md:h-20 w-auto object-contain"
              />
            </Link>
            <nav className="hidden md:flex items-center space-x-8">
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
            <div className="flex items-center space-x-4">
              <Link href="/warenkorb" className={`flex items-center space-x-2 hover:text-orange-600 transition-colors cursor-pointer relative ${isScrolled ? 'text-gray-700' : 'text-white'}`}>
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-shopping-cart-line text-xl"></i>
                </div>
                <span className="hidden sm:inline">Warenkorb</span>
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </Link>

              {/* Account Dropdown */}
              <div className="relative z-50" ref={accountDropdownRef}>
                <button
                  onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                  className={`flex items-center space-x-2 hover:text-orange-600 transition-colors cursor-pointer ${isScrolled ? 'text-gray-700' : 'text-white'}`}
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    <i className="ri-user-line text-xl"></i>
                  </div>
                  <span className="hidden sm:inline">Mein Konto</span>
                  <div className="w-4 h-4 flex items-center justify-center">
                    <i className={`ri-arrow-down-s-line text-sm transition-transform ${isAccountDropdownOpen ? 'rotate-180' : ''}`}></i>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isAccountDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-[9999] transform translate-y-0">
                    {!isLoggedIn ? (
                      <div className="px-4 py-3">
                        <Link
                          href="/konto"
                          className="block text-sm font-semibold text-gray-900 hover:text-orange-600 transition-colors"
                          onClick={() => setIsAccountDropdownOpen(false)}
                        >
                          Anmelden / Registrieren
                        </Link>
                        <p className="text-xs text-gray-500 mt-1">Zugang zu Ihrem Konto</p>
                      </div>
                    ) : (
                      <>
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-semibold text-gray-900">Willkommen zurück!</p>
                          <p className="text-xs text-gray-500 mt-1">Verwalten Sie Ihr Konto</p>
                        </div>
                        <div className="py-2">
                          {accountMenuItems.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-orange-600 transition-colors cursor-pointer"
                              onClick={() => setIsAccountDropdownOpen(false)}
                            >
                              <div className="w-5 h-5 flex items-center justify-center mr-3">
                                <i className={`${item.icon} text-gray-400`}></i>
                              </div>
                              {item.name}
                            </Link>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <button
                className="md:hidden flex flex-col space-y-1 cursor-pointer p-2 z-50 relative flex-shrink-0"
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
        <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm">
          <div className="bg-[#F5F0E0] h-full overflow-y-auto pt-20 max-w-full">
            <div className="px-6 py-8 max-w-full overflow-x-hidden">
              <div className="mb-8">
                <h3 className="text-xs font-bold text-[#C04020] uppercase tracking-wider mb-4">Navigation</h3>
                <div className="space-y-4">
                  {navigation.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center text-lg font-medium text-[#1A1A1A] hover:text-[#C04020] transition-colors py-3 border-b border-gray-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="w-6 h-6 flex items-center justify-center mr-4 flex-shrink-0">
                        <i className={`ri-${item.href === '/' ? 'home-4-line' : item.href === '/shop' ? 'store-line' : item.href === '/blog' ? 'file-line' : item.href === '/ueber-uns' ? 'team-line' : 'mail-line'} text-xl text-[#C04020]`}></i>
                      </div>
                      <span className="break-words">{item.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
              <div className="mb-8">
                <h3 className="text-xs font-bold text-[#C04020] uppercase tracking-wider mb-4">Schnell-Aktionen</h3>
                <div className="space-y-3">
                  <Link
                    href="/shop"
                    className="w-full bg-[#C04020] text-white px-6 py-4 rounded-xl font-bold hover:bg-[#A03318] transition-colors flex items-center justify-center cursor-pointer"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">
                      <i className="ri-fire-line text-xl"></i>
                    </div>
                    <span className="break-words">Brennholz kaufen</span>
                  </Link>
                  <Link
                    href="/kontakt"
                    className="w-full bg-white text-[#C04020] border-2 border-[#C04020] px-6 py-4 rounded-xl font-bold hover:bg-gray-50 transition-colors flex items-center justify-center cursor-pointer"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">
                      <i className="ri-phone-line text-xl"></i>
                    </div>
                    <span className="break-words">Beratung anrufen</span>
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
                    <span className="break-words">0661 / 123 456 78</span>
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
        <div className="md:hidden absolute top-full left-0 right-0 bg-[#C04020] border-t border-white/20">
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
    </>
  );
}