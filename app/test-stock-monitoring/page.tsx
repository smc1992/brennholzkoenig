'use client';

import { useState } from 'react';

// Mock-Daten für die Demonstration
const mockProducts = [
  { id: 1, name: 'Buche Brennholz 25cm', stock_quantity: 5, min_stock_level: 10, price: 89.99 },
  { id: 2, name: 'Eiche Brennholz 33cm', stock_quantity: 15, min_stock_level: 10, price: 99.99 },
  { id: 3, name: 'Birke Brennholz 25cm', stock_quantity: 2, min_stock_level: 8, price: 79.99 },
  { id: 4, name: 'Fichte Brennholz 30cm', stock_quantity: 0, min_stock_level: 5, price: 69.99 },
];

export default function TestStockMonitoring() {
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<any>(null);

  const getStockStatus = (product: any) => {
    if (product.stock_quantity === 0) return 'out-of-stock';
    if (product.stock_quantity <= product.min_stock_level) return 'low-stock';
    return 'in-stock';
  };

  const getStockStatusBadge = (status: string) => {
    const styles = {
      'out-of-stock': 'bg-red-100 text-red-800 border border-red-200',
      'low-stock': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      'in-stock': 'bg-green-100 text-green-800 border border-green-200'
    };

    const labels = {
      'out-of-stock': 'Ausverkauft',
      'low-stock': 'Niedriger Bestand',
      'in-stock': 'Verfügbar'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const simulateStockCheck = async (type: string) => {
    setIsChecking(true);
    
    // Simuliere API-Aufruf
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const lowStockProducts = mockProducts.filter(p => getStockStatus(p) !== 'in-stock');
    
    const result = {
      type,
      checked: mockProducts.length,
      alerts: lowStockProducts.length,
      products: lowStockProducts,
      timestamp: new Date().toISOString()
    };
    
    setResults(result);
    setIsChecking(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Lagerbestand-Überwachung Test
          </h1>
          <p className="text-gray-600">
            Demonstration der implementierten Lagerbestand-Überwachungsfunktionen
          </p>
        </div>

        {/* Aktuelle Produktübersicht */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Aktuelle Produktbestände
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Produkt</th>
                  <th className="text-left py-3 px-4">Bestand</th>
                  <th className="text-left py-3 px-4">Mindestbestand</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Preis</th>
                </tr>
              </thead>
              <tbody>
                {mockProducts.map((product) => (
                  <tr key={product.id} className="border-b">
                    <td className="py-3 px-4 font-medium">{product.name}</td>
                    <td className="py-3 px-4">{product.stock_quantity}</td>
                    <td className="py-3 px-4">{product.min_stock_level}</td>
                    <td className="py-3 px-4">
                      {getStockStatusBadge(getStockStatus(product))}
                    </td>
                    <td className="py-3 px-4">€{product.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Überwachungsaktionen */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Lagerbestand-Prüfungen
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => simulateStockCheck('check-all')}
              disabled={isChecking}
              className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isChecking ? 'Prüfe...' : 'Alle Produkte prüfen'}
            </button>
            
            <button
              onClick={() => simulateStockCheck('check-low-stock')}
              disabled={isChecking}
              className="bg-yellow-600 text-white px-4 py-3 rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isChecking ? 'Prüfe...' : 'Nur niedrige Bestände'}
            </button>
            
            <button
              onClick={() => simulateStockCheck('check-out-of-stock')}
              disabled={isChecking}
              className="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isChecking ? 'Prüfe...' : 'Nur ausverkaufte Artikel'}
            </button>
          </div>
        </div>

        {/* Ergebnisse */}
        {results && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Prüfungsergebnisse
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{results.checked}</div>
                <div className="text-sm text-blue-800">Produkte geprüft</div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{results.alerts}</div>
                <div className="text-sm text-yellow-800">Warnungen</div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">
                  {new Date(results.timestamp).toLocaleTimeString()}
                </div>
                <div className="text-sm text-gray-800">Letzte Prüfung</div>
              </div>
            </div>

            {results.products.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">
                  Produkte mit Bestandsproblemen:
                </h3>
                <div className="space-y-2">
                  {results.products.map((product: any) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-600">
                          Bestand: {product.stock_quantity} / Mindest: {product.min_stock_level}
                        </div>
                      </div>
                      {getStockStatusBadge(getStockStatus(product))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* API-Informationen */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Implementierte Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">✅ Automatische Prüfungen</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Nach Bestellungen im Checkout</li>
                <li>• Bei manuellen Bestandsänderungen</li>
                <li>• Regelmäßige Überwachung via API</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">✅ Admin-Interface</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Manuelle Bestandsprüfungen</li>
                <li>• Echtzeit-Statusanzeige</li>
                <li>• Detaillierte Berichte</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">API-Endpunkt</h4>
            <code className="text-sm text-blue-800">
              GET/POST /api/stock-monitoring
            </code>
            <p className="text-sm text-blue-700 mt-1">
              Unterstützt verschiedene Prüfungstypen und Produktfilter
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}