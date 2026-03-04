
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
}

export default function FAQPage() {
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [faqs, setFAQs] = useState<FAQItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Kategorien laden
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('faq_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (categoriesError) throw categoriesError;

      // FAQ Items laden
      const { data: faqsData, error: faqsError } = await supabase
        .from('faq_items')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (faqsError) throw faqsError;

      setCategories(categoriesData || []);
      setFAQs(faqsData || []);
    } catch (error) {
      console.error('Fehler beim Laden der FAQ-Daten:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackView = async (faqId: string) => {
    try {
      const faq = faqs.find(f => f.id === faqId);
      const currentViews = faq?.views || 0;
      
      await supabase
        .from('faq_items')
        .update({ views: currentViews + 1 })
        .eq('id', faqId);
    } catch (error) {
      console.error('Fehler beim Tracking:', error);
    }
  };

  const vote = async (faqId: string, helpful: boolean) => {
    if (voting[faqId]) return;
    
    setVoting(prev => ({ ...prev, [faqId]: true }));

    try {
      const faq = faqs.find(f => f.id === faqId);
      if (!faq) return;

      const updates = helpful 
        ? { helpful_votes: faq.helpful_votes + 1 }
        : { not_helpful_votes: faq.not_helpful_votes + 1 };

      await supabase
        .from('faq_items')
        .update(updates)
        .eq('id', faqId);

      // Lokale State aktualisieren
      setFAQs(prev => prev.map(f => 
        f.id === faqId 
          ? { ...f, ...updates }
          : f
      ));
    } catch (error) {
      console.error('Fehler beim Voten:', error);
    } finally {
      setVoting(prev => ({ ...prev, [faqId]: false }));
    }
  };

  const toggleFAQ = (faqId: string) => {
    if (openFAQ === faqId) {
      setOpenFAQ(null);
    } else {
      setOpenFAQ(faqId);
      trackView(faqId);
    }
  };

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category_id === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  const getCategoryName = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.name || 'Unbekannt';
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-12 bg-gray-200 rounded mb-6"></div>
          <div className="flex space-x-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-10 bg-gray-200 rounded w-24"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 sm:pt-24 md:pt-28">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Häufig gestellte Fragen</h1>
        <p className="text-sm sm:text-base text-gray-600">
          Finden Sie schnell Antworten auf die häufigsten Fragen zu unseren Produkten und Services.
        </p>
      </div>

      {/* Suchfeld */}
      <div className="mb-6">
        <div className="relative">
          <i className="ri-search-line absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="FAQ durchsuchen..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Kategorie Filter */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full font-medium transition-colors whitespace-nowrap cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Alle ({faqs.length})
          </button>
          {categories.map((category) => {
            const count = faqs.filter(faq => faq.category_id === category.id).length;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  selectedCategory === category.id
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* FAQ Liste */}
      {filteredFAQs.length === 0 ? (
        <div className="text-center py-12">
          <i className="ri-question-line text-6xl text-gray-300 mb-4"></i>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchQuery ? 'Keine Ergebnisse gefunden' : 'Keine FAQs verfügbar'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery 
              ? `Für "${searchQuery}" wurden keine passenden FAQs gefunden.`
              : 'In dieser Kategorie sind noch keine FAQs verfügbar.'
            }
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer"
            >
              Suche zurücksetzen
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFAQs.map((faq) => (
            <div key={faq.id} className="bg-white border rounded-xl overflow-hidden">
              <button
                onClick={() => toggleFAQ(faq.id)}
                className="w-full p-6 text-left hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                        {getCategoryName(faq.category_id)}
                      </span>
                      <span className="flex items-center">
                        <i className="ri-eye-line mr-1"></i>
                        {faq.views} Aufrufe
                      </span>
                    </div>
                  </div>
                  <i className={`ri-arrow-down-s-line text-2xl text-gray-400 transition-transform ${
                    openFAQ === faq.id ? 'rotate-180' : ''
                  }`}></i>
                </div>
              </button>

              {openFAQ === faq.id && (
                <div className="px-6 pb-6 border-t border-gray-100">
                  <div className="pt-4 prose max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: faq.answer.replace(/\n/g, '<br>') }} />
                  </div>

                  {/* Bewertung */}
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600 mb-3">War diese Antwort hilfreich?</p>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => vote(faq.id, true)}
                        disabled={voting[faq.id]}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <i className="ri-thumb-up-line"></i>
                        <span>Ja ({faq.helpful_votes})</span>
                      </button>
                      <button
                        onClick={() => vote(faq.id, false)}
                        disabled={voting[faq.id]}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <i className="ri-thumb-down-line"></i>
                        <span>Nein ({faq.not_helpful_votes})</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Weitere Hilfe */}
      <div className="mt-12 bg-green-50 rounded-xl p-6 text-center">
        <i className="ri-customer-service-2-line text-4xl text-green-600 mb-4"></i>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Ihre Frage ist nicht dabei?
        </h3>
        <p className="text-gray-600 mb-4">
          Unser Support-Team hilft Ihnen gerne weiter. Erstellen Sie einfach eine Anfrage.
        </p>
        <a
          href="/konto/support"
          className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer"
        >
          <i className="ri-customer-service-line mr-2"></i>
          Support kontaktieren
        </a>
      </div>
      </div>
    </div>
  );
}
