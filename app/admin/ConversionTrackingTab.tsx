
'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { safeJsonParse } from '../../lib/jsonHelper';

interface Conversion {
  id: string;
  created_at: string;
  event_type: string;
  target_value: number;
  page_url?: string;
  count?: number;
}

interface ConversionGoal {
  id: string;
  created_at: string;
  event_type: string;
  target_value: number;
  name: string;
  event: string;
  value: string | number;
  is_active: boolean;
}

interface FunnelStep {
  count: number;
  percentage: number;
  name: string;
  query: {
    event_type: string;
    page_url?: string;
  };
  dropOffRate?: number;
}

interface NewGoal {
  name: string;
  event: string;
  value: string | number;
  is_active: boolean;
}

export default function ConversionTrackingTab() {
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [conversionGoals, setConversionGoals] = useState<ConversionGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGoal, setNewGoal] = useState<NewGoal>({ name: '', event: '', value: '', is_active: true });
  const [funnelData, setFunnelData] = useState<FunnelStep[]>([]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadConversionData();
  }, [selectedTimeRange]);

  const loadConversionData = async () => {
    try {
      // JSON-Daten bereinigen vor dem Laden wurde entfernt

      const { data: goalsData } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_type', 'conversion_goals');

      const goals = goalsData?.map(item => {
        const parsedGoal = safeJsonParse(item.setting_value, null);
        if (!parsedGoal || typeof parsedGoal !== 'object') {
          return null;
        }
        return {
          ...parsedGoal,
          id: parsedGoal.id || item.setting_key,
          name: parsedGoal.name || 'Unbenanntes Ziel',
          event_type: parsedGoal.event || parsedGoal.event_type || 'purchase',
          target_value: parsedGoal.value || parsedGoal.target_value || 0,
          is_active: parsedGoal.is_active !== false
        };
      }).filter(Boolean) || [];

      setConversionGoals(goals);

      const startDate = getStartDate(selectedTimeRange);

      const funnelSteps = [
        { name: 'Website-Besucher', query: { event_type: 'page_view' } },
        { name: 'Shop-Besucher', query: { event_type: 'page_view', page_url: '/shop' } },
        { name: 'Produktansichten', query: { event_type: 'view_item' } },
        { name: 'Warenkorb', query: { event_type: 'add_to_cart' } },
        { name: 'Checkout begonnen', query: { event_type: 'begin_checkout' } },
        { name: 'Käufe abgeschlossen', query: { event_type: 'purchase' } }
      ];

      const funnelResults: FunnelStep[] = [];
      for (const step of funnelSteps) {
        const { count } = await supabase
          .from('analytics_events')
          .select('*', { count: 'exact', head: true })
          .eq('event_type', step.query.event_type)
          .gte('timestamp', startDate);

        funnelResults.push({
          ...step,
          count: count || 0,
          percentage: 0
        });
      }

      if (funnelResults.length > 0) {
        const baseCount = funnelResults[0].count;
        funnelResults.forEach((step, index) => {
          step.percentage = baseCount > 0 ? Number(((step.count / baseCount) * 100).toFixed(1)) : 0;
          step.dropOffRate = index > 0 ? Number(((funnelResults[index - 1].count - step.count) / funnelResults[index - 1].count * 100).toFixed(1)) : 0;
        });
      }

      setFunnelData(funnelResults);
    } catch (error) {
      console.error('Error loading conversion data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStartDate = (range: string): string => {
    const now = new Date();
    switch (range) {
      case '1d':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const addConversionGoal = async () => {
    if (!newGoal.name) return;

    try {
      const goalId = Date.now().toString();
      const goal = { 
        ...newGoal, 
        id: goalId, 
        created_at: new Date().toISOString(),
        event_type: newGoal.event,
        target_value: typeof newGoal.value === 'string' ? parseFloat(newGoal.value) || 0 : newGoal.value || 0
      };

      const { error } = await supabase
        .from('app_settings')
        .insert({
          setting_type: 'conversion_goals',
          setting_key: goalId,
          setting_value: JSON.stringify(goal),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setConversionGoals(prev => [...prev, goal]);
      setShowAddGoal(false);
      setNewGoal({ name: '', event: '', value: '', is_active: true });
    } catch (error) {
      console.error('Error adding conversion goal:', error);
    }
  };

  const getConversionRate = () => {
    const visitors = funnelData.find(step => step.name === 'Website-Besucher')?.count || 0;
    const conversions = funnelData.find(step => step.name === 'Käufe abgeschlossen')?.count || 0;
    return visitors > 0 ? ((conversions / visitors) * 100).toFixed(2) : '0.00';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="w-12 h-12 flex items-center justify-center bg-green-100 rounded-full mx-auto mb-4 animate-pulse">
          <i className="ri-target-line text-2xl text-green-600"></i>
        </div>
        <p className="text-lg font-medium text-gray-700">Lade Conversion Tracking...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 flex items-center justify-center bg-green-100 rounded-full mr-3">
              <i className="ri-target-line text-green-600"></i>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1A1A1A]">Conversion Tracking</h2>
              <p className="text-gray-600">Verfolgen Sie Ihre Marketing-Ziele und Conversion-Raten</p>
            </div>
          </div>

          <div className="flex gap-3">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 cursor-pointer pr-8"
            >
              <option value="1d">Letzter Tag</option>
              <option value="7d">Letzte 7 Tage</option>
              <option value="30d">Letzte 30 Tage</option>
            </select>

            <button
              onClick={() => setShowAddGoal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-add-line mr-2"></i>
              Neues Ziel
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-3xl font-bold text-green-600">{getConversionRate()}%</p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center bg-green-100 rounded-lg">
              <i className="ri-percent-line text-green-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gesamtbesucher</p>
              <p className="text-3xl font-bold text-blue-600">
                {funnelData.find(step => step.name === 'Website-Besucher')?.count || 0}
              </p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center bg-blue-100 rounded-lg">
              <i className="ri-user-line text-blue-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Abgeschlossene Käufe</p>
              <p className="text-3xl font-bold text-purple-600">
                {funnelData.find(step => step.name === 'Käufe abgeschlossen')?.count || 0}
              </p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center bg-purple-100 rounded-lg">
              <i className="ri-shopping-cart-line text-purple-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aktive Ziele</p>
              <p className="text-3xl font-bold text-orange-600">
                {conversionGoals.filter(goal => goal.is_active).length}
              </p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center bg-orange-100 rounded-lg">
              <i className="ri-flag-line text-orange-600 text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-bold text-[#1A1A1A] mb-6">Conversion Funnel</h3>

        <div className="space-y-4">
          {funnelData.map((step, index) => (
            <div key={step.name} className="relative">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 flex items-center justify-center bg-green-100 rounded-full mr-4 text-sm font-bold text-green-700">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{step.name}</h4>
                    <p className="text-sm text-gray-500">
                      {step.percentage}% der Gesamtbesucher
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xl font-bold text-[#1A1A1A]">{step.count}</p>
                  {index > 0 && step.dropOffRate !== undefined && step.dropOffRate > 0 && (
                    <p className="text-sm text-red-600">
                      -{step.dropOffRate}% Abbruch
                    </p>
                  )}
                </div>
              </div>

              {/* Funnel Visualization */}
              <div className="mt-2 relative">
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${step.percentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Drop-off Arrow */}
              {index < funnelData.length - 1 && (
                <div className="flex justify-center mt-2 mb-2">
                  <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[12px] border-l-transparent border-r-transparent border-t-gray-300"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Conversion Goals */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-[#1A1A1A]">Conversion-Ziele</h3>
          <button
            onClick={() => setShowAddGoal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-add-line mr-2"></i>
            Ziel hinzufügen
          </button>
        </div>

        {conversionGoals.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
              <i className="ri-target-line text-2xl text-gray-400"></i>
            </div>
            <h4 className="text-lg font-medium text-gray-600 mb-2">Keine Conversion-Ziele definiert</h4>
            <p className="text-gray-500">Erstellen Sie Ihr erstes Conversion-Ziel für besseres Tracking.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {conversionGoals.map((goal) => (
              <div key={goal.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-800">{goal.name}</h4>
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${goal.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {goal.is_active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Event-Typ:</span>
                    <span className="font-medium">{goal.event_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Zielwert:</span>
                    <span className="font-medium">{goal.target_value}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Goal Modal */}
      {showAddGoal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#1A1A1A]">Neues Conversion-Ziel</h3>
                <button
                  onClick={() => setShowAddGoal(false)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ziel-Name</label>
                <input
                  type="text"
                  value={newGoal.name}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="z.B. Online-Kauf abgeschlossen"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event-Typ</label>
                <select
                  value={newGoal.event}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, event: e.target.value }))}
                  className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent cursor-pointer"
                >
                  <option value="purchase">Kauf abgeschlossen</option>
                  <option value="add_to_cart">Zum Warenkorb hinzugefügt</option>
                  <option value="begin_checkout">Checkout begonnen</option>
                  <option value="view_item">Produkt angesehen</option>
                  <option value="contact_form">Kontaktformular gesendet</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Zielwert (optional)</label>
                <input
                  type="number"
                  value={newGoal.value}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="100"
                />
              </div>

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={newGoal.is_active}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="mr-3"
                />
                <span className="text-sm font-medium text-gray-700">Ziel sofort aktivieren</span>
              </label>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={addConversionGoal}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
              >
                Ziel erstellen
              </button>
              <button
                onClick={() => setShowAddGoal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
