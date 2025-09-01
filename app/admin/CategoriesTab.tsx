'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Category {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const CategoriesTab = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'ri-fire-line',
    color: '#C04020',
    sort_order: 1,
    is_active: true
  });
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    console.log('CategoriesTab: Komponente geladen');
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      console.log('CategoriesTab: Lade Kategorien aus Datenbank...');
      
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('CategoriesTab: Supabase Error:', error);
        showNotification('error', `Fehler beim Laden: ${error.message}`);
        // Keine Fallback-Daten - zeige leeres Array
        setCategories([]);
        return;
      }
      
      if (data && data.length > 0) {
        console.log('CategoriesTab: Kategorien geladen:', data.length);
        const typedCategories: Category[] = data.map((item: any) => ({
          id: item.id,
          name: item.name || '',
          description: item.description || undefined,
          icon: item.icon || undefined,
          color: item.color || '#C04020',
          sort_order: item.sort_order || 0,
          is_active: item.is_active !== false,
          created_at: item.created_at || '',
          updated_at: item.updated_at || ''
        }));
        setCategories(typedCategories);
        showNotification('success', `${data.length} Kategorien geladen`);
      } else {
        console.log('✅ CategoriesTab: Keine Kategorien in Datenbank gefunden');
        setCategories([]);
        showNotification('success', 'Keine Kategorien gefunden - erstellen Sie neue Kategorien');
      }
    } catch (error: any) {
      console.error('❌ CategoriesTab: Fehler beim Laden:', error);
      showNotification('error', `Fehler: ${error.message}`);
      // Keine Fallback-Daten - zeige leeres Array
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Produktionsreife CategoriesTab - keine Fallback-Daten mehr

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleAddNew = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      icon: 'ri-fire-line',
      color: '#C04020',
      sort_order: categories.length + 1,
      is_active: true
    });
    setShowAddModal(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || 'ri-fire-line',
      color: category.color,
      sort_order: category.sort_order,
      is_active: category.is_active
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from('product_categories')
          .update({
            name: formData.name,
            description: formData.description || null,
            icon: formData.icon || null,
            color: formData.color,
            sort_order: formData.sort_order,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
        showNotification('success', 'Kategorie erfolgreich aktualisiert');
      } else {
        // Create new category
        const { error } = await supabase
          .from('product_categories')
          .insert({
            name: formData.name,
            description: formData.description || null,
            icon: formData.icon || null,
            color: formData.color,
            sort_order: formData.sort_order,
            is_active: formData.is_active
          });

        if (error) throw error;
        showNotification('success', 'Kategorie erfolgreich erstellt');
      }

      setShowAddModal(false);
      loadCategories();
    } catch (error: any) {
      console.error('Error saving category:', error);
      showNotification('error', `Fehler beim Speichern: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Kategorie löschen möchten?')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('product_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      showNotification('success', 'Kategorie erfolgreich gelöscht');
      loadCategories();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      showNotification('error', `Fehler beim Löschen: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  console.log('CategoriesTab: Rendering mit', categories.length, 'Kategorien');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Kategorien</h2>
          <p className="text-gray-600">Verwalten Sie Ihre Produktkategorien</p>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-[#C04020] text-white px-4 py-2 rounded-lg hover:bg-[#A03318] transition-colors flex items-center"
        >
          <i className="ri-add-line mr-2"></i>
          Neue Kategorie
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`p-4 rounded-lg ${
          notification.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center">
            <i className={`${
              notification.type === 'success' ? 'ri-check-line' : 'ri-error-warning-line'
            } mr-2`}></i>
            {notification.message}
          </div>
        </div>
      )}

      {/* Debug Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Debug Information</h3>
        <div className="text-sm text-blue-800">
          <p>Kategorien geladen: {categories.length}</p>
          <p>Loading: {loading ? 'Ja' : 'Nein'}</p>
          <p>Komponente gerendert: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C04020]"></div>
          <span className="ml-2 text-gray-600">Lade Kategorien...</span>
        </div>
      )}

      {/* Categories Table */}
      {!loading && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Beschreibung
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reihenfolge
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full mr-3"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {category.icon && <i className={`${category.icon} mr-2`}></i>}
                            {category.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {category.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{category.sort_order}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        category.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {category.is_active ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <i className="ri-edit-line"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingCategory ? 'Kategorie bearbeiten' : 'Neue Kategorie'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beschreibung
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icon
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ri-fire-line"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Farbe
                  </label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reihenfolge
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.is_active ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="true">Aktiv</option>
                    <option value="false">Inaktiv</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#C04020] text-white rounded-lg hover:bg-[#A03318] transition-colors disabled:opacity-50"
                >
                  {loading ? 'Speichern...' : 'Speichern'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesTab;