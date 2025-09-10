'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestLoginPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
      setUser(user);
    } catch (error) {
      console.error('Error checking login status:', error);
    }
  };

  const simulateLogin = () => {
    // Simulate login by setting localStorage
    localStorage.setItem('supabase.auth.token', JSON.stringify({
      user: {
        id: 'test-user-123',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' }
      },
      session: {
        access_token: 'test-token',
        user: {
          id: 'test-user-123',
          email: 'test@example.com'
        }
      }
    }));
    
    // Trigger a page reload to update header state
    window.location.reload();
  };

  const simulateLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('supabase.auth.token');
      setIsLoggedIn(false);
      setUser(null);
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Mobile Dropdown Test</h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 border border-gray-200 rounded">
            <p className="text-sm text-gray-800">
              <strong>Login Status:</strong> {isLoggedIn ? '✅ Eingeloggt' : '❌ Nicht eingeloggt'}<br/>
              {user && (
                <span><strong>User:</strong> {user.email}</span>
              )}
            </p>
          </div>
          
          {!isLoggedIn ? (
            <button 
              onClick={simulateLogin}
              className="block w-full bg-green-600 text-white text-center py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              🔐 Simuliere Login (für Dropdown-Test)
            </button>
          ) : (
            <button 
              onClick={simulateLogout}
              className="block w-full bg-red-600 text-white text-center py-3 px-4 rounded-lg hover:bg-red-700 transition-colors"
            >
              🚪 Ausloggen
            </button>
          )}
          
          <Link 
            href="/konto"
            className="block w-full bg-blue-600 text-white text-center py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔗 Zu /konto navigieren
          </Link>
          
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Test-Anleitung:</strong><br/>
              1. Klicke "Simuliere Login"<br/>
              2. Gehe zur Startseite<br/>
              3. Teste das mobile Account-Dropdown<br/>
              4. Prüfe ob Links funktionieren
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}