
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface AdminLoginProps {
  onLogin: (user: any) => void;
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  // Using the centralized Supabase client from lib/supabase.ts

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Optimierte Authentifizierung mit Timeout
      const authPromise = Promise.race([
        supabase.auth.signInWithPassword({ email, password }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Login timeout - Verbindung zu langsam')), 10000)
        )
      ]) as Promise<{ data: any, error: any }>;

      const { data: authData, error: authError } = await authPromise;

      if (authError) {
        throw authError;
      }

      // Parallele Admin-Prüfung mit Timeout
      const adminPromise = Promise.race([
        supabase
          .from('admin_users')
          .select('id, email, name, role, is_active')
          .eq('email', email)
          .eq('is_active', true)
          .single(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Admin-Prüfung timeout')), 5000)
        )
      ]) as Promise<{ data: any, error: any }>;

      const { data: adminData, error: adminError } = await adminPromise;

      if (adminError || !adminData) {
        await supabase.auth.signOut();
        if (adminError?.message === 'Admin-Prüfung timeout') {
          throw new Error('Datenbank-Verbindung zu langsam');
        }
        throw new Error('Kein Admin-Zugang für diese E-Mail-Adresse');
      }

      // Erfolgreicher Login - onLogin aufrufen
      onLogin(adminData);
      
      console.log('Admin login successful:', email);
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
            HÄNDLER LOGIN
          </h1>
          <p className="text-gray-600">
            Brennholzkönig Admin-Bereich
          </p>
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
      </div>
    </div>
  );
}
