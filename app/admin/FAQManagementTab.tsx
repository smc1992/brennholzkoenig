
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Using the centralized Supabase client from lib/supabase.ts

interface FAQCategory {
  id: string;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

interface FAQItem {
  id: string;
  category_id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
  views: number;
  helpful_votes: number;
  not_helpful_votes: number;
  created_at: string;
}

export default function FAQManagementTab() {
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [faqs, setFAQs] = useState<FAQItem[]>([]);
  const [activeTab, setActiveTab] = useState<'categories' | 'faqs'>('categories');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Kategorie Form
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FAQCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    is_active: true
  });

  // FAQ Form
  const [showFAQForm, setShowFAQForm] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQItem | null>(null);
  const [faqForm, setFaqForm] = useState({
    category_id: '',
    question: '',
    answer: '',
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Kategorien laden
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('faq_categories')
        .select('*')
        .order('sort_order');

      if (categoriesError) throw categoriesError;

      // FAQ Items laden
      const { data: faqsData, error: faqsError } = await supabase
        .from('faq_items')
        .select('*')
        .order('sort_order');

      if (faqsError) throw faqsError;

      setCategories(categoriesData || []);
      setFAQs(faqsData || []);
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
    } finally {
      setLoading(false);
    }
  };

  // Kategorie Funktionen
  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const categoryData = {
        ...categoryForm,
        sort_order: editingCategory?.sort_order || categories.length + 1
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('faq_categories')
          .update(categoryData)
          .eq('id', editingCategory.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('faq_categories')
          .insert([categoryData]);

        if (error) throw error;
      }

      await loadData();
      resetCategoryForm();
    } catch (error) {
      console.error('Fehler beim Speichern der Kategorie:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Möchten Sie diese Kategorie wirklich löschen? Alle zugehörigen FAQs werden ebenfalls gelöscht.')) return;

    try {
      // Erst FAQs löschen
      await supabase
        .from('faq_items')
        .delete()
        .eq('category_id', id);

      // Dann Kategorie löschen
      const { error } = await supabase
        .from('faq_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Fehler beim Löschen der Kategorie:', error);
    }
  };

  const editCategory = (category: FAQCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      is_active: category.is_active
    });
    setShowCategoryForm(true);
  };

  const resetCategoryForm = () => {
    setShowCategoryForm(false);
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      description: '',
      is_active: true
    });
  };

  // FAQ Funktionen
  const saveFAQ = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const faqData = {
        ...faqForm,
        sort_order: editingFAQ?.sort_order || faqs.filter(f => f.category_id === faqForm.category_id).length + 1,
        views: editingFAQ?.views || 0,
        helpful_votes: editingFAQ?.helpful_votes || 0,
        not_helpful_votes: editingFAQ?.not_helpful_votes || 0
      };

      if (editingFAQ) {
        const { error } = await supabase
          .from('faq_items')
          .update(faqData)
          .eq('id', editingFAQ.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('faq_items')
          .insert([faqData]);

        if (error) throw error;
      }

      await loadData();
      resetFAQForm();
    } catch (error) {
      console.error('Fehler beim Speichern der FAQ:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteFAQ = async (id: string) => {
    if (!confirm('Möchten Sie diese FAQ wirklich löschen?')) return;

    try {
      const { error } = await supabase
        .from('faq_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Fehler beim Löschen der FAQ:', error);
    }
  };

  const editFAQ = (faq: FAQItem) => {
    setEditingFAQ(faq);
    setFaqForm({
      category_id: faq.category_id,
      question: faq.question,
      answer: faq.answer,
      is_active: faq.is_active
    });
    setShowFAQForm(true);
  };

  const resetFAQForm = () => {
    setShowFAQForm(false);
    setEditingFAQ(null);
    setFaqForm({
      category_id: '',
      question: '',
      answer: '',
      is_active: true
    });
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.name || 'Unbekannt';
  };

  const updateSortOrder = async (items: any[], tableName: string, type: 'category' | 'faq') => {
    try {
      const updates = items.map((item, index) => ({
        id: item.id,
        sort_order: index + 1
      }));

      for (const update of updates) {
        await supabase
          .from(tableName)
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
      }

      await loadData();
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Reihenfolge:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">FAQ Verwaltung</h2>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-md font-medium transition-colors cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Kategorien ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab('faqs')}
            className={`px-4 py-2 rounded-md font-medium transition-colors cursor-pointer ${
              activeTab === 'faqs'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            FAQ Items ({faqs.length})
          </button>
        </div>
      </div>

      {/* Kategorien Tab */}
      {activeTab === 'categories' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Kategorien verwalten</h3>
            <button
              onClick={() => setShowCategoryForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-add-line mr-2"></i>
              Neue Kategorie
            </button>
          </div>

          {showCategoryForm && (
            <div className="bg-white border-2 border-green-200 rounded-xl p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-gray-900">
                  {editingCategory ? 'Kategorie bearbeiten' : 'Neue Kategorie'}
                </h4>
                <button
                  onClick={resetCategoryForm}
                  className="text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <form onSubmit={saveCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beschreibung
                  </label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="category_active"
                    checked={categoryForm.is_active}
                    onChange={(e) => setCategoryForm({...categoryForm, is_active: e.target.checked})}
                    className="mr-3 w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="category_active" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Kategorie aktiv
                  </label>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {saving ? 'Speichern...' : editingCategory ? 'Änderungen speichern' : 'Kategorie erstellen'}
                  </button>
                  <button
                    type="button"
                    onClick={resetCategoryForm}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Abbrechen
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.id} className="bg-white border rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{category.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        category.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {category.is_active ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </div>
                    {category.description && (
                      <p className="text-gray-600 mb-3">{category.description}</p>
                    )}
                    <div className="text-sm text-gray-500">
                      {faqs.filter(f => f.category_id === category.id).length} FAQ Items
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => editCategory(category)}
                      className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <i className="ri-edit-line text-lg"></i>
                    </button>
                    <button
                      onClick={() => deleteCategory(category.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <i className="ri-delete-bin-line text-lg"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQs Tab */}
      {activeTab === 'faqs' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">FAQ Items verwalten</h3>
            <button
              onClick={() => setShowFAQForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer"
              disabled={categories.length === 0}
            >
              <i className="ri-add-line mr-2"></i>
              Neue FAQ
            </button>
          </div>

          {categories.length === 0 && (
            <div className="text-center py-8 bg-yellow-50 rounded-lg mb-6">
              <i className="ri-information-line text-4xl text-yellow-600 mb-2"></i>
              <p className="text-yellow-800 font-medium mb-1">Keine Kategorien vorhanden</p>
              <p className="text-yellow-700">Erstellen Sie zuerst eine Kategorie, bevor Sie FAQs hinzufügen können.</p>
            </div>
          )}

          {showFAQForm && (
            <div className="bg-white border-2 border-green-200 rounded-xl p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-gray-900">
                  {editingFAQ ? 'FAQ bearbeiten' : 'Neue FAQ'}
                </h4>
                <button
                  onClick={resetFAQForm}
                  className="text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <form onSubmit={saveFAQ} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategorie *
                  </label>
                  <select
                    value={faqForm.category_id}
                    onChange={(e) => setFaqForm({...faqForm, category_id: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-8"
                    required
                  >
                    <option value="">Kategorie wählen</option>
                    {categories.filter(cat => cat.is_active).map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frage *
                  </label>
                  <input
                    type="text"
                    value={faqForm.question}
                    onChange={(e) => setFaqForm({...faqForm, question: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Antwort *
                  </label>
                  <textarea
                    value={faqForm.answer}
                    onChange={(e) => setFaqForm({...faqForm, answer: e.target.value})}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    required
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="faq_active"
                    checked={faqForm.is_active}
                    onChange={(e) => setFaqForm({...faqForm, is_active: e.target.checked})}
                    className="mr-3 w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="faq_active" className="text-sm font-medium text-gray-700 cursor-pointer">
                    FAQ aktiv
                  </label>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {saving ? 'Speichern...' : editingFAQ ? 'Änderungen speichern' : 'FAQ erstellen'}
                  </button>
                  <button
                    type="button"
                    onClick={resetFAQForm}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Abbrechen
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.id} className="bg-white border rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                        {getCategoryName(faq.category_id)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        faq.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {faq.is_active ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h4>
                    <p className="text-gray-600 mb-3 line-clamp-3">{faq.answer}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <i className="ri-eye-line mr-1"></i>
                        {faq.views} Aufrufe
                      </span>
                      <span className="flex items-center">
                        <i className="ri-thumb-up-line mr-1"></i>
                        {faq.helpful_votes} hilfreich
                      </span>
                      <span className="flex items-center">
                        <i className="ri-thumb-down-line mr-1"></i>
                        {faq.not_helpful_votes} nicht hilfreich
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => editFAQ(faq)}
                      className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <i className="ri-edit-line text-lg"></i>
                    </button>
                    <button
                      onClick={() => deleteFAQ(faq.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <i className="ri-delete-bin-line text-lg"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
