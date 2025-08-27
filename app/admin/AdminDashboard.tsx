'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import OrdersTab from './OrdersTab';
import CustomersTab from './CustomersTab';
import StatsTab from './StatsTab';
import ProductsTab from './ProductsTab';
import ReportsTab from './ReportsTab';
import PricingTab from './PricingTab';
import SuppliersTab from './SuppliersTab';
import MarketingTab from './MarketingTab';
import BackupTab from './BackupTab';
import ProductManagementTab from './ProductManagementTab';
import DashboardSettingsTab from './DashboardSettingsTab';
import AutomationTab from './AutomationTab';
import EmailSystemTab from './EmailSystemTab';
import AnalyticsTab from './AnalyticsTab';
import GoogleAnalyticsTab from './GoogleAnalyticsTab';
import ConversionTrackingTab from './ConversionTrackingTab';
import HeatmapsTab from './HeatmapsTab';
import SMSSystemTab from './SMSSystemTab';
import PushNotificationTab from './PushNotificationTab';
import EmailAutomationTab from './EmailAutomationTab';
import EmailTemplatesTab from './EmailTemplatesTab';
import DiscountCodesTab from './DiscountCodesTab';
import LoyaltyProgramTab from './LoyaltyProgramTab';
import SMTPSettingsTab from './SMTPSettingsTab';
import MediaTab from './MediaTab';
import ContentManagementTab from './ContentManagementTab';
import SEOTab from './SEOTab';
import SEOManagementTab from './SEOManagementTab';
import BlogManagementTab from './BlogManagementTab';
import GoogleAdsTrackingTab from './GoogleAdsTrackingTab';
import InventoryTab from './InventoryTab';
// PWA functionality removed
import SupportTab from './SupportTab';
import FAQManagementTab from './FAQManagementTab';

interface AdminDashboardProps {
  adminUser: any;
  onLogout: () => void;
}

export default function AdminDashboard({ adminUser, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('stats');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasAccess, setHasAccess] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    pendingOrders: 0
  });
  // Using the centralized Supabase client from lib/supabase.ts

  useEffect(() => {
    // Admin-Validierung bereits in page.tsx durchgeführt
    if (adminUser) {
      setHasAccess(true);
      loadStats();
    }
  }, [adminUser]);

  const loadStats = async () => {
    if (!hasAccess) return;
    
    try {
      // Sichere Abfrage für customers Tabelle
      const getCustomersCount = async () => {
        try {
          const result = await supabase.from('customers').select('*', { count: 'exact', head: true });
          return result;
        } catch (error) {
          console.warn('customers Tabelle nicht verfügbar:', error);
          return { count: 0, error: null, data: null };
        }
      };

      // Alle Abfragen parallel ausführen für bessere Performance
      const [ordersResult, customersResult, revenueResult, pendingResult] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        getCustomersCount(),
        supabase.from('orders').select('total_amount').eq('status', 'delivered'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      ]);

      const totalRevenue = revenueResult.data?.reduce((sum: number, order: any) => {
         const amount = typeof order.total_amount === 'string' ? parseFloat(order.total_amount) : Number(order.total_amount) || 0;
         return sum + amount;
       }, 0) || 0;

      setStats({
        totalOrders: ordersResult.count || 0,
        totalCustomers: customersResult.count || 0,
        totalRevenue: totalRevenue,
        pendingOrders: pendingResult.count || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 flex items-center justify-center bg-red-500 rounded-full mx-auto mb-4">
            <i className="ri-error-warning-line text-2xl text-white"></i>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Zugriff verweigert</h2>
          <p className="text-gray-600 mb-4">Sie haben keine Berechtigung für diesen Bereich.</p>
          <button
            onClick={onLogout}
            className="bg-[#C04020] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#A03318] transition-colors cursor-pointer"
          >
            Zur Anmeldung
          </button>
        </div>
      </div>
    );
  }

  const menuCategories = [
    {
      title: 'Verkauf & Bestellungen',
      items: [
        { id: 'stats', label: 'Übersicht', icon: 'ri-dashboard-line' },
        { id: 'orders', label: 'Bestellungen', icon: 'ri-shopping-bag-line' },
        { id: 'customers', label: 'Kunden', icon: 'ri-user-line' }
      ]
    },
    {
      title: 'Produktverwaltung',
      items: [
        { id: 'products', label: 'Produkte', icon: 'ri-stack-line' },
        { id: 'inventory', label: 'Lager', icon: 'ri-archive-line' },
        { id: 'suppliers', label: 'Lieferanten', icon: 'ri-truck-line' }
      ]
    },
    {
      title: 'Preise & Aktionen',
      items: [
        { id: 'pricing', label: 'Preisgestaltung', icon: 'ri-money-euro-circle-line' },
        { id: 'discount-codes', label: 'Rabattcodes', icon: 'ri-coupon-line' },
        { id: 'loyalty-program', label: 'Treueprogramm', icon: 'ri-medal-line' }
      ]
    },
    {
      title: 'Analytics & Berichte',
      items: [
        { id: 'analytics', label: 'Analytics', icon: 'ri-bar-chart-line' },
        { id: 'reports', label: 'Berichte', icon: 'ri-file-chart-line' }
      ]
    },
    {
      title: 'Marketing & Kommunikation',
      items: [
        { id: 'marketing', label: 'Marketing', icon: 'ri-megaphone-line' },
        { id: 'automation', label: 'Automatisierung', icon: 'ri-robot-line' },
        { id: 'email', label: 'E-Mail System', icon: 'ri-mail-line' },
        { id: 'sms-system', label: 'SMS System', icon: 'ri-message-3-line' },
        { id: 'push-notifications', label: 'Push-Benachrichtigungen', icon: 'ri-notification-line' }
      ]
    },
    {
      title: 'Website & Inhalte',
      items: [
        { id: 'content', label: 'Inhalte', icon: 'ri-file-text-line' },
        { id: 'media', label: 'Medien', icon: 'ri-image-line' },
        { id: 'seo', label: 'SEO', icon: 'ri-search-eye-line' }
      ]
    },
    {
      title: 'Support & System',
      items: [
        { id: 'support', label: 'Support', icon: 'ri-customer-service-2-line' },
        { id: 'backup', label: 'Backup', icon: 'ri-archive-drawer-line' },
        { id: 'settings', label: 'Einstellungen', icon: 'ri-settings-line' }
      ]
    }
  ];

  const popularItems = [
    { id: 'stats', label: 'Übersicht', icon: 'ri-dashboard-line' },
    { id: 'orders', label: 'Bestellungen', icon: 'ri-shopping-bag-line' },
    { id: 'products', label: 'Produkte', icon: 'ri-stack-line' },
    { id: 'customers', label: 'Kunden', icon: 'ri-user-line' },
    { id: 'inventory', label: 'Lager', icon: 'ri-archive-line' }
  ];

  const renderTabContent = () => {
    if (!hasAccess || !adminUser) {
      return (
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
          <div className="w-16 h-16 flex items-center justify-center bg-red-100 rounded-full mx-auto mb-4">
            <i className="ri-lock-line text-2xl text-red-600"></i>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Berechtigung erforderlich</h3>
          <p className="text-gray-600">Für dieses Modul benötigen Sie entsprechende Berechtigungen.</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'stats': return <StatsTab stats={stats} onRefresh={loadStats} />;
      case 'orders': return <OrdersTab onStatsUpdate={loadStats} />;
      case 'customers': return <CustomersTab />;
      case 'products': return <ProductsTab />;
      case 'inventory': return <InventoryTab />;
      case 'suppliers': return <SuppliersTab />;
      case 'support': return <SupportTab />;
      case 'faq': return <FAQManagementTab />;
      case 'analytics': return <AnalyticsTab />;
      case 'marketing': return <MarketingTab />;
      case 'content': return <ContentManagementTab />;
      case 'media': return <MediaTab />;
      case 'seo': return <SEOTab />;
      case 'email': return <EmailSystemTab />;
      case 'settings': return <DashboardSettingsTab />;
      default: return <StatsTab stats={stats} onRefresh={loadStats} />;
    }
  };

  const getAllMenuItems = () => {
    const allItems = [];

    allItems.push(...popularItems);

    menuCategories.forEach(category => {
      allItems.push(...category.items);
    });

    return allItems;
  };

  const allMenuItems = getAllMenuItems();

  const filteredCategories = menuCategories.map(category => ({
    ...category,
    items: category.items.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
  })).filter(category => category.items.length > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 flex items-center justify-center bg-[#C04020] rounded-lg">
                <i className="ri-admin-line text-white"></i>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-black text-[#1A1A1A]" style={{ fontFamily: 'Inter, sans-serif' }}>
                  BRENNHOLZKÖNIG ADMIN
                </h1>
                <p className="text-sm text-gray-500">Händler-Dashboard</p>
              </div>
            </div>

            <div className="hidden lg:block flex-1 max-w-md mx-8">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <div className="w-5 h-5 flex items-center justify-center text-gray-400">
                    <i className="ri-search-line"></i>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Suche in Navigation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg transition-colors cursor-pointer"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className={`${isMobileMenuOpen ? 'ri-close-line' : 'ri-menu-line'} text-xl`}></i>
                </div>
              </button>

              <div className="hidden sm:flex items-center space-x-3">
                <div className="w-8 h-8 bg-[#C04020] rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {adminUser.name?.charAt(0) || 'A'}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-[#1A1A1A]">{adminUser.name}</p>
                  <p className="text-xs text-gray-500">{adminUser.role}</p>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                <div className="w-5 h-5 flex items-center justify-center sm:mr-2">
                  <i className="ri-logout-circle-r-line"></i>
                </div>
                <span className="hidden sm:inline">Abmelden</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex">
        <aside className="hidden lg:block w-72 flex-shrink-0 py-8">
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Häufig verwendet</h3>
              <div className="space-y-1">
                {popularItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                      activeTab === item.id
                        ? 'bg-orange-100 text-orange-700 border-r-2 border-orange-500'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center">
                      <i className={`${item.icon} mr-3`}></i>
                      {item.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {menuCategories.map(category => (
              <div key={category.title} className="p-6 border-b last:border-b-0">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">{category.title}</h3>
                <div className="space-y-1">
                  {category.items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                        activeTab === item.id
                          ? 'bg-orange-100 text-orange-700 border-r-2 border-orange-500'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <i className={`${item.icon} mr-3`}></i>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50">
            <div className="fixed inset-y-0 left-0 w-80 bg-white shadow-xl overflow-y-auto">
              <div className="p-6">
                <div className="mb-6">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <div className="w-5 h-5 flex items-center justify-center text-gray-400">
                        <i className="ri-search-line"></i>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="Suche..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Häufig verwendet</h3>
                  <div className="space-y-1">
                    {popularItems.map(item => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-3 text-sm rounded-lg transition-colors ${
                          activeTab === item.id
                            ? 'bg-orange-100 text-orange-700 border-r-2 border-orange-500'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center">
                          <i className={`${item.icon} mr-3`}></i>
                          {item.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {filteredCategories.map(category => (
                  <div key={category.title} className="mb-6">
                    <div className="flex items-center px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                      {category.title}
                    </div>
                    <div className="space-y-1">
                      {category.items.map(item => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-3 py-3 text-sm rounded-lg transition-colors text-gray-700 hover:bg-gray-100"
                        >
                          <div className="flex items-center">
                            <i className={`${item.icon} mr-3`}></i>
                            {item.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 py-8 lg:ml-8">
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
            <span>Admin</span>
            <div className="w-4 h-4 flex items-center justify-center">
              <i className="ri-arrow-right-s-line"></i>
            </div>
            <span>{allMenuItems.find(item => item.id === activeTab)?.label || 'Übersicht'}</span>
          </div>

          <div className="flex-1 overflow-auto">
            {activeTab === 'stats' && <StatsTab stats={stats} onRefresh={loadStats} />}
            {activeTab === 'orders' && <OrdersTab onStatsUpdate={loadStats} />}
            {activeTab === 'customers' && <CustomersTab />}
            {activeTab === 'products' && <ProductsTab />}
            {activeTab === 'product-management' && <ProductManagementTab />}
            {activeTab === 'inventory' && <InventoryTab />}
            {activeTab === 'suppliers' && <SuppliersTab />}
            {activeTab === 'discount-codes' && <DiscountCodesTab />}
            {activeTab === 'loyalty-program' && <LoyaltyProgramTab />}
            {activeTab === 'pricing' && <PricingTab />}
            {activeTab === 'support' && <SupportTab />}
            {activeTab === 'faq' && <FAQManagementTab />}
            {activeTab === 'analytics' && <AnalyticsTab />}
            {activeTab === 'reports' && <ReportsTab />}
            {activeTab === 'marketing' && <MarketingTab />}
            {activeTab === 'automation' && <AutomationTab />}
            {activeTab === 'content' && <ContentManagementTab />}
            {activeTab === 'blog-management' && <BlogManagementTab />}
            {activeTab === 'seo-management' && <SEOManagementTab />}
            {activeTab === 'media' && <MediaTab />}
            {activeTab === 'seo' && <SEOTab />}
            {activeTab === 'email' && <EmailSystemTab />}
            {activeTab === 'email-automation' && <EmailAutomationTab />}
            {activeTab === 'email-templates' && <EmailTemplatesTab />}
            {activeTab === 'smtp-settings' && <SMTPSettingsTab />}
            {activeTab === 'sms-system' && <SMSSystemTab />}
            {activeTab === 'push-notifications' && <PushNotificationTab />}
            {/* PWA functionality removed */}
            {activeTab === 'backup' && <BackupTab />}
            {activeTab === 'settings' && <DashboardSettingsTab />}
          </div>
        </main>
      </div>
    </div>
  );
}