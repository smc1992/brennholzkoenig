
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// Using the centralized Supabase client from lib/supabase.ts

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    street: '',
    house_number: '',
    city: '',
    postal_code: '',
    country: 'Deutschland',
    date_of_birth: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Sie müssen angemeldet sein');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setProfile({
        email: user.email || '',
        first_name: data?.first_name || '',
        last_name: data?.last_name || '',
        phone: data?.phone || '',
        street: data?.street || '',
        house_number: data?.house_number || '',
        city: data?.city || '',
        postal_code: data?.postal_code || '',
        country: data?.country || 'Deutschland',
        date_of_birth: data?.date_of_birth || ''
      });
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      setError('Fehler beim Laden des Profils: ' + (error.message || 'Unbekannter Fehler'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nicht angemeldet');

      const updateData = {
        id: user.id,
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone || null,
        street: profile.street || null,
        house_number: profile.house_number || null,
        city: profile.city || null,
        postal_code: profile.postal_code || null,
        country: profile.country,
        date_of_birth: profile.date_of_birth || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('customers')
        .upsert(updateData, {
          onConflict: 'id'
        });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      setMessage('Profil erfolgreich aktualisiert!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      console.error('Update error:', error);
      setError('Fehler beim Speichern: ' + (error.message || 'Unbekannter Fehler'));
    } finally {
      setSaving(false);
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail || !currentPassword) {
      setError('Bitte füllen Sie alle Felder aus');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const { error: updateError } = await supabase.auth.updateUser({
        email: newEmail,
        password: currentPassword
      });

      if (updateError) throw updateError;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('customers')
          .update({
            email: newEmail,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
      }

      setMessage('E-Mail-Adresse wurde geändert. Bitte bestätigen Sie die neue E-Mail-Adresse.');
      setShowEmailModal(false);
      setNewEmail('');
      setCurrentPassword('');
      setTimeout(() => {
        supabase.auth.signOut();
        window.location.href = '/konto';
      }, 3000);
    } catch (error: any) {
      setError('Fehler beim Ändern der E-Mail: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'LÖSCHEN') {
      setError('Bitte geben Sie "LÖSCHEN" ein, um fortzufahren');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nicht angemeldet');

      await supabase
        .from('customers')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          first_name: 'Gelöschter',
          last_name: 'Benutzer',
          email: `deleted_${user.id}@deleted.local`,
          phone: null,
          street: null,
          house_number: null,
          city: null,
          postal_code: null,
          date_of_birth: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      await supabase
        .from('customer_addresses')
        .delete()
        .eq('customer_id', user.id);

      await supabase
        .from('wishlist')
        .delete()
        .eq('customer_id', user.id);

      const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
      if (authError) console.warn('Auth deletion warning:', authError);

      setMessage('Ihr Konto wurde erfolgreich gelöscht.');
      setTimeout(() => {
        supabase.auth.signOut();
        window.location.href = '/';
      }, 2000);
    } catch (error: any) {
      console.error('Delete error:', error);
      setError('Fehler beim Löschen des Kontos: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8 dashboard-page">
        <div className="mb-8">
          <Link href="/konto/dashboard" className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-4">
            <i className="ri-arrow-left-line mr-2"></i>
            Zurück zum Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Mein Profil</h1>
          <p className="text-gray-600 mt-2">Verwalten Sie Ihre persönlichen Daten</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Persönliche Informationen</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {message && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <i className="ri-check-line text-green-600 mr-2"></i>
                  <span className="text-green-800 text-sm">{message}</span>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <i className="ri-error-warning-line text-red-600 mr-2"></i>
                  <span className="text-red-800 text-sm">{error}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vorname *
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={profile.first_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nachname *
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={profile.last_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-Mail-Adresse
                </label>
                <div className="flex gap-3">
                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    disabled
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmailModal(true)}
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    E-Mail ändern
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefonnummer
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={profile.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Straße
                </label>
                <input
                  type="text"
                  name="street"
                  value={profile.street}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hausnummer
                </label>
                <input
                  type="text"
                  name="house_number"
                  value={profile.house_number}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postleitzahl
                </label>
                <input
                  type="text"
                  name="postal_code"
                  value={profile.postal_code}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stadt
                </label>
                <input
                  type="text"
                  name="city"
                  value={profile.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Land
                </label>
                <select
                  name="country"
                  value={profile.country}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="Deutschland">Deutschland</option>
                  <option value="Österreich">Österreich</option>
                  <option value="Schweiz">Schweiz</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Geburtsdatum (optional)
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={profile.date_of_birth}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                  {saving ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Wird gespeichert...
                    </div>
                  ) : (
                    'Änderungen speichern'
                  )}
                </button>

                <Link
                  href="/konto/dashboard"
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  Abbrechen
                </Link>
              </div>

              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
              >
                <i className="ri-delete-bin-line mr-2"></i>
                Konto löschen
              </button>
            </div>
          </form>
        </div>
      </div>

      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">E-Mail-Adresse ändern</h3>
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  setNewEmail('');
                  setCurrentPassword('');
                  setError('');
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Neue E-Mail-Adresse *
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="neue@email.de"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aktuelles Passwort bestätigen *
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Aktuelles Passwort"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <i className="ri-information-line text-blue-600 mr-2 mt-0.5"></i>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Wichtiger Hinweis:</p>
                    <p>
                      Sie erhalten eine Bestätigungs-E-Mail an Ihre neue Adresse. Nach der Bestätigung werden Sie automatisch
                      abgemeldet und müssen sich mit der neuen E-Mail-Adresse anmelden.
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <i className="ri-error-warning-line text-red-600 mr-2"></i>
                    <span className="text-red-800 text-sm">{error}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowEmailModal(false);
                    setNewEmail('');
                    setCurrentPassword('');
                    setError('');
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleEmailChange}
                  disabled={saving || !newEmail || !currentPassword}
                  className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                  {saving ? 'Wird geändert...' : 'E-Mail ändern'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-red-900">Konto löschen</h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                  setError('');
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <i className="ri-alert-line text-red-600 mr-2 mt-0.5"></i>
                  <div className="text-sm text-red-800">
                    <p className="font-medium mb-2">Achtung: Diese Aktion kann nicht rückgängig gemacht werden!</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Ihr Konto wird dauerhaft gelöscht</li>
                      <li>Alle persönlichen Daten werden entfernt</li>
                      <li>Ihre Wunschliste und gespeicherten Adressen werden gelöscht</li>
                      <li>Sie werden automatisch abgemeldet</li>
                      <li>Bestellhistorie bleibt für administrative Zwecke erhalten</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Geben Sie "LÖSCHEN" ein, um zu bestätigen:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="LÖSCHEN"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <i className="ri-error-warning-line text-red-600 mr-2"></i>
                    <span className="text-red-800 text-sm">{error}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText('');
                    setError('');
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={saving || deleteConfirmText !== 'LÖSCHEN'}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                  {saving ? 'Wird gelöscht...' : 'Konto löschen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
