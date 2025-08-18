
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function ProductManagementTab() {
  interface Product {
    id: string;
    name: string;
    description: string;
    category: string;
    price: string;
    original_price?: string | null;
    unit: string;
    stock_quantity: number;
    min_stock_level: number;
    image_url: string;
    additional_images?: string[];
    features?: string[];
    specifications?: Record<string, any>;
    is_active: boolean;
    in_stock: boolean;
    created_at: string;
    updated_at?: string;
  }

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Alle');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkValue, setBulkValue] = useState('');
  interface InventoryMovement {
    id: string;
    product_id: string;
    movement_type: string;
    quantity: number;
    reference_type: string;
    notes?: string;
    created_at: string;
    orders?: { order_number: string } | null;
  }

  interface InventoryHistory {
    productId: string;
    movements: InventoryMovement[];
  }

  const [inventoryHistory, setInventoryHistory] = useState<InventoryHistory | null>(null);

  // Verwende den zentralen Supabase-Client aus lib/supabase.ts

  const defaultCategories = ['Premium Buche', 'Standard Buche', 'Scheitholz', 'Mix-Sortiment', 'Nadelholz'];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory]);

  const loadData = async () => {
    try {
      // Produkte laden
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (productsError) throw productsError;

      // Kategorien aus vorhandenen Produkten extrahieren
      const uniqueCategories = [...new Set(productsData?.map(p => p.category) || [])];
      const allCategories = [...new Set([...defaultCategories, ...uniqueCategories])];

      setProducts(productsData || []);
      setCategories(['Alle', ...allCategories]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (selectedCategory !== 'Alle') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  interface ProductData {
    name: string;
    description: string;
    category: string;
    price: number;
    original_price?: number | null;
    unit: string;
    stock_quantity: number;
    min_stock_level: number;
    image_url: string;
    additional_images?: string[];
    features?: string[];
    specifications?: Record<string, any>;
    [key: string]: any;
  }

  const addProduct = async (productData: ProductData) => {
    try {
      const { error } = await supabase
        .from('products')
        .insert({
          ...productData,
          created_at: new Date().toISOString(),
          is_active: true,
          in_stock: productData.stock_quantity > 0
        });

      if (error) throw error;

      setIsAddModalOpen(false);
      loadData();
      alert('Produkt erfolgreich hinzugefügt!');
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Fehler beim Hinzufügen des Produkts');
    }
  };

  const deleteProduct = async (productId: string) => {
    if (confirm('Möchten Sie dieses Produkt wirklich löschen?')) {
      try {
        const { error } = await supabase
          .from('products')
          .update({ is_active: false })
          .eq('id', productId);

        if (error) throw error;

        loadData();
        alert('Produkt erfolgreich deaktiviert!');
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Fehler beim Löschen des Produkts');
      }
    }
  };

  const duplicateProduct = async (product: Product) => {
    try {
      const newProduct = {
        ...product,
        name: `${product.name} (Kopie)`,
        id: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('products')
        .insert(newProduct);

      if (error) throw error;

      loadData();
      alert('Produkt erfolgreich dupliziert!');
    } catch (error) {
      console.error('Error duplicating product:', error);
      alert('Fehler beim Duplizieren des Produkts');
    }
  };

  const handleBulkAction = async () => {
    if (selectedProducts.length === 0) {
      alert('Bitte wählen Sie mindestens ein Produkt aus');
      return;
    }

    if (!bulkAction) {
      alert('Bitte wählen Sie eine Aktion aus');
      return;
    }

    try {
      let updateData = {};

      switch (bulkAction) {
        case 'activate':
          updateData = { is_active: true };
          break;
        case 'deactivate':
          updateData = { is_active: false };
          break;
        case 'price_increase':
          if (!bulkValue || parseFloat(bulkValue) <= 0) {
            alert('Bitte geben Sie einen gültigen Prozentsatz ein');
            return;
          }
          // Preiserhöhung wird für jedes Produkt einzeln berechnet
          break;
        case 'price_decrease':
          if (!bulkValue || parseFloat(bulkValue) <= 0) {
            alert('Bitte geben Sie einen gültigen Prozentsatz ein');
            return;
          }
          // Preissenkung wird für jedes Produkt einzeln berechnet
          break;
        case 'stock_update':
          if (!bulkValue || parseInt(bulkValue) < 0) {
            alert('Bitte geben Sie einen gültigen Lagerbestand ein');
            return;
          }
          updateData = { 
            stock_quantity: parseInt(bulkValue),
            in_stock: parseInt(bulkValue) > 0
          };
          break;
        case 'category_change':
          if (!bulkValue) {
            alert('Bitte wählen Sie eine Kategorie aus');
            return;
          }
          updateData = { category: bulkValue };
          break;
      }

      for (const productId of selectedProducts) {
        if (bulkAction === 'price_increase' || bulkAction === 'price_decrease') {
          const product = products.find(p => p.id === productId);
          if (product) {
            const currentPrice = parseFloat(product.price);
            const percentage = parseFloat(bulkValue);
            const multiplier = bulkAction === 'price_increase' ? (1 + percentage / 100) : (1 - percentage / 100);
            const newPrice = Math.round(currentPrice * multiplier * 100) / 100;
            
            updateData = { 
              price: newPrice.toString(),
              updated_at: new Date().toISOString()
            };
          }
        }

        const { error } = await supabase
          .from('products')
          .update({
            ...updateData,
            updated_at: new Date().toISOString()
          })
          .eq('id', productId);

        if (error) throw error;
      }

      setSelectedProducts([]);
      setBulkAction('');
      setBulkValue('');
      loadData();
      alert(`Bulk-Aktion erfolgreich auf ${selectedProducts.length} Produkte angewendet!`);
    } catch (error) {
      console.error('Error applying bulk action:', error);
      alert('Fehler beim Anwenden der Bulk-Aktion');
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAllProducts = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const updateProductStock = async (productId: string, newStock: number, reason = 'Manual adjustment') => {
    try {
      const { error: productError } = await supabase
        .from('products')
        .update({ 
          stock_quantity: newStock,
          in_stock: newStock > 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (productError) throw productError;

      // Lagerbestandsbewegung erfassen
      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert({
          product_id: productId,
          movement_type: 'adjustment',
          quantity: newStock,
          reference_type: 'manual_adjustment',
          notes: reason,
          created_at: new Date().toISOString()
        });

      if (movementError) throw movementError;

      loadData();
      alert('Lagerbestand erfolgreich aktualisiert!');
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Lagerbestand konnte nicht aktualisiert werden');
    }
  };

  const viewInventoryMovements = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('inventory_movements')
        .select(`
          *,
          orders (order_number)
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Lagerbestandshistorie im Modal anzeigen
      setInventoryHistory({ productId, movements: data || [] });
    } catch (error) {
      console.error('Error loading inventory movements:', error);
      alert('Lagerbestandshistorie konnte nicht geladen werden');
    }
  };

  const handleAddProductSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const formEntries = Object.fromEntries(formData.entries());
    const data: Record<string, string | FormDataEntryValue> = formEntries;

    const featuresValue = formData.get('features');
    const features = typeof featuresValue === 'string' ? featuresValue.split(',').map(f => f.trim()).filter(f => f) : [];

    const additionalImagesValue = formData.get('additional_images');
    const additionalImages = typeof additionalImagesValue === 'string' ? additionalImagesValue.split(',').map(url => url.trim()).filter(url => url) : [];

    let specifications = {};
    try {
      const specificationsValue = data.specifications;
      if (typeof specificationsValue === 'string') {
        specifications = JSON.parse(specificationsValue || '{}');
      }
    } catch (error) {
      alert('Fehler in den technischen Daten - bitte korrektes JSON Format verwenden');
      return;
    }

    const priceValue = data.price?.toString() || '0';
    const originalPriceValue = data.original_price?.toString() || '';
    const stockQuantityValue = data.stock_quantity?.toString() || '0';
    const minStockLevelValue = data.min_stock_level?.toString() || '0';
    const nameValue = data.name?.toString() || '';
    const descriptionValue = data.description?.toString() || '';
    const categoryValue = data.category?.toString() || '';
    const unitValue = data.unit?.toString() || '';
    const imageUrlValue = data.image_url?.toString() || '';
    
    addProduct({
      name: nameValue,
      description: descriptionValue,
      category: categoryValue,
      unit: unitValue,
      image_url: imageUrlValue,
      price: parseFloat(priceValue),
      original_price: originalPriceValue ? parseFloat(originalPriceValue) : null,
      stock_quantity: parseInt(stockQuantityValue),
      min_stock_level: parseInt(minStockLevelValue),
      features,
      specifications,
      additional_images: additionalImages
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="w-12 h-12 flex items-center justify-center bg-[#C04020] rounded-full mx-auto mb-4 animate-pulse">
          <i className="ri-product-hunt-line text-2xl text-white"></i>
        </div>
        <p className="text-lg font-medium text-gray-700">Lade Produktverwaltung...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">Erweiterte Produktverwaltung</h2>
            <p className="text-gray-600">Neue Produkte hinzufügen, Kategorien verwalten und Bulk-Bearbeitungen durchführen</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-[#C04020] hover:bg-[#A03318] text-white px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-add-line mr-2"></i>
              Neues Produkt
            </button>
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-price-tag-line mr-2"></i>
              Kategorien verwalten
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <div className="w-5 h-5 flex items-center justify-center text-gray-400">
                  <i className="ri-search-line"></i>
                </div>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#C04020] transition-colors"
                placeholder="Suche nach Produktname, Kategorie oder Beschreibung..."
              />
            </div>
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#C04020] transition-colors cursor-pointer pr-8"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <button
            onClick={loadData}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-refresh-line mr-2"></i>
            Aktualisieren
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-blue-900 mb-2">
                Bulk-Aktionen ({selectedProducts.length} Produkte ausgewählt)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Aktion wählen</label>
                  <select
                    value={bulkAction}
                    onChange={(e) => setBulkAction(e.target.value)}
                    className="w-full border border-blue-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 cursor-pointer pr-8"
                  >
                    <option value="">Aktion auswählen...</option>
                    <option value="activate">Aktivieren</option>
                    <option value="deactivate">Deaktivieren</option>
                    <option value="price_increase">Preis erhöhen (%)</option>
                    <option value="price_decrease">Preis senken (%)</option>
                    <option value="stock_update">Lagerbestand setzen</option>
                    <option value="category_change">Kategorie ändern</option>
                  </select>
                </div>

                {(bulkAction === 'price_increase' || bulkAction === 'price_decrease') && (
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">Prozentsatz</label>
                    <input
                      type="number"
                      step="0.1"
                      value={bulkValue}
                      onChange={(e) => setBulkValue(e.target.value)}
                      className="w-full border border-blue-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                      placeholder="10.0"
                    />
                  </div>
                )}

                {bulkAction === 'stock_update' && (
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">Lagerbestand</label>
                    <input
                      type="number"
                      value={bulkValue}
                      onChange={(e) => setBulkValue(e.target.value)}
                      className="w-full border border-blue-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                      placeholder="100"
                    />
                  </div>
                )}

                {bulkAction === 'category_change' && (
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">Neue Kategorie</label>
                    <select
                      value={bulkValue}
                      onChange={(e) => setBulkValue(e.target.value)}
                      className="w-full border border-blue-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 cursor-pointer pr-8"
                    >
                      <option value="">Kategorie wählen...</option>
                      {categories.slice(1).map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBulkAction}
                disabled={!bulkAction}
                className={`px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  bulkAction
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <i className="ri-check-line mr-2"></i>
                Anwenden
              </button>
              <button
                onClick={() => {
                  setSelectedProducts([]);
                  setBulkAction('');
                  setBulkValue('');
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-[#1A1A1A]">
              Produkte ({filteredProducts.length})
            </h3>
            <div className="flex items-center gap-4">
              <label className="flex items-center text-sm font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                  onChange={selectAllProducts}
                  className="mr-2"
                />
                Alle auswählen
              </label>
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
              <i className="ri-product-hunt-line text-2xl text-gray-400"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              {products.length === 0 ? 'Noch keine Produkte' : 'Keine Produkte gefunden'}
            </h3>
            <p className="text-gray-500 mb-4">
              {products.length === 0
                ? 'Fügen Sie Ihr erstes Produkt hinzu.'
                : 'Versuchen Sie andere Suchkriterien oder Filter.'
              }
            </p>
            {products.length === 0 && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-[#C04020] hover:bg-[#A03318] text-white px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-add-line mr-2"></i>
                Erstes Produkt hinzufügen
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === filteredProducts.length}
                      onChange={selectAllProducts}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Produkt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Kategorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Preis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Bestand
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className={`hover:bg-gray-50 ${selectedProducts.includes(product.id) ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover mr-4"
                        />
                        <div>
                          <div className="text-sm font-bold text-[#1A1A1A]">
                            {product.name}
                          </div>
                          <div className="text-xs text-gray-500 max-w-xs truncate">
                            {product.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-bold text-[#C04020] uppercase tracking-wider">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-[#C04020]">
                        €{parseFloat(product.price).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {product.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-[#1A1A1A]">
                        {product.stock_quantity} SRM
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${
                          product.is_active
                            ? 'text-green-600 bg-green-100'
                            : 'text-red-600 bg-red-100'
                        }`}
                      >
                        {product.is_active ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => viewInventoryMovements(product.id)}
                        className="text-purple-600 hover:text-purple-800 cursor-pointer"
                        title="Lagerbestandshistorie"
                      >
                        <i className="ri-history-line"></i>
                      </button>
                      <button
                        onClick={() => {
                          const newStock = prompt(
                            `Aktueller Bestand: ${product.stock_quantity} SRM\nBitte geben Sie den neuen Lagerbestand ein:`
                          );
                          if (newStock !== null && !isNaN(parseInt(newStock))) {
                            const reason = prompt('Bitte geben Sie den Grund für die Anpassung ein:') || 'Manuelle Anpassung';
                            updateProductStock(product.id, parseInt(newStock), reason);
                          }
                        }}
                        className="text-green-600 hover:text-green-800 cursor-pointer"
                        title="Lagerbestand anpassen"
                      >
                        <i className="ri-add-box-line"></i>
                      </button>
                      <button
                        onClick={() => duplicateProduct(product)}
                        className="text-blue-600 hover:text-blue-800 cursor-pointer"
                        title="Produkt kopieren"
                      >
                        <i className="ri-file-copy-line"></i>
                      </button>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        className="text-red-600 hover:text-red-800 cursor-pointer"
                        title="Produkt löschen"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#1A1A1A]">
                  Neues Produkt hinzufügen
                </h2>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
            </div>

            <form
              onSubmit={handleAddProductSubmit}
              className="p-6 space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Produktname *</label>
                  <input
                    type="text"
                    name="name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                    required
                    placeholder="z.B. Premium Buchenholz"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kategorie *</label>
                  <select
                    name="category"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] cursor-pointer pr-8"
                    required
                  >
                    <option value="">Kategorie wählen...</option>
                    {categories.slice(1).map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preis (€) *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                    required
                    placeholder="29.90"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ursprungspreis (€) - optional</label>
                  <input
                    type="number"
                    step="0.01"
                    name="original_price"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                    placeholder="39.90"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Einheit *</label>
                  <select
                    name="unit"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] cursor-pointer pr-8"
                    defaultValue="pro SRM"
                  >
                    <option value="pro SRM">pro SRM</option>
                    <option value="pro Tonne">pro Tonne</option>
                    <option value="pro Stück">pro Stück</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lagerbestand (SRM) *</label>
                  <input
                    type="number"
                    name="stock_quantity"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                    required
                    placeholder="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mindestbestand (SRM) *</label>
                  <input
                    type="number"
                    name="min_stock_level"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                    required
                    placeholder="10"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Produktbilder</label>
                  <div className="space-y-4 border border-gray-300 rounded-lg p-4">
                    {/* Hauptbild */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        Hauptbild URL *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          name="image_url"
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                          required
                          placeholder="https://readdy.ai/api/search-image?query=..."
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.querySelector('input[name="image_url"]') as HTMLInputElement;
                            const categorySelect = document.querySelector('select[name="category"]') as HTMLSelectElement;
                            if (input && categorySelect) {
                              const category = categorySelect.value.toLowerCase();
                              input.value = `https://readdy.ai/api/search-image?query=premium%20${category}%20brennholz%20gestapelt%20sauber%20naturbelassen%20kammergetrocknet&width=800&height=600&seq=${Date.now()}&orientation=landscape`;
                            }
                          }}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <i className="ri-image-line mr-1"></i>Auto
                        </button>
                      </div>
                    </div>

                    {/* Zusätzliche Bilder */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        Zusätzliche Bilder (optional)
                      </label>
                      <textarea
                        name="additional_images"
                        rows={4}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                        placeholder="https://beispiel.com/bild2.jpg&#10;https://beispiel.com/bild3.jpg&#10;Eine URL pro Zeile für Produktgalerie"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            const textarea = document.querySelector('textarea[name="additional_images"]') as HTMLTextAreaElement;
                            const categorySelect = document.querySelector('select[name="category"]') as HTMLSelectElement;
                            if (textarea && categorySelect) {
                              const category = categorySelect.value.toLowerCase();
                              const additionalUrls = [
                                `https://readdy.ai/api/search-image?query=${category}%20brennholz%20nahaufnahme%20textur%20holzmaserung%20details&width=600&height=600&seq=${Date.now()}&orientation=squarish`,
                                `https://readdy.ai/api/search-image?query=${category}%20kaminholz%20gestapelt%20ordentlich%20lager%20trocken&width=600&height=600&seq=${Date.now() + 1}&orientation=squarish`,
                                `https://readdy.ai/api/search-image?query=${category}%20scheitholz%20querschnitt%20rinde%20nat%C3%BCrlich%20premium&width=600&height=600&seq=${Date.now() + 2}&orientation=squarish`,
                                `https://readdy.ai/api/search-image?query=${category}%20brennholz%20stapel%20outdoor%20nat%C3%BCrlich%20umgebung&width=600&height=600&seq=${Date.now() + 3}&orientation=squarish`
                              ];
                              textarea.value = additionalUrls.join('\n');
                            }
                          }}
                          className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <i className="ri-gallery-line mr-1"></i>Galerie generieren (4 Bilder)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const textarea = document.querySelector('textarea[name="additional_images"]') as HTMLTextAreaElement;
                            if (textarea) textarea.value = '';
                          }}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <i className="ri-delete-bin-line mr-1"></i>Leeren
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
                      <div className="flex items-start">
                        <i className="ri-information-line text-blue-600 mr-2 mt-0.5"></i>
                        <div>
                          <strong>Bild-Tipps:</strong>
                          <ul className="mt-1 space-y-1">
                            <li>• Hauptbild wird auf Startseite und in Listen angezeigt</li>
                            <li>• Zusätzliche Bilder erscheinen in der Produktdetailansicht</li>
                            <li>• Verwenden Sie hochauflösende Bilder (min. 800x600px)</li>
                            <li>• Alle Bilder werden automatisch synchronisiert</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kurzbeschreibung *</label>
                  <textarea
                    name="description"
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                    required
                    placeholder="Kurze Produktbeschreibung..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Detailbeschreibung</label>
                  <textarea
                    name="detailed_description"
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                    placeholder="Ausführliche Produktbeschreibung..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Eigenschaften (eine pro Zeile)</label>
                  <textarea
                    name="features"
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                    placeholder="Kammergetrocknet\\nRestfeuchte < 20%\\nNachhaltiger Anbau\\n..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Technische Daten (JSON Format)</label>
                  <textarea
                    name="specifications"
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] font-mono text-sm"
                    placeholder={`{"Holzart": "Buche", "Restfeuchte": "< 20%", "Scheitlänge": "25-33 cm"}`}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Beispiel: {`{"Holzart": "Buche", "Restfeuchte": "< 20%"}`}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="bg-[#C04020] hover:bg-[#A03318] text-white px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
                >
                  Produkt hinzufügen
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#1A1A1A]">
                  Kategorien verwalten
                </h2>
                <button
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <div className="w-5 h-5 flex items-center justify-center mr-2 text-blue-600">
                    <i className="ri-information-line"></i>
                  </div>
                  <h4 className="font-bold text-blue-800">Kategorien-Verwaltung</h4>
                </div>
                <p className="text-sm text-blue-700">
                  Hier können Sie die verfügbaren Produktkategorien einsehen. 
                  Neue Kategorien werden automatisch erstellt, wenn Sie sie bei Produkten verwenden.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-bold text-[#1A1A1A] mb-4">Verfügbare Kategorien</h4>
                <div className="space-y-3">
                  {categories.slice(1).map((category) => {
                    const productCount = products.filter(p => p.category === category).length;
                    return (
                      <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-[#C04020] rounded-full mr-3"></div>
                          <span className="font-medium text-[#1A1A1A]">{category}</span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {productCount} Produkt{productCount !== 1 ? 'e' : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <div className="w-5 h-5 flex items-center justify-center mr-2 text-green-600">
                    <i className="ri-lightbulb-line"></i>
                  </div>
                  <h4 className="font-bold text-green-800">Tipp</h4>
                </div>
                <p className="text-sm text-green-700">
                  Um eine neue Kategorie zu erstellen, geben Sie einfach einen neuen Kategorienamen 
                  beim Hinzufügen oder Bearbeiten eines Produkts ein.
                </p>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inventory History Modal */}
      {inventoryHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#1A1A1A]">
                  Lagerbestandshistorie
                </h2>
                <button
                  onClick={() => setInventoryHistory(null)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
            </div>

            <div className="p-6">
              {inventoryHistory.movements.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
                    <i className="ri-history-line text-2xl text-gray-400"></i>
                  </div>
                  <p className="text-gray-500">Keine Lagerbestandsbewegungen vorhanden</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Datum</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Typ</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Menge</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Referenz</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Notizen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {inventoryHistory.movements.map((movement) => (
                        <tr key={movement.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {new Date(movement.created_at).toLocaleDateString('de-DE', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${
                                movement.movement_type === 'in'
                                  ? 'bg-green-100 text-green-800'
                                  : movement.movement_type === 'out'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {movement.movement_type === 'in' ? 'Eingang' :
                                movement.movement_type === 'out' ? 'Ausgang' : 'Anpassung'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-bold">
                            {movement.movement_type === 'out' ? '-' : '+'}{movement.quantity} SRM
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {movement.orders?.order_number || movement.reference_type || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {movement.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
