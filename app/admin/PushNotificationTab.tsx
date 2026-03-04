'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Subscription {
  id: string;
  endpoint: string;
  user_agent: string;
  created_at: string;
  last_used: string | null;
  is_active: boolean;
  error_message?: string;
}

interface Notification {
  id: string;
  title: string;
  body: string;
  notification_type: string;
  target_audience: string;
  schedule_type: string;
  scheduled_at: string;
  sent_at: string | null;
  sent_count: number;
  failed_count: number;
  created_at: string;
}

interface NewNotification {
  title: string;
  message: string;
  target_audience: string;
  schedule_type: string;
  scheduled_at: string;
  notification_type: string;
  url: string;
}

interface PushConfig {
  enabled: boolean;
  vapidPublicKey: string;
  vapidPrivateKey: string;
  maxSubscriptions: number;
  ttl: number;
}

export default function PushNotificationTab() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [config, setConfig] = useState<PushConfig>({
    enabled: false,
    vapidPublicKey: '',
    vapidPrivateKey: '',
    maxSubscriptions: 10000,
    ttl: 86400
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newNotification, setNewNotification] = useState<NewNotification>({
    title: '',
    message: '',
    target_audience: 'all',
    schedule_type: 'immediate',
    scheduled_at: '',
    notification_type: 'general',
    url: '/'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('config');
  const [stats, setStats] = useState({
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    totalNotifications: 0,
    sentToday: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadConfig(),
        loadNotifications(),
        loadSubscriptions(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/push-config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/push-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setMessage('✅ Push-Konfiguration erfolgreich gespeichert!');
        await loadConfig();
      } else {
        setMessage(`❌ Fehler: ${result.error || 'Unbekannter Fehler'}`);
      }
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage('❌ Fehler beim Speichern der Konfiguration');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const generateVapidKeys = async () => {
    try {
      // Hier würde normalerweise eine Server-Funktion VAPID-Keys generieren
      // Für Demo-Zwecke verwenden wir Platzhalter
      const publicKey = 'BExample-Public-Key-' + Math.random().toString(36).substring(2, 15);
      const privateKey = 'Example-Private-Key-' + Math.random().toString(36).substring(2, 15);
      
      setConfig(prev => ({
        ...prev,
        vapidPublicKey: publicKey,
        vapidPrivateKey: privateKey
      }));
      
      setMessage('⚠️ VAPID-Keys generiert. Bitte speichern Sie die Konfiguration.');
    } catch (error) {
      console.error('Error generating VAPID keys:', error);
      setMessage('❌ Fehler beim Generieren der VAPID-Keys');
    }
  };

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('push_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    }
  };

  const loadStats = async () => {
    try {
      const { data: subscriptionStats } = await supabase
        .from('push_subscriptions')
        .select('is_active');
      
      const { data: notificationStats } = await supabase
        .from('push_notifications')
        .select('sent_at');
      
      const today = new Date().toISOString().split('T')[0];
      const sentToday = notificationStats?.filter(n => 
        n.sent_at && n.sent_at.startsWith(today)
      ).length || 0;
      
      setStats({
        totalSubscriptions: subscriptionStats?.length || 0,
        activeSubscriptions: subscriptionStats?.filter(s => s.is_active).length || 0,
        totalNotifications: notificationStats?.length || 0,
        sentToday
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const sendNotification = async () => {
    if (!newNotification.title || !newNotification.message) {
      setMessage('❌ Titel und Nachricht sind erforderlich');
      return;
    }

    setIsSending(true);
    setMessage('');

    try {
      const response = await fetch('/api/push-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newNotification),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(`✅ Benachrichtigung gesendet! ${result.statistics?.sent || 0} erfolgreich, ${result.statistics?.failed || 0} fehlgeschlagen.`);
        setNewNotification({
          title: '',
          message: '',
          target_audience: 'all',
          schedule_type: 'immediate',
          scheduled_at: '',
          notification_type: 'general',
          url: '/'
        });
        await loadNotifications();
        await loadStats();
      } else {
        setMessage(`❌ Fehler: ${result.error || 'Unbekannter Fehler'}`);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      setMessage('❌ Fehler beim Senden der Benachrichtigung');
    } finally {
      setIsSending(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const deleteSubscription = async (subscriptionId: string) => {
    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('id', subscriptionId);

      if (error) throw error;
      
      await loadSubscriptions();
      await loadStats();
      setMessage('✅ Subscription gelöscht');
    } catch (error) {
      console.error('Error deleting subscription:', error);
      setMessage('❌ Fehler beim Löschen der Subscription');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Lade Push-Benachrichtigungen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <i className="ri-notification-line text-2xl text-blue-600"></i>
          <div>
            <h2 className="text-2xl font-bold text-[#1A1A1A]">Push-Benachrichtigungen</h2>
            <p className="text-blue-700">
              Verwalten Sie Web Push-Benachrichtigungen für Ihre Kunden
            </p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' :
          message.includes('⚠️') ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
          'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="ri-user-line text-blue-600"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Gesamt Abonnenten</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalSubscriptions}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="ri-user-check-line text-green-600"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Aktive Abonnenten</p>
              <p className="text-xl font-bold text-gray-900">{stats.activeSubscriptions}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="ri-notification-3-line text-purple-600"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Gesamt Benachrichtigungen</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalNotifications}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <i className="ri-calendar-line text-orange-600"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Heute gesendet</p>
              <p className="text-xl font-bold text-gray-900">{stats.sentToday}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'config', label: 'Konfiguration', icon: 'ri-settings-line' },
            { id: 'send', label: 'Senden', icon: 'ri-send-plane-line' },
            { id: 'history', label: 'Verlauf', icon: 'ri-history-line' },
            { id: 'subscriptions', label: 'Abonnenten', icon: 'ri-user-line' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className={tab.icon}></i>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          {/* VAPID Configuration */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">VAPID-Konfiguration</h3>
                <p className="text-sm text-gray-600">Voluntary Application Server Identification für Web Push</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => setConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  VAPID Public Key
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={config.vapidPublicKey}
                    onChange={(e) => setConfig(prev => ({ ...prev, vapidPublicKey: e.target.value }))}
                    placeholder="VAPID Public Key"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={generateVapidKeys}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Generieren
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  VAPID Private Key
                </label>
                <input
                  type="password"
                  value={config.vapidPrivateKey}
                  onChange={(e) => setConfig(prev => ({ ...prev, vapidPrivateKey: e.target.value }))}
                  placeholder="VAPID Private Key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max. Abonnenten
                  </label>
                  <input
                    type="number"
                    value={config.maxSubscriptions}
                    onChange={(e) => setConfig(prev => ({ ...prev, maxSubscriptions: parseInt(e.target.value) || 10000 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    TTL (Sekunden)
                  </label>
                  <input
                    type="number"
                    value={config.ttl}
                    onChange={(e) => setConfig(prev => ({ ...prev, ttl: parseInt(e.target.value) || 86400 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={saveConfig}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {saving ? 'Speichern...' : 'Konfiguration speichern'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'send' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Neue Benachrichtigung senden</h3>
              <div className="text-sm text-gray-500">
                {stats.activeSubscriptions} aktive Abonnenten
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titel *
                </label>
                <input
                  type="text"
                  value={newNotification.title}
                  onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Benachrichtigungstitel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nachricht *
                </label>
                <textarea
                  value={newNotification.message}
                  onChange={(e) => setNewNotification(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Benachrichtigungstext"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zielgruppe
                  </label>
                  <select
                    value={newNotification.target_audience}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, target_audience: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Alle Abonnenten</option>
                    <option value="active">Nur aktive Abonnenten</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Typ
                  </label>
                  <select
                    value={newNotification.notification_type}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, notification_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="general">Allgemein</option>
                    <option value="order">Bestellung</option>
                    <option value="promotion">Angebot</option>
                    <option value="news">Neuigkeiten</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ziel-URL (optional)
                </label>
                <input
                  type="url"
                  value={newNotification.url}
                  onChange={(e) => setNewNotification(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://brennholzkoenig.de/"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={sendNotification}
                disabled={isSending || !config.enabled}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {isSending ? 'Sende...' : 'Benachrichtigung senden'}
              </button>
              
              {!config.enabled && (
                <p className="text-sm text-red-600 mt-2">
                  Push-Benachrichtigungen sind nicht aktiviert. Bitte konfigurieren Sie VAPID-Keys.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">Benachrichtigungsverlauf</h3>
            <p className="text-sm text-gray-600">Übersicht aller gesendeten Benachrichtigungen</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Titel</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Typ</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Zielgruppe</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Gesendet</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Erfolgreich</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Fehlgeschlagen</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Datum</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((notification, index) => (
                  <tr key={notification.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="py-3 px-6">
                      <div>
                        <div className="font-medium text-gray-900">{notification.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{notification.body}</div>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {notification.notification_type}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-600">
                      {notification.target_audience === 'all' ? 'Alle' : 'Aktive'}
                    </td>
                    <td className="py-3 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        notification.sent_at ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {notification.sent_at ? 'Gesendet' : 'Geplant'}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-sm font-medium text-green-600">
                      {notification.sent_count}
                    </td>
                    <td className="py-3 px-6 text-sm font-medium text-red-600">
                      {notification.failed_count}
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-600">
                      {new Date(notification.created_at).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {notifications.length === 0 && (
              <div className="text-center py-12">
                <i className="ri-notification-off-line text-4xl text-gray-400 mb-4"></i>
                <p className="text-gray-500">Noch keine Benachrichtigungen gesendet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'subscriptions' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">Abonnenten-Verwaltung</h3>
            <p className="text-sm text-gray-600">Nutzer können Push-Benachrichtigungen auf der Website aktivieren.</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Browser</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Registriert</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Zuletzt verwendet</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((subscription, index) => (
                  <tr key={subscription.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="py-3 px-6">
                      <div className="text-sm text-gray-900 truncate max-w-xs">
                        {subscription.user_agent || 'Unbekannt'}
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        subscription.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {subscription.is_active ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-600">
                      {new Date(subscription.created_at).toLocaleDateString('de-DE')}
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-600">
                      {subscription.last_used 
                        ? new Date(subscription.last_used).toLocaleDateString('de-DE')
                        : 'Nie'
                      }
                    </td>
                    <td className="py-3 px-6">
                      <button
                        onClick={() => deleteSubscription(subscription.id)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Löschen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {subscriptions.length === 0 && (
              <div className="text-center py-12">
                <i className="ri-user-line text-4xl text-gray-400 mb-4"></i>
                <p className="text-gray-500">Noch keine Abonnenten vorhanden</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
