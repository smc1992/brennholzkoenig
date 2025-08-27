
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Using the centralized Supabase client from lib/supabase.ts

  const [password, setPassword] = useState('');
  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/konto/passwort-zuruecksetzen`,
      });

      if (error) throw error;

      setMessage('Wir haben Ihnen eine E-Mail mit Anweisungen zum Zurücksetzen Ihres Passworts gesendet. Bitte prüfen Sie auch Ihren Spam-Ordner.');
    } catch (error: any) {
      setError(error.message || 'Fehler beim Senden der E-Mail');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-lock-line text-2xl text-orange-600"></i>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Passwort vergessen?
            </h1>
            <p className="text-gray-600">
              Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen
            </p>
          </div>

          <form onSubmit={handleResetRequest} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-Mail-Adresse
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                required
                placeholder="ihre@email.de"
              />
            </div>

            {error && (
              <div className="p-4 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">
                {error}
              </div>
            )}

            {message && (
              <div className="p-4 rounded-lg text-sm bg-green-50 text-green-700 border border-green-200">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {loading ? 'Wird gesendet...' : 'Link zum Zurücksetzen senden'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center space-y-4">
            <Link href="/konto" className="block text-orange-600 hover:text-orange-700 font-medium cursor-pointer">
              ← Zurück zur Anmeldung
            </Link>

            <div className="text-sm text-gray-500">
              <p>Probleme? Kontaktieren Sie uns:</p>
              <p className="font-medium text-gray-700">info@brennholz-koenig.de</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
