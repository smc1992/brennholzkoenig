'use client';

import { useState } from 'react';
import { supabase, supabaseSafari } from '@/lib/supabase';

// Safari-spezifische Debug-Komponente für Login-Tests
export default function SafariDebugLogin() {
  const [email, setEmail] = useState('info@brennholz-koenig.de');
  const [password, setPassword] = useState('brennholz2024');
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState('');

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  const handleSafariLogin = async () => {
    setIsLoading(true);
    setError('');
    setLogs([]);
    
    try {
      addLog('🍎 Safari Debug Login gestartet');
      addLog(`📧 E-Mail: ${email}`);
      
      // Safari-spezifische Authentifizierung
      addLog('🔐 Starte Authentifizierung...');
      
      // Safari-spezifische Authentifizierung mit Fallback-Strategien
      let authResult;
      
      try {
         addLog('🔄 Versuche Standard-Supabase-Client...');
         authResult = await supabase.auth.signInWithPassword({ 
           email: email.trim().toLowerCase(), 
           password: password 
         });
       } catch (standardError: any) {
          addLog(`⚠️ Standard-Client fehlgeschlagen: ${standardError.message}`);
          addLog('🔄 Versuche Safari-spezifischen Client...');
          
          try {
            authResult = await supabaseSafari.auth.signInWithPassword({ 
              email: email.trim().toLowerCase(), 
              password: password 
            });
          } catch (safariError: any) {
            addLog(`❌ Safari-Client fehlgeschlagen: ${safariError.message}`);
            addLog('🔄 Versuche API-Route als Fallback...');
            
            try {
              // Fallback: Direkte API-Route für Safari
              const response = await fetch('/api/auth/safari-login', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email: email.trim().toLowerCase(),
                  password: password
                })
              });
              
              const apiResult = await response.json();
              addLog(`📡 API Response: ${JSON.stringify(apiResult, null, 2)}`);
              
              if (!response.ok || !apiResult.success) {
                throw new Error(apiResult.error || 'API-Login fehlgeschlagen');
              }
              
              // Simuliere Supabase Auth Response
              authResult = {
                data: {
                  user: apiResult.user,
                  session: apiResult.session
                },
                error: null
              };
              
              addLog('✅ API-Fallback erfolgreich!');
            } catch (apiError: any) {
              addLog(`❌ API-Fallback fehlgeschlagen: ${apiError.message}`);
              throw apiError;
            }
          }
       }
      
      addLog(`✅ Auth Response: ${JSON.stringify(authResult, null, 2)}`);
      
      if (authResult.error) {
        addLog(`❌ Auth Error: ${authResult.error.message}`);
        throw new Error(authResult.error.message);
      }
      
      if (!authResult.data?.user) {
        addLog('❌ Keine Benutzerdaten erhalten');
        throw new Error('Keine Benutzerdaten');
      }
      
      addLog(`✅ User authenticated: ${authResult.data.user.email}`);
      
      // Kurze Pause für Safari
      addLog('⏳ Warte 500ms für Safari-Kompatibilität...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Admin-Prüfung
      addLog('🔍 Prüfe Admin-Berechtigung...');
      
      // Admin-Berechtigung prüfen mit Safari-Fallback
      let adminResult;
      
      try {
        addLog('🔄 Versuche Admin-Prüfung mit Standard-Client...');
        adminResult = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', email.trim().toLowerCase())
          .eq('is_active', true)
          .maybeSingle();
      } catch (standardAdminError: any) {
         addLog(`⚠️ Standard Admin-Prüfung fehlgeschlagen: ${standardAdminError.message}`);
         addLog('🔄 Versuche Admin-Prüfung mit Safari-Client...');
        
        adminResult = await supabaseSafari
          .from('admin_users')
          .select('*')
          .eq('email', email.trim().toLowerCase())
          .eq('is_active', true)
          .maybeSingle();
      }
      
      addLog(`📊 Admin Response: ${JSON.stringify(adminResult, null, 2)}`);
      
      if (adminResult.error) {
        addLog(`❌ Admin Error: ${adminResult.error.message}`);
        try {
          await supabase.auth.signOut();
        } catch {
          await supabaseSafari.auth.signOut();
        }
        throw new Error(adminResult.error.message);
      }
      
      if (!adminResult.data) {
        addLog('❌ Kein Admin-Zugang gefunden');
        await supabase.auth.signOut();
        throw new Error('Kein Admin-Zugang');
      }
      
      addLog(`✅ Admin-Zugang bestätigt: ${adminResult.data.name}`);
      addLog('🚀 Login erfolgreich!');
      
      // Navigation testen
      addLog('🔄 Teste Navigation...');
      
      // Mehrere Navigation-Methoden testen
      setTimeout(() => {
        addLog('📍 Versuche window.location.href...');
        window.location.href = '/admin';
      }, 1000);
      
    } catch (error: any) {
      addLog(`💥 Fehler: ${error.message}`);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-6">
            🍎 Safari Debug Login
          </h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Login Form */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Login-Test</h2>
              
              <div>
                <label className="block text-sm font-medium mb-1">E-Mail:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Passwort:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={isLoading}
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleSafariLogin}
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? '🔄 Teste...' : '🍎 Safari Login Test'}
                </button>
                
                <button
                  onClick={clearLogs}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                >
                  🗑️ Logs löschen
                </button>
              </div>
              
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  <strong>Fehler:</strong> {error}
                </div>
              )}
            </div>
            
            {/* Debug Logs */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Debug Logs</h2>
              <div className="bg-black text-green-400 p-4 rounded-md h-96 overflow-y-auto font-mono text-sm">
                {logs.length === 0 ? (
                  <div className="text-gray-500">Keine Logs vorhanden...</div>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="mb-1">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          {/* Browser Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h3 className="font-semibold mb-2">Browser-Informationen:</h3>
            <div className="text-sm space-y-1">
              <div><strong>User Agent:</strong> {typeof navigator !== 'undefined' ? navigator.userAgent : 'Server-side'}</div>
              <div><strong>Platform:</strong> {typeof navigator !== 'undefined' ? navigator.platform : 'Server-side'}</div>
              <div><strong>Cookies aktiviert:</strong> {typeof navigator !== 'undefined' ? (navigator.cookieEnabled ? 'Ja' : 'Nein') : 'Unbekannt'}</div>
              <div><strong>Online:</strong> {typeof navigator !== 'undefined' ? (navigator.onLine ? 'Ja' : 'Nein') : 'Unbekannt'}</div>
              <div><strong>URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'Server-side'}</div>
            </div>
          </div>
          
          {/* Zurück zum normalen Login */}
          <div className="mt-6 text-center">
            <a 
              href="/admin/login" 
              className="text-blue-600 hover:text-blue-800 underline"
            >
              ← Zurück zum normalen Admin-Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}