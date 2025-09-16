
'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import RichTextEditor from '@/components/RichTextEditor';

// Using the centralized Supabase client from lib/supabase.ts

interface Ticket {
  id: string;
  customer_id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  created_at: string;
  updated_at: string;
  last_response_at?: string;
  admin_assigned?: string;
  customer_email?: string;
  customer_name?: string;
}

interface Message {
  id: string;
  ticket_id: string;
  sender_type: 'customer' | 'admin';
  sender_name: string;
  content: string;
  created_at: string;
}

/**
 * SupportTab – a simple ticket overview & chat component.
 *
 * The component is deliberately kept small and defensive:
 *  • All async calls are wrapped in try/catch.
 *  • State is typed explicitly.
 *  • Edge‑cases (missing tickets, empty message lists) are handled gracefully.
 */
export default function SupportTab() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  // Fixed: initialise with an empty object instead of the invalid `%` placeholder.
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [quickReplies, setQuickReplies] = useState<any[]>([]);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [quickReplySearch, setQuickReplySearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [attachments, setAttachments] = useState<{[key: string]: any[]}>({});
  const [uploading, setUploading] = useState(false);
  const [useRichText, setUseRichText] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const statuses = [
    { value: 'open', label: 'Offen', color: 'bg-yellow-100 text-yellow-800', count: 0 },
    { value: 'in_progress', label: 'In Bearbeitung', color: 'bg-blue-100 text-blue-800', count: 0 },
    { value: 'resolved', label: 'Gelöst', color: 'bg-green-100 text-green-800', count: 0 },
    { value: 'closed', label: 'Geschlossen', color: 'bg-gray-100 text-gray-800', count: 0 }
  ];

  const priorities = [
    { value: 'urgent', label: 'Dringend', color: 'bg-red-100 text-red-800', count: 0 },
    { value: 'high', label: 'Hoch', color: 'bg-orange-100 text-orange-800', count: 0 },
    { value: 'medium', label: 'Normal', color: 'bg-blue-100 text-blue-800', count: 0 },
    { value: 'low', label: 'Niedrig', color: 'bg-gray-100 text-gray-800', count: 0 }
  ];

  const categories = [
    { value: 'general', label: 'Allgemeine Anfrage' },
    { value: 'order', label: 'Bestellung' },
    { value: 'delivery', label: 'Lieferung' },
    { value: 'payment', label: 'Zahlung' },
    { value: 'product', label: 'Produkt' },
    { value: 'technical', label: 'Technisches Problem' },
    { value: 'complaint', label: 'Beschwerde' },
    { value: 'return', label: 'Rückgabe/Reklamation' }
  ];

  useEffect(() => {
    loadTickets();
    loadQuickReplies();
    setupRealtimeSubscriptions();

    // Cleanup: close all channels when the component unmounts.
    return () => {
      supabase.removeAllChannels();
    };
  }, []);

  /** Load quick replies for admin */
  const loadQuickReplies = async () => {
    try {
      const response = await fetch('/api/support/quick-replies?active=true');
      const data = await response.json();
      if (data.quickReplies) {
        setQuickReplies(data.quickReplies);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Schnellantworten:', error);
    }
  };

  /** Use quick reply */
  const useQuickReply = async (quickReply: any) => {
    setNewMessage(quickReply.content);
    setShowQuickReplies(false);
    setQuickReplySearch('');
    setSelectedCategory('all');
    
    // Usage count erhöhen
    try {
      await fetch(`/api/support/quick-replies?id=${quickReply.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usage_count: quickReply.usage_count + 1 })
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Usage Count:', error);
    }
  };

  /** Handle keyboard navigation for quick replies */
  const handleQuickReplyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowQuickReplies(false);
      setQuickReplySearch('');
      setSelectedCategory('all');
    }
  };

  /** Load attachments for a ticket */
  const loadAttachments = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/support/upload?ticketId=${ticketId}`);
      const data = await response.json();
      if (data.attachments) {
        setAttachments(prev => ({
          ...prev,
          [ticketId]: data.attachments
        }));
      }
    } catch (error) {
      console.error('Fehler beim Laden der Anhänge:', error);
    }
  };

  /** Handle file upload */
  const handleFileUpload = async (file: File) => {
    if (!selectedTicket) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('ticketId', selectedTicket);
      formData.append('uploaderType', 'admin');

      const response = await fetch('/api/support/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        await loadAttachments(selectedTicket);
        
        // System-Nachricht für Upload erstellen
        await supabase
          .from('ticket_messages')
          .insert([{
            ticket_id: selectedTicket,
            sender_type: 'admin',
            sender_name: 'System',
            content: `Datei hochgeladen: ${data.attachment.fileName}`
          }]);
        
        await loadMessages(selectedTicket);
      } else {
        console.error('Upload-Fehler:', data.error);
      }
    } catch (error) {
      console.error('Fehler beim Datei-Upload:', error);
    } finally {
      setUploading(false);
    }
  };

  /** Trigger file input */
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  /** Setup Realtime listeners for tickets & messages */
  const setupRealtimeSubscriptions = () => {
    const ticketsChannel = supabase
      .channel('tickets-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'support_tickets' },
        () => {
          loadTickets();
        }
      )
      .subscribe();

    const messagesChannel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ticket_messages' },
        (payload: any) => {
          // Only reload messages for the currently selected ticket on INSERT.
          if (payload.eventType === 'INSERT' && selectedTicket) {
            loadMessages(selectedTicket);
          }
        }
      )
      .subscribe();

    // Return cleanup function (optional, supabase already removes on `removeAllChannels`).
    return () => {
      ticketsChannel.unsubscribe();
      messagesChannel.unsubscribe();
    };
  };

  /** Load all tickets with related customer information */
  const loadTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          customers!inner(email, first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const ticketsWithCustomerInfo: Ticket[] = (data?.map((ticket: any) => ({
        ...ticket,
        customer_email: ticket.customers?.email,
        customer_name: `${ticket.customers?.first_name ?? ''} ${ticket.customers?.last_name ?? ''}`.trim()
      })) as Ticket[]) ?? [];

      setTickets(ticketsWithCustomerInfo);
    } catch (error) {
      console.error('Fehler beim Laden der Tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  /** Auto-scroll to bottom of messages */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /** Load messages for a given ticket */
  const loadMessages = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(prev => ({
        ...prev,
        [ticketId]: (data as Message[]) ?? []
      }));
      
      // Auto-scroll to bottom after loading messages
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Fehler beim Laden der Nachrichten:', error);
    }
  };

  /** Update ticket status and related metadata */
  const updateTicketStatus = async (ticketId: string, status: Ticket['status']) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          status,
          updated_at: new Date().toISOString(),
          last_response_at: new Date().toISOString()
          // admin_assigned wird nicht gesetzt, da wir keine echte Admin-UUID haben
        })
        .eq('id', ticketId);

      if (error) throw error;

      // Erstelle eine System-Nachricht für Status-Änderungen
      await supabase
        .from('ticket_messages')
        .insert([{
          ticket_id: ticketId,
          sender_type: 'admin',
          sender_name: 'System',
          content: `Ticket-Status wurde auf "${getStatusLabel(status)}" geändert.`
        }]);

      await loadTickets();
      
      // Lade Nachrichten neu wenn das Ticket ausgewählt ist
      if (selectedTicket === ticketId) {
        await loadMessages(ticketId);
      }
      
      // Email-Benachrichtigung senden
      try {
        await fetch('/api/support/email-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticketId,
            newStatus: status,
            type: 'status_change'
          })
        });
      } catch (emailError) {
        console.error('Fehler beim Senden der Email-Benachrichtigung:', emailError);
        // Email-Fehler nicht blockierend
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Status:', error);
    }
  };

  /** Send a new admin message */
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !newMessage.trim()) return;

    setSending(true);
    try {
      const { error: insertError } = await supabase
        .from('ticket_messages')
        .insert([{
          ticket_id: selectedTicket,
          sender_type: 'admin',
          sender_name: 'Support Team',
          content: newMessage
        }]);

      if (insertError) throw insertError;

      const { error: ticketError } = await supabase
        .from('support_tickets')
        .update({
          status: 'in_progress',
          updated_at: new Date().toISOString(),
          last_response_at: new Date().toISOString()
          // admin_assigned wird nicht gesetzt, da wir keine echte Admin-UUID haben
        })
        .eq('id', selectedTicket);

      if (ticketError) throw ticketError;

      // Refresh data so UI stays in sync.
      await Promise.all([loadMessages(selectedTicket), loadTickets()]);
      setNewMessage('');
      
      // Auto-scroll to bottom after sending message
      setTimeout(scrollToBottom, 200);
    } catch (error) {
      console.error('Fehler beim Senden der Nachricht:', error);
    } finally {
      setSending(false);
    }
  };

  /** When a ticket is selected, ensure its messages are loaded */
  const selectTicket = (ticketId: string) => {
    setSelectedTicket(ticketId);
    if (!messages[ticketId]) {
      loadMessages(ticketId);
    }
    if (!attachments[ticketId]) {
      loadAttachments(ticketId);
    }
  };

  /** Apply status & priority filters */
  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    return matchesStatus && matchesPriority;
  });

  /** Pre‑computed statistics for the dashboard */
  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    urgent: tickets.filter(t => t.priority === 'urgent').length,
    response_needed: tickets.filter(t => ['open', 'in_progress'].includes(t.status)).length
  };

  /** Render a loading skeleton while tickets are being fetched */
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="lg:col-span-2 h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  /** Helper: format ISO strings to a German locale */
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getCategoryLabel(value: string) {
    return categories.find(cat => cat.value === value)?.label || value;
  }

  function getStatusInfo(value: string) {
    return statuses.find(s => s.value === value) ?? statuses[0];
  }

  function getStatusLabel(value: string) {
    return getStatusInfo(value).label;
  }

  function getPriorityInfo(value: string) {
    return priorities.find(p => p.value === value) ?? priorities[2];
  }

  /* -------------------------------------------------------------------------- */
  /*                                 UI Render                                 */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="p-6">
      {/* Header & KPI cards */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Support-Tickets</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {/* Gesamt */}
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="ri-ticket-2-line text-blue-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Gesamt</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          {/* Offen */}
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <i className="ri-time-line text-yellow-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Offen</p>
                <p className="text-2xl font-bold text-gray-900">{stats.open}</p>
              </div>
            </div>
          </div>

          {/* In Bearbeitung */}
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="ri-tools-line text-blue-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Bearbeitung</p>
                <p className="text-2xl font-bold text-gray-900">{stats.in_progress}</p>
              </div>
            </div>
          </div>

          {/* Dringend */}
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <i className="ri-alarm-warning-line text-red-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Dringend</p>
                <p className="text-2xl font-bold text-gray-900">{stats.urgent}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter selectors */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-8"
            >
              <option value="all">Alle</option>
              {statuses.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Priorität:</label>
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-8"
            >
              <option value="all">Alle</option>
              {priorities.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main layout: ticket list + detail view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">
            Tickets ({filteredTickets.length})
          </h3>

          {filteredTickets.length === 0 ? (
            <div className="text-center py-8">
              <i className="ri-inbox-line text-4xl text-gray-300 mb-2"></i>
              <p className="text-gray-500">Keine Tickets gefunden</p>
            </div>
          ) : (
            filteredTickets.map(ticket => {
              const statusInfo = getStatusInfo(ticket.status);
              const priorityInfo = getPriorityInfo(ticket.priority);

              return (
                <div
                  key={ticket.id}
                  onClick={() => selectTicket(ticket.id)}
                  className={`bg-white border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
                    selectedTicket === ticket.id ? 'border-green-500 shadow-md' : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityInfo.color}`}>
                      {priorityInfo.label}
                    </span>
                  </div>

                  <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {ticket.subject}
                  </h4>

                  <div className="space-y-1 text-sm text-gray-600 mb-3">
                    <p><strong>Kunde:</strong> {ticket.customer_name || 'Unbekannt'}</p>
                    <p><strong>E-Mail:</strong> {ticket.customer_email}</p>
                    <p><strong>Kategorie:</strong> {getCategoryLabel(ticket.category)}</p>
                  </div>

                  <div className="text-xs text-gray-500">
                    Erstellt: {formatDate(ticket.created_at)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Ticket Detail / Chat */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <div className="bg-white border rounded-lg h-96 flex flex-col">
              {(() => {
                const ticket = tickets.find(t => t.id === selectedTicket);
                if (!ticket) return null;

                const statusInfo = getStatusInfo(ticket.status);
                const priorityInfo = getPriorityInfo(ticket.priority);

                return (
                  <>
                    {/* Header with ticket meta */}
                    <div className="p-4 border-b">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">{ticket.subject}</h3>
                          <p className="text-sm text-gray-600">
                            {ticket.customer_name} ({ticket.customer_email})
                          </p>
                          <p className="text-sm text-gray-600">
                            {getCategoryLabel(ticket.category)}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityInfo.color}`}>
                            {priorityInfo.label}
                          </span>
                        </div>
                      </div>

                      {/* Quick status change buttons */}
                      <div className="flex space-x-2">
                        {statuses.map(s => (
                          <button
                            key={s.value}
                            onClick={() => updateTicketStatus(ticket.id, s.value as Ticket['status'])}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                              ticket.status === s.value
                                ? s.color
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Message list */}
                    <div 
                      ref={messagesEndRef}
                      className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96 min-h-96"
                      style={{ scrollBehavior: 'smooth' }}
                    >
                      {(messages[selectedTicket] ?? []).length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          <div className="text-center">
                            <i className="ri-chat-3-line text-4xl mb-2"></i>
                            <p>Noch keine Nachrichten</p>
                          </div>
                        </div>
                      ) : (
                        (messages[selectedTicket] ?? []).map(message => (
                          <div
                            key={message.id}
                            className={`flex ${message.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-sm ${
                                message.sender_type === 'admin'
                                  ? 'bg-green-600 text-white'
                                  : 'bg-gray-100 text-gray-900 border'
                              }`}
                            >
                              <p className="text-sm mb-1 whitespace-pre-wrap">{message.content}</p>
                              
                              {/* Attachments */}
                              {attachments[selectedTicket]?.filter(att => att.message_id === message.id).map(attachment => (
                                <div key={attachment.id} className="mt-2 p-2 bg-black bg-opacity-10 rounded">
                                  {attachment.file_type.startsWith('image/') ? (
                                    <div className="space-y-2">
                                      <img 
                                        src={attachment.file_url} 
                                        alt={attachment.file_name}
                                        className="max-w-full h-auto rounded cursor-pointer"
                                        style={{ maxHeight: '200px' }}
                                        onClick={() => window.open(`/api/support/download?id=${attachment.id}`, '_blank')}
                                      />
                                      <div className="flex items-center justify-between text-xs">
                                        <span className={message.sender_type === 'admin' ? 'text-green-100' : 'text-gray-600'}>
                                          {attachment.file_name}
                                        </span>
                                        <button
                                          onClick={() => window.open(`/api/support/download?id=${attachment.id}`, '_blank')}
                                          className={`px-2 py-1 rounded text-xs ${
                                            message.sender_type === 'admin' 
                                              ? 'bg-green-700 text-white hover:bg-green-800' 
                                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                          }`}
                                        >
                                          <i className="ri-download-line mr-1"></i>
                                          Download
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <i className={`ri-file-line text-lg ${
                                          message.sender_type === 'admin' ? 'text-green-100' : 'text-gray-600'
                                        }`}></i>
                                        <div>
                                          <div className={`text-xs font-medium ${
                                            message.sender_type === 'admin' ? 'text-green-100' : 'text-gray-700'
                                          }`}>
                                            {attachment.file_name}
                                          </div>
                                          <div className={`text-xs ${
                                            message.sender_type === 'admin' ? 'text-green-200' : 'text-gray-500'
                                          }`}>
                                            {(attachment.file_size / 1024).toFixed(1)} KB
                                          </div>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => window.open(`/api/support/download?id=${attachment.id}`, '_blank')}
                                        className={`px-2 py-1 rounded text-xs ${
                                          message.sender_type === 'admin' 
                                            ? 'bg-green-700 text-white hover:bg-green-800' 
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                      >
                                        <i className="ri-download-line mr-1"></i>
                                        Download
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                              
                              <div
                                className={`text-xs mt-2 ${
                                  message.sender_type === 'admin' ? 'text-green-100' : 'text-gray-500'
                                }`}
                              >
                                {message.sender_name} • {formatDate(message.created_at)}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Send new message */}
                    <form onSubmit={sendMessage} className="p-4 border-t">
                      {/* Quick Replies Modal */}
                      {showQuickReplies && quickReplies.length > 0 && (
                        <div 
                          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                          onClick={(e) => {
                            if (e.target === e.currentTarget) {
                              setShowQuickReplies(false);
                              setQuickReplySearch('');
                              setSelectedCategory('all');
                            }
                          }}
                        >
                          <div 
                             className="bg-white rounded-lg border shadow-lg max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col"
                             onKeyDown={handleQuickReplyKeyDown}
                             tabIndex={-1}
                           >
                          {/* Header */}
                          <div className="flex justify-between items-center p-4 border-b">
                            <div className="flex items-center space-x-2">
                              <i className="ri-chat-quote-line text-green-600"></i>
                              <h4 className="text-sm font-semibold text-gray-900">Schnellantworten</h4>
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                {quickReplies.filter(reply => {
                                  const matchesSearch = reply.title.toLowerCase().includes(quickReplySearch.toLowerCase()) ||
                                                       reply.content.toLowerCase().includes(quickReplySearch.toLowerCase());
                                  const matchesCategory = selectedCategory === 'all' || reply.category === selectedCategory;
                                  return matchesSearch && matchesCategory;
                                }).length}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setShowQuickReplies(false);
                                setQuickReplySearch('');
                                setSelectedCategory('all');
                              }}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <i className="ri-close-line text-lg"></i>
                            </button>
                          </div>
                          
                          {/* Search and Filter */}
                          <div className="p-4 border-b bg-gray-50">
                            <div className="flex flex-col sm:flex-row gap-3">
                              <div className="flex-1 relative">
                                <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                <input
                                  type="text"
                                  placeholder="Schnellantworten durchsuchen..."
                                  value={quickReplySearch}
                                  onChange={(e) => setQuickReplySearch(e.target.value)}
                                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                />
                              </div>
                              <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                              >
                                <option value="all">Alle Kategorien</option>
                                <option value="general">Allgemein</option>
                                <option value="order">Bestellung</option>
                                <option value="delivery">Lieferung</option>
                                <option value="payment">Zahlung</option>
                                <option value="product">Produkt</option>
                                <option value="technical">Technisch</option>
                                <option value="complaint">Beschwerde</option>
                                <option value="return">Rückgabe</option>
                              </select>
                            </div>
                          </div>
                          
                          {/* Quick Replies List */}
                           <div className="flex-1 overflow-y-auto">
                            {(() => {
                              const filteredReplies = quickReplies.filter(reply => {
                                const matchesSearch = reply.title.toLowerCase().includes(quickReplySearch.toLowerCase()) ||
                                                     reply.content.toLowerCase().includes(quickReplySearch.toLowerCase());
                                const matchesCategory = selectedCategory === 'all' || reply.category === selectedCategory;
                                return matchesSearch && matchesCategory;
                              });
                              
                              if (filteredReplies.length === 0) {
                                return (
                                  <div className="p-8 text-center text-gray-500">
                                    <i className="ri-search-line text-3xl mb-2"></i>
                                    <p className="text-sm">Keine Schnellantworten gefunden</p>
                                    <p className="text-xs mt-1">Versuchen Sie andere Suchbegriffe oder Kategorien</p>
                                  </div>
                                );
                              }
                              
                              return (
                                <div className="divide-y divide-gray-100">
                                  {filteredReplies.map(reply => (
                                    <button
                                      key={reply.id}
                                      type="button"
                                      onClick={() => {
                                        useQuickReply(reply);
                                        setQuickReplySearch('');
                                        setSelectedCategory('all');
                                      }}
                                      className="w-full text-left p-4 hover:bg-gray-50 transition-colors group"
                                    >
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center space-x-2 mb-1">
                                            <h5 className="font-medium text-sm text-gray-900 group-hover:text-green-700 transition-colors">
                                              {reply.title}
                                            </h5>
                                            {reply.category && (
                                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                {reply.category}
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                            {reply.content}
                                          </p>
                                          {reply.usage_count > 0 && (
                                            <div className="flex items-center mt-2 text-xs text-gray-500">
                                              <i className="ri-bar-chart-line mr-1"></i>
                                              <span>{reply.usage_count} mal verwendet</span>
                                            </div>
                                          )}
                                        </div>
                                        <div className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <i className="ri-arrow-right-line text-green-600"></i>
                                        </div>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                          
                          {/* Footer */}
                          <div className="p-3 border-t bg-gray-50">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>Tipp: Verwenden Sie die Suche für schnelleren Zugriff</span>
                              <span>Esc zum Schließen</span>
                            </div>
                          </div>
                         </div>
                       </div>
                       )}
                      
                      <div className="space-y-3">
                         {/* Editor Toggle und Tools */}
                         <div className="flex items-center justify-between">
                           <div className="flex items-center space-x-2">
                             <button
                               type="button"
                               onClick={() => setUseRichText(!useRichText)}
                               className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                 useRichText 
                                   ? 'bg-green-100 text-green-800' 
                                   : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                               }`}
                               title="Rich Text Editor"
                             >
                               <i className="ri-text mr-1"></i>
                               {useRichText ? 'Rich Text' : 'Einfach'}
                             </button>
                           </div>
                           
                           <div className="flex items-center space-x-2">
                             <button
                               type="button"
                               onClick={triggerFileUpload}
                               disabled={uploading}
                               className="px-3 py-1 rounded text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
                               title="Datei anhängen"
                             >
                               <i className={uploading ? 'ri-loader-4-line animate-spin' : 'ri-attachment-line'}></i>
                               {uploading ? 'Uploading...' : 'Anhang'}
                             </button>
                             
                             <button
                               type="button"
                               onClick={() => setShowQuickReplies(!showQuickReplies)}
                               className="px-3 py-1 rounded text-sm text-gray-600 hover:text-gray-800"
                               title="Schnellantworten"
                             >
                               <i className="ri-chat-quote-line mr-1"></i>
                               Vorlagen
                             </button>
                           </div>
                         </div>
                         
                         {/* Message Input */}
                         <div className="flex space-x-3">
                           <div className="flex-1">
                             {useRichText ? (
                               <RichTextEditor
                                 content={newMessage}
                                 onChange={setNewMessage}
                                 placeholder="Formatierte Antwort eingeben..."
                               />
                             ) : (
                               <textarea
                                 value={newMessage}
                                 onChange={e => setNewMessage(e.target.value)}
                                 placeholder="Antwort eingeben..."
                                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                                 rows={3}
                                 maxLength={500}
                               />
                             )}
                           </div>
                           
                           <button
                             type="submit"
                             disabled={sending || !newMessage.trim()}
                             className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer self-end"
                           >
                             {sending ? 'Senden...' : 'Senden'}
                           </button>
                         </div>
                       </div>
                       
                       {/* Hidden file input */}
                       <input
                         ref={fileInputRef}
                         type="file"
                         accept="image/*,.pdf,.doc,.docx,.txt"
                         onChange={(e) => {
                           const file = e.target.files?.[0];
                           if (file) {
                             handleFileUpload(file);
                             e.target.value = ''; // Reset input
                           }
                         }}
                         className="hidden"
                       />
                    </form>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="bg-white border rounded-lg h-96 flex items-center justify-center">
              <div className="text-center">
                <i className="ri-chat-3-line text-6xl text-gray-300 mb-4"></i>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Kein Ticket ausgewählt</h3>
                <p className="text-gray-600">Wählen Sie ein Ticket aus der Liste aus.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
