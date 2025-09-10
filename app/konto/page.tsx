
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AccountPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Using the centralized Supabase client from lib/supabase.ts

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        // Handle mock client or missing configuration
        if (error && error.message?.includes('Mock client')) {
          setMessage('⚠️ Demo-Modus: Supabase-Datenbank ist nicht konfiguriert.\n\n📋 Zur Aktivierung der Authentifizierung:\n1. Erstellen Sie ein Supabase-Projekt\n2. Konfigurieren Sie NEXT_PUBLIC_SUPABASE_URL\n3. Konfigurieren Sie NEXT_PUBLIC_SUPABASE_ANON_KEY\n4. Starten Sie den Server neu');
          setLoading(false);
          return;
        }

        if (error) throw error;
        setMessage('Erfolgreich angemeldet!');
        window.location.href = '/konto/dashboard';
      } else {
        if (password !== confirmPassword) {
          throw new Error('Passwörter stimmen nicht überein');
        }

        if (password.length < 6) {
          throw new Error('Passwort muss mindestens 6 Zeichen lang sein');
        }

        // Schritt 1: Supabase Auth Registrierung
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
            },
          },
        });

        // Handle mock client or missing configuration
        if (authError && authError.message?.includes('Mock client')) {
          setMessage('⚠️ Demo-Modus: Supabase-Datenbank ist nicht konfiguriert.\n\n📋 Zur Aktivierung der Registrierung:\n1. Erstellen Sie ein Supabase-Projekt\n2. Konfigurieren Sie NEXT_PUBLIC_SUPABASE_URL\n3. Konfigurieren Sie NEXT_PUBLIC_SUPABASE_ANON_KEY\n4. Starten Sie den Server neu');
          setLoading(false);
          return;
        }

        if (authError) throw authError;

        // Schritt 2: Kundendaten in customers Tabelle speichern
        if (authData.user) {
          const { error: customerError } = await supabase
            .from('customers')
            .insert({
              id: authData.user.id,
              first_name: firstName,
              last_name: lastName,
              email: email,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (customerError) {
            console.error('Fehler beim Speichern der Kundendaten:', customerError);
            // Auth-Benutzer wurde bereits erstellt, also nicht als Fehler behandeln
          }
        }

        setMessage('Registrierung erfolgreich! Bitte prüfen Sie Ihre E-Mails zur Bestätigung.');
      }
    } catch (error: any) {
      console.error('Auth-Fehler:', error);
      setMessage(error.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 my-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isLogin ? 'Anmelden' : 'Registrieren'}
            </h1>
            <p className="text-gray-600">
              {isLogin ? 'Willkommen zurück!' : 'Neues Konto erstellen'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vorname *
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    required={!isLogin}
                    minLength={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nachname *
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    required={!isLogin}
                    minLength={2}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-Mail-Adresse *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Passwort * {!isLogin && <span className="text-xs text-gray-500">(mindestens 6 Zeichen)</span>}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                required
                minLength={6}
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Passwort bestätigen *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  required
                  minLength={6}
                />
              </div>
            )}

            {message && (
              <div
                className={`p-4 rounded-lg text-sm whitespace-pre-line ${
                  message.includes('Erfolg') || message.includes('erfolgreich')
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : message.includes('Demo-Modus') || message.includes('⚠️')
                    ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {loading ? 'Lädt...' : isLogin ? 'Anmelden' : 'Registrieren'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setMessage('');
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setFirstName('');
                setLastName('');
              }}
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              {isLogin
                ? 'Noch kein Konto? Jetzt registrieren'
                : 'Bereits registriert? Hier anmelden'}
            </button>
          </div>

          {isLogin && (
            <div className="text-center mt-6">
              <Link
                href="/konto/passwort-vergessen"
                className="text-orange-600 hover:text-orange-700 text-sm font-medium"
              >
                Passwort vergessen?
              </Link>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">
              ← Zurück zum Shop
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
