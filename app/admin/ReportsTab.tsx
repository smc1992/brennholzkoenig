
'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

interface SalesByMonth {
  month: string;
  revenue: number;
  orders: number;
}

interface ProductPerformance {
  name: string;
  category: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
}

interface CustomerStats {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  averageOrderValue: number;
  repeatCustomers: number;
}

interface InventoryItem {
  name: string;
  category: string;
  stock_quantity: number;
  min_stock_level: number;
  price: string | number;
}

interface ReportDataState {
  salesByMonth: SalesByMonth[];
  productPerformance: ProductPerformance[];
  customerStats: CustomerStats;
  inventoryReport: InventoryItem[];
}

export default function ReportsTab() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState('sales');
  const [dateRange, setDateRange] = useState('30d');
  const [reportData, setReportData] = useState(null);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [reportDataState, setReportDataState] = useState<ReportDataState>({
    salesByMonth: [],
    productPerformance: [],
    customerStats: {
      totalCustomers: 0,
      newCustomers: 0,
      activeCustomers: 0,
      averageOrderValue: 0,
      repeatCustomers: 0
    },
    inventoryReport: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [dateRangeState, setDateRangeState] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadReportData();
  }, [dateRangeState]);

  const loadReportData = async () => {
    try {
      setIsLoading(true);

      // Sales by Month
      const { data: salesData } = await supabase
        .from('orders')
        .select('total_amount, created_at, status')
        .gte('created_at', dateRangeState.start)
        .lte('created_at', dateRangeState.end + 'T23:59:59')
        .eq('status', 'delivered');

      // Product Performance
      const { data: productData } = await supabase
        .from('order_items')
        .select(`
          product_name,
          product_category,
          quantity,
          total_price,
          orders!inner(status, created_at)
        `)
        .gte('orders.created_at', dateRangeState.start)
        .lte('orders.created_at', dateRangeState.end + 'T23:59:59')
        .eq('orders.status', 'delivered');

      // Customer Stats
      const { data: customerData } = await supabase
        .from('customers')
        .select(`
          id,
          created_at,
          orders(total_amount, status, created_at)
        `);

      // Inventory Report
      const { data: inventoryData } = await supabase
        .from('products')
        .select('name, category, stock_quantity, min_stock_level, price')
        .eq('is_active', true);

      // Process Sales by Month
      const salesByMonth = processSalesByMonth(salesData || []);

      // Process Product Performance
      const productPerformance = processProductPerformance(productData || []);

      // Process Customer Stats
      const customerStats = processCustomerStats(customerData || []);

      setReportDataState({
        salesByMonth,
        productPerformance,
        customerStats,
        inventoryReport: inventoryData || []
      });

    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processSalesByMonth = (salesData: any[]): SalesByMonth[] => {
    const monthlyData: Record<string, SalesByMonth> = {};

    salesData.forEach((order: any) => {
      const date = new Date(order.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          revenue: 0,
          orders: 0
        };
      }

      monthlyData[monthKey].revenue += parseFloat(order.total_amount);
      monthlyData[monthKey].orders += 1;
    });

    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  };

  const processProductPerformance = (productData: any[]): ProductPerformance[] => {
    const productStats: Record<string, ProductPerformance> = {};

    productData.forEach((item: any) => {
      const key = item.product_name;

      if (!productStats[key]) {
        productStats[key] = {
          name: item.product_name,
          category: item.product_category,
          totalQuantity: 0,
          totalRevenue: 0,
          orderCount: 0
        };
      }

      productStats[key].totalQuantity += item.quantity;
      productStats[key].totalRevenue += parseFloat(item.total_price);
      productStats[key].orderCount += 1;
    });

    return Object.values(productStats).sort((a, b) => b.totalRevenue - a.totalRevenue);
  };

  const processCustomerStats = (customerData: any[]): CustomerStats => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats = {
      totalCustomers: customerData.length,
      newCustomers: 0,
      activeCustomers: 0,
      averageOrderValue: 0,
      repeatCustomers: 0
    };

    let totalRevenue = 0;
    let totalOrders = 0;

    customerData.forEach((customer: any) => {
      const customerDate = new Date(customer.created_at);

      // New customers (last 30 days)
      if (customerDate >= thirtyDaysAgo) {
        stats.newCustomers++;
      }

      const deliveredOrders = customer.orders?.filter((order: any) =>
        order.status === 'delivered'
      ) || [];

      if (deliveredOrders.length > 0) {
        stats.activeCustomers++;
        
        if (deliveredOrders.length > 1) {
          stats.repeatCustomers++;
        }

        deliveredOrders.forEach((order: any) => {
          totalRevenue += parseFloat(order.total_amount);
          totalOrders++;
        });
      }
    });

    stats.averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return stats;
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map((row: any) => headers.map((header: string) => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="w-12 h-12 flex items-center justify-center bg-[#C04020] rounded-full mx-auto mb-4 animate-pulse">
          <i className="ri-bar-chart-line text-2xl text-white"></i>
        </div>
        <p className="text-lg font-medium text-gray-700">Lade Berichte...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Report Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4 items-end">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Von</label>
              <input
                type="date"
                value={dateRangeState.start}
                onChange={(e) => setDateRangeState(prev => ({...prev, start: e.target.value}))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bis</label>
              <input
                type="date"
                value={dateRangeState.end}
                onChange={(e) => setDateRangeState(prev => ({...prev, end: e.target.value}))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
              />
            </div>
          </div>
          
          <button
            onClick={loadReportData}
            className="bg-[#C04020] hover:bg-[#A03318] text-white px-6 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-refresh-line mr-2"></i>
            Aktualisieren
          </button>
        </div>
      </div>

      {/* Report Navigation */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: 'sales', label: 'Umsatz-Analyse', icon: 'ri-line-chart-line' },
          { id: 'products', label: 'Produkt-Performance', icon: 'ri-product-hunt-line' },
          { id: 'customers', label: 'Kunden-Statistiken', icon: 'ri-user-line' },
          { id: 'inventory', label: 'Lager-Bericht', icon: 'ri-stock-line' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedReport(tab.id)}
            className={`px-6 py-4 font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedReport === tab.id
                ? 'text-[#C04020] border-b-2 border-[#C04020]'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="w-5 h-5 flex items-center justify-center mr-2 inline-block">
              <i className={tab.icon}></i>
            </div>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        
        {/* Sales Report */}
        {selectedReport === 'sales' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#1A1A1A]">Umsatz-Analyse</h2>
              <button
                onClick={() => exportToCSV(reportDataState.salesByMonth, 'umsatz_analyse')}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-file-excel-line mr-2"></i>
                CSV Export
              </button>
            </div>

            {reportDataState.salesByMonth.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
                  <i className="ri-line-chart-line text-2xl text-gray-400"></i>
                </div>
                <p className="text-gray-600">Keine Umsatzdaten im gewählten Zeitraum</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Monat</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Bestellungen</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Umsatz</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Ø pro Bestellung</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportDataState.salesByMonth.map((month) => (
                      <tr key={month.month}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {new Date(month.month + '-01').toLocaleDateString('de-DE', { year: 'numeric', month: 'long' })}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{month.orders.toString()}</td>
                        <td className="px-6 py-4 text-sm font-bold text-[#C04020]">€{month.revenue.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">€{(month.revenue / month.orders).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">Gesamt</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">
                        {reportDataState.salesByMonth.reduce((sum, month) => sum + month.orders, 0)}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-[#C04020]">
                        €{reportDataState.salesByMonth.reduce((sum, month) => sum + month.revenue, 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">
                        €{(
                          reportDataState.salesByMonth.reduce((sum, month) => sum + month.revenue, 0) /
                          reportDataState.salesByMonth.reduce((sum, month) => sum + month.orders, 0)
                        ).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Product Performance */}
        {selectedReport === 'products' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#1A1A1A]">Produkt-Performance</h2>
              <button
                onClick={() => exportToCSV(reportDataState.productPerformance, 'produkt_performance')}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-file-excel-line mr-2"></i>
                CSV Export
              </button>
            </div>

            {reportDataState.productPerformance.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
                  <i className="ri-product-hunt-line text-2xl text-gray-400"></i>
                </div>
                <p className="text-gray-600">Keine Produktdaten im gewählten Zeitraum</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Produkt</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Kategorie</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Verkaufte Menge</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Bestellungen</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Umsatz</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Ø pro SRM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportDataState.productPerformance.map((product, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{product.category}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{product.totalQuantity} SRM</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{product.orderCount}</td>
                        <td className="px-6 py-4 text-sm font-bold text-[#C04020]">€{product.totalRevenue.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">€{(product.totalRevenue / product.totalQuantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Customer Statistics */}
        {selectedReport === 'customers' && (
          <div className="p-6">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-6">Kunden-Statistiken</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-blue-50 p-6 rounded-xl">
                <div className="flex items-center">
                  <div className="w-12 h-12 flex items-center justify-center bg-blue-500 rounded-lg mr-4">
                    <i className="ri-user-line text-2xl text-white"></i>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-600">Gesamte Kunden</p>
                    <p className="text-3xl font-bold text-blue-800">{reportDataState.customerStats.totalCustomers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-6 rounded-xl">
                <div className="flex items-center">
                  <div className="w-12 h-12 flex items-center justify-center bg-green-500 rounded-lg mr-4">
                    <i className="ri-user-add-line text-2xl text-white"></i>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-600">Neue Kunden (30T)</p>
                    <p className="text-3xl font-bold text-green-800">{reportDataState.customerStats.newCustomers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 p-6 rounded-xl">
                <div className="flex items-center">
                  <div className="w-12 h-12 flex items-center justify-center bg-orange-500 rounded-lg mr-4">
                    <i className="ri-user-star-line text-2xl text-white"></i>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-orange-600">Aktive Kunden</p>
                    <p className="text-3xl font-bold text-orange-800">{reportDataState.customerStats.activeCustomers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 p-6 rounded-xl">
                <div className="flex items-center">
                  <div className="w-12 h-12 flex items-center justify-center bg-purple-500 rounded-lg mr-4">
                    <i className="ri-repeat-line text-2xl text-white"></i>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-600">Wiederkehr-Kunden</p>
                    <p className="text-3xl font-bold text-purple-800">{reportDataState.customerStats.repeatCustomers}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Kennzahlen</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Durchschnittlicher Bestellwert:</span>
                  <span className="font-bold text-[#C04020]">€{reportDataState.customerStats.averageOrderValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Wiederkehr-Rate:</span>
                  <span className="font-bold text-[#C04020]">
                    {reportDataState.customerStats.activeCustomers > 0 
                      ? ((reportDataState.customerStats.repeatCustomers / reportDataState.customerStats.activeCustomers) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inventory Report */}
        {selectedReport === 'inventory' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#1A1A1A]">Lager-Bericht</h2>
              <button
                onClick={() => exportToCSV(reportDataState.inventoryReport, 'lager_bericht')}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-file-excel-line mr-2"></i>
                CSV Export
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-red-50 p-6 rounded-xl">
                <div className="flex items-center">
                  <div className="w-10 h-10 flex items-center justify-center bg-red-500 rounded-lg mr-3">
                    <i className="ri-alert-line text-xl text-white"></i>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-600">Kritisch niedrig</p>
                    <p className="text-2xl font-bold text-red-800">
                      {reportDataState.inventoryReport.filter(p => p.stock_quantity === 0).length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 p-6 rounded-xl">
                <div className="flex items-center">
                  <div className="w-10 h-10 flex items-center justify-center bg-orange-500 rounded-lg mr-3">
                    <i className="ri-error-warning-line text-xl text-white"></i>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-orange-600">Nachbestellen</p>
                    <p className="text-2xl font-bold text-orange-800">
                      {reportDataState.inventoryReport.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.min_stock_level).length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-6 rounded-xl">
                <div className="flex items-center">
                  <div className="w-10 h-10 flex items-center justify-center bg-green-500 rounded-lg mr-3">
                    <i className="ri-check-line text-xl text-white"></i>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-600">Gut versorgt</p>
                    <p className="text-2xl font-bold text-green-800">
                      {reportDataState.inventoryReport.filter(p => p.stock_quantity > p.min_stock_level).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Produkt</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Kategorie</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Bestand</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Mindestbestand</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Lagerwert</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportDataState.inventoryReport
                    .sort((a, b) => {
                      // Sortiere nach Status: Kritisch, Niedrig, OK
                      if (a.stock_quantity === 0 && b.stock_quantity > 0) return -1;
                      if (b.stock_quantity === 0 && a.stock_quantity > 0) return 1;
                      if (a.stock_quantity <= a.min_stock_level && b.stock_quantity > b.min_stock_level) return -1;
                      if (b.stock_quantity <= b.min_stock_level && a.stock_quantity > a.min_stock_level) return 1;
                      return a.name.localeCompare(b.name);
                    })
                    .map((product) => {
                      const getStatusColor = () => {
                        if (product.stock_quantity === 0) return 'text-red-600 bg-red-100';
                        if (product.stock_quantity <= product.min_stock_level) return 'text-orange-600 bg-orange-100';
                        return 'text-green-600 bg-green-100';
                      };

                      const getStatusText = () => {
                        if (product.stock_quantity === 0) return 'Ausverkauft';
                        if (product.stock_quantity <= product.min_stock_level) return 'Niedrig';
                        return 'Verfügbar';
                      };

                      return (
                        <tr key={product.name}>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{product.category}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{product.stock_quantity} SRM</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{product.min_stock_level} SRM</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${getStatusColor()}`}>
                              {getStatusText()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-[#C04020]">
                            €{(product.stock_quantity * (typeof product.price === 'string' ? parseFloat(product.price) : product.price)).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  }
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-sm font-bold text-gray-900">Gesamtlagerwert:</td>
                    <td className="px-6 py-4 text-sm font-bold text-[#C04020]">
                      €{reportDataState.inventoryReport.reduce((sum, product) => 
                        sum + (product.stock_quantity * (typeof product.price === 'string' ? parseFloat(product.price) : product.price)), 0
                      ).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
