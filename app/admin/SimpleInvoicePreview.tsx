'use client';
import { useState, useEffect } from 'react';

interface SimpleInvoicePreviewProps {
  customSettings: Record<string, string>;
}

export default function SimpleInvoicePreview({ customSettings }: SimpleInvoicePreviewProps) {
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generatePreview = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/invoice-preview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customSettings
          }),
        });

        const data = await response.json();
        
        if (data.success && data.html) {
          setHtml(data.html);
        } else {
          setError(data.error || 'Fehler beim Generieren der Vorschau');
        }
      } catch (err) {
        setError('Netzwerkfehler beim Laden der Vorschau');
        console.error('Preview error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (customSettings && Object.keys(customSettings).length > 0) {
      generatePreview();
    }
  }, [customSettings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Puppeteer-Vorschau wird generiert...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-red-600 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-600 font-medium text-sm">Fehler beim Laden</p>
          <p className="text-gray-600 text-xs mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!html) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Keine Vorschau verfügbar</p>
      </div>
    );
  }

  return (
    <iframe
      srcDoc={html}
      className="w-full h-full border-0"
      title="Puppeteer Rechnungsvorschau"
      style={{ minHeight: '600px' }}
    />
  );
}