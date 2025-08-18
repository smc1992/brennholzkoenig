
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { safeJsonParse, safeJsonStringify } from '../../lib/jsonHelper';

export default function BackupTab() {
  interface Backup {
    id: string;
    name: string;
    timestamp: string;
    tables: string[];
    [key: string]: any; // For any additional properties
  }

  const [backups, setBackups] = useState<Backup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportTable, setExportTable] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const tables = [
    { key: 'all', name: 'Alle Daten' },
    { key: 'products', name: 'Produkte' },
    { key: 'customers', name: 'Kunden' },
    { key: 'orders', name: 'Bestellungen' },
    { key: 'order_items', name: 'Bestellpositionen' },
    { key: 'inventory_movements', name: 'Lagerbewegungen' },
    { key: 'pricing_tiers', name: 'Preisstaffeln' },
    { key: 'discount_codes', name: 'Rabattcodes' },
    { key: 'promotions', name: 'Aktionen' },
    { key: 'suppliers', name: 'Lieferanten' }
  ];

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_type', 'backup_history')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const backupList = data?.map(item => {
        const parsed = safeJsonParse(item.setting_value, null);
        return parsed;
      }).filter(Boolean) || [];

      setBackups(backupList);
    } catch (err: unknown) {
      console.error('Error loading backups:', err);
      setBackups([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createBackup = async (backupName: string, includeTables: string[]) => {
    setIsCreatingBackup(true);

    try {
      const backupData: { [key: string]: any } = {};

      for (const tableName of includeTables) {
        if (tableName === 'all') continue;

        const { data, error } = await supabase.from(tableName).select('*');
        if (error) throw error;
        backupData[tableName] = data;
      }

      const backup = {
        name: backupName,
        created_at: new Date().toISOString(),
        tables: includeTables,
        data: backupData,
        version: '1.0'
      };

      const backupInfo = {
        id: Date.now().toString(),
        name: backupName,
        filename: `backup_${new Date().toISOString().split('T')[0]}_${backupName
          .toLowerCase()
          .replace(/\s+/g, '_')}.json`,
        created_at: new Date().toISOString(),
        size: `${Math.round(JSON.stringify(backup).length / 1024)} KB`,
        type:
          includeTables.includes('all') || includeTables.length > 5
            ? 'full'
            : 'partial',
        tables_included: includeTables.filter(t => t !== 'all'),
        status: 'completed'
      };

      await supabase.from('app_settings').insert({
        setting_type: 'backup_history',
        setting_key: backupInfo.id,
        setting_value: safeJsonStringify(backupInfo),
        updated_at: new Date().toISOString()
      });

      const dataStr = JSON.stringify(backup, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = backupInfo.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert('Backup erfolgreich erstellt und heruntergeladen!');
      loadBackups();
    } catch (err: unknown) {
      console.error('Error creating backup:', err);
      alert('Fehler beim Erstellen des Backups');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const restoreBackup = async (file: File) => {
    if (!file) return;

    if (
      !confirm(
        'WARNUNG: Diese Aktion wird bestehende Daten überschreiben. Sind Sie sicher?'
      )
    )
      return;

    setIsRestoring(true);

    try {
      const text = await file.text();
      const backup = safeJsonParse(text, null);

      if (!backup) {
        throw new Error('Ungültige Backup-Datei - JSON-Format nicht erkannt');
      }

      if (!backup.data || !backup.tables || !Array.isArray(backup.tables)) {
        throw new Error('Backup-Format nicht kompatibel - data und tables Felder erforderlich');
      }

      for (const tableName of backup.tables) {
        if (tableName === 'all' || !backup.data[tableName]) continue;

        const tableData = backup.data[tableName];

        if (Array.isArray(tableData) && tableData.length > 0) {
          const { error: deleteError } = await supabase
            .from(tableName)
            .delete()
            .neq('id', 0);

          if (deleteError) throw deleteError;

          const { error: insertError } = await supabase
            .from(tableName)
            .insert(tableData);

          if (insertError) throw insertError;
        }
      }

      alert('Backup erfolgreich wiederhergestellt!');
      window.location.reload();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const userMessage = errorMessage.includes('JSON') ||
                        errorMessage.includes('Backup-Datei') ||
                        errorMessage.includes('ungültig')
        ? errorMessage
        : 'Fehler beim Wiederherstellen des Backups';

      console.error('Error restoring backup:', err);
      alert(userMessage);
    } finally {
      setIsRestoring(false);
    }
  };

  const exportData = async (): Promise<void> => {
    setIsExporting(true);

    try {
      let exportData: { [key: string]: any } = {};
      const tablesToExport =
        exportTable === 'all'
          ? tables.filter(t => t.key !== 'all').map(t => t.key)
          : [exportTable];

      for (const tableName of tablesToExport) {
        const { data, error } = await supabase.from(tableName).select('*');
        if (error) throw error;
        exportData[tableName] = data;
      }

      if (exportFormat === 'csv') {
        for (const [tableName, data] of Object.entries(exportData)) {
          if (!Array.isArray(data) || data.length === 0) continue;

          const headers = Object.keys(data[0]);
          const csvContent = [
            headers.join(','),
            ...data.map(row =>
              headers
                .map(header => JSON.stringify(row[header] ?? ''))
                .join(',')
            )
          ].join('\n');

          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${tableName}_export_${new Date()
            .toISOString()
            .split('T')[0]}.csv`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      } else {
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `data_export_${new Date()
          .toISOString()
          .split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      alert('Daten erfolgreich exportiert!');
    } catch (err: unknown) {
      console.error('Error exporting data:', err);
      alert('Fehler beim Exportieren der Daten');
    } finally {
      setIsExporting(false);
    }
  };

  const getBackupTypeColor = (type: string): string =>
    type === 'full' ? 'text-green-600 bg-green-100' : 'text-blue-600 bg-blue-100';

  const getBackupTypeText = (type: string): string => (type === 'full' ? 'Vollständig' : 'Teilweise');

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="w-12 h-12 flex items-center justify-center bg-[#C04020] rounded-full mx-auto mb-4 animate-pulse">
          <i className="ri-database-line text-2xl text-white"></i>
        </div>
        <p className="text-lg font-medium text-gray-700">Lade Backup-Optionen...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">Backup & Datenexport</h2>
          <p className="text-gray-600">Sichern und exportieren Sie Ihre Daten regelmäßig</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backup erstellen */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 flex items-center justify-center bg-green-100 rounded-full mr-3">
              <i className="ri-save-line text-green-600"></i>
            </div>
            <h3 className="text-xl font-bold text-[#1A1A1A]">Backup erstellen</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Backup-Name
              </label>
              <input
                type="text"
                id="backup-name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
                placeholder="Vollständiges Backup"
                defaultValue={`Backup ${new Date().toLocaleDateString('de-DE')}`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tabellen auswählen
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {tables.map(table => (
                  <label key={table.key} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="backup-table"
                      value={table.key}
                      defaultChecked={table.key === 'all'}
                      className="rounded text-[#C04020] focus:ring-[#C04020]"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        if (table.key === 'all' && e.target.checked) {
                          document.querySelectorAll('input[name="backup-table"]').forEach(cb => {
                            if (cb !== e.target) (cb as HTMLInputElement).checked = false;
                          });
                        }
                      }}
                    />
                    <span className="text-sm text-gray-700">{table.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                const nameInput = document.getElementById('backup-name');
                const backupName = nameInput && (nameInput as HTMLInputElement).value || `Backup_${new Date().toISOString().split('T')[0]}`;
                const checkboxes = document.querySelectorAll('input[name="backup-table"]:checked');
                const selectedTables = Array.from(checkboxes).map(cb => (cb as HTMLInputElement).value).filter(Boolean);

                if (selectedTables.length === 0) {
                  alert('Bitte wählen Sie mindestens eine Tabelle aus');
                  return;
                }

                createBackup(backupName, selectedTables);
              }}
              disabled={isCreatingBackup}
              className={`w-full py-3 px-4 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap ${
                isCreatingBackup
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isCreatingBackup ? (
                <>
                  <i className="ri-loader-4-line mr-2 animate-spin"></i>
                  Erstelle Backup...
                </>
              ) : (
                <>
                  <i className="ri-download-line mr-2"></i>
                  Backup erstellen & herunterladen
                </>
              )}
            </button>
          </div>
        </div>

        {/* Backup wiederherstellen */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 flex items-center justify-center bg-orange-100 rounded-full mr-3">
              <i className="ri-upload-line text-orange-600"></i>
            </div>
            <h3 className="text-xl font-bold text-[#1A1A1A]">Backup wiederherstellen</h3>
          </div>

          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <div className="w-5 h-5 flex items-center justify-center mr-2 text-red-600">
                  <i className="ri-alert-line"></i>
                </div>
                <h4 className="font-bold text-red-800">Warnung</h4>
              </div>
              <p className="text-sm text-red-700">
                Das Wiederherstellen eines Backups überschreibt alle aktuellen Daten!
                Erstellen Sie zuerst ein aktuelles Backup.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Backup-Datei auswählen
              </label>
              <input
                type="file"
                accept=".json"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    const label = document.querySelector('.custom-file-label');
                    if (label) (label as HTMLElement).textContent = file.name;
                  }
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-[#C04020] file:text-white hover:file:bg-[#A03318]"
                disabled={isRestoring}
              />

            </div>

            {isRestoring && (
              <div className="text-center py-4">
                <div className="w-8 h-8 flex items-center justify-center bg-[#C04020] rounded-full mx-auto mb-2 animate-pulse">
                  <i className="ri-loader-4-line text-white animate-spin"></i>
                </div>
                <p className="text-sm text-gray-600">Stelle Backup wieder her...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Datenexport */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 flex items-center justify-center bg-blue-100 rounded-full mr-3">
            <i className="ri-file-download-line text-blue-600"></i>
          </div>
          <h3 className="text-xl font-bold text-[#1A1A1A]">Datenexport</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export-Format
            </label>
            <select
              value={exportFormat}
              onChange={e => setExportFormat(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] cursor-pointer pr-8"
            >
              <option value="csv">CSV (Excel-kompatibel)</option>
              <option value="json">JSON (Strukturiert)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tabelle auswählen
            </label>
            <select
              value={exportTable}
              onChange={e => setExportTable(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] cursor-pointer pr-8"
            >
              {tables.map(table => (
                <option key={table.key} value={table.key}>
                  {table.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={exportData}
              disabled={isExporting}
              className={`w-full py-3 px-4 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap ${
                isExporting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isExporting ? (
                <>
                  <i className="ri-loader-4-line mr-2 animate-spin"></i>
                  Exportiere...
                </>
              ) : (
                <>
                  <i className="ri-download-2-line mr-2"></i>
                  Exportieren
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <div className="w-5 h-5 flex items-center justify-center mr-2 text-blue-600">
              <i className="ri-information-line"></i>
            </div>
            <h4 className="font-bold text-blue-800">Export-Informationen</h4>
          </div>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• CSV-Format eignet sich für Excel und andere Tabellenkalkulationen</li>
            <li>• JSON-Format behält die ursprüngliche Datenstruktur bei</li>
            <li>• Exportierte Dateien enthalten alle Daten der ausgewählten Tabelle(n)</li>
            <li>• Backups können zur Wiederherstellung verwendet werden</li>
          </ul>
        </div>
      </div>

      {/* Automatische Backups (Informationsbereich) */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 flex items-center justify-center bg-purple-100 rounded-full mr-3">
            <i className="ri-time-line text-purple-600"></i>
          </div>
          <h3 className="text-xl font-bold text-[#1A1A1A]">Backup-Empfehlungen</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="w-5 h-5 flex items-center justify-center mr-2 text-green-600">
                <i className="ri-calendar-line"></i>
              </div>
              <h4 className="font-bold text-green-800">Täglich</h4>
            </div>
            <p className="text-sm text-green-700">
              Bestellungen und Kundendaten sollten täglich gesichert werden.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="w-5 h-5 flex items-center justify-center mr-2 text-blue-600">
                <i className="ri-calendar-2-line"></i>
              </div>
              <h4 className="font-bold text-blue-800">Wöchentlich</h4>
            </div>
            <p className="text-sm text-blue-700">
              Vollständige Backups aller Daten einmal pro Woche erstellen.
            </p>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="w-5 h-5 flex items-center justify-center mr-2 text-orange-600">
                <i className="ri-shield-check-line"></i>
              </div>
              <h4 className="font-bold text-orange-800">Vor Updates</h4>
            </div>
            <p className="text-sm text-orange-700">
              Immer vor Systemupdates oder größeren Änderungen sichern.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
