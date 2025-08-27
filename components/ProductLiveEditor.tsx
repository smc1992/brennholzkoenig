'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRealtimeSync, productChangeNotifier } from '../hooks/useRealtimeSync';

interface ProductLiveEditorProps {
  productId: number;
  onClose: () => void;
}

export default function ProductLiveEditor({ productId, onClose }: ProductLiveEditorProps) {
  const { products, refreshProducts } = useRealtimeSync();
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    unit: '',
    stock_quantity: '',
    is_active: true
  });

  useEffect(() => {
    const foundProduct = products.find(p => p.id === productId);
    if (foundProduct) {
      setProduct(foundProduct);
      setFormData({
        name: foundProduct.name || '',
        description: foundProduct.description || '',
        price: foundProduct.price?.toString() || '',
        category: foundProduct.category || '',
        unit: foundProduct.unit || '',
        stock_quantity: foundProduct.stock_quantity?.toString() || '',
        is_active: foundProduct.is_active ?? true
      });
    }
  }, [products, productId]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!product) return;

    setIsSaving(true);
    try {
      const updateData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        unit: formData.unit,
        stock_quantity: parseInt(formData.stock_quantity),
        is_active: formData.is_active,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId);

      if (error) {
        throw error;
      }

      productChangeNotifier.notify(
        `Produkt "${formData.name}" wurde erfolgreich aktualisiert`,
        'success'
      );

      // Refresh products to get latest data
      await refreshProducts();
      
      onClose();
    } catch (error) {
      console.error('Error updating product:', error);
      productChangeNotifier.notify(
        `Fehler beim Aktualisieren: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        'error'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!product) return;

    setIsLoading(true);
    try {
      const newActiveState = !formData.is_active;
      
      const { error } = await supabase
        .from('products')
        .update({ 
          is_active: newActiveState,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (error) {
        throw error;
      }

      setFormData(prev => ({ ...prev, is_active: newActiveState }));
      
      productChangeNotifier.notify(
        `Produkt "${formData.name}" wurde ${newActiveState ? 'aktiviert' : 'deaktiviert'}`,
        'success'
      );

      await refreshProducts();
    } catch (error) {
      console.error('Error toggling product status:', error);
      productChangeNotifier.notify(
        `Fehler beim Ändern des Status: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!product) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#C04020] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Produkt wird geladen...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Produkt bearbeiten</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Live Status Indicator */}
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
            <span className="text-green-800 font-medium">Live-Bearbeitung aktiv</span>
            <span className="text-green-600 text-sm ml-2">Änderungen werden sofort im Frontend sichtbar</span>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Produktname
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
              placeholder="Produktname eingeben..."
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Beschreibung
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
              placeholder="Produktbeschreibung eingeben..."
            />
          </div>

          {/* Price and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preis (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategorie
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                placeholder="Kategorie eingeben..."
              />
            </div>
          </div>

          {/* Unit and Stock */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Einheit
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => handleInputChange('unit', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                placeholder="z.B. pro Schüttraummeter"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lagerbestand
              </label>
              <input
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => handleInputChange('stock_quantity', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">Produktstatus</h3>
              <p className="text-sm text-gray-600">
                {formData.is_active ? 'Produkt ist aktiv und im Shop sichtbar' : 'Produkt ist deaktiviert und nicht sichtbar'}
              </p>
            </div>
            <button
              onClick={handleToggleActive}
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                formData.is_active
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Wird geändert...' : (formData.is_active ? 'Aktiv' : 'Inaktiv')}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 mt-8">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-6 py-2 bg-[#C04020] text-white rounded-lg hover:bg-[#A03318] transition-colors ${
              isSaving ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSaving ? 'Wird gespeichert...' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  );
}