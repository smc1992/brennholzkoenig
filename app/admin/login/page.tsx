'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  is_active: boolean;
}

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Cross-Browser Admin-Authentifizierung mit automatischen Fallbacks
      console.log('🔐 Starting cross-browser admin login for:', email);
      
      let authResult;
      let adminResult;
      
      try {
        // Primäre Authentifizierung mit Standard Supabase Client
        console.log('📡 Attempting primary authentication...');
        authResult = await supabase.auth.signInWithPassword({ 
          email: email.trim().toLowerCase(), 
          password: password 
        });
        
        if (authResult.error) {
          throw new Error(`Auth failed: ${authResult.error.message}`);
        }
        
        console.log('✅ Primary authentication successful');
        
      } catch (primaryError: any) {
         console.warn('⚠️ Primary auth failed, trying fallback:', primaryError.message);
        
        try {
          // Fallback: Direkte API-Route für problematische Browser
          console.log('🔄 Attempting API fallback authentication...');
          
          const response = await fetch('/api/auth/admin-login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: email.trim().toLowerCase(),
              password: password
            })
          });
          
          if (!response.ok) {
            throw new Error(`API auth failed: ${response.status}`);
          }
          
          const apiResult = await response.json();
          
          if (!apiResult.success) {
            throw new Error(apiResult.error || 'API authentication failed');
          }
          
          // Simuliere Supabase Auth Response für einheitliche Behandlung
          authResult = {
            data: {
              user: apiResult.user,
              session: apiResult.session
            },
            error: null
          };
          
          console.log('✅ API fallback authentication successful');
          
        } catch (fallbackError: any) {
           console.error('❌ All authentication methods failed:', fallbackError.message);
          throw new Error('Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.');
        }
      }
      
      if (!authResult.data?.user) {
        throw new Error('Keine Benutzerdaten erhalten');
      }
      
      // Admin-Berechtigung prüfen
      console.log('🔍 Verifying admin access...');
      
      try {
        adminResult = await supabase
          .from('admin_users')
          .select('id, email, name, role, is_active')
          .eq('email', email.trim().toLowerCase())
          .eq('is_active', true)
          .maybeSingle();
          
        if (adminResult.error) {
          throw new Error(`Admin check failed: ${adminResult.error.message}`);
        }
        
      } catch (adminError: any) {
         console.warn('⚠️ Direct admin check failed, trying API fallback:', adminError.message);
        
        try {
          const response = await fetch(`/api/auth/check-admin?email=${encodeURIComponent(email)}`);
          const apiResult = await response.json();
          
          if (!apiResult.success || !apiResult.admin) {
            throw new Error('No admin access found');
          }
          
          adminResult = { data: apiResult.admin, error: null };
          
        } catch (fallbackError) {
          await supabase.auth.signOut();
          throw new Error('Admin-Berechtigung konnte nicht überprüft werden');
        }
      }
      
      if (!adminResult.data) {
        await supabase.auth.signOut();
        throw new Error('Kein Admin-Zugang für diese E-Mail-Adresse');
      }
      
      console.log('✅ Admin access confirmed:', adminResult.data.email);
      
      // Cross-Browser Navigation mit progressiven Fallbacks
      console.log('🚀 Redirecting to admin dashboard...');
      
      // Sofortige Navigation für moderne Browser
      try {
        router.push('/admin');
        
        // Fallback nach 1 Sekunde für langsamere Browser
        setTimeout(() => {
          if (window.location.pathname === '/admin/login') {
            console.log('🔄 Using window.location fallback');
            window.location.href = '/admin';
          }
        }, 1000);
        
      } catch (navError) {
        console.warn('Router failed, using direct navigation:', navError);
        window.location.href = '/admin';
      }
      
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.message?.includes('timeout')) {
        setError('Verbindung zu langsam - bitte erneut versuchen');
      } else if (error.message?.includes('Invalid login credentials')) {
        setError('Ungültige E-Mail oder Passwort');
      } else {
        setError(error.message || 'Login fehlgeschlagen');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#C04020] to-[#A03318] p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 flex items-center justify-center bg-[#C04020] rounded-full mx-auto mb-4">
            <i className="ri-admin-line text-3xl text-white"></i>
          </div>
          <h1 className="text-2xl font-black text-[#1A1A1A] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            ADMIN LOGIN
          </h1>
          <p className="text-gray-600">
            Brennholzkönig Admin-Bereich
          </p>
          
          {/* Performance Indicator */}
          <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>SSR-optimiert</span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-5 h-5 flex items-center justify-center mr-3 text-red-500">
                  <i className="ri-error-warning-line"></i>
                </div>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-[#1A1A1A] mb-2">
              E-Mail-Adresse
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <div className="w-5 h-5 flex items-center justify-center text-gray-400">
                  <i className="ri-mail-line"></i>
                </div>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#C04020] transition-colors"
                placeholder="admin@brennholzkoenig.de"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#1A1A1A] mb-2">
              Passwort
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <div className="w-5 h-5 flex items-center justify-center text-gray-400">
                  <i className="ri-lock-line"></i>
                </div>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#C04020] transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className={`w-full py-3 px-6 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
              isLoading || !email || !password
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#C04020] text-white hover:bg-[#A03318] hover:shadow-lg'
            }`}
          >
            {isLoading ? (
              <>
                <i className="ri-loader-4-line mr-2 animate-spin"></i>
                Anmeldung läuft...
              </>
            ) : (
              <>
                <i className="ri-login-circle-line mr-2"></i>
                Anmelden
              </>
            )}
          </button>
        </form>

        {/* Demo Access Info */}
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start">
            <div className="w-5 h-5 flex items-center justify-center mr-3 text-green-600 mt-0.5">
              <i className="ri-key-line"></i>
            </div>
            <div className="text-sm text-green-800">
              <p className="font-medium mb-1">Admin-Zugangsdaten:</p>
              <p className="text-xs mb-1">
                <strong>E-Mail:</strong> info@brennholz-koenig.de
              </p>
              <p className="text-xs">
                <strong>Passwort:</strong> brennholz2024
              </p>
            </div>
          </div>
        </div>
        
        {/* Performance Info */}
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-center space-x-2 text-xs text-blue-700">
            <i className="ri-rocket-line"></i>
            <span>Performance-optimiert mit SSR und Middleware-Schutz</span>
          </div>
        </div>
      </div>
    </div>
  );
}