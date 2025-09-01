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
}

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  showAllOption?: boolean;
}

export default function CategoryFilter({ 
  selectedCategory, 
  onCategoryChange, 
  showAllOption = true 
}: CategoryFilterProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      
      const typedCategories: Category[] = (data || []).map((item: any) => ({
        id: item.id,
        name: item.name || '',
        description: item.description || undefined,
        icon: item.icon || undefined,
        color: item.color || '#C04020',
        sort_order: item.sort_order || 0,
        is_active: item.is_active !== false
      }));
      
      setCategories(typedCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
      // Fallback-Kategorien wenn Laden fehlschlägt
      setCategories([
        { id: 1, name: 'Premium Buche', color: '#C04020', sort_order: 1, is_active: true },
        { id: 2, name: 'Standard Buche', color: '#C04020', sort_order: 2, is_active: true },
        { id: 3, name: 'Scheitholz', color: '#C04020', sort_order: 3, is_active: true },
        { id: 4, name: 'Mix-Sortiment', color: '#C04020', sort_order: 4, is_active: true },
        { id: 5, name: 'Nadelholz', color: '#C04020', sort_order: 5, is_active: true }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 w-24 bg-gray-200 rounded-full animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const allCategories = showAllOption ? ['Alle'] : [];
  const categoryOptions = [...allCategories, ...categories.map(cat => cat.name)];

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Kategorien</h3>
      <div className="flex flex-wrap gap-2">
        {categoryOptions.map((categoryName) => {
          const category = categories.find(cat => cat.name === categoryName);
          const isSelected = selectedCategory === categoryName;
          
          return (
            <button
              key={categoryName}
              onClick={() => onCategoryChange(categoryName)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center ${
                isSelected
                  ? 'text-white shadow-lg transform scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
              }`}
              style={{
                backgroundColor: isSelected ? (category?.color || '#C04020') : undefined
              }}
            >
              {category?.icon && (
                <i className={`${category.icon} mr-2`}></i>
              )}
              {categoryName}
              {category && (
                <div 
                  className="w-2 h-2 rounded-full ml-2"
                  style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : category.color }}
                ></div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Kategorie-Beschreibung */}
      {selectedCategory !== 'Alle' && (
        <div className="mt-4">
          {categories
            .filter(cat => cat.name === selectedCategory)
            .map(cat => cat.description && (
              <p key={cat.id} className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                {cat.description}
              </p>
            ))
          }
        </div>
      )}
    </div>
  );
}