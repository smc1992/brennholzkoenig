'use client';

import Link from 'next/link';

export default function TestLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Login Test</h1>
        
        <div className="space-y-4">
          <p className="text-gray-600 text-center">
            Testen Sie die Navigation zum Login:
          </p>
          
          <Link 
            href="/konto"
            className="block w-full bg-blue-600 text-white text-center py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔗 Direkt zu /konto navigieren
          </Link>
          
          <button 
            onClick={() => window.location.href = '/konto'}
            className="block w-full bg-green-600 text-white text-center py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            🚀 Mit window.location zu /konto
          </button>
          
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Cache-Problem?</strong><br/>
              Drücken Sie <strong>Strg+F5</strong> (Windows) oder <strong>Cmd+Shift+R</strong> (Mac) für einen Hard-Refresh.
            </p>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              <strong>Aktueller Zeitstempel:</strong><br/>
              {new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}