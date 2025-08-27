
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { safeJsonParse, safeJsonStringify } from '../../lib/jsonHelper';

interface PriceRule {
  id: string;
  name: string;
  product_ids: string[];
  adjustment_type: 'percentage' | 'fixed';
  adjustment_value: number;
  schedule_type: 'daily' | 'weekly' | 'monthly' | 'custom';
  schedule_time: string;
  active: boolean;
  last_run: string | null;
  next_run: string;
}

export default function AutomationTab() {
  const [priceRules, setPriceRules] = useState<PriceRule[]>([]);
  interface Product {
    id: string;
    name: string;
    price: number;
  }

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddRule, setShowAddRule] = useState(false);
  const [message, setMessage] = useState('');
  const [newRule, setNewRule] = useState<{
    name: string;
    product_ids: string[];
    adjustment_type: 'percentage' | 'fixed';
    adjustment_value: number;
    schedule_type: 'daily' | 'weekly' | 'monthly' | 'custom';
    schedule_time: string;
    active: boolean;
  }>({
    name: '',
    product_ids: [],
    adjustment_type: 'percentage',
    adjustment_value: 0,
    schedule_type: 'weekly',
    schedule_time: '09:00',
    active: true
  });

  // Using the centralized Supabase client from lib/supabase.ts

  useEffect(() => {
    loadPriceRules();
    loadProducts();
  }, []);

  const loadPriceRules = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_type', 'price_automation');

      if (data) {
        const rules = data.map(item => {
          const parsed = safeJsonParse(item.setting_value, null);
          return parsed;
        }).filter(Boolean);
        setPriceRules(rules);
      }
    } catch (error) {
      console.error('Error loading price rules:', error);
      setPriceRules([]);
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const saveRule = async () => {
    if (!newRule.name || newRule.product_ids.length === 0) {
      setMessage('Bitte Name und mindestens ein Produkt auswählen');
      return;
    }

    setLoading(true);
    try {
      const ruleId = Date.now().toString();
      const nextRun = calculateNextRun(newRule.schedule_type, newRule.schedule_time);

      const rule: PriceRule = {
        ...newRule,
        id: ruleId,
        last_run: null,
        next_run: nextRun
      };

      const { error } = await supabase
        .from('app_settings')
        .insert({
          setting_type: 'price_automation',
          setting_key: ruleId,
          setting_value: safeJsonStringify(rule),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setPriceRules(prev => [...prev, rule]);
      setShowAddRule(false);
      setNewRule({
        name: '',
        product_ids: [],
        adjustment_type: 'percentage',
        adjustment_value: 0,
        schedule_type: 'weekly',
        schedule_time: '09:00',
        active: true
      });
      setMessage('Preisregel erfolgreich erstellt!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving rule:', error);
      setMessage('Fehler beim Speichern der Regel');
    } finally {
      setLoading(false);
    }
  };

  const calculateNextRun = (scheduleType: string, scheduleTime: string): string => {
    const now = new Date();
    const [hours, minutes] = scheduleTime.split(':').map(Number);

    let nextRun = new Date();
    nextRun.setHours(hours, minutes, 0, 0);

    switch (scheduleType) {
      case 'daily':
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + (7 - nextRun.getDay())); // Nächster Sonntag
        break;
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1);
        nextRun.setDate(1);
        break;
    }

    return nextRun.toISOString();
  };

  const toggleRule = async (ruleId: string) => {
    setLoading(true);
    try {
      const rule = priceRules.find(r => r.id === ruleId);
      if (!rule) return;

      const updatedRule = { ...rule, active: !rule.active };

      const { error } = await supabase
        .from('app_settings')
        .update({
          setting_value: safeJsonStringify(updatedRule),
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', ruleId);

      if (error) throw error;

      setPriceRules(prev => prev.map(r => r.id === ruleId ? updatedRule : r));
      setMessage(`Regel ${updatedRule.active ? 'aktiviert' : 'deaktiviert'}!`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error toggling rule:', error);
      setMessage('Fehler beim Ändern der Regel');
    } finally {
      setLoading(false);
    }
  };

  const runRuleNow = async (ruleId: string) => {
    setLoading(true);
    try {
      const rule = priceRules.find(r => r.id === ruleId);
      if (!rule) return;

      // Preise aktualisieren
      for (const productId of rule.product_ids) {
        const product = products.find(p => p.id === productId);
        if (!product) continue;

        // Ensure price is treated as a number
        let newPrice = typeof product.price === 'string' ? parseFloat(product.price) : product.price;

        if (rule.adjustment_type === 'percentage') {
          newPrice = newPrice * (1 + rule.adjustment_value / 100);
        } else {
          newPrice = newPrice + rule.adjustment_value;
        }

        await supabase
          .from('products')
          .update({ price: newPrice.toFixed(2) })
          .eq('id', productId);
      }

      // Regel aktualisieren
      const updatedRule = {
        ...rule,
        last_run: new Date().toISOString(),
        next_run: calculateNextRun(rule.schedule_type, rule.schedule_time)
      };

      await supabase
        .from('app_settings')
        .update({
          setting_value: safeJsonStringify(updatedRule),
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', ruleId);

      setPriceRules(prev => prev.map(r => r.id === ruleId ? updatedRule : r));
      setMessage(`Preisregel "${rule.name}" erfolgreich ausgeführt!`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error running rule:', error);
      setMessage('Fehler beim Ausführen der Regel');
    } finally {
      setLoading(false);
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm('Regel wirklich löschen?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .delete()
        .eq('setting_key', ruleId);

      if (error) throw error;

      setPriceRules(prev => prev.filter(r => r.id !== ruleId));
      setMessage('Regel erfolgreich gelöscht!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting rule:', error);
      setMessage('Fehler beim Löschen der Regel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#1A1A1A]">Zeitgesteuerte Preisaktionen</h2>
              <p className="text-gray-600 mt-1">Automatische Preisanpassungen nach Zeitplan</p>
            </div>
            <button
              onClick={() => setShowAddRule(true)}
              className="bg-[#C04020] hover:bg-[#A03318] text-white px-4 py-2 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-add-line mr-2"></i>
              Neue Regel
            </button>
          </div>
        </div>

        {message && (
          <div className={`mx-6 mt-4 px-4 py-2 rounded-lg text-sm font-medium ${
            message.includes('erfolgreich')
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}

        {/* Regel hinzufügen */}
        {showAddRule && (
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Neue Preisregel erstellen</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Regelname
                </label>
                <input
                  type="text"
                  value={newRule.name}
                  onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                  placeholder="z.B. Sommerrabatt 10%"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Anpassungstyp
                </label>
                <select
                  value={newRule.adjustment_type}
                  onChange={(e) => setNewRule(prev => ({ ...prev, adjustment_type: e.target.value as 'percentage' | 'fixed' }))}
                  className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                >
                  <option value="percentage">Prozentual (%)</option>
                  <option value="fixed">Fester Betrag (€)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Anpassungswert
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newRule.adjustment_value}
                  onChange={(e) => setNewRule(prev => ({ ...prev, adjustment_value: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                  placeholder={newRule.adjustment_type === 'percentage' ? '10' : '5.00'}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {newRule.adjustment_type === 'percentage'
                    ? 'Positive Werte = Preiserhöhung, Negative = Preissenkung'
                    : 'In Euro - positive/negative Werte möglich'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Zeitplan
                </label>
                <div className="flex space-x-2">
                  <select
                    value={newRule.schedule_type}
                    onChange={(e) => setNewRule(prev => ({ ...prev, schedule_type: e.target.value as any }))}
                    className="flex-1 px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                  >
                    <option value="daily">Täglich</option>
                    <option value="weekly">Wöchentlich</option>
                    <option value="monthly">Monatlich</option>
                  </select>
                  <input
                    type="time"
                    value={newRule.schedule_time}
                    onChange={(e) => setNewRule(prev => ({ ...prev, schedule_time: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C04020] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Produkte auswählen
                </label>
                <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                  {products.map((product: any) => (
                    <label key={product.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newRule.product_ids.includes(product.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewRule(prev => ({ ...prev, product_ids: [...prev.product_ids, product.id] }));
                          } else {
                            setNewRule(prev => ({ ...prev, product_ids: prev.product_ids.filter(id => id !== product.id) }));
                          }
                        }}
                        className="mr-3"
                      />
                      <span className="text-sm">{product.name} (€{product.price})</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowAddRule(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium cursor-pointer whitespace-nowrap"
              >
                Abbrechen
              </button>
              <button
                onClick={saveRule}
                disabled={loading}
                className="bg-[#C04020] hover:bg-[#A03318] text-white px-6 py-2 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                {loading ? 'Speichert...' : 'Regel erstellen'}
              </button>
            </div>
          </div>
        )}

        {/* Regelliste */}
        <div className="p-6">
          {priceRules.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
                <i className="ri-timer-line text-2xl text-gray-400"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">Noch keine Preisregeln</h3>
              <p className="text-gray-500">Erstellen Sie zeitgesteuerte Preisaktionen für Ihre Produkte.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {priceRules.map((rule) => (
                <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-bold text-[#1A1A1A]">{rule.name}</h3>
                        <span
                          className={`px-2 py-1 text-xs font-bold rounded-full ${
                            rule.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {rule.active ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Anpassung:</span>
                          <p className="font-medium">
                            {rule.adjustment_value > 0 ? '+' : ''}{rule.adjustment_value}
                            {rule.adjustment_type === 'percentage' ? '%' : '€'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Zeitplan:</span>
                          <p className="font-medium">
                            {rule.schedule_type === 'daily' && 'Täglich'}
                            {rule.schedule_type === 'weekly' && 'Wöchentlich'}
                            {rule.schedule_type === 'monthly' && 'Monatlich'}
                            {` um ${rule.schedule_time}`}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Produkte:</span>
                          <p className="font-medium">{rule.product_ids.length} Produkte</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Nächste Ausführung:</span>
                          <p className="font-medium">
                            {new Date(rule.next_run).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                      </div>
                      {rule.last_run && (
                        <p className="text-sm text-gray-500 mt-2">
                          Zuletzt ausgeführt: {new Date(rule.last_run).toLocaleString('de-DE')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => toggleRule(rule.id)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                          rule.active
                            ? 'bg-red-100 hover:bg-red-200 text-red-800'
                            : 'bg-green-100 hover:bg-green-200 text-green-800'
                        }`}
                      >
                        {rule.active ? 'Deaktivieren' : 'Aktivieren'}
                      </button>
                      <button
                        onClick={() => runRuleNow(rule.id)}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Jetzt ausführen
                      </button>
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
