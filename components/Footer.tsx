
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
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center mb-4">
              <img 
                src="https://static.readdy.ai/image/5cb98375ce345c7331a1619afba21cba/501398866eb96573186841197a5add47.webp" 
                alt="Brennholz Logo" 
                className="h-20 w-auto object-contain"
              />
            </div>
            <p className="text-gray-300 mb-4">
              Ihr zuverlässiger Partner für hochwertiges Brennholz aus der Region Fulda. 
              27 Jahre Erfahrung und königliche Qualität.
            </p>
            <div className="flex space-x-4">
              <div className="w-10 h-10 flex items-center justify-center bg-[#C04020] rounded-full cursor-pointer">
                <i className="ri-phone-line text-white"></i>
              </div>
              <div className="w-10 h-10 flex items-center justify-center bg-[#C04020] rounded-full cursor-pointer">
                <i className="ri-mail-line text-white"></i>
              </div>
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
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-4 text-[#C04020]">Kontakt</h4>
            <div className="text-gray-300 space-y-2">
              <p>Frankfurter Straße 3, 36419 Buttlar</p>
              <p>0176-22572100</p>
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
