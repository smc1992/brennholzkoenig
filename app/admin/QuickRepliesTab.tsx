'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface QuickReply {
  id: string;
  title: string;
  content: string;
  category: string;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export default function QuickRepliesTab() {
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingReply, setEditingReply] = useState<QuickReply | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general'
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { value: 'general', label: 'Allgemein' },
    { value: 'order', label: 'Bestellung' },
    { value: 'delivery', label: 'Lieferung' },
    { value: 'payment', label: 'Zahlung' },
    { value: 'product', label: 'Produkt' },
    { value: 'technical', label: 'Technisch' },
    { value: 'complaint', label: 'Beschwerde' },
    { value: 'return', label: 'Rückgabe' }
  ];

  useEffect(() => {
    loadQuickReplies();
  }, []);

  const loadQuickReplies = async () => {
    try {
      const response = await fetch('/api/support/quick-replies');
      const data = await response.json();
      if (data.quickReplies) {
        setQuickReplies(data.quickReplies);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Schnellantworten:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Titel ist erforderlich';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Titel muss mindestens 3 Zeichen lang sein';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Inhalt ist erforderlich';
    } else if (formData.content.length < 10) {
      newErrors.content = 'Inhalt muss mindestens 10 Zeichen lang sein';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    setErrors({});

    try {
      const url = editingReply 
        ? `/api/support/quick-replies?id=${editingReply.id}`
        : '/api/support/quick-replies';
      
      const method = editingReply ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (response.ok) {
        await loadQuickReplies();
        setShowModal(false);
        setEditingReply(null);
        setFormData({ title: '', content: '', category: 'general' });
        setErrors({});
      } else {
        setErrors({ submit: data.error || 'Fehler beim Speichern' });
      }
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      setErrors({ submit: 'Netzwerkfehler beim Speichern' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (reply: QuickReply) => {
    setEditingReply(reply);
    setFormData({
      title: reply.title,
      content: reply.content,
      category: reply.category
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/support/quick-replies?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadQuickReplies();
        setShowDeleteConfirm(null);
      } else {
        console.error('Fehler beim Löschen');
      }
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
    }
  };

  const confirmDelete = (reply: QuickReply) => {
    setShowDeleteConfirm(reply.id);
  };

  const toggleActive = async (reply: QuickReply) => {
    try {
      const response = await fetch(`/api/support/quick-replies?id=${reply.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !reply.is_active })
      });

      if (response.ok) {
        await loadQuickReplies();
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren:', error);
    }
  };

  const filteredReplies = quickReplies.filter(reply => {
    const matchesCategory = filterCategory === 'all' || reply.category === filterCategory;
    const matchesSearch = reply.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reply.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryLabel = (category: string) => {
    return categories.find(c => c.value === category)?.label || category;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Schnellantworten verwalten</h2>
        <button
          onClick={() => {
            setEditingReply(null);
            setFormData({ title: '', content: '', category: 'general' });
            setShowModal(true);
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          <i className="ri-add-line mr-2"></i>
          Neue Schnellantwort
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Schnellantworten durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Alle Kategorien</option>
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quick Replies List */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {filteredReplies.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <i className="ri-chat-quote-line text-4xl mb-4"></i>
            <p>Keine Schnellantworten gefunden</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredReplies.map(reply => (
              <div key={reply.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{reply.title}</h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {getCategoryLabel(reply.category)}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        reply.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {reply.is_active ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3 line-clamp-2">{reply.content}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>
                        <i className="ri-bar-chart-line mr-1"></i>
                        {reply.usage_count} mal verwendet
                      </span>
                      <span>
                        <i className="ri-time-line mr-1"></i>
                        Erstellt: {new Date(reply.created_at).toLocaleDateString('de-DE')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => toggleActive(reply)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        reply.is_active
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                      title={reply.is_active ? 'Deaktivieren' : 'Aktivieren'}
                    >
                      <i className={reply.is_active ? 'ri-pause-line' : 'ri-play-line'}></i>
                    </button>
                    
                    <button
                      onClick={() => handleEdit(reply)}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium hover:bg-blue-200 transition-colors"
                      title="Bearbeiten"
                    >
                      <i className="ri-edit-line"></i>
                    </button>
                    
                    <button
                      onClick={() => confirmDelete(reply)}
                      className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm font-medium hover:bg-red-200 transition-colors"
                      title="Löschen"
                    >
                      <i className="ri-delete-line"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
              setEditingReply(null);
              setFormData({ title: '', content: '', category: 'general' });
              setErrors({});
            }
          }}
        >
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingReply ? 'Schnellantwort bearbeiten' : 'Neue Schnellantwort'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingReply(null);
                  setFormData({ title: '', content: '', category: 'general' });
                  setErrors({});
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            
            {errors.submit && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}
            
            <form 
              onSubmit={handleSubmit} 
              className="space-y-4"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setShowModal(false);
                  setEditingReply(null);
                  setFormData({ title: '', content: '', category: 'general' });
                  setErrors({});
                }
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titel *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (errors.title) {
                      setErrors({ ...errors, title: '' });
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="z.B. Begrüßung, Lieferzeit, Problem gelöst"
                  autoFocus
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategorie
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inhalt *
                  <span className="text-xs text-gray-500 ml-2">
                    ({formData.content.length} Zeichen)
                  </span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => {
                    setFormData({ ...formData, content: e.target.value });
                    if (errors.content) {
                      setErrors({ ...errors, content: '' });
                    }
                  }}
                  rows={6}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.content ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Geben Sie hier den Text der Schnellantwort ein..."
                />
                {errors.content && (
                  <p className="mt-1 text-sm text-red-600">{errors.content}</p>
                )}
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <i className="ri-lightbulb-line text-blue-600 mt-0.5"></i>
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Tipps für gute Schnellantworten:</p>
                    <ul className="text-xs space-y-1">
                      <li>• Verwenden Sie einen aussagekräftigen Titel</li>
                      <li>• Schreiben Sie höflich und professionell</li>
                      <li>• Keyboard-Shortcuts: Esc = Schließen, Ctrl+Enter = Speichern</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingReply(null);
                    setFormData({ title: '', content: '', category: 'general' });
                    setErrors({});
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <i className="ri-close-line mr-2"></i>
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={saving || !formData.title.trim() || !formData.content.trim()}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                >
                  <i className={`${saving ? 'ri-loader-4-line animate-spin' : (editingReply ? 'ri-save-line' : 'ri-add-line')} mr-2`}></i>
                  {saving ? 'Wird gespeichert...' : (editingReply ? 'Aktualisieren' : 'Erstellen')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <i className="ri-delete-bin-line text-red-600 text-xl"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Schnellantwort löschen</h3>
                <p className="text-sm text-gray-600">Diese Aktion kann nicht rückgängig gemacht werden.</p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 mb-6">
              <p className="text-sm font-medium text-gray-900 mb-1">
                {quickReplies.find(r => r.id === showDeleteConfirm)?.title}
              </p>
              <p className="text-xs text-gray-600 line-clamp-2">
                {quickReplies.find(r => r.id === showDeleteConfirm)?.content}
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <i className="ri-close-line mr-2"></i>
                Abbrechen
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <i className="ri-delete-bin-line mr-2"></i>
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}