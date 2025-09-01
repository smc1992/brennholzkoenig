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
import CategoriesTab from './CategoriesTab';
import ShopSettingsTab from './ShopSettingsTab';
// PWA functionality removed
import SupportTab from './SupportTab';
import FAQManagementTab from './FAQManagementTab';
import InvoiceTab from './InvoiceTab';
import InvoiceSettingsTab from './InvoiceSettingsTab';

interface AdminDashboardProps {
  adminUser: any;
  onLogout: () => void;
}

// Produktionsreife Stats - keine Fallback-Daten mehr

export default function AdminDashboardClient({ 
  adminUser, 
  onLogout,
  initialStats,
  initialBatchData 
}: Partial<AdminDashboardProps> & {
  initialStats?: any;
  initialBatchData?: any;
}) {
  const [activeTab, setActiveTab] = useState('stats');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasAccess, setHasAccess] = useState(true);
  // Starte mit leeren Stats - werden durch loadStats() geladen
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    pendingOrders: 0
  });
  // Using the centralized Supabase client from lib/supabase.ts

  useEffect(() => {
    // Session-Validierung und Admin-Zugriff prüfen
    const checkSessionAndLoadData = async () => {
      try {
        // Prüfe aktuelle Session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!session || error) {
          console.warn('❌ Keine gültige Session im Admin Dashboard:', error);
          setHasAccess(false);
          // Redirect zur Login-Seite
          window.location.href = '/admin/login';
          return;
        }
        
        console.log('✅ Gültige Session gefunden:', session.user.email);
        
        if (adminUser) {
          setHasAccess(true);
          loadStats();
        }
      } catch (error) {
        console.error('❌ Session-Prüfung fehlgeschlagen:', error);
        setHasAccess(false);
      }
    };
    
    checkSessionAndLoadData();
   }, [adminUser]);

  // URL-Parameter für Tab-Switching verarbeiten
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab) {
      console.log('AdminDashboard: URL-Parameter tab =', tab);
      setActiveTab(tab);
    }
  }, []);

  // Debug-Log für aktiven Tab
  useEffect(() => {
    console.log('AdminDashboard: Aktiver Tab =', activeTab);
  }, [activeTab]);

  const loadStats = async () => {
    if (!hasAccess) return;
    
    try {
      // Session erneut prüfen vor API-Aufrufen
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (!session || sessionError) {
        console.error('❌ Keine gültige Session für API-Aufrufe:', sessionError);
        setHasAccess(false);
        window.location.href = '/admin/login';
        return;
      }
      
      console.log('🔄 Lade Admin-Statistiken mit Session:', session.user.email);
      
      // Client-seitige Stats-Abfrage mit Session-Validierung
      const [productsCount, ordersCount, categoriesCount] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('product_categories').select('id', { count: 'exact', head: true })
      ]);
      
      // Prüfe auf Fehler in den Abfragen
      if (productsCount.error) {
        console.error('❌ Products query failed:', productsCount.error);
        throw new Error(`Products query failed: ${productsCount.error.message}`);
      }
      if (ordersCount.error) {
        console.error('❌ Orders query failed:', ordersCount.error);
        throw new Error(`Orders query failed: ${ordersCount.error.message}`);
      }
      if (categoriesCount.error) {
        console.error('❌ Categories query failed:', categoriesCount.error);
        throw new Error(`Categories query failed: ${categoriesCount.error.message}`);
      }
      
      const statsData = {
        products: productsCount.count || 0,
        orders: ordersCount.count || 0,
        categories: categoriesCount.count || 0
      };
      
      // Zusätzliche Revenue-Berechnung
      const revenueResult = await supabase
        .from('orders')
        .select('total_amount')
        .eq('status', 'delivered');
      
      const totalRevenue = revenueResult.data?.reduce((sum: number, order: any) => {
        const amount = typeof order.total_amount === 'string' ? parseFloat(order.total_amount) : Number(order.total_amount) || 0;
        return sum + amount;
      }, 0) || 0;
      
      // Pending Orders zählen
      const pendingResult = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      const newStats = {
        totalOrders: statsData.orders,
        totalCustomers: 0, // Customers werden später implementiert
        totalRevenue: totalRevenue,
        pendingOrders: pendingResult.count || 0
      };
      
      setStats(newStats);
      console.log('✅ Production stats loaded:', newStats);
    } catch (error) {
      console.error('❌ Error loading production stats:', error);
       // Keine Fallback-Daten mehr - zeige Fehler an
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
        { id: 'invoices', label: 'Rechnungen', icon: 'ri-file-text-line' },
        { id: 'customers', label: 'Kunden', icon: 'ri-user-line' }
      ]
    },
    {
      title: 'Produktverwaltung',
      items: [
        { id: 'products', label: 'Produkte', icon: 'ri-stack-line' },
        { id: 'categories', label: 'Kategorien', icon: 'ri-folder-line' },
        { id: 'inventory', label: 'Lager', icon: 'ri-archive-line' },
        { id: 'suppliers', label: 'Lieferanten', icon: 'ri-truck-line' },
        { id: 'shop-settings', label: 'Shop-Einstellungen', icon: 'ri-settings-3-line' }
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
        { id: 'google-analytics', label: 'Google Analytics', icon: 'ri-google-line' },
        { id: 'google-ads-tracking', label: 'Google Ads Tracking', icon: 'ri-advertisement-line' },
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
        { id: 'invoice-settings', label: 'Rechnungseinstellungen', icon: 'ri-settings-4-line' },
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
    console.log('AdminDashboard: renderTabContent called with activeTab =', activeTab);
    console.log('AdminDashboard: hasAccess =', hasAccess, 'adminUser =', !!adminUser);
    
    // Debug-Ausgabe für Tab-Switching
    console.log('AdminDashboard: Rendering Tab:', activeTab);
    
    switch (activeTab) {
      case 'stats': 
        console.log('AdminDashboard: Rendering StatsTab');
        return <StatsTab stats={stats} onRefresh={loadStats} onTabChange={setActiveTab} />;
      case 'orders': 
        console.log('AdminDashboard: Rendering OrdersTab');
        return <OrdersTab onStatsUpdate={loadStats} />;
      case 'customers': 
        console.log('AdminDashboard: Rendering CustomersTab');
        return <CustomersTab />;
      case 'invoices': 
        console.log('AdminDashboard: Rendering InvoiceTab');
        return <InvoiceTab onStatsUpdate={loadStats} />;
      case 'products': 
        console.log('AdminDashboard: Rendering ProductsTab');
        return <ProductsTab />;
      case 'categories': 
        console.log('AdminDashboard: Rendering CategoriesTab');
        return <CategoriesTab />;
      case 'shop-settings': 
        console.log('AdminDashboard: Rendering ShopSettingsTab');
        return <ShopSettingsTab />;
      case 'inventory': 
        console.log('AdminDashboard: Rendering InventoryTab');
        return <InventoryTab />;
      case 'suppliers': 
        console.log('AdminDashboard: Rendering SuppliersTab');
        return <SuppliersTab />;
      case 'support': 
        console.log('AdminDashboard: Rendering SupportTab');
        return <SupportTab />;
      case 'faq': 
        console.log('AdminDashboard: Rendering FAQManagementTab');
        return <FAQManagementTab />;
      case 'analytics': 
        console.log('AdminDashboard: Rendering AnalyticsTab');
        return <AnalyticsTab />;
      case 'google-analytics': 
        console.log('AdminDashboard: Rendering GoogleAnalyticsTab');
        return <GoogleAnalyticsTab />;
      case 'google-ads-tracking': 
        console.log('AdminDashboard: Rendering GoogleAdsTrackingTab');
        return <GoogleAdsTrackingTab />;
      case 'marketing': 
        console.log('AdminDashboard: Rendering MarketingTab');
        return <MarketingTab />;
      case 'content': 
        console.log('AdminDashboard: Rendering ContentManagementTab');
        return <ContentManagementTab />;
      case 'media': 
        console.log('AdminDashboard: Rendering MediaTab');
        return <MediaTab />;
      case 'seo': 
        console.log('AdminDashboard: Rendering SEOTab');
        return <SEOTab />;
      case 'invoice-settings': 
        console.log('AdminDashboard: Rendering InvoiceSettingsTab');
        return <InvoiceSettingsTab onStatsUpdate={loadStats} />;
      case 'pricing': 
        console.log('AdminDashboard: Rendering PricingTab');
        return <PricingTab />;
      case 'discount-codes': 
        console.log('AdminDashboard: Rendering DiscountCodesTab');
        return <DiscountCodesTab />;
      case 'loyalty-program': 
        console.log('AdminDashboard: Rendering LoyaltyProgramTab');
        return <LoyaltyProgramTab />;
      case 'reports': 
        console.log('AdminDashboard: Rendering ReportsTab');
        return <ReportsTab />;
      case 'automation': 
        console.log('AdminDashboard: Rendering AutomationTab');
        return <AutomationTab />;
      case 'blog-management': 
        console.log('AdminDashboard: Rendering BlogManagementTab');
        return <BlogManagementTab />;
      case 'seo-management': 
        console.log('AdminDashboard: Rendering SEOManagementTab');
        return <SEOManagementTab />;
      case 'email': 
        console.log('AdminDashboard: Rendering EmailSystemTab');
        return <EmailSystemTab />;
      case 'email-automation': 
        console.log('AdminDashboard: Rendering EmailAutomationTab');
        return <EmailAutomationTab />;
      case 'email-templates': 
        console.log('AdminDashboard: Rendering EmailTemplatesTab');
        return <EmailTemplatesTab />;
      case 'smtp-settings': 
        console.log('AdminDashboard: Rendering SMTPSettingsTab');
        return <SMTPSettingsTab />;
      case 'sms-system': 
        console.log('AdminDashboard: Rendering SMSSystemTab');
        return <SMSSystemTab />;
      case 'push-notifications': 
        console.log('AdminDashboard: Rendering PushNotificationTab');
        return <PushNotificationTab />;
      case 'backup': 
        console.log('AdminDashboard: Rendering BackupTab');
        return <BackupTab />;
      case 'settings': 
         console.log('AdminDashboard: Rendering DashboardSettingsTab');
         return <DashboardSettingsTab />;
       default: return <StatsTab stats={stats} onRefresh={loadStats} onTabChange={setActiveTab} />;
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
                  {adminUser?.name?.charAt(0) || 'A'}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-[#1A1A1A]">{adminUser?.name || 'Admin'}</p>
                  <p className="text-xs text-gray-500">{adminUser?.role || 'Administrator'}</p>
                </div>
              </div>

              <button
                onClick={async () => {
                  try {
                    console.log('🔐 Starting logout process...');
                    
                    // Vollständiger Logout mit Session-Bereinigung
                    await supabase.auth.signOut({ scope: 'global' });
                    
                    // Browser-Cache und Session-Storage leeren
                    if (typeof window !== 'undefined') {
                      localStorage.clear();
                      sessionStorage.clear();
                      
                      // Cookies löschen
                      document.cookie.split(";").forEach(function(c) { 
                        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
                      });
                    }
                    
                    console.log('✅ Logout successful, redirecting...');
                    
                    // Hard redirect um Cache zu umgehen
                    window.location.replace('/admin/login');
                    
                  } catch (error) {
                    console.error('❌ Logout error:', error);
                    // Fallback: Force redirect auch bei Fehlern
                    window.location.replace('/admin/login');
                  }
                }}
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

      <div className="mx-auto px-4 sm:px-6 lg:px-8 flex min-h-0">
        <aside className="hidden lg:block w-72 xl:w-80 flex-shrink-0 py-8 admin-sidebar">
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

        <main className="flex-1 py-8 lg:ml-8 min-w-0 overflow-hidden admin-main">
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
            <span>Admin</span>
            <div className="w-4 h-4 flex items-center justify-center">
              <i className="ri-arrow-right-s-line"></i>
            </div>
            <span>{allMenuItems.find(item => item.id === activeTab)?.label || 'Übersicht'}</span>
          </div>

          <div className="flex-1 admin-content">
            {renderTabContent()}
          </div>
        </main>
      </div>
    </div>
  );
}