
'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import RichTextEditor from '../../components/RichTextEditor';
import MediaManager from '../../components/MediaManager';
import SEOOptimizer from '../../components/SEOOptimizer';

export default function BlogManagementTab() {
  interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt?: string;
    content: string;
    category?: string;
    tags?: string[];
    featured_image?: string;
    status: string;
    reading_time?: number;
    meta_title?: string;
    meta_description?: string;
    focus_keywords?: string;
    scheduled_publish_at?: string;
    comments_enabled?: boolean;
    created_at?: string;
    updated_at?: string;
    [key: string]: any; // For any additional properties
  }

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [showMediaManager, setShowMediaManager] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [activeTab, setActiveTab] = useState('content');
  const [notification, setNotification] = useState('');
  interface FormData {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    category: string;
    tags: string[];
    featured_image: string;
    status: string;
    reading_time: number;
    meta_title: string;
    meta_description: string;
    focus_keywords: string;
    scheduled_publish_at: string;
    comments_enabled: boolean;
  }

  const [formData, setFormData] = useState<FormData>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: '',
    tags: [],
    featured_image: '',
    status: 'draft',
    reading_time: 5,
    meta_title: '',
    meta_description: '',
    focus_keywords: '',
    scheduled_publish_at: '',
    comments_enabled: true
  });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadBlogPosts();
  }, []);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  const loadBlogPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('page_contents')
        .select('*')
        .eq('content_type', 'blog_post')
        .is('deleted_at', null)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        showNotification('Fehler beim Laden der Artikel');
        return;
      }

      setPosts(data || []);
    } catch (error) {
      console.error('Error loading blog posts:', error);
      showNotification('Fehler beim Laden der Artikel');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      showNotification('Titel und Inhalt sind erforderlich');
      return;
    }

    try {
      const slug = formData.slug || generateSlug(formData.title);
      const postData = {
        title: formData.title,
        slug,
        excerpt: formData.excerpt,
        content_value: formData.content,
        category: formData.category,
        tags: formData.tags,
        featured_image: formData.featured_image,
        status: formData.status,
        reading_time: formData.reading_time,
        meta_title: formData.meta_title,
        meta_description: formData.meta_description,
        focus_keywords: formData.focus_keywords,
        scheduled_publish_at: formData.scheduled_publish_at || null,
        comments_enabled: formData.comments_enabled,
        content_type: 'blog_post',
        page: 'blog',
        section: 'post',
        content_key: slug,
        is_active: true,
        updated_at: new Date().toISOString()
      };

      let result;
      if (editingPost) {
        result = await supabase
          .from('page_contents')
          .update(postData)
          .eq('id', editingPost.id);

        if (result.error) throw result.error;
        showNotification('Artikel erfolgreich aktualisiert!');
      } else {
        result = await supabase
          .from('page_contents')
          .insert({
            ...postData,
            created_at: new Date().toISOString(),
            sort_order: posts.length
          });

        if (result.error) throw result.error;
        showNotification('Artikel erfolgreich erstellt!');
      }

      resetForm();
      loadBlogPosts();
    } catch (error) {
      console.error('Error saving blog post:', error);
      showNotification('Fehler beim Speichern des Artikels');
    }
  };

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const resetForm = (): void => {
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      category: '',
      tags: [],
      featured_image: '',
      status: 'draft',
      reading_time: 5,
      meta_title: '',
      meta_description: '',
      focus_keywords: '',
      scheduled_publish_at: '',
      comments_enabled: true
    });
    setEditingPost(null);
    setShowEditor(false);
    setActiveTab('content');
  };

  const editPost = (post: BlogPost): void => {
    setFormData({
      title: post.title || '',
      slug: post.slug || '',
      excerpt: post.excerpt || '',
      content: post.content_value || '',
      category: post.category || '',
      tags: post.tags || [],
      featured_image: post.featured_image || '',
      status: post.status || 'draft',
      reading_time: post.reading_time || 5,
      meta_title: post.meta_title || '',
      meta_description: post.meta_description || '',
      focus_keywords: post.focus_keywords || '',
      scheduled_publish_at: post.scheduled_publish_at || '',
      comments_enabled: post.comments_enabled !== false
    });
    setEditingPost(post);
    setShowEditor(true);
  };

  const deletePost = async (postId: string): Promise<void> => {
    if (!confirm('Sind Sie sicher, dass Sie diesen Artikel löschen möchten?')) return;

    try {
      const { error } = await supabase
        .from('page_contents')
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', postId);

      if (error) throw error;
      loadBlogPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const duplicatePost = async (post: BlogPost): Promise<void> => {
    try {
      const duplicatedPost = {
        ...post,
        title: `${post.title} (Kopie)`,
        slug: `${post.slug}-kopie-${Date.now()}`,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sort_order: posts.length
      };

      // Remove the id property for the new post
      const { id, ...postWithoutId } = duplicatedPost;

      const { error } = await supabase
        .from('page_contents')
        .insert(postWithoutId);

      if (error) throw error;
      loadBlogPosts();
    } catch (error) {
      console.error('Error duplicating post:', error);
    }
  };

  const toggleStatus = async (post: BlogPost): Promise<void> => {
    try {
      const newStatus = post.status === 'published' ? 'draft' : 'published';
      const { error } = await supabase
        .from('page_contents')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', post.id);

      if (error) throw error;

      showNotification(
        newStatus === 'published' 
          ? 'Artikel wurde veröffentlicht!' 
          : 'Artikel wurde als Entwurf gespeichert!'
      );

      loadBlogPosts();
    } catch (error) {
      console.error('Error updating post status:', error);
      showNotification('Fehler beim Ändern des Status');
    }
  };

  const updateSortOrder = async (postId: string, newOrder: number): Promise<void> => {
    try {
      const { error } = await supabase
        .from('page_contents')
        .update({
          sort_order: newOrder,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId);

      if (error) throw error;
      loadBlogPosts();
    } catch (error) {
      console.error('Error updating sort order:', error);
    }
  };

  const addTag = (tag: string): void => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    }
  };

  const removeTag = (tagToRemove: string): void => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove)
    }));
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="w-12 h-12 flex items-center justify-center bg-green-100 rounded-full mx-auto mb-4 animate-pulse">
          <i className="ri-article-line text-2xl text-green-600"></i>
        </div>
        <p className="text-lg font-medium text-gray-700">Lade Blog-Artikel...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notification && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center">
            <i className="ri-check-line mr-2"></i>
            {notification}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 flex items-center justify-center bg-green-100 rounded-full mr-3">
              <i className="ri-article-line text-green-600"></i>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1A1A1A]">Blog Management</h2>
              <p className="text-gray-600">Erstellen und verwalten Sie Blog-Artikel</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowMediaManager(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-image-line mr-2"></i>
              Medien
            </button>
            <button
              onClick={() => setShowEditor(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-add-line mr-2"></i>
              Neuer Artikel
            </button>
          </div>
        </div>
      </div>

      {/* Media Manager Modal */}
      {showMediaManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#1A1A1A]">Medien-Bibliothek</h3>
              <button
                onClick={() => setShowMediaManager(false)}
                className="text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>
            <div className="max-h-[calc(90vh-100px)] overflow-y-auto">
              <MediaManager
                onSelect={(url) => {
                  setFormData((prev) => ({ ...prev, featured_image: url }));
                  setShowMediaManager(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Blog Posts List */}
      {!showEditor && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-[#1A1A1A]">Alle Artikel ({posts.length})</h3>
          </div>

          {posts.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
                <i className="ri-article-line text-2xl text-gray-400"></i>
              </div>
              <h4 className="text-lg font-medium text-gray-600 mb-2">Noch keine Artikel</h4>
              <p className="text-gray-500 mb-6">Erstellen Sie Ihren ersten Blog-Artikel.</p>
              <button
                onClick={() => setShowEditor(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
              >
                Ersten Artikel erstellen
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {posts.map((post, index) => (
                <div key={post.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-bold text-[#1A1A1A]">{post.title}</h4>
                        <span
                          className={`px-3 py-1 text-xs font-bold rounded-full ${
                            post.status === 'published'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {post.status === 'published' ? 'Veröffentlicht' : 'Entwurf'}
                        </span>
                        {post.category && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                            {post.category}
                          </span>
                        )}
                        {post.scheduled_publish_at && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                            <i className="ri-calendar-line mr-1"></i>
                            Geplant
                          </span>
                        )}
                      </div>

                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {post.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="text-gray-600 mb-3 leading-relaxed">
                        {post.excerpt || post.content_value?.replace(/<[^>]*>/g, '').substring(0, 150) + '...'}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>
                          <i className="ri-calendar-line mr-1"></i>
                          {formatDate(post.created_at)}
                        </span>
                        <span>
                          <i className="ri-time-line mr-1"></i>
                          {post.reading_time || 5} Min.
                        </span>
                        <span>
                          <i className="ri-eye-line mr-1"></i>
                          {post.views || 0} Aufrufe
                        </span>
                        {post.comments_enabled && (
                          <span>
                            <i className="ri-chat-1-line mr-1"></i>
                            Kommentare aktiv
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => updateSortOrder(post.id, Math.max(0, index - 1))}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 cursor-pointer"
                        >
                          <i className="ri-arrow-up-line"></i>
                        </button>
                        <button
                          onClick={() => updateSortOrder(post.id, index + 1)}
                          disabled={index === posts.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 cursor-pointer"
                        >
                          <i className="ri-arrow-down-line"></i>
                        </button>
                      </div>

                      <button
                        onClick={() => toggleStatus(post)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                          post.status === 'published'
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {post.status === 'published' ? 'Verstecken' : 'Veröffentlichen'}
                      </button>

                      <button
                        onClick={() => duplicatePost(post)}
                        className="px-3 py-2 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <i className="ri-file-copy-line mr-1"></i>
                        Duplizieren
                      </button>

                      <button
                        onClick={() => editPost(post)}
                        className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <i className="ri-edit-line mr-1"></i>
                        Bearbeiten
                      </button>

                      <button
                        onClick={() => deletePost(post.id)}
                        className="px-3 py-2 bg-red-100 text-red-800 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <i className="ri-delete-bin-line mr-1"></i>
                        Löschen
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Blog Editor */}
      {showEditor && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#1A1A1A]">
                {editingPost ? 'Artikel bearbeiten' : 'Neuer Artikel'}
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  <i className="ri-eye-line mr-1"></i>
                  {showPreview ? 'Editor' : 'Vorschau'}
                </button>
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mt-4 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('content')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === 'content'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <i className="ri-edit-line mr-2"></i>
                Inhalt
              </button>
              <button
                onClick={() => setActiveTab('seo')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === 'seo'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <i className="ri-seo-line mr-2"></i>
                SEO
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <i className="ri-settings-line mr-2"></i>
                Einstellungen
              </button>
            </div>
          </div>

          {showPreview ? (
            <div className="p-6">
              <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                  {formData.featured_image && (
                    <img
                      src={formData.featured_image}
                      alt={formData.title}
                      className="w-full h-64 object-cover rounded-lg mb-6"
                    />
                  )}
                  <h1 className="text-3xl font-bold text-[#1A1A1A] mb-4">{formData.title}</h1>
                  {formData.excerpt && (
                    <p className="text-xl text-gray-600 mb-6">{formData.excerpt}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-8">
                    <span>
                      <i className="ri-time-line mr-1"></i>
                      {formData.reading_time} Min. Lesezeit
                    </span>
                    {formData.category && (
                      <span>
                        <i className="ri-folder-line mr-1"></i>
                        {formData.category}
                      </span>
                    )}
                  </div>
                </div>
                <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: formData.content }} />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6">
              {activeTab === 'content' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Titel *</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={handleInputChange}
                        name="title"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Artikel-Titel eingeben..."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">URL-Slug</label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={handleInputChange}
                        name="slug"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="url-slug"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kurzbeschreibung</label>
                    <textarea
                      value={formData.excerpt}
                      onChange={handleInputChange}
                      name="excerpt"
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Kurze Zusammenfassung des Artikels..."
                      maxLength={200}
                    />
                    <p className="text-sm text-gray-500 mt-1">{formData.excerpt.length}/200 Zeichen</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Artikel-Inhalt *</label>
                    <RichTextEditor
                      content={formData.content}
                      onChange={(value: string) => setFormData({ ...formData, content: value })}
                      placeholder="Artikel-Inhalt hier eingeben..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Artikelbild</label>
                    <div className="flex gap-3">
                      <input
                        type="url"
                        value={formData.featured_image}
                        onChange={(e) => setFormData((prev) => ({ ...prev, featured_image: e.target.value }))}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="https://..."
                      />
                      <button
                        type="button"
                        onClick={() => setShowMediaManager(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <i className="ri-image-line mr-2"></i>
                        Auswählen
                      </button>
                    </div>
                    {formData.featured_image && (
                      <img
                        src={formData.featured_image}
                        alt="Vorschau"
                        className="mt-3 w-32 h-20 object-cover rounded-lg"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-2 text-purple-600 hover:text-purple-800 cursor-pointer"
                          >
                            <i className="ri-close-line"></i>
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Tag hinzufügen und Enter drücken..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const target = e.target as HTMLInputElement;
                          addTag(target.value.trim());
                          target.value = '';
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'seo' && (
                <SEOOptimizer
                  title={formData.title}
                  content={formData.content}
                  seoData={{
                    meta_title: formData.meta_title,
                    meta_description: formData.meta_description,
                    focus_keywords: formData.focus_keywords
                  }}
                  onChange={(seoData) => setFormData((prev) => ({ ...prev, ...seoData }))}
                />
              )}

              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Kategorie</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                        className="w-full px-4 py-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent cursor-pointer"
                      >
                        <option value="">Kategorie wählen</option>
                        <option value="Brennholz-Tipps">Brennholz-Tipps</option>
                        <option value="Kamin & Ofen">Kamin & Ofen</option>
                        <option value="Nachhaltigkeit">Nachhaltigkeit</option>
                        <option value="Saison-Tipps">Saison-Tipps</option>
                        <option value="Holzarten">Holzarten</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                        className="w-full px-4 py-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent cursor-pointer"
                      >
                        <option value="draft">Entwurf</option>
                        <option value="published">Veröffentlicht</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Lesezeit (Min.)</label>
                      <input
                        type="number"
                        value={formData.reading_time}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const value = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            reading_time: parseInt(value) || 5
                          }));
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        min="1"
                        max="60"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Geplante Veröffentlichung</label>
                    <input
                      type="datetime-local"
                      value={formData.scheduled_publish_at}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, scheduled_publish_at: e.target.value }))
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="comments_enabled"
                      checked={formData.comments_enabled}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, comments_enabled: e.target.checked }))
                      }
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <label htmlFor="comments_enabled" className="ml-2 text-sm font-medium text-gray-700">
                      Kommentare erlauben
                    </label>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-6 border-t mt-8">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
                >
                  {editingPost ? 'Artikel aktualisieren' : 'Artikel erstellen'}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
