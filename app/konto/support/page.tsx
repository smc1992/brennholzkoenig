
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase Client korrekt initialisieren
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL oder Key fehlt');
}

const supabase = createClient(supabaseUrl, supabaseKey);

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
  ticket_number?: string;
}

interface Message {
  id: string;
  ticket_id: string;
  sender_type: 'customer' | 'admin';
  sender_name: string;
  content: string;
  created_at: string;
  attachments?: any[];
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [messages, setMessages] = useState<{ [key: string]: Message[] }>({});
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    category: 'general',
    priority: 'medium' as const
  });

  const [newMessage, setNewMessage] = useState('');

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

  const priorities = [
    { value: 'low', label: 'Niedrig', color: 'bg-gray-100 text-gray-800' },
    { value: 'medium', label: 'Normal', color: 'bg-blue-100 text-blue-800' },
    { value: 'high', label: 'Hoch', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Dringend', color: 'bg-red-100 text-red-800' }
  ];

  const statuses = [
    { value: 'open', label: 'Offen', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'in_progress', label: 'In Bearbeitung', color: 'bg-blue-100 text-blue-800' },
    { value: 'resolved', label: 'Gelöst', color: 'bg-green-100 text-green-800' },
    { value: 'closed', label: 'Geschlossen', color: 'bg-gray-100 text-gray-800' }
  ];

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        console.error('Auth Error:', error);
        setError('Authentifizierungsfehler. Bitte melden Sie sich erneut an.');
        setLoading(false);
        return;
      }

      if (!user) {
        setError('Sie müssen angemeldet sein, um Support-Anfragen zu erstellen.');
        setLoading(false);
        return;
      }

      setUser(user);
      await loadTickets(user.id);
      setupRealtimeSubscriptions();
    } catch (error) {
      console.error('Error checking auth:', error);
      setError('Es gab ein Problem beim Laden der Seite.');
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    if (!user) return;

    const ticketsChannel = supabase
      .channel('customer-tickets')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'support_tickets' }, 
        () => {
          if (user) loadTickets(user.id);
        }
      )
      .subscribe();

    const messagesChannel = supabase
      .channel('customer-messages')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'ticket_messages' }, 
        (payload) => {
          if (payload.eventType === 'INSERT' && selectedTicket) {
            loadMessages(selectedTicket);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeAllChannels();
    };
  };

  const loadTickets = async (userId: string) => {
    try {
      setError('');
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('customer_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading tickets:', error);
        setError('Fehler beim Laden der Support-Tickets.');
        return;
      }

      setTickets(data || []);
    } catch (error) {
      console.error('Fehler beim Laden der Tickets:', error);
      setError('Es gab ein Problem beim Laden der Support-Tickets.');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      setMessages(prev => ({ ...prev, [ticketId]: data || [] }));
    } catch (error) {
      console.error('Fehler beim Laden der Nachrichten:', error);
    }
  };

  const createTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('Sie müssen angemeldet sein, um eine Support-Anfrage zu erstellen.');
      return;
    }

    if (!newTicket.subject.trim() || !newTicket.description.trim()) {
      setError('Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    setSending(true);
    setError('');
    setSuccess('');

    try {
      // Verbindungstest
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        console.error('Auth session error:', authError);
        setError('Authentifizierungsproblem. Bitte melden Sie sich erneut an.');
        return;
      }

      if (!session) {
        setError('Keine aktive Sitzung. Bitte melden Sie sich erneut an.');
        return;
      }

      // Datenbankverbindung testen
      const { error: connectionError } = await supabase
        .from('support_tickets')
        .select('id')
        .limit(1);

      if (connectionError) {
        console.error('Database connection error:', connectionError);
        setError(`Datenbankverbindung fehlgeschlagen: ${connectionError.message}`);
        return;
      }

      // Kurze Ticket-Nummer generieren (max 20 Zeichen)
      const timestamp = Date.now().toString().slice(-8); // Letzte 8 Ziffern
      const randomCode = Math.random().toString(36).substr(2, 4).toUpperCase(); // 4 Zeichen
      const ticketNumber = `TK${timestamp}${randomCode}`; // TK + 8 + 4 = 14 Zeichen

      const ticketData = {
        customer_id: user.id,
        ticket_number: ticketNumber,
        subject: newTicket.subject.trim(),
        description: newTicket.description.trim(),
        category: newTicket.category,
        priority: newTicket.priority,
        status: 'open' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Creating ticket:', ticketData);

      const { data: insertedTicket, error: insertError } = await supabase
        .from('support_tickets')
        .insert([ticketData])
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        
        switch (insertError.code) {
          case '23503':
            setError('Benutzerkonto nicht gefunden. Bitte melden Sie sich erneut an.');
            break;
          case '42501':
            setError('Keine Berechtigung zum Erstellen von Support-Anfragen.');
            break;
          case 'PGRST301':
            setError('Datenbankzugriff verweigert. Bitte wenden Sie sich an den Support.');
            break;
          default:
            setError(`Datenbankfehler: ${insertError.message}`);
        }
        return;
      }

      if (!insertedTicket) {
        setError('Support-Anfrage konnte nicht erstellt werden.');
        return;
      }

      // Nachricht hinzufügen
      const messageData = {
        ticket_id: insertedTicket.id,
        sender_type: 'customer' as const,
        sender_name: user.email || user.user_metadata?.full_name || 'Kunde',
        content: newTicket.description.trim(),
        created_at: new Date().toISOString()
      };

      const { error: messageError } = await supabase
        .from('ticket_messages')
        .insert([messageData]);

      if (messageError) {
        console.error('Message insert error:', messageError);
        // Nachricht-Fehler nicht blockierend
      }

      setSuccess(`Ihre Support-Anfrage wurde erfolgreich erstellt! Ticket-Nr.: ${ticketNumber}`);
      await loadTickets(user.id);
      setShowNewTicket(false);
      setNewTicket({
        subject: '',
        description: '',
        category: 'general',
        priority: 'medium'
      });

      setTimeout(() => setSuccess(''), 5000);

    } catch (error: any) {
      console.error('Unexpected error:', error);
      
      if (error.message?.includes('Failed to fetch')) {
        setError('Netzwerkverbindung fehlgeschlagen. Bitte prüfen Sie Ihre Internetverbindung.');
      } else if (error.message?.includes('JWT')) {
        setError('Sitzung abgelaufen. Bitte melden Sie sich erneut an.');
      } else {
        setError(`Unerwarteter Fehler: ${error.message}. Bitte versuchen Sie es später erneut.`);
      }
    } finally {
      setSending(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTicket || !newMessage.trim() || !user) return;

    setSending(true);
    setError('');

    try {
      const { error } = await supabase
        .from('ticket_messages')
        .insert([{
          ticket_id: selectedTicket,
          sender_type: 'customer',
          sender_name: user.email || 'Kunde',
          content: newMessage.trim()
        }]);

      if (error) {
        console.error('Message send error:', error);
        setError('Fehler beim Senden der Nachricht.');
        return;
      }

      await supabase
        .from('support_tickets')
        .update({ 
          status: 'open',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTicket);

      await loadMessages(selectedTicket);
      await loadTickets(user.id);
      setNewMessage('');
    } catch (error) {
      console.error('Fehler beim Senden der Nachricht:', error);
      setError('Es gab ein Problem beim Senden der Nachricht.');
    } finally {
      setSending(false);
    }
  };

  const selectTicket = (ticketId: string) => {
    setSelectedTicket(ticketId);
    if (!messages[ticketId]) {
      loadMessages(ticketId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryLabel = (value: string) => {
    return categories.find(cat => cat.value === value)?.label || value;
  };

  const getPriorityInfo = (value: string) => {
    return priorities.find(p => p.value === value) || priorities[1];
  };

  const getStatusInfo = (value: string) => {
    return statuses.find(s => s.value === value) || statuses[0];
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="lg:col-span-2 h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <i className="ri-lock-line text-6xl text-red-300 mb-4"></i>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Anmeldung erforderlich</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <a
            href="/konto"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-block whitespace-nowrap"
          >
            Zur Anmeldung
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Support & Anfragen</h1>
        <button
          onClick={() => setShowNewTicket(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer"
        >
          <i className="ri-add-line mr-2"></i>
          Neue Anfrage
        </button>
      </div>

      {/* Fehlermeldungen */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <i className="ri-error-warning-line text-red-500 mr-2"></i>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Erfolgsmeldungen */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <i className="ri-check-line text-green-500 mr-2"></i>
            <span className="text-green-700">{success}</span>
          </div>
        </div>
      )}

      {showNewTicket && (
        <div className="bg-white border-2 border-green-200 rounded-xl p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Neue Support-Anfrage</h2>
            <button
              onClick={() => {
                setShowNewTicket(false);
                setError('');
              }}
              className="text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>

          <form onSubmit={createTicket} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Betreff *
              </label>
              <input
                type="text"
                value={newTicket.subject}
                onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
                placeholder="Kurze Beschreibung Ihres Anliegens"
                maxLength={200}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategorie
                </label>
                <select
                  value={newTicket.category}
                  onChange={(e) => setNewTicket({...newTicket, category: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-8"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priorität
                </label>
                <select
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({...newTicket, priority: e.target.value as any})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-8"
                >
                  {priorities.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beschreibung *
              </label>
              <textarea
                value={newTicket.description}
                onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                required
                placeholder="Beschreiben Sie Ihr Anliegen so detailliert wie möglich..."
                maxLength={500}
              />
              <div className="text-sm text-gray-500 mt-1">
                {newTicket.description.length}/500 Zeichen
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={sending || !newTicket.subject.trim() || !newTicket.description.trim()}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
              >
                {sending ? 'Wird gesendet...' : 'Anfrage senden'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewTicket(false);
                  setError('');
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-8 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      )}

      {tickets.length === 0 && !showNewTicket && !error && (
        <div className="text-center py-12">
          <i className="ri-customer-service-2-line text-6xl text-gray-300 mb-4"></i>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Keine Support-Anfragen</h3>
          <p className="text-gray-600 mb-6">Sie haben noch keine Support-Anfragen gestellt.</p>
          <button
            onClick={() => setShowNewTicket(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer"
          >
            Erste Anfrage erstellen
          </button>
        </div>
      )}

      {tickets.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ticket Liste */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 mb-4">Ihre Anfragen</h3>
            {tickets.map((ticket) => {
              const statusInfo = getStatusInfo(ticket.status);
              const priorityInfo = getPriorityInfo(ticket.priority);

              return (
                <div
                  key={ticket.id}
                  onClick={() => selectTicket(ticket.id)}
                  className={`bg-white border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer ${ 
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

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {getCategoryLabel(ticket.category)}
                  </p>

                  <div className="text-xs text-gray-500">
                    Erstellt: {formatDate(ticket.created_at)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chat Bereich */}
          <div className="lg:col-span-2">
            {selectedTicket ? (
              <div className="bg-white border rounded-xl h-96 flex flex-col">
                <div className="p-4 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {tickets.find(t => t.id === selectedTicket)?.subject}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {getCategoryLabel(tickets.find(t => t.id === selectedTicket)?.category || '')}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {(() => {
                        const ticket = tickets.find(t => t.id === selectedTicket);
                        const statusInfo = getStatusInfo(ticket?.status || '');
                        const priorityInfo = getPriorityInfo(ticket?.priority || '');
                        return (
                          <>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityInfo.color}`}>
                              {priorityInfo.label}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages[selectedTicket]?.map((message) => (
                    <div key={message.id} className={`flex ${message.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${ 
                        message.sender_type === 'customer' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-sm mb-1">{message.content}</p>
                        <div className={`text-xs ${message.sender_type === 'customer' ? 'text-green-100' : 'text-gray-500'}`}>
                          {message.sender_name} • {formatDate(message.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={sendMessage} className="p-4 border-t">
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Ihre Nachricht..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      maxLength={500}
                    />
                    <button
                      type="submit"
                      disabled={sending || !newMessage.trim()}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer"
                    >
                      {sending ? 'Senden...' : 'Senden'}
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {newMessage.length}/500 Zeichen
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-white border rounded-xl h-96 flex items-center justify-center">
                <div className="text-center">
                  <i className="ri-chat-3-line text-6xl text-gray-300 mb-4"></i>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Keine Unterhaltung ausgewählt</h3>
                  <p className="text-gray-600">Wählen Sie eine Anfrage aus, um die Nachrichten zu sehen.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
