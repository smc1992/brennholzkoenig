'use client';

import { useState } from 'react';

export default function DebugTemplatesPage() {
  const [testEmail, setTestEmail] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testOrderConfirmation = async () => {
    if (!testEmail) {
      alert('Bitte geben Sie eine E-Mail-Adresse ein');
      return;
    }

    setLoading(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/send-order-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerEmail: testEmail,
          customerName: 'Test Kunde',
          orderId: 'TEST-' + Date.now(),
          orderDate: new Date().toLocaleDateString('de-DE'),
          totalAmount: 99.99,
          deliveryAddress: 'Teststraße 123, 12345 Teststadt',
          orderItems: 'Test Brennholz - 1x Buche trocken (1 Raummeter)',
          adminEmail: 'admin@brennholzkoenig.de'
        }),
      });

      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const testSMTPConnection = async () => {
    setLoading(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/test-smtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">E-Mail Template Debug</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test E-Mail Versand</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test E-Mail-Adresse:
            </label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="test@example.com"
            />
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={testOrderConfirmation}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Sende...' : 'Test Bestellbestätigung'}
            </button>
            
            <button
              onClick={testSMTPConnection}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Teste...' : 'Test SMTP Verbindung'}
            </button>
          </div>

          {testResult && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Test Ergebnis:</h3>
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Debugging Hinweise</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Überprüfen Sie die SMTP-Konfiguration in der Datenbank</li>
            <li>Stellen Sie sicher, dass die E-Mail-Templates aktiv sind</li>
            <li>Prüfen Sie die Template-Schlüssel: 'order-confirmation' und 'order-shipped'</li>
            <li>Überprüfen Sie die E-Mail-Logs in der Konsole</li>
            <li>Testen Sie die SMTP-Verbindung separat</li>
          </ul>
        </div>
      </div>
    </div>
  );
}