
'use client';

import Link from 'next/link';

const quickLinks = [
  { name: 'Startseite', href: '/' },
  { name: 'Shop', href: '/shop' },
  { name: 'Blog', href: '/blog' },
  { name: 'Über uns', href: '/ueber-uns' },
  { name: 'Kontakt', href: '/kontakt' },
  { name: 'Mein Konto', href: '/konto' }
];

export default function Footer() {
  return (
    <footer className="bg-[#1A1A1A] text-white pt-12 pb-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center mb-4">
              <img 
                src="/images/brennholzkoenig-logo-white.webp" 
                alt="Brennholzkönig Logo" 
                className="h-20 w-auto object-contain"
              />
            </div>
            <p className="text-gray-300 mb-4">
              Ihr zuverlässiger Partner für hochwertiges Brennholz aus der Region Fulda. 
              27 Jahre Erfahrung und königliche Qualität.
            </p>
            <div className="flex space-x-4">
              <a href="tel:+4917671085234" className="w-10 h-10 flex items-center justify-center bg-[#C04020] rounded-full cursor-pointer hover:bg-[#A03318] transition-colors">
                <i className="ri-phone-line text-white"></i>
              </a>
              <a href="mailto:info@brennholz-koenig.de" className="w-10 h-10 flex items-center justify-center bg-[#C04020] rounded-full cursor-pointer hover:bg-[#A03318] transition-colors">
                <i className="ri-mail-line text-white"></i>
              </a>
              <a href="https://wa.me/4917671085234" target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center bg-[#25D366] rounded-full cursor-pointer hover:bg-[#1DA851] transition-colors">
                <i className="ri-whatsapp-line text-white"></i>
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-4 text-[#C04020]">Navigation</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-300 hover:text-white transition-colors cursor-pointer">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-4 text-[#C04020]">Produkte</h4>
            <ul className="space-y-2 text-gray-300">
              <li>Kaminholz trocken</li>
              <li>Ofenholz gespalten</li>
              <li>Brennholz gemischt</li>
              <li>Brennholz geliefert</li>
              <li>Kaminholz geliefert</li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-4 text-[#C04020]">Kontakt</h4>
            <div className="text-gray-300 space-y-2">
              <p>Frankfurter Straße 3, 36419 Buttlar</p>
              <p>+49 176 71085234</p>
              <p>info@brennholz-koenig.de</p>
              <p>Mo-Fr: 8:00-18:00 Uhr</p>
            </div>
          </div>
        </div>

        <div className="border-t border-amber-700/30 pt-8 mt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-gray-300 text-sm mb-4 sm:mb-0" suppressHydrationWarning={true}>
            {new Date().getFullYear()} Brennholz-Shop. Alle Rechte vorbehalten.
          </p>
          <div className="flex space-x-6 text-sm">
            <Link href="/impressum" className="text-gray-300 hover:text-white transition-colors">
              Impressum
            </Link>
            <Link href="/datenschutz" className="text-gray-300 hover:text-white transition-colors">
              Datenschutz
            </Link>
            <Link href="/agb" className="text-gray-300 hover:text-white transition-colors">
              AGB
            </Link>
            <Link href="/widerrufsrecht" className="text-gray-300 hover:text-white transition-colors">
              Widerrufsrecht
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
