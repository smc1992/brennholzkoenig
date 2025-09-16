'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Comment {
  id: string;
  blog_post_id: string;
  author_name: string;
  author_email: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  parent_id?: string;
  replies?: Comment[];
}

interface BlogCommentsProps {
  blogPostId: string;
  blogPostTitle: string;
}

export default function BlogComments({ blogPostId, blogPostTitle }: BlogCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    author_name: '',
    author_email: '',
    content: ''
  });

  useEffect(() => {
    loadComments();
  }, [blogPostId]);

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_comments')
        .select('*')
        .eq('blog_post_id', blogPostId)
        .eq('status', 'approved')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Organisiere Kommentare in Hierarchie (Parent-Child)
      const organizedComments = organizeComments(data || []);
      setComments(organizedComments);
    } catch (error) {
      console.error('Fehler beim Laden der Kommentare:', error);
    } finally {
      setLoading(false);
    }
  };

  const organizeComments = (flatComments: Comment[]): Comment[] => {
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // Erstelle Map aller Kommentare
    flatComments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Organisiere in Hierarchie
    flatComments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!;
      
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies!.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    return rootComments;
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const commentData = {
        blog_post_id: blogPostId,
        author_name: formData.author_name.trim(),
        author_email: formData.author_email.trim(),
        content: formData.content.trim(),
        status: 'pending',
        parent_id: replyingTo || null,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('blog_comments')
        .insert([commentData]);

      if (error) throw error;

      // Benachrichtigung an Admin senden
      await sendAdminNotification(commentData);

      // Formular zurücksetzen
      setFormData({ author_name: '', author_email: '', content: '' });
      setShowForm(false);
      setReplyingTo(null);

      alert('Vielen Dank für Ihren Kommentar! Er wird nach Prüfung veröffentlicht.');
    } catch (error) {
      console.error('Fehler beim Senden des Kommentars:', error);
      alert('Fehler beim Senden des Kommentars. Bitte versuchen Sie es erneut.');
    } finally {
      setSubmitting(false);
    }
  };

  const sendAdminNotification = async (commentData: any) => {
    try {
      await fetch('/api/notifications/new-comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment: commentData,
          blogPostTitle,
          type: 'new_comment'
        }),
      });
    } catch (error) {
      console.error('Fehler beim Senden der Admin-Benachrichtigung:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderComment = (comment: Comment, depth: number = 0) => (
    <div key={comment.id} className={`${depth > 0 ? 'ml-8 mt-4' : 'mt-6'} border-l-2 border-gray-200 pl-4`}>
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {comment.author_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{comment.author_name}</h4>
              <p className="text-sm text-gray-500">{formatDate(comment.created_at)}</p>
            </div>
          </div>
          
          {depth < 2 && (
            <button
              onClick={() => {
                setReplyingTo(comment.id);
                setShowForm(true);
              }}
              className="text-sm text-orange-600 hover:text-orange-800 font-medium"
            >
              Antworten
            </button>
          )}
        </div>
        
        <div className="prose prose-sm max-w-none">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
        </div>
      </div>
      
      {/* Antworten */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4">
          {comment.replies.map(reply => renderComment(reply, depth + 1))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="mt-12 p-8 text-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Kommentare werden geladen...</p>
      </div>
    );
  }

  return (
    <div className="mt-12 border-t border-gray-200 pt-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">
          Kommentare ({comments.length})
        </h3>
        
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Kommentar schreiben
          </button>
        )}
      </div>

      {/* Kommentar-Formular */}
      {showForm && (
        <div className="mb-8 bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">
              {replyingTo ? 'Antwort schreiben' : 'Neuer Kommentar'}
            </h4>
            <button
              onClick={() => {
                setShowForm(false);
                setReplyingTo(null);
                setFormData({ author_name: '', author_email: '', content: '' });
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
          
          <form onSubmit={submitComment} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.author_name}
                  onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ihr Name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-Mail *
                </label>
                <input
                  type="email"
                  required
                  value={formData.author_email}
                  onChange={(e) => setFormData({ ...formData, author_email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="ihre@email.de"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Wird nicht veröffentlicht
                </p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kommentar *
              </label>
              <textarea
                required
                rows={4}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Schreiben Sie Ihren Kommentar..."
              />
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Ihr Kommentar wird vor Veröffentlichung geprüft.
              </p>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setReplyingTo(null);
                    setFormData({ author_name: '', author_email: '', content: '' });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Abbrechen
                </button>
                
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  {submitting ? 'Wird gesendet...' : 'Kommentar senden'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Kommentare anzeigen */}
      {comments.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-chat-1-line text-2xl text-gray-400"></i>
          </div>
          <h4 className="text-lg font-medium text-gray-600 mb-2">Noch keine Kommentare</h4>
          <p className="text-gray-500">Seien Sie der Erste, der einen Kommentar schreibt!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map(comment => renderComment(comment))}
        </div>
      )}
    </div>
  );
}