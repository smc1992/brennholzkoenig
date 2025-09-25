'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Product {
  id: string;
  name: string;
  stock_quantity: number;
  min_stock_level: number;
  in_stock: boolean;
  updated_at: string;
}

interface MonitoringResult {
  success: boolean;
  message: string;
  data: {
    type: string;
    checked: number;
    alerts: number;
    productId?: string;
    productIds?: string[];
  };
  timestamp: string;
}

export default function StockMonitoringTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [monitoring, setMonitoring] = useState(false);
  const [lastCheck, setLastCheck] = useState<MonitoringResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('id, name, stock_quantity, min_stock_level, in_stock, updated_at')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Fehler beim Laden der Produkte:', err);
      setError('Fehler beim Laden der Produkte');
    } finally {
      setLoading(false);
    }
  };

  const runStockMonitoring = async (type: 'all' | 'single' | 'low-stock-only', productId?: string) => {
    try {
      setMonitoring(true);
      setError(null);

      let url = '/api/stock-monitoring';
      let body: any = {};

      if (type === 'single' && productId) {
        body = { action: 'check-single', productId };
      } else if (type === 'low-stock-only') {
        const lowStockProducts = products.filter(p => p.stock_quantity <= p.min_stock_level);
        body = { action: 'check-multiple', productIds: lowStockProducts.map(p => p.id) };
      } else {
        body = { action: 'check-all' };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result: MonitoringResult = await response.json();
      setLastCheck(result);

      if (result.success) {
        // Refresh products to get updated stock status
        await fetchProducts();
      } else {
        setError(result.message || 'Fehler bei der Lagerbestand-Überwachung');
      }
    } catch (err) {
      console.error('Fehler bei der Lagerbestand-Überwachung:', err);
      setError('Fehler bei der Lagerbestand-Überwachung');
    } finally {
      setMonitoring(false);
    }
  };

  const getStockStatusBadge = (inStock: boolean, stockQuantity: number, minStockLevel: number) => {
    if (stockQuantity === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <i className="ri-alert-line"></i>
          Ausverkauft
        </span>
      );
    } else if (stockQuantity <= minStockLevel) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <i className="ri-alert-line"></i>
          Niedrig
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <i className="ri-check-line"></i>
          Verfügbar
        </span>
      );
    }
  };

  const lowStockProducts = products.filter(p => p.stock_quantity <= p.min_stock_level && p.stock_quantity > 0);
  const outOfStockProducts = products.filter(p => p.stock_quantity === 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C04020]"></div>
        <span className="ml-2">Lade Lagerbestand-Daten...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lagerbestand-Überwachung</h2>
          <p className="text-gray-600">Überwachen Sie den Lagerbestand und senden Sie automatische Warnungen</p>
        </div>
        <button 
          onClick={fetchProducts} 
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
        >
          <i className="ri-refresh-line"></i>
          Aktualisieren
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <i className="ri-alert-line text-red-600 mr-2"></i>
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Übersicht */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gesamt Produkte</p>
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="ri-package-line text-blue-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Niedriger Bestand</p>
              <p className="text-2xl font-bold text-yellow-600">{lowStockProducts.length}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <i className="ri-alert-line text-yellow-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ausverkauft</p>
              <p className="text-2xl font-bold text-red-600">{outOfStockProducts.length}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <i className="ri-alert-line text-red-600 text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Monitoring Aktionen */}
      <div className="bg-white rounded-lg border p-6">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900">Lagerbestand-Prüfung</h3>
          <p className="text-gray-600">
            Führen Sie manuelle Lagerbestand-Prüfungen durch und senden Sie Warnungen bei niedrigem Bestand
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => runStockMonitoring('all')}
              disabled={monitoring}
              className="flex items-center gap-2 px-4 py-2 bg-[#C04020] hover:bg-[#A03318] disabled:bg-gray-300 text-white rounded-lg transition-colors"
            >
              {monitoring ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <i className="ri-eye-line"></i>
              )}
              Alle Produkte prüfen
            </button>
            
            <button
              onClick={() => runStockMonitoring('low-stock-only')}
              disabled={monitoring || lowStockProducts.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
            >
              {monitoring ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <i className="ri-alert-line"></i>
              )}
              Nur niedrige Bestände prüfen ({lowStockProducts.length})
            </button>
          </div>

          {lastCheck && (
            <div className={`border rounded-lg p-4 ${lastCheck.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
              <div className="flex items-start">
                <i className={`ri-check-line mr-2 mt-1 ${lastCheck.success ? "text-green-600" : "text-red-600"}`}></i>
                <div className="space-y-1">
                  <p><strong>Letzte Prüfung:</strong> {new Date(lastCheck.timestamp).toLocaleString('de-DE')}</p>
                  <p>{lastCheck.message}</p>
                  {lastCheck.data && (
                    <p className="text-sm text-gray-600">
                      Typ: {lastCheck.data.type} | Geprüft: {lastCheck.data.checked} | Warnungen: {lastCheck.data.alerts}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Produktliste mit kritischen Beständen */}
      {lowStockProducts.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <i className="ri-alert-line text-yellow-600"></i>
              Kritische Bestände ({lowStockProducts.length})
            </h3>
            <p className="text-gray-600">
              Produkte mit niedrigem oder ausverkauftem Bestand
            </p>
          </div>
          
          <div className="space-y-2">
            {lowStockProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{product.name}</h4>
                  <p className="text-sm text-gray-600">
                    Aktuell: {product.stock_quantity} | Minimum: {product.min_stock_level}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getStockStatusBadge(product.in_stock, product.stock_quantity, product.min_stock_level)}
                  <button
                    onClick={() => runStockMonitoring('single', product.id)}
                    disabled={monitoring}
                    className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 text-gray-700 rounded text-sm transition-colors"
                  >
                    {monitoring ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                    ) : (
                      <i className="ri-eye-line"></i>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}