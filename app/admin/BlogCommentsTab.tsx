'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface BlogComment {
  id: string;
  blog_post_id: string;
  author_name: string;
  author_email: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  parent_id?: string;
  blog_post_title?: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
}

export default function BlogCommentsTab() {
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComment, setSelectedComment] = useState<BlogComment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    loadComments();
    loadBlogPosts();
  }, [filter]);

  const loadComments = async () => {
    try {
      let query = supabase
        .from('blog_comments')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Lade Blog-Post-Titel für jeden Kommentar
      const commentsWithTitles = await Promise.all(
        (data || []).map(async (comment: any) => {
          const { data: postData } = await supabase
            .from('page_contents')
            .select('title')
            .eq('id', comment.blog_post_id)
            .eq('content_type', 'blog_post')
            .single();

          return {
            ...comment,
            blog_post_title: postData?.title || 'Unbekannter Artikel'
          };
        })
      );

      setComments(commentsWithTitles);
    } catch (error) {
      console.error('Fehler beim Laden der Kommentare:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBlogPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('page_contents')
        .select('id, title, slug')
        .eq('content_type', 'blog_post')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBlogPosts(data || []);
    } catch (error) {
      console.error('Fehler beim Laden der Blog-Posts:', error);
    }
  };

  const updateCommentStatus = async (commentId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('blog_comments')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId);

      if (error) throw error;

      // Aktualisiere lokalen State
      setComments(comments.map(comment => 
        comment.id === commentId 
          ? { ...comment, status: newStatus }
          : comment
      ));

      showNotification(`Kommentar ${newStatus === 'approved' ? 'genehmigt' : 'abgelehnt'}!`);
      setShowDetailModal(false);
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Kommentar-Status:', error);
      showNotification('Fehler beim Aktualisieren des Status');
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diesen Kommentar löschen möchten?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('blog_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      setComments(comments.filter(comment => comment.id !== commentId));
      showNotification('Kommentar gelöscht!');
      setShowDetailModal(false);
    } catch (error) {
      console.error('Fehler beim Löschen des Kommentars:', error);
      showNotification('Fehler beim Löschen des Kommentars');
    }
  };

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  const filteredComments = comments.filter(comment => {
    const matchesSearch = 
      comment.author_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.author_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (comment.blog_post_title && comment.blog_post_title.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'ri-time-line';
      case 'approved': return 'ri-check-line';
      case 'rejected': return 'ri-close-line';
      default: return 'ri-question-line';
    }
  };

  const pendingCount = comments.filter(c => c.status === 'pending').length;

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="w-12 h-12 flex items-center justify-center bg-orange-100 rounded-full mx-auto mb-4 animate-pulse">
          <i className="ri-chat-1-line text-2xl text-orange-600"></i>
        </div>
        <p className="text-lg font-medium text-gray-700">Lade Kommentare...</p>
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
            <div className="w-8 h-8 flex items-center justify-center bg-orange-100 rounded-full mr-3">
              <i className="ri-chat-1-line text-orange-600"></i>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1A1A1A]">Kommentar-Moderation</h2>
              <p className="text-gray-600">
                Verwalten Sie Blog-Kommentare
                {pendingCount > 0 && (
                  <span className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm font-medium">
                    {pendingCount} wartend
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter und Suche */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex gap-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === status
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status === 'all' && 'Alle'}
                {status === 'pending' && 'Wartend'}
                {status === 'approved' && 'Genehmigt'}
                {status === 'rejected' && 'Abgelehnt'}
                {status === filter && (
                  <span className="ml-2 bg-white bg-opacity-50 px-2 py-1 rounded text-sm">
                    {status === 'all' ? comments.length : comments.filter(c => c.status === status).length}
                  </span>
                )}
              </button>
            ))}
          </div>
          
          <div className="flex-1 max-w-md">
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Kommentare durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Kommentare Liste */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {filteredComments.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
              <i className="ri-chat-1-line text-2xl text-gray-400"></i>
            </div>
            <h4 className="text-lg font-medium text-gray-600 mb-2">Keine Kommentare gefunden</h4>
            <p className="text-gray-500">
              {filter === 'pending' ? 'Keine wartenden Kommentare vorhanden.' : 'Keine Kommentare in dieser Kategorie.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredComments.map((comment) => (
              <div key={comment.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                        {comment.author_name.charAt(0).toUpperCase()}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">{comment.author_name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(comment.status)}`}>
                            <i className={`${getStatusIcon(comment.status)} mr-1`}></i>
                            {comment.status === 'pending' && 'Wartend'}
                            {comment.status === 'approved' && 'Genehmigt'}
                            {comment.status === 'rejected' && 'Abgelehnt'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>
                            <i className="ri-mail-line mr-1"></i>
                            {comment.author_email}
                          </span>
                          <span>
                            <i className="ri-calendar-line mr-1"></i>
                            {formatDate(comment.created_at)}
                          </span>
                          <span>
                            <i className="ri-article-line mr-1"></i>
                            {comment.blog_post_title}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-13">
                      <p className="text-gray-700 leading-relaxed line-clamp-3">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedComment(comment);
                        setShowDetailModal(true);
                      }}
                      className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                    >
                      <i className="ri-eye-line mr-1"></i>
                      Details
                    </button>
                    
                    {comment.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateCommentStatus(comment.id, 'approved')}
                          className="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                        >
                          <i className="ri-check-line mr-1"></i>
                          Genehmigen
                        </button>
                        
                        <button
                          onClick={() => updateCommentStatus(comment.id, 'rejected')}
                          className="px-3 py-2 bg-red-100 text-red-800 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                        >
                          <i className="ri-close-line mr-1"></i>
                          Ablehnen
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedComment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Kommentar-Details</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {selectedComment.author_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{selectedComment.author_name}</h4>
                    <p className="text-sm text-gray-500">{selectedComment.author_email}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedComment.status)}`}>
                    <i className={`${getStatusIcon(selectedComment.status)} mr-1`}></i>
                    {selectedComment.status === 'pending' && 'Wartend'}
                    {selectedComment.status === 'approved' && 'Genehmigt'}
                    {selectedComment.status === 'rejected' && 'Abgelehnt'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Erstellt:</span>
                    <p className="text-gray-600">{formatDate(selectedComment.created_at)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Blog-Artikel:</span>
                    <p className="text-gray-600">{selectedComment.blog_post_title}</p>
                  </div>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Kommentar:</span>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {selectedComment.content}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6 pt-6 border-t">
                {selectedComment.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateCommentStatus(selectedComment.id, 'approved')}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      <i className="ri-check-line mr-2"></i>
                      Genehmigen
                    </button>
                    
                    <button
                      onClick={() => updateCommentStatus(selectedComment.id, 'rejected')}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      <i className="ri-close-line mr-2"></i>
                      Ablehnen
                    </button>
                  </>
                )}
                
                <button
                  onClick={() => deleteComment(selectedComment.id)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  <i className="ri-delete-bin-line mr-2"></i>
                  Löschen
                </button>
                
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}