
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Using the centralized Supabase client from lib/supabase.ts

interface Address {
  id?: string;
  customer_id: string;
  type: 'shipping' | 'billing';
  title: string;
  first_name: string;
  last_name: string;
  company?: string;
  street: string;
  house_number: string;
  postal_code: string;
  city: string;
  country: string;
  phone?: string;
  is_default: boolean;
  created_at?: string;
}

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  street?: string;
  house_number?: string;
  postal_code?: string;
  city?: string;
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<Partial<Address>>({
    type: 'shipping',
    title: 'Herr',
    first_name: '',
    last_name: '',
    company: '',
    street: '',
    house_number: '',
    postal_code: '',
    city: '',
    country: 'Deutschland',
    phone: '',
    is_default: false
  });

  useEffect(() => {
    loadAddresses();
    loadCustomerProfile();
  }, []);

  const loadCustomerProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setCustomer(data);
    } catch (error) {
      console.error('Fehler beim Laden des Kundenprofils:', error);
    }
  };

  const loadAddresses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('customer_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error('Fehler beim Laden der Adressen:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const addressData = {
        ...formData,
        customer_id: user.id
      };

      // Wenn Standard-Adresse, andere auf false setzen
      if (formData.is_default) {
        await supabase
          .from('customer_addresses')
          .update({ is_default: false })
          .eq('customer_id', user.id)
          .neq('id', editingAddress?.id || '0');
      }

      if (editingAddress) {
        const { error } = await supabase
          .from('customer_addresses')
          .update(addressData)
          .eq('id', editingAddress.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('customer_addresses')
          .insert([addressData]);

        if (error) throw error;
      }

      // Wenn das die erste Adresse ist oder als Standard markiert wurde,
      // auch das Kundenprofil aktualisieren für Konsistenz
      if (formData.is_default || addresses.length === 0) {
        await supabase
          .from('customers')
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone,
            street: formData.street,
            house_number: formData.house_number,
            postal_code: formData.postal_code,
            city: formData.city,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
      }

      await loadAddresses();
      await loadCustomerProfile();
      setShowForm(false);
      setEditingAddress(null);
      resetForm();
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern der Adresse');
    } finally {
      setSaving(false);
    }
  };

  const deleteAddress = async (id: string) => {
    if (!confirm('Möchten Sie diese Adresse wirklich löschen?')) return;

    try {
      const { error } = await supabase
        .from('customer_addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadAddresses();
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen der Adresse');
    }
  };

  const editAddress = (address: Address) => {
    setEditingAddress(address);
    setFormData(address);
    setShowForm(true);
  };

  const addFromProfile = () => {
    if (customer) {
      setFormData({
        type: 'shipping',
        title: 'Herr',
        first_name: customer.first_name || '',
        last_name: customer.last_name || '',
        company: '',
        street: customer.street || '',
        house_number: customer.house_number || '',
        postal_code: customer.postal_code || '',
        city: customer.city || '',
        country: 'Deutschland',
        phone: customer.phone || '',
        is_default: addresses.length === 0
      });
    }
    setEditingAddress(null);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      type: 'shipping',
      title: 'Herr',
      first_name: '',
      last_name: '',
      company: '',
      street: '',
      house_number: '',
      postal_code: '',
      city: '',
      country: 'Deutschland',
      phone: '',
      is_default: false
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 md:pt-24">
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 sm:pt-24 md:pt-28">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Adressbuch</h1>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          {customer && (customer.street || customer.city) && (
            <button
              onClick={addFromProfile}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors cursor-pointer text-sm sm:text-base flex items-center justify-center"
            >
              <i className="ri-user-line mr-2"></i>
              <span className="truncate">Aus Profil hinzufügen</span>
            </button>
          )}
          <button
            onClick={() => {
              resetForm();
              setEditingAddress(null);
              setShowForm(true);
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer text-sm sm:text-base flex items-center justify-center"
          >
            <i className="ri-add-line mr-2"></i>
            <span className="truncate">Neue Adresse</span>
          </button>
        </div>
      </div>

      {addresses.length === 0 && !showForm && (
        <div className="text-center py-12">
          <i className="ri-map-pin-line text-6xl text-gray-300 mb-4"></i>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Keine Adressen gespeichert</h3>
          <p className="text-gray-600 mb-6">Fügen Sie Ihre erste Adresse hinzu, um schneller bestellen zu können.</p>
          <div className="flex justify-center space-x-4">
            {customer && (customer.street || customer.city) && (
              <button
                onClick={addFromProfile}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer"
              >
                Aus Profil hinzufügen
              </button>
            )}
            <button
              onClick={() => setShowForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer"
            >
              Erste Adresse hinzufügen
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white border-2 border-green-200 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate pr-4">
              {editingAddress ? 'Adresse bearbeiten' : 'Neue Adresse hinzufügen'}
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingAddress(null);
                resetForm();
              }}
              className="text-gray-500 hover:text-gray-700 cursor-pointer p-1 flex-shrink-0"
            >
              <i className="ri-close-line text-xl sm:text-2xl"></i>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresstyp
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value="shipping"
                      checked={formData.type === 'shipping'}
                      onChange={(e) => setFormData({...formData, type: e.target.value as 'shipping' | 'billing'})}
                      className="mr-2"
                    />
                    Lieferadresse
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value="billing"
                      checked={formData.type === 'billing'}
                      onChange={(e) => setFormData({...formData, type: e.target.value as 'shipping' | 'billing'})}
                      className="mr-2"
                    />
                    Rechnungsadresse
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anrede
                </label>
                <select
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-8"
                  required
                >
                  <option value="Herr">Herr</option>
                  <option value="Frau">Frau</option>
                  <option value="Firma">Firma</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vorname *
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nachname *
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Firma (optional)
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Straße *
                </label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData({...formData, street: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nr. *
                </label>
                <input
                  type="text"
                  value={formData.house_number}
                  onChange={(e) => setFormData({...formData, house_number: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PLZ *
                </label>
                <input
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({...formData, postal_code: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stadt *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Land *
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-8"
                  required
                >
                  <option value="Deutschland">Deutschland</option>
                  <option value="Österreich">Österreich</option>
                  <option value="Schweiz">Schweiz</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefon (optional)
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_default"
                checked={formData.is_default}
                onChange={(e) => setFormData({...formData, is_default: e.target.checked})}
                className="mr-3 w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="is_default" className="text-sm font-medium text-gray-700 cursor-pointer">
                Als Standardadresse festlegen
              </label>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer"
              >
                {saving ? 'Speichern...' : editingAddress ? 'Änderungen speichern' : 'Adresse hinzufügen'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingAddress(null);
                  resetForm();
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-8 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {addresses.map((address) => (
          <div key={address.id} className="bg-white border rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    address.type === 'shipping' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {address.type === 'shipping' ? 'Lieferadresse' : 'Rechnungsadresse'}
                  </span>
                  {address.is_default && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Standard
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-gray-900">
                  <p className="font-semibold">
                    {address.title} {address.first_name} {address.last_name}
                  </p>
                  {address.company && (
                    <p className="text-gray-600">{address.company}</p>
                  )}
                  <p>{address.street} {address.house_number}</p>
                  <p>{address.postal_code} {address.city}</p>
                  <p>{address.country}</p>
                  {address.phone && (
                    <p className="text-gray-600">
                      <i className="ri-phone-line mr-1"></i>
                      {address.phone}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => editAddress(address)}
                  className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                  title="Bearbeiten"
                >
                  <i className="ri-edit-line text-lg"></i>
                </button>
                <button
                  onClick={() => deleteAddress(address.id!)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Löschen"
                >
                  <i className="ri-delete-bin-line text-lg"></i>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
