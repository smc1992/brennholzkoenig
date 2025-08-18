
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

interface PageViewData {
  session_id: string;
  page_url: string;
  timestamp: string;
  user_agent: string;
  referrer: string;
  event_type: string;
}

interface SessionData {
  session_id: string;
  start_time: string;
  page_views: number;
  user_agent: string;
  referrer: string;
}

export default function AnalyticsTab() {
  const [analytics, setAnalytics] = useState<{
    pageViews: PageViewData[];
    topPages: {url: string, count: number}[];
    userSessions: SessionData[];
    events: PageViewData[];
    realTimeUsers: number;
  }>({
    pageViews: [],
    topPages: [],
    userSessions: [],
    events: [],
    realTimeUsers: 0
  });
  const [timeRange, setTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);
  const [storageInfo, setStorageInfo] = useState({
    totalRecords: 0,
    oldestRecord: null,
    storageSize: 0
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteRange, setDeleteRange] = useState('30d');
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadAnalytics();
    loadStorageInfo();
  }, [timeRange]);

  const loadStorageInfo = async () => {
    try {
      // Gesamtanzahl Records
      const { count } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true });

      // Ältester Eintrag
      const { data: oldestData } = await supabase
        .from('analytics_events')
        .select('timestamp')
        .order('timestamp', { ascending: true })
        .limit(1);

      setStorageInfo({
        totalRecords: count || 0,
        oldestRecord: oldestData?.[0]?.timestamp || null,
        storageSize: Math.round((count || 0) * 0.5) // Geschätzte KB pro Record
      });
    } catch (error) {
      console.error('Error loading storage info:', error);
    }
  };

  const deleteOldData = async () => {
    setIsDeleting(true);
    try {
      const deleteDate = getDeleteDate(deleteRange);

      const { error } = await supabase
        .from('analytics_events')
        .delete()
        .lt('timestamp', deleteDate);

      if (error) throw error;

      alert(`Alte Analytics-Daten erfolgreich gelöscht!`);
      loadAnalytics();
      loadStorageInfo();
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting data:', error);
      alert('Fehler beim Löschen der Daten');
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteAllData = async () => {
    if (!confirm('ACHTUNG: Alle Analytics-Daten werden unwiderruflich gelöscht! Fortfahren?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('analytics_events')
        .delete()
        .neq('id', 0); // Löscht alle Einträge

      if (error) throw error;

      alert('Alle Analytics-Daten wurden gelöscht!');
      loadAnalytics();
      loadStorageInfo();
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting all data:', error);
      alert('Fehler beim Löschen aller Daten');
    } finally {
      setIsDeleting(false);
    }
  };

  const getDeleteDate = (range: string) => {
    const now = new Date();
    switch (range) {
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      case '180d': return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString();
      case '365d': return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
      default: return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const startDate = getStartDate(timeRange);

      // Page Views
      const { data: pageViewsData } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('event_type', 'page_view')
        .gte('timestamp', startDate)
        .order('timestamp', { ascending: false });

      // Top Pages
      const pageViewsByUrl: { [key: string]: number } = {};
      pageViewsData?.forEach((view: PageViewData) => {
        const url = view.page_url;
        pageViewsByUrl[url] = (pageViewsByUrl[url] || 0) + 1;
      });

      const topPages = Object.entries(pageViewsByUrl)
        .map(([url, count]) => ({ url, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // User Sessions
      interface SessionData {
        session_id: string;
        start_time: string;
        page_views: number;
        user_agent: string;
        referrer: string;
      }
      
      const sessionData: { [key: string]: SessionData } = {};
      pageViewsData?.forEach((view: PageViewData) => {
        const sessionId = view.session_id;
        if (!sessionData[sessionId]) {
          sessionData[sessionId] = {
            session_id: sessionId,
            start_time: view.timestamp,
            page_views: 0,
            user_agent: view.user_agent,
            referrer: view.referrer
          };
        }
        sessionData[sessionId].page_views++;
      });

      const userSessions = Object.values(sessionData);

      // Events
      const { data: eventsData } = await supabase
        .from('analytics_events')
        .select('*')
        .neq('event_type', 'page_view')
        .gte('timestamp', startDate)
        .order('timestamp', { ascending: false })
        .limit(100);

      // Real-time users (last 30 minutes)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data: realtimeData } = await supabase
        .from('analytics_events')
        .select('session_id')
        .eq('event_type', 'page_view')
        .gte('timestamp', thirtyMinutesAgo);

      const uniqueSessions = new Set(realtimeData?.map(d => d.session_id) || []);

      setAnalytics({
        pageViews: pageViewsData || [],
        topPages,
        userSessions,
        events: eventsData || [],
        realTimeUsers: uniqueSessions.size
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStartDate = (range: string) => {
    const now = new Date();
    switch (range) {
      case '1d': return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      default: return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-DE');
  };

  const getPageName = (url: string) => {
    if (url === '/') return 'Startseite';
    if (url === '/shop') return 'Shop';
    if (url === '/ueber-uns') return 'Über uns';
    if (url === '/kontakt') return 'Kontakt';
    if (url === '/warenkorb') return 'Warenkorb';
    if (url === '/checkout') return 'Checkout';
    if (url.startsWith('/shop/')) return 'Produktdetails';
    return url;
  };

  const getBrowserFromUserAgent = (userAgent: string) => {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unbekannt';
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'click': return 'ri-cursor-line';
      case 'scroll_depth': return 'ri-scroll-to-bottom-line';
      case 'time_on_page': return 'ri-time-line';
      default: return 'ri-information-line';
    }
  };

  const getEventName = (eventType: string) => {
    switch (eventType) {
      case 'click': return 'Element angeklickt';
      case 'scroll_depth': return 'Scroll-Tiefe erreicht';
      case 'time_on_page': return 'Zeit auf Seite';
      default: return eventType;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="w-16 h-16 flex items-center justify-center bg-[#C04020] rounded-full mx-auto mb-4 animate-pulse">
            <i className="ri-bar-chart-line text-2xl text-white"></i>
          </div>
          <p className="text-lg font-medium text-gray-700">Analytics werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Website Analytics</h1>
          <p className="text-gray-600">Detaillierte Einblicke in das Nutzerverhalten</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#C04020]"
          >
            <option value="1d">Letzter Tag</option>
            <option value="7d">Letzte 7 Tage</option>
            <option value="30d">Letzte 30 Tage</option>
            <option value="90d">Letzte 90 Tage</option>
          </select>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
          >
            <i className="ri-delete-bin-line mr-2"></i>
            Daten verwalten
          </button>
        </div>
      </div>

      {/* Storage Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 flex items-center justify-center bg-amber-100 rounded-lg">
            <i className="ri-database-line text-amber-600 text-xl"></i>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-amber-800 mb-2">Speicher-Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-amber-600 font-medium">Gesamt Records:</p>
                <p className="text-amber-800 font-bold text-xl">{storageInfo.totalRecords.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-amber-600 font-medium">Geschätzte Größe:</p>
                <p className="text-amber-800 font-bold text-xl">{(storageInfo.storageSize / 1024).toFixed(1)} MB</p>
              </div>
              <div>
                <p className="text-amber-600 font-medium">Ältester Eintrag:</p>
                <p className="text-amber-800 font-bold">
                  {storageInfo.oldestRecord ? formatDate(storageInfo.oldestRecord) : 'Keine Daten'}
                </p>
              </div>
            </div>
            <div className="mt-3 p-3 bg-amber-100 rounded-lg">
              <p className="text-xs text-amber-700">
                <i className="ri-information-line mr-1"></i>
                <strong>Empfehlung:</strong> Löschen Sie regelmäßig alte Analytics-Daten, um Speicherplatz zu sparen und Performance zu optimieren. 
                Daten älter als 3-6 Monate sind meist nicht mehr relevant.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Seitenaufrufe</p>
              <p className="text-2xl font-bold text-[#1A1A1A]">{analytics.pageViews.length}</p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center bg-blue-100 rounded-lg">
              <i className="ri-eye-line text-blue-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unique Sessions</p>
              <p className="text-2xl font-bold text-[#1A1A1A]">{analytics.userSessions.length}</p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center bg-green-100 rounded-lg">
              <i className="ri-user-line text-green-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Live Nutzer</p>
              <p className="text-2xl font-bold text-[#1A1A1A]">{analytics.realTimeUsers}</p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center bg-red-100 rounded-lg">
              <i className="ri-pulse-line text-red-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Events</p>
              <p className="text-2xl font-bold text-[#1A1A1A]">{analytics.events.length}</p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center bg-purple-100 rounded-lg">
              <i className="ri-cursor-line text-purple-600 text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Beliebteste Seiten</h3>
          <div className="space-y-3">
            {analytics.topPages.slice(0, 10).map((page, index) => (
              <div key={page.url} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full text-xs font-bold mr-3">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-800">{getPageName(page.url)}</span>
                </div>
                <span className="text-sm font-bold text-[#C04020]">{page.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Events */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Aktuelle Events</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {analytics.events.slice(0, 20).map((event, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 flex items-center justify-center bg-blue-100 rounded-lg">
                  <i className={`${getEventIcon(event.event_type)} text-blue-600 text-sm`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{getEventName(event.event_type)}</p>
                  <p className="text-xs text-gray-500 truncate">{getPageName(event.page_url)}</p>
                  <p className="text-xs text-gray-400">{formatDate(event.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Sessions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Nutzer-Sessions</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Session ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Startzeit</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Seitenaufrufe</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Browser</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Referrer</th>
              </tr>
            </thead>
            <tbody>
              {analytics.userSessions.slice(0, 20).map((session, index) => (
                <tr key={session.session_id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-3 px-4 text-sm font-mono text-gray-800">
                    {session.session_id.slice(-8)}...
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {formatDate(session.start_time)}
                  </td>
                  <td className="py-3 px-4 text-sm font-bold text-[#C04020)">
                    {session.page_views}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {getBrowserFromUserAgent(session.user_agent)}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 truncate max-w-xs">
                    {session.referrer || 'Direkt'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 flex items-center justify-center bg-red-100 rounded-lg">
                <i className="ri-delete-bin-line text-red-600 text-xl"></i>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Analytics-Daten verwalten</h3>
                <p className="text-sm text-gray-600">Speicherplatz optimieren</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Daten löschen älter als:
                </label>
                <select
                  value={deleteRange}
                  onChange={(e) => setDeleteRange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#C04020]"
                >
                  <option value="7d">7 Tage</option>
                  <option value="30d">30 Tage</option>
                  <option value="90d">90 Tage (3 Monate)</option>
                  <option value="180d">180 Tage (6 Monate)</option>
                  <option value="365d">365 Tage (1 Jahr)</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={deleteOldData}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {isDeleting ? 'Lösche...' : 'Alte Daten löschen'}
                </button>
                <button
                  onClick={deleteAllData}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {isDeleting ? 'Lösche...' : 'Alle Daten löschen'}
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors whitespace-nowrap"
                >
                  Abbrechen
                </button>
              </div>
            </div>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-700">
                <i className="ri-warning-line mr-1"></i>
                <strong>Hinweis:</strong> Das Löschen von Analytics-Daten ist unwiderruflich. 
                Stellen Sie sicher, dass Sie alle wichtigen Berichte exportiert haben.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getEventIcon(eventType: string) {
  switch (eventType) {
    case 'click': return 'ri-cursor-line';
    case 'scroll_depth': return 'ri-scroll-to-bottom-line';
    case 'time_on_page': return 'ri-time-line';
    default: return 'ri-information-line';
  }
}

function getEventName(eventType: string) {
  switch (eventType) {
    case 'click': return 'Element angeklickt';
    case 'scroll_depth': return 'Scroll-Tiefe erreicht';
    case 'time_on_page': return 'Zeit auf Seite';
    default: return eventType;
  }
}
