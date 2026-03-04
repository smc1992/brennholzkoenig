'use client';

import { useState, useEffect } from 'react';

interface Product {
  id: number;
  name: string;
  price: number;
  stock_quantity: number;
}

interface InventoryMovement {
  id: string;
  product_id: number;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  created_at: string;
}

export default function TestInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);

  // Funktion zur Berechnung des aktuellen Bestands basierend auf Bewegungen
  const getCurrentStock = (productId: number) => {
    const productMovements = movements.filter(m => m.product_id === productId);
    return productMovements.reduce((total, movement) => {
      switch (movement.movement_type) {
        case 'in':
          return total + movement.quantity;
        case 'out':
          return total - movement.quantity;
        case 'adjustment':
          return total + movement.quantity;
        default:
          return total;
      }
    }, 0);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabaseUrl = 'https://tmxhamdyrjuxwnskgfka.supabase.co';
        const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteGhhbWR5cmp1eHduc2tnZmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTgyMjksImV4cCI6MjA3MDQ5NDIyOX0.Nj4plTbNMvPF1fqEXffWXnS6TBJUpHETM1JE6BK7odk';

        // Produkte laden
        const productsResponse = await fetch(`${supabaseUrl}/rest/v1/products?select=id,name,price,stock_quantity`, {
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'Content-Type': 'application/json'
          }
        });
        const productsData = await productsResponse.json();

        // Lagerbewegungen laden
        const movementsResponse = await fetch(`${supabaseUrl}/rest/v1/inventory_movements?select=id,product_id,movement_type,quantity,created_at`, {
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'Content-Type': 'application/json'
          }
        });
        const movementsData = await movementsResponse.json();

        setProducts(productsData);
        setMovements(movementsData);
        setLoading(false);
      } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8">Lade Daten...</div>;
  }

  const totalStaticValue = products.reduce((total, product) => 
    total + (product.price * product.stock_quantity), 0
  );

  const totalCalculatedValue = products.reduce((total, product) => 
    total + (product.price * getCurrentStock(product.id)), 0
  );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Lagerwert-Berechnung Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Statischer Lagerwert</h2>
          <p className="text-3xl font-bold text-blue-600">
            {totalStaticValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
          </p>
          <p className="text-sm text-gray-600 mt-2">Basierend auf stock_quantity</p>
        </div>
        
        <div className="bg-green-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Berechneter Lagerwert</h2>
          <p className="text-3xl font-bold text-green-600">
            {totalCalculatedValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
          </p>
          <p className="text-sm text-gray-600 mt-2">Basierend auf Lagerbewegungen</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Produkt
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Preis
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statischer Bestand
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Berechneter Bestand
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statischer Wert
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Berechneter Wert
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => {
              const calculatedStock = getCurrentStock(product.id);
              const staticValue = product.price * product.stock_quantity;
              const calculatedValue = product.price * calculatedStock;
              
              return (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.price.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.stock_quantity} SRM
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={calculatedStock < 0 ? 'text-red-600 font-semibold' : ''}>
                      {calculatedStock} SRM
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {staticValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={calculatedValue < 0 ? 'text-red-600 font-semibold' : ''}>
                      {calculatedValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-8 bg-yellow-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Lagerbewegungen ({movements.length} Einträge)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Eingänge</p>
            <p className="text-xl font-bold text-green-600">
              {movements.filter(m => m.movement_type === 'in').length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Ausgänge</p>
            <p className="text-xl font-bold text-red-600">
              {movements.filter(m => m.movement_type === 'out').length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Anpassungen</p>
            <p className="text-xl font-bold text-blue-600">
              {movements.filter(m => m.movement_type === 'adjustment').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}