'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

interface Subscription {
  id: string;
  user_agent: string;
  created_at: string;
  last_used: string | null;
  is_active: boolean;
}

interface Notification {
  id: string;
  title: string;
  body: string;
  sent_at: string;
  sent_count: number;
  failed_count: number;
}

interface NewNotification {
  title: string;
  message: string;
  target_audience: string;
  schedule_type: string;
  scheduled_at: string;
}

export default function PushNotificationTab() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNotification, setNewNotification] = useState<NewNotification>({
    title: '',
    message: '',
    target_audience: 'all',
    schedule_type: 'immediate',
    scheduled_at: ''
  });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('send');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: subsData, error: subsError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (subsError) throw subsError;

      const { data: notifsData, error: notifsError } = await supabase
        .from('push_notifications')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(50);

      if (notifsError) throw notifsError;

      setSubscriptions(subsData || []);
      setNotifications(notifsData || []);
    } catch (error) {
      console.error('Error loading push notification data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendPushNotification = async () => {
    if (!newNotification.title.trim() || !newNotification.message.trim()) {
      setMessage('Titel und Nachricht sind erforderlich');
      return;
    }

    setIsSending(true);
    setMessage('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-push-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          title: newNotification.title,
          body: newNotification.message,
          type: 'general',
          url: '/',
          icon: '/icon-192x192.png',
          actions: [
            {
              action: 'view',
              title: 'Anzeigen'
            },
            {
              action: 'dismiss',
              title: 'Schließen'
            }
          ],
          requireInteraction: false
        })
      });

      const result = await response.json();

      if (result.success) {
        setMessage(`Push-Benachrichtigung erfolgreich gesendet! (${result.sent} von ${result.total} Geräten)`);
        setNewNotification({
          title: '',
          message: '',
          target_audience: 'all',
          schedule_type: 'immediate',
          scheduled_at: ''
        });
        loadData(); 
      } else {
        throw new Error(result.error || 'Unbekannter Fehler');
      }
    } catch (error: any) {
      console.error('Error sending push notification:', error);
      setMessage(`Fehler beim Senden: ${error.message}`);
    } finally {
      setIsSending(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="w-12 h-12 flex items-center justify-center bg-blue-100 rounded-full mx-auto mb-4 animate-pulse">
          <i className="ri-notification-line text-2xl text-blue-600"></i>
        </div>
        <p className="text-lg font-medium text-gray-700">Lade Push-Benachrichtigungen...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 flex items-center justify-center bg-blue-100 rounded-full mr-3">
            <i className="ri-notification-line text-blue-600"></i>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#1A1A1A]">Push-Benachrichtigungen</h2>
            <p className="text-gray-600">Senden Sie direkte Nachrichten an App-Nutzer</p>
          </div>
        </div>

        {message && (
          <div className={`mb-4 px-4 py-2 rounded-lg text-sm font-medium ${message.includes('erfolgreich') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Aktive Abonnenten</p>
                <p className="text-2xl font-bold text-blue-800">{subscriptions.length}</p>
              </div>
              <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-lg">
                <i className="ri-user-line text-blue-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Gesendete Nachrichten</p>
                <p className="text-2xl font-bold text-green-800">{notifications.length}</p>
              </div>
              <div className="w-10 h-10 flex items-center justify-center bg-green-100 rounded-lg">
                <i className="ri-send-plane-line text-green-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Erfolgsrate</p>
                <p className="text-2xl font-bold text-purple-800">
                  {notifications.length > 0
                    ? Math.round((notifications.reduce((acc, n) => acc + n.sent_count, 0) /
                        notifications.reduce((acc, n) => acc + n.sent_count + n.failed_count, 0)) * 100)
                    : 0}%
                </p>
              </div>
              <div className="w-10 h-10 flex items-center justify-center bg-purple-100 rounded-lg">
                <i className="ri-line-chart-line text-purple-600"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('send')}
              className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${activeTab === 'send' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <i className="ri-send-plane-line mr-2"></i>
              Nachricht senden
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${activeTab === 'history' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <i className="ri-history-line mr-2"></i>
              Verlauf ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('subscribers')}
              className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${activeTab === 'subscribers' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <i className="ri-user-line mr-2"></i>
              Abonnenten ({subscriptions.length})
            </button>
          </nav>
        </div>

        {/* Send Tab */}
        {activeTab === 'send' && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Custom Notification */}
              <div>
                <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Eigene Nachricht erstellen</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Titel *</label>
                    <input
                      type="text"
                      value={newNotification.title}
                      onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="z.B. Neues Angebot verfügbar!"
                      maxLength={50}
                    />
                    <div className="text-xs text-gray-500 mt-1">{newNotification.title.length}/50 Zeichen</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nachricht *</label>
                    <textarea
                      value={newNotification.message}
                      onChange={(e) => setNewNotification(prev => ({ ...prev, message: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Ihre Nachricht an die Kunden..."
                      maxLength={120}
                    />
                    <div className="text-xs text-gray-500 mt-1">{newNotification.message.length}/120 Zeichen</div>
                  </div>

                  <button
                    onClick={sendPushNotification}
                    disabled={isSending || !newNotification.title.trim() || !newNotification.message.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {isSending ? (
                      <>
                        <i className="ri-loader-4-line mr-2 animate-spin"></i>
                        Sende...
                      </>
                    ) : (
                      <>
                        <i className="ri-send-plane-line mr-2"></i>
                        An alle Abonnenten senden
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="p-6">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
                  <i className="ri-history-line text-2xl text-gray-400"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">Noch keine Benachrichtigungen gesendet</h3>
                <p className="text-gray-500">Senden Sie Ihre erste Push-Benachrichtigung an Ihre Kunden.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div key={notification.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-bold text-[#1A1A1A]">{notification.title}</h4>
                        </div>
                        <p className="text-gray-600 mb-3">{notification.body}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>
                            <i className="ri-send-plane-line mr-1"></i>
                            {notification.sent_count} gesendet
                          </span>
                          {notification.failed_count > 0 && (
                            <span className="text-red-600">
                              <i className="ri-error-warning-line mr-1"></i>
                              {notification.failed_count} fehlgeschlagen
                            </span>
                          )}
                          <span>
                            <i className="ri-time-line mr-1"></i>
                            {new Date(notification.sent_at).toLocaleString('de-DE')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Subscribers Tab */}
        {activeTab === 'subscribers' && (
          <div className="p-6">
            {subscriptions.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
                  <i className="ri-user-line text-2xl text-gray-400"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">Noch keine Abonnenten</h3>
                <p className="text-gray-500">Nutzer können Push-Benachrichtigungen auf der Website aktivieren.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Gerät
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Registriert
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Letzte Verwendung
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {subscriptions.map((subscription) => (
                      <tr key={subscription.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {subscription.user_agent.includes('Mobile') ? '📱 Mobile' : '💻 Desktop'}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-xs">
                            {subscription.user_agent}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {new Date(subscription.created_at).toLocaleDateString('de-DE')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {subscription.last_used
                            ? new Date(subscription.last_used).toLocaleDateString('de-DE')
                            : 'Nie'
                          }
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${subscription.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {subscription.is_active ? 'Aktiv' : 'Inaktiv'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
