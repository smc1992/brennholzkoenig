
'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

interface ClickDataItem {
  element: string;
  count: number;
  percentage: number;
}

interface ScrollDataItem {
  depth: number;
  count: number;
  percentage: number;
}

export default function HeatmapsTab() {
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPage, setSelectedPage] = useState('');
  const [dateRange, setDateRange] = useState('7d');
  const [heatmapType, setHeatmapType] = useState('clicks');
  const [selectedType, setSelectedType] = useState('click');
  const [isLoading, setIsLoading] = useState(true);
  const [pages, setPages] = useState<string[]>([]);
  const [scrollData, setScrollData] = useState<ScrollDataItem[]>([]);
  const [clickData, setClickData] = useState<ClickDataItem[]>([]);
  const [hotjarSettings, setHotjarSettings] = useState({
    site_id: '',
    is_enabled: false
  });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadHeatmapData();
    loadHotjarSettings();
  }, [selectedPage, selectedType]);

  const loadHeatmapData = async () => {
    try {
      // Verfügbare Seiten laden
      const { data: pageData } = await supabase
        .from('analytics_events')
        .select('page_url')
        .eq('event_type', 'page_view')
        .order('timestamp', { ascending: false })
        .limit(100);

      const uniquePages = [...new Set(pageData?.map(item => item.page_url) || [])];
      setPages(uniquePages.slice(0, 20));

      // Click-Heatmap Daten
      if (selectedType === 'click') {
        const { data: clickEvents } = await supabase
          .from('analytics_events')
          .select('properties')
          .eq('event_type', 'click')
          .eq('page_url', selectedPage)
          .order('timestamp', { ascending: false })
          .limit(1000);

        const clickHeatmap: Record<string, number> = {};
        clickEvents?.forEach(event => {
          if (event.properties?.element_class || event.properties?.element_id) {
            const key = event.properties.element_class || event.properties.element_id;
            clickHeatmap[key] = (clickHeatmap[key] || 0) + 1;
          }
        });

        const clickArray = Object.entries(clickHeatmap).map(([element, count]) => ({
          element,
          count,
          percentage: 0
        }));

        // Prozentsätze berechnen
        const totalClicks = clickArray.reduce((sum, item) => sum + item.count, 0);
        if (totalClicks > 0) {
          clickArray.forEach(item => {
            item.percentage = Number(((item.count / totalClicks) * 100).toFixed(1));
          });
        }

        setClickData(clickArray.sort((a, b) => b.count - a.count));
      }

      // Scroll-Heatmap Daten
      if (selectedType === 'scroll') {
        const { data: scrollEvents } = await supabase
          .from('analytics_events')
          .select('properties')
          .eq('event_type', 'scroll_depth')
          .eq('page_url', selectedPage)
          .order('timestamp', { ascending: false });

        const scrollDepths: Record<string, number> = {};
        scrollEvents?.forEach(event => {
          const depth = event.properties?.depth;
          if (depth) {
            scrollDepths[depth] = (scrollDepths[depth] || 0) + 1;
          }
        });

        const scrollArray = Object.entries(scrollDepths).map(([depth, count]) => ({
          depth: parseInt(depth),
          count,
          percentage: 0
        }));

        const totalScrolls = scrollArray.reduce((sum, item) => sum + item.count, 0);
        if (totalScrolls > 0) {
          scrollArray.forEach(item => {
            item.percentage = Number(((item.count / totalScrolls) * 100).toFixed(1));
          });
        }

        setScrollData(scrollArray.sort((a, b) => a.depth - b.depth));
      }

      setHeatmapData(selectedType === 'click' ? clickData : scrollData);
    } catch (error) {
      console.error('Error loading heatmap data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHotjarSettings = async () => {
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_type', 'hotjar_settings')
        .single();

      if (data) {
        setHotjarSettings(JSON.parse(data.setting_value));
      }
    } catch (error) {
      console.error('Error loading Hotjar settings:', error);
    }
  };

  const saveHotjarSettings = async () => {
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          setting_type: 'hotjar_settings',
          setting_key: 'config',
          setting_value: JSON.stringify(hotjarSettings),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Hotjar Script einbetten wenn aktiviert
      if (hotjarSettings.is_enabled && hotjarSettings.site_id) {
        await embedHotjarScript();
      }

      alert('Hotjar Einstellungen erfolgreich gespeichert!');
    } catch (error) {
      console.error('Error saving Hotjar settings:', error);
      alert('Fehler beim Speichern der Einstellungen');
    }
  };

  const embedHotjarScript = async () => {
    const hotjarScript = `
<!-- Hotjar Tracking Code -->
<script>
    (function(h,o,t,j,a,r){
        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
        h._hjSettings={hjid:${hotjarSettings.site_id},hjsv:6};
        a=o.getElementsByTagName('head')[0];
        r=o.createElement('script');r.async=1;
        r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
        a.appendChild(r);
    })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
</script>
`;

    await supabase
      .from('app_settings')
      .upsert({
        setting_type: 'html_head',
        setting_key: 'hotjar_tracking',
        setting_value: hotjarScript,
        updated_at: new Date().toISOString()
      });
  };

  const getHeatIntensity = (count: number, maxCount: number): string => {
    const intensity = (count / maxCount) * 100;
    if (intensity >= 80) return 'bg-red-600';
    if (intensity >= 60) return 'bg-red-500';
    if (intensity >= 40) return 'bg-orange-500';
    if (intensity >= 20) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="w-12 h-12 flex items-center justify-center bg-red-100 rounded-full mx-auto mb-4 animate-pulse">
          <i className="ri-fire-line text-2xl text-red-600"></i>
        </div>
        <p className="text-lg font-medium text-gray-700">Lade Heatmap-Daten...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 flex items-center justify-center bg-red-100 rounded-full mr-3">
            <i className="ri-fire-line text-red-600"></i>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#1A1A1A]">Heatmaps & Nutzerverhalten</h2>
            <p className="text-gray-600">Visualisierung des Nutzerverhaltens auf Ihrer Website</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Seite auswählen</label>
            <select
              value={selectedPage}
              onChange={(e) => setSelectedPage(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 cursor-pointer pr-8"
            >
              {pages.map((page) => (
                <option key={page} value={page}>
                  {page === '/' ? 'Startseite' : page}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Heatmap-Typ</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 cursor-pointer pr-8"
            >
              <option value="click">Click Heatmap</option>
              <option value="scroll">Scroll Heatmap</option>
            </select>
          </div>
        </div>
      </div>

      {/* Heatmap Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Click Heatmap */}
        {selectedType === 'click' && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Click-Intensität nach Elementen</h3>

            {clickData.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
                  <i className="ri-cursor-line text-2xl text-gray-400"></i>
                </div>
                <p className="text-gray-500">Keine Click-Daten für diese Seite verfügbar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {clickData.slice(0, 10).map((item, index) => {
                  const maxCount = Math.max(...clickData.map(d => d.count));
                  return (
                    <div key={item.element} className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${getHeatIntensity(item.count, maxCount)}`}
                          style={{ width: `${(item.count / maxCount) * 100}%` }}
                        ></div>
                        <div className="absolute inset-0 flex items-center px-3">
                          <span className="text-sm font-medium text-white truncate">
                            {item.element}
                          </span>
                        </div>
                      </div>
                      <div className="text-right min-w-0">
                        <div className="text-sm font-bold text-gray-800">{item.count}</div>
                        <div className="text-xs text-gray-500">{item.percentage}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Scroll Heatmap */}
        {selectedType === 'scroll' && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Scroll-Tiefe Verteilung</h3>

            {scrollData.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
                  <i className="ri-scroll-to-bottom-line text-2xl text-gray-400"></i>
                </div>
                <p className="text-gray-500">Keine Scroll-Daten für diese Seite verfügbar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scrollData.map((item) => {
                  const maxCount = Math.max(...scrollData.map(d => d.count));
                  return (
                    <div key={item.depth} className="flex items-center gap-3">
                      <div className="w-12 text-sm font-medium text-gray-600">
                        {item.depth}%
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${getHeatIntensity(item.count, maxCount)}`}
                          style={{ width: `${(item.count / maxCount) * 100}%` }}
                        ></div>
                      </div>
                      <div className="text-right min-w-0">
                        <div className="text-sm font-bold text-gray-800">{item.count}</div>
                        <div className="text-xs text-gray-500">{item.percentage}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Heatmap Legende */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Intensitäts-Legende</h3>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-red-600 rounded"></div>
              <span className="text-sm text-gray-700">Sehr hoch (80-100%)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-red-500 rounded"></div>
              <span className="text-sm text-gray-700">Hoch (60-79%)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-orange-500 rounded"></div>
              <span className="text-sm text-gray-700">Mittel (40-59%)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-yellow-500 rounded"></div>
              <span className="text-sm text-gray-700">Niedrig (20-39%)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-700">Sehr niedrig (0-19%)</span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-bold text-blue-800 mb-2">Interpretation</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Click Heatmaps:</strong> Zeigen die am häufigsten angeklickten Bereiche</li>
              <li>• <strong>Scroll Heatmaps:</strong> Zeigen bis zu welcher Tiefe Nutzer scrollen</li>
              <li>• Rote Bereiche = Hohe Nutzeraktivität</li>
              <li>• Blaue Bereiche = Niedrige Nutzeraktivität</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Hotjar Integration */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 flex items-center justify-center bg-orange-100 rounded-full mr-3">
            <i className="ri-hotjar-line text-orange-600"></i>
          </div>
          <h3 className="text-lg font-bold text-[#1A1A1A]">Hotjar Integration</h3>
        </div>

        <p className="text-gray-600 mb-6">
          Integrieren Sie Hotjar für erweiterte Heatmaps, Session-Recordings und Feedback-Tools.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hotjar Site ID
            </label>
            <input
              type="text"
              value={hotjarSettings.site_id}
              onChange={(e) => setHotjarSettings(prev => ({ ...prev, site_id: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="1234567"
            />
            <p className="text-xs text-gray-500 mt-1">
              Finden Sie in Ihrem Hotjar Dashboard unter Settings
            </p>
          </div>

          <div className="flex items-end">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={hotjarSettings.is_enabled}
                onChange={(e) => setHotjarSettings(prev => ({ ...prev, is_enabled: e.target.checked }))}
                className="mr-3"
              />
              <span className="text-sm font-medium text-gray-700">
                Hotjar Tracking aktivieren
              </span>
            </label>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={saveHotjarSettings}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
          >
            Hotjar Einstellungen speichern
          </button>

          <a
            href="https://www.hotjar.com"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-external-link-line mr-2"></i>
            Hotjar Account erstellen
          </a>
        </div>
      </div>

      {/* Nutzerverhalten Insights */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Verhaltens-Insights</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 flex items-center justify-center bg-blue-100 rounded-lg mr-3">
                <i className="ri-cursor-line text-blue-600"></i>
              </div>
              <h4 className="font-bold text-blue-800">Click-Verhalten</h4>
            </div>
            <p className="text-sm text-blue-700">
              Die meisten Clicks erfolgen auf Call-to-Action Buttons und Navigation. Optimieren Sie prominente Platzierung wichtiger Elemente.
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 flex items-center justify-center bg-green-100 rounded-lg mr-3">
                <i className="ri-scroll-to-bottom-line text-green-600"></i>
              </div>
              <h4 className="font-bold text-green-800">Scroll-Verhalten</h4>
            </div>
            <p className="text-sm text-green-700">
              {scrollData.length > 0 && scrollData.find(s => s.depth >= 75)
                ? 'Gute Scroll-Tiefe: Nutzer lesen Ihre Inhalte vollständig.'
                : 'Niedrige Scroll-Tiefe: Wichtige Inhalte weiter nach oben verlagern.'
              }
            </p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 flex items-center justify-center bg-purple-100 rounded-lg mr-3">
                <i className="ri-eye-line text-purple-600"></i>
              </div>
              <h4 className="font-bold text-purple-800">Aufmerksamkeit</h4>
            </div>
            <p className="text-sm text-purple-700">
              Bereiche mit hoher Interaktion zeigen starkes Nutzerinteresse. Nutzen Sie diese Erkenntnisse für A/B-Tests.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
