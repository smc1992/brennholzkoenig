
'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
  min_stock_level: number;
  max_stock_level: number;
  category: string;
  supplier_id: string;
  cost_price: number;
  created_at: string;
  updated_at: string;
}

interface InventoryMovement {
  id: string;
  product_id: string;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reference_id: string;
  notes: string;
  created_by: string;
  created_at: string;
}

interface StockAlert {
  product_id: string;
  product_name: string;
  current_stock: number;
  min_stock: number;
  alert_type: 'low_stock' | 'out_of_stock';
}

export default function InventoryTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showStockAdjustment, setShowStockAdjustment] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentData, setAdjustmentData] = useState({
    type: 'in' as 'in' | 'out' | 'adjustment',
    quantity: 0,
    reference: '',
    notes: ''
  });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (productsError) {
        console.error('Products error:', productsError);
        throw productsError;
      }

      console.log('Loaded products:', productsData);
      setProducts(productsData || []);

      const { data: movementsData, error: movementsError } = await supabase
        .from('inventory_movements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (movementsError) {
        console.error('Movements error:', movementsError);
        throw movementsError;
      }

      console.log('Loaded movements:', movementsData);
      setMovements(movementsData || []);

      // Bestandswarnungen berechnen
      const alerts: StockAlert[] = [];
      productsData?.forEach(product => {
        const currentStock = product.stock_quantity || 0;
        const minStock = product.min_stock_level || 0;

        if (currentStock <= 0) {
          alerts.push({
            product_id: product.id,
            product_name: product.name,
            current_stock: currentStock,
            min_stock: minStock,
            alert_type: 'out_of_stock'
          });
        } else if (currentStock <= minStock) {
          alerts.push({
            product_id: product.id,
            product_name: product.name,
            current_stock: currentStock,
            min_stock: minStock,
            alert_type: 'low_stock'
          });
        }
      });
      setStockAlerts(alerts);

    } catch (error) {
      console.error('Error loading inventory data:', error);
      setMessage('Fehler beim Laden der Bestandsdaten: ' + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  const handleStockAdjustment = async () => {
    if (!selectedProduct || adjustmentData.quantity <= 0) {
      setMessage('Bitte Produkt auswählen und gültige Menge eingeben');
      return;
    }

    setLoading(true);
    try {
      let newStockQuantity = selectedProduct.stock_quantity || 0;

      if (adjustmentData.type === 'in') {
        newStockQuantity += adjustmentData.quantity;
      } else if (adjustmentData.type === 'out') {
        newStockQuantity -= adjustmentData.quantity;
      } else {
        newStockQuantity = adjustmentData.quantity;
      }

      // Bestand in products Tabelle aktualisieren
      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          stock_quantity: Math.max(0, newStockQuantity),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedProduct.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      // Bewegung in inventory_movements eintragen (mit korrekten Feldnamen)
      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert({
          product_id: parseInt(selectedProduct.id),
          movement_type: adjustmentData.type,
          quantity: adjustmentData.quantity,
          reference_id: adjustmentData.reference || `ADJ-${Date.now()}`,
          notes: adjustmentData.notes,
          created_by: 'admin',
          created_at: new Date().toISOString()
        });

      if (movementError) {
        console.error('Movement error:', movementError);
        throw movementError;
      }

      await loadInventoryData();
      setShowStockAdjustment(false);
      setSelectedProduct(null);
      setAdjustmentData({ type: 'in', quantity: 0, reference: '', notes: '' });
      setMessage('Bestandsanpassung erfolgreich durchgeführt!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error adjusting stock:', error);
      setMessage('Fehler bei der Bestandsanpassung: ' + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  const updateStockLevels = async (productId: string, minLevel: number, maxLevel: number) => {
    if (isNaN(minLevel) || isNaN(maxLevel) || minLevel < 0 || maxLevel < 0) {
      setMessage('Bitte gültige Zahlen eingeben');
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          min_stock_level: minLevel,
          max_stock_level: maxLevel,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (error) {
        console.error('Stock levels update error:', error);
        throw error;
      }

      await loadInventoryData();
      setMessage('Bestandsgrenzwerte erfolgreich aktualisiert!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating stock levels:', error);
      setMessage('Fehler beim Aktualisieren der Bestandsgrenzwerte: ' + (error as any).message);
    }
  };

  const exportInventoryReport = () => {
    const csvContent = [
      'Produkt,SKU,Aktueller Bestand,Mindestbestand,Maximalbestand,Wert (€)',
      ...products.map(product => 
        `"${product.name}","${product.sku || ''}",${product.stock_quantity || 0},${product.min_stock_level || 0},${product.max_stock_level || 0},${((product.cost_price || 0) * (product.stock_quantity || 0)).toFixed(2)}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bestandsbericht-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getTotalInventoryValue = () => {
    return products.reduce((total, product) => 
      total + ((product.cost_price || 0) * (product.stock_quantity || 0)), 0
    );
  };

  const getLowStockCount = () => {
    return products.filter(p => (p.stock_quantity || 0) <= (p.min_stock_level || 0)).length;
  };

  const getOutOfStockCount = () => {
    return products.filter(p => (p.stock_quantity || 0) <= 0).length;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-8 h-8 flex items-center justify-center bg-green-100 rounded-full mr-3">
              <i className="ri-stack-line text-green-600"></i>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1A1A1A]">Bestandsverwaltung</h2>
              <p className="text-gray-600">Lagerbestände verwalten und überwachen</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={exportInventoryReport}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-download-line mr-2"></i>
              Export
            </button>
            <button
              onClick={() => setShowStockAdjustment(true)}
              className="bg-[#C04020] hover:bg-[#A03318] text-white px-4 py-2 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-add-line mr-2"></i>
              Bestand anpassen
            </button>
          </div>
        </div>

        {message && (
          <div className={`mb-4 px-4 py-2 rounded-lg text-sm font-medium ${
            message.includes('erfolgreich')
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Gesamtprodukte</p>
                <p className="text-2xl font-bold text-blue-800">{products.length}</p>
              </div>
              <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-lg">
                <i className="ri-box-line text-blue-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Bestandswert</p>
                <p className="text-2xl font-bold text-green-800">€{getTotalInventoryValue().toLocaleString('de-DE', {minimumFractionDigits: 2})}</p>
              </div>
              <div className="w-10 h-10 flex items-center justify-center bg-green-100 rounded-lg">
                <i className="ri-money-euro-circle-line text-green-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Niedriger Bestand</p>
                <p className="text-2xl font-bold text-orange-800">{getLowStockCount()}</p>
              </div>
              <div className="w-10 h-10 flex items-center justify-center bg-orange-100 rounded-lg">
                <i className="ri-error-warning-line text-orange-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Ausverkauft</p>
                <p className="text-2xl font-bold text-red-800">{getOutOfStockCount()}</p>
              </div>
              <div className="w-10 h-10 flex items-center justify-center bg-red-100 rounded-lg">
                <i className="ri-close-circle-line text-red-600"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className="ri-dashboard-line mr-2"></i>
              Bestandsübersicht
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${
                activeTab === 'alerts'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className="ri-alarm-warning-line mr-2"></i>
              Warnungen ({stockAlerts.length})
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${
                activeTab === 'movements'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className="ri-exchange-line mr-2"></i>
              Lagerbewegungen
            </button>
          </nav>
        </div>

        {activeTab === 'overview' && (
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produkt</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bestand</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min/Max</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wert</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.category}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.sku || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{product.stock_quantity || 0}</div>
                        <div className="text-xs text-gray-500">Stück</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <input
                          type="number"
                          defaultValue={product.min_stock_level || 0}
                          onBlur={(e) => {
                            const minLevel = parseInt(e.target.value) || 0;
                            updateStockLevels(product.id, minLevel, product.max_stock_level || 100);
                          }}
                          className="w-16 px-2 py-1 text-xs border border-gray-300 rounded mr-1"
                        />
                        /
                        <input
                          type="number"
                          defaultValue={product.max_stock_level || 100}
                          onBlur={(e) => {
                            const maxLevel = parseInt(e.target.value) || 100;
                            updateStockLevels(product.id, product.min_stock_level || 0, maxLevel);
                          }}
                          className="w-16 px-2 py-1 text-xs border border-gray-300 rounded ml-1"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        €{((product.cost_price || 0) * (product.stock_quantity || 0)).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(product.stock_quantity || 0) <= 0 ? (
                          <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800">
                            Ausverkauft
                          </span>
                        ) : (product.stock_quantity || 0) <= (product.min_stock_level || 0) ? (
                          <span className="px-2 py-1 text-xs font-bold rounded-full bg-orange-100 text-orange-800">
                            Niedriger Bestand
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800">
                            Verfügbar
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowStockAdjustment(true);
                          }}
                          className="text-[#C04020] hover:text-[#A03318] cursor-pointer"
                        >
                          Anpassen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="p-6">
            {stockAlerts.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 flex items-center justify-center bg-green-100 rounded-full mx-auto mb-4">
                  <i className="ri-check-line text-2xl text-green-600"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">Keine Bestandswarnungen</h3>
                <p className="text-gray-500">Alle Produkte haben ausreichend Bestand.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stockAlerts.map((alert, index) => (
                  <div key={index} className={`border rounded-lg p-4 ${
                    alert.alert_type === 'out_of_stock' 
                      ? 'border-red-200 bg-red-50' 
                      : 'border-orange-200 bg-orange-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 flex items-center justify-center rounded-full mr-3 ${
                          alert.alert_type === 'out_of_stock'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-orange-100 text-orange-600'
                        }`}>
                          <i className={alert.alert_type === 'out_of_stock' ? 'ri-close-circle-line' : 'ri-error-warning-line'}></i>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{alert.product_name}</h4>
                          <p className="text-sm text-gray-600">
                            Aktueller Bestand: {alert.current_stock} | Mindestbestand: {alert.min_stock}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const product = products.find(p => p.id === alert.product_id);
                          if (product) {
                            setSelectedProduct(product);
                            setShowStockAdjustment(true);
                          }
                        }}
                        className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg border font-medium transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Bestand auffüllen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'movements' && (
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produkt</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Typ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Menge</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referenz</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notizen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {movements.map((movement) => {
                    const product = products.find(p => p.id === movement.product_id.toString());
                    return (
                      <tr key={movement.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(movement.created_at).toLocaleString('de-DE')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product?.name || 'Unbekannt'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                            movement.movement_type === 'in' ? 'bg-green-100 text-green-800' :
                            movement.movement_type === 'out' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {movement.movement_type === 'in' ? 'Zugang' :
                             movement.movement_type === 'out' ? 'Abgang' : 'Anpassung'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {movement.movement_type === 'out' ? '-' : '+'}{movement.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {movement.reference_id || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {movement.notes || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showStockAdjustment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">
              Bestand anpassen: {selectedProduct?.name}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Aktueller Bestand</label>
                <div className="text-2xl font-bold text-green-600">{selectedProduct?.stock_quantity || 0} Stück</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bewegungstyp</label>
                <select
                  value={adjustmentData.type}
                  onChange={(e) => setAdjustmentData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="in">Zugang (Wareneingang)</option>
                  <option value="out">Abgang (Verkauf/Verlust)</option>
                  <option value="adjustment">Bestandskorrektur</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {adjustmentData.type === 'adjustment' ? 'Neuer Bestand' : 'Menge'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={adjustmentData.quantity}
                  onChange={(e) => setAdjustmentData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Referenz</label>
                <input
                  type="text"
                  value={adjustmentData.reference}
                  onChange={(e) => setAdjustmentData(prev => ({ ...prev, reference: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="z.B. Lieferschein-Nr., Bestellnummer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notizen</label>
                <textarea
                  value={adjustmentData.notes}
                  onChange={(e) => setAdjustmentData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Zusätzliche Informationen..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  onClick={() => {
                    setShowStockAdjustment(false);
                    setSelectedProduct(null);
                    setAdjustmentData({ type: 'in', quantity: 0, reference: '', notes: '' });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium cursor-pointer whitespace-nowrap"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleStockAdjustment}
                  disabled={loading}
                  className="bg-[#C04020] hover:bg-[#A03318] text-white px-6 py-2 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                >
                  {loading ? 'Speichert...' : 'Anpassen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
