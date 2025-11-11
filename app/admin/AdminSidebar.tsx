'use client'

import Link from 'next/link'

export default function AdminSidebar() {
  const menuCategories = [
    {
      title: 'Verkauf & Bestellungen',
      items: [
        { id: 'stats', label: 'Übersicht', icon: 'ri-dashboard-line' },
        { id: 'orders', label: 'Bestellungen', icon: 'ri-shopping-bag-line' },
        { id: 'invoices', label: 'Rechnungen', icon: 'ri-file-text-line' },
        { id: 'customers', label: 'Kunden', icon: 'ri-user-line' },
      ],
    },
    {
      title: 'Produktverwaltung',
      items: [
        { id: 'products', label: 'Produkte', icon: 'ri-stack-line' },
        { id: 'categories', label: 'Kategorien', icon: 'ri-folder-line' },
        { id: 'inventory', label: 'Lager', icon: 'ri-archive-line' },
        { id: 'stock-monitoring', label: 'Lagerbestand-Überwachung', icon: 'ri-eye-line' },
        { id: 'suppliers', label: 'Lieferanten', icon: 'ri-truck-line' },
        { id: 'shop-settings', label: 'Shop-Einstellungen', icon: 'ri-settings-3-line' },
      ],
    },
    {
      title: 'Preise & Aktionen',
      items: [
        { id: 'pricing', label: 'Preisgestaltung', icon: 'ri-money-euro-circle-line' },
        { id: 'discount-codes', label: 'Rabattcodes', icon: 'ri-coupon-line' },
        { id: 'loyalty-program', label: 'Treueprogramm', icon: 'ri-medal-line' },
      ],
    },
    {
      title: 'Analytics & Berichte',
      items: [
        { id: 'analytics', label: 'Analytics', icon: 'ri-bar-chart-line' },
        { id: 'google-analytics', label: 'Google Analytics', icon: 'ri-google-line' },
        { id: 'google-ads-tracking', label: 'Google Ads Tracking', icon: 'ri-advertisement-line' },
        { id: 'reports', label: 'Berichte', icon: 'ri-file-chart-line' },
      ],
    },
    {
      title: 'Marketing & Kommunikation',
      items: [
        { id: 'marketing', label: 'Marketing', icon: 'ri-megaphone-line' },
        { id: 'automation', label: 'Automatisierung', icon: 'ri-robot-line' },
        { id: 'email', label: 'E-Mail System', icon: 'ri-mail-line' },
        { id: 'email-signature', label: 'E-Mail Signatur', icon: 'ri-quill-pen-line' },
        { id: 'sms-system', label: 'SMS System', icon: 'ri-message-3-line' },
        { id: 'push-notifications', label: 'Push-Benachrichtigungen', icon: 'ri-notification-line' },
      ],
    },
    {
      title: 'Website & Inhalte',
      items: [
        { id: 'content', label: 'Inhalte', icon: 'ri-file-text-line' },
        { id: 'city-pages', label: 'Städte-Landingpages', icon: 'ri-map-pin-line' },
        { id: 'local-business', label: 'Local Business SEO', icon: 'ri-building-line' },
        { id: 'blog-management', label: 'Blog-Editor', icon: 'ri-article-line' },
        { id: 'blog-comments', label: 'Kommentare', icon: 'ri-chat-1-line' },
        { id: 'media', label: 'Medien', icon: 'ri-image-line' },
        { id: 'seo', label: 'SEO', icon: 'ri-search-eye-line' },
      ],
    },
    {
      title: 'Support & System',
      items: [
        { id: 'support', label: 'Support', icon: 'ri-customer-service-2-line' },
        { id: 'quick-replies', label: 'Schnellantworten', icon: 'ri-chat-quote-line' },
        { id: 'faq', label: 'FAQ', icon: 'ri-question-answer-line' },
        { id: 'invoice-settings', label: 'Rechnungseinstellungen', icon: 'ri-settings-4-line' },
        { id: 'admin-config', label: 'Admin-Konfiguration', icon: 'ri-admin-line' },
        { id: 'backup', label: 'Backup', icon: 'ri-archive-drawer-line' },
        { id: 'settings', label: 'Einstellungen', icon: 'ri-settings-line' },
      ],
    },
  ]

  const popularItems = [
    { id: 'stats', label: 'Übersicht', icon: 'ri-dashboard-line' },
    { id: 'orders', label: 'Bestellungen', icon: 'ri-shopping-bag-line' },
    { id: 'products', label: 'Produkte', icon: 'ri-stack-line' },
    { id: 'customers', label: 'Kunden', icon: 'ri-user-line' },
    { id: 'inventory', label: 'Lager', icon: 'ri-archive-line' },
  ]

  return (
    <aside className="hidden lg:block w-72 xl:w-80 flex-shrink-0 py-8 admin-sidebar">
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Häufig verwendet</h3>
          <div className="space-y-1">
            {popularItems.map((item) => (
              <Link
                key={item.id}
                href={`/admin?tab=${item.id}`}
                className={
                  'w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors text-gray-700 hover:bg-gray-100'
                }
              >
                <div className="flex items-center">
                  <i className={`${item.icon} mr-3`}></i>
                  {item.label}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {menuCategories.map((category) => (
          <div key={category.title} className="p-6 border-b last:border-b-0">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">{category.title}</h3>
            <div className="space-y-1">
              {category.items.map((item) => (
                <Link
                  key={item.id}
                  href={`/admin?tab=${item.id}`}
                  className={'w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors text-gray-700 hover:bg-gray-100'}
                >
                  <i className={`${item.icon} mr-3`}></i>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}