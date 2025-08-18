'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Supplier {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  contact_person?: string;
  created_at: string;
  updated_at?: string;
  status?: string;
  street?: string;
  postal_code?: string;
  city?: string;
  product_types?: string[];
  notes?: string;
}

export default function SuppliersTab() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [supplierOrders, setSupplierOrders] = useState<any[]>([]);
  const [showOrders, setShowOrders] = useState<string | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  
  // Filtered suppliers based on search term
  const filteredSuppliers = suppliers.filter(supplier => 
    searchTerm === '' || 
    supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [formData, setFormData] = useState<Partial<Supplier>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    contact_person: ''
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    // Alias for loadSuppliers
    loadSuppliers();
  };
  
  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error: unknown) {
      console.error('Fehler beim Laden der Lieferanten:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingSupplier) {
        const { error } = await supabase
          .from('suppliers')
          .update(formData)
          .eq('id', editingSupplier.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('suppliers')
          .insert([formData]);
        
        if (error) throw error;
      }

      fetchSuppliers();
      resetForm();
    } catch (error: unknown) {
      console.error('Fehler beim Speichern:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      contact_person: ''
    });
    setShowAddForm(false);
    setEditingSupplier(null);
  };

  const addSupplier = async (supplierData: Record<string, any>) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .insert({
          ...supplierData,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      setIsAddModalOpen(false);
      loadSuppliers();
      alert('Lieferant erfolgreich hinzugefügt!');
    } catch (error) {
      console.error('Error adding supplier:', error);
      alert('Fehler beim Hinzufügen des Lieferanten');
    }
  };

  const updateSupplier = async (supplierData: Record<string, any>) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({
          ...supplierData,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingSupplier?.id || '');

      if (error) throw error;

      setIsEditModalOpen(false);
      setEditingSupplier(null);
      loadSuppliers();
      alert('Lieferant erfolgreich aktualisiert!');
    } catch (error) {
      console.error('Error updating supplier:', error);
      alert('Fehler beim Aktualisieren des Lieferanten');
    }
  };

  const deleteSupplier = async (supplierId: string) => {
    if (confirm('Möchten Sie diesen Lieferanten wirklich löschen?')) {
      try {
        const { error } = await supabase
          .from('suppliers')
          .delete()
          .eq('id', supplierId);

        if (error) throw error;

        loadSuppliers();
        alert('Lieferant erfolgreich gelöscht!');
      } catch (error) {
        console.error('Error deleting supplier:', error);
        alert('Fehler beim Löschen des Lieferanten');
      }
    }
  };

  const loadSupplierOrders = async (supplierId: string) => {
    try {
      const { data, error } = await supabase
        .from('supplier_orders')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSupplierOrders(data || []);
      setShowOrders(supplierId);
    } catch (error) {
      console.error('Error loading supplier orders:', error);
    }
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'text-gray-600 bg-gray-100';
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'inactive':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string | undefined) => {
    if (!status) return 'Aktiv';
    switch (status) {
      case 'active':
        return 'Aktiv';
      case 'inactive':
        return 'Inaktiv';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="w-12 h-12 flex items-center justify-center bg-[#C04020] rounded-full mx-auto mb-4 animate-pulse">
          <i className="ri-truck-line text-2xl text-white"></i>
        </div>
        <p className="text-lg font-medium text-gray-700">Lade Lieferanten...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">Lieferantenverwaltung</h2>
            <p className="text-gray-600">Verwalten Sie Ihre Lieferanten und Einkaufspreise</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#C04020] hover:bg-[#A03318] text-white px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-add-line mr-2"></i>
            Neuer Lieferant
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <div className="w-5 h-5 flex items-center justify-center text-gray-400">
                  <i className="ri-search-line"></i>
                </div>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#C04020] transition-colors"
                placeholder="Suche nach Lieferantenname, Ansprechpartner oder Ort..."
              />
            </div>
          </div>

          <button
            onClick={loadSuppliers}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-refresh-line mr-2"></i>
            Aktualisieren
          </button>
        </div>
      </div>

      {/* Suppliers List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-[#1A1A1A]">
              Lieferanten ({filteredSuppliers.length})
            </h3>
          </div>
        </div>

        {filteredSuppliers.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
              <i className="ri-truck-line text-2xl text-gray-400"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              {suppliers.length === 0 ? 'Noch keine Lieferanten' : 'Keine Lieferanten gefunden'}
            </h3>
            <p className="text-gray-500 mb-4">
              {suppliers.length === 0 
                ? 'Fügen Sie Ihren ersten Lieferanten hinzu.'
                : 'Versuchen Sie andere Suchkriterien.'
              }
            </p>
            {suppliers.length === 0 && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-[#C04020] hover:bg-[#A03318] text-white px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-add-line mr-2"></i>
                Ersten Lieferant hinzufügen
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Lieferant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Kontakt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Standort
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-bold text-[#1A1A1A]">
                          {supplier.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {supplier.product_types?.join(', ') || 'Keine Produkttypen'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {supplier.contact_person}
                        </div>
                        <div className="text-xs text-gray-500">
                          {supplier.email}
                        </div>
                        <div className="text-xs text-gray-500">
                          {supplier.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {supplier.city}
                      </div>
                      <div className="text-xs text-gray-500">
                        {supplier.postal_code}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${getStatusColor(supplier.status)}`}>
                        {getStatusText(supplier.status || 'active')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setEditingSupplier(supplier);
                          setIsEditModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 cursor-pointer"
                        title="Bearbeiten"
                      >
                        <i className="ri-edit-line"></i>
                      </button>
                      <button
                        onClick={() => loadSupplierOrders(supplier.id)}
                        className="text-green-600 hover:text-green-800 cursor-pointer"
                        title="Bestellungen anzeigen"
                      >
                        <i className="ri-file-list-line"></i>
                      </button>
                      <button
                        onClick={() => deleteSupplier(supplier.id)}
                        className="text-red-600 hover:text-red-800 cursor-pointer"
                        title="Löschen"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Supplier Orders */}
        {showOrders && (
          <div className="p-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#1A1A1A]">
                Bestellungen für {selectedSupplier?.name}
              </h3>
              <button
                onClick={() => setShowOrders(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            {supplierOrders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Keine Bestellungen gefunden</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Bestellnummer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Datum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Produkte
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Betrag
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {supplierOrders.map((order: any) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {order.order_number || order.id}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {order.products?.length || 0} Produkte
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {order.total_amount ? `${order.total_amount.toFixed(2)} €` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Supplier Modal */}
      {isAddModalOpen && (
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
<div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
<div className="p-6 border-b border-gray-200">
<div className="flex items-center justify-between">
<h2 className="text-2xl font-bold text-[#1A1A1A]">
Neuen Lieferant hinzufügen
</h2>
<button
onClick={() => setIsAddModalOpen(false)}
className="text-gray-400 hover:text-gray-600 cursor-pointer"
>
<i className="ri-close-line text-2xl"></i>
</button>
</div>
</div>

<form
onSubmit={(e) => {
e.preventDefault();
const form = e.target as HTMLFormElement;
const formData = new FormData(form);
const productTypesValue = formData.get('product_types');
const productTypes = typeof productTypesValue === 'string' ? 
productTypesValue.split(',').map((t: string) => t.trim()).filter((t: string) => t !== '') : 
[];
const supplierData = {
name: formData.get('name') as string,
email: formData.get('email') as string,
phone: formData.get('phone') as string,
contact_person: formData.get('contact_person') as string,
street: formData.get('street') as string,
postal_code: formData.get('postal_code') as string,
city: formData.get('city') as string,
product_types: productTypes,
notes: formData.get('notes') as string,
status: formData.get('status') as string
};
addSupplier({
...supplierData,
purchase_prices: {}
});
}}
className="p-6 space-y-6"
>
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
<div className="md:col-span-2">
<label className="block text-sm font-medium text-gray-700 mb-2">Firmenname *</label>
<input
type="text"
name="name"
className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
required
/>
</div>

<div>
<label className="block text-sm font-medium text-gray-700 mb-2">Ansprechpartner *</label>
<input
type="text"
name="contact_person"
className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
required
/>
</div>

<div>
<label className="block text-sm font-medium text-gray-700 mb-2">E-Mail *</label>
<input
type="email"
name="email"
className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
required
/>
</div>

<div>
<label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
<input
type="tel"
name="phone"
className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
/>
</div>

<div>
<label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
<select
name="status"
className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] cursor-pointer pr-8"
defaultValue="active"
>
<option value="active">Aktiv</option>
<option value="inactive">Inaktiv</option>
</select>
</div>

<div>
<label className="block text-sm font-medium text-gray-700 mb-2">Straße</label>
<input
type="text"
name="street"
className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
/>
</div>

<div>
<label className="block text-sm font-medium text-gray-700 mb-2">PLZ</label>
<input
type="text"
name="postal_code"
className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
/>
</div>

<div>
<label className="block text-sm font-medium text-gray-700 mb-2">Ort</label>
<input
type="text"
name="city"
className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
/>
</div>

<div className="md:col-span-2">
<label className="block text-sm font-medium text-gray-700 mb-2">Produkttypen (komma-getrennt)</label>
<input
type="text"
name="product_types"
className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
placeholder="Buchenholz, Eichenholz, Nadelholz"
/>
</div>

<div className="md:col-span-2">
<label className="block text-sm font-medium text-gray-700 mb-2">Notizen</label>
<textarea
name="notes"
rows={3}
className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
placeholder="Zusätzliche Informationen..."
/>
</div>
</div>

<div className="flex gap-4 pt-4 border-t border-gray-200">
<button
type="submit"
className="bg-[#C04020] hover:bg-[#A03318] text-white px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
>
Lieferant hinzufügen
</button>
<button
type="button"
onClick={() => setIsAddModalOpen(false)}
className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
>
Abbrechen
</button>
</div>
</form>
</div>
</div>
)}

{/* Edit Supplier Modal */}
{isEditModalOpen && editingSupplier && (
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
<div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
<div className="p-6 border-b border-gray-200">
<div className="flex items-center justify-between">
<h2 className="text-2xl font-bold text-[#1A1A1A]">
Lieferant bearbeiten: {editingSupplier.name}
</h2>
<button
onClick={() => {
setIsEditModalOpen(false);
setEditingSupplier(null);
}}
className="text-gray-400 hover:text-gray-600 cursor-pointer"
>
<i className="ri-close-line text-2xl"></i>
</button>
</div>
</div>

<form
onSubmit={(e) => {
e.preventDefault();
const form = e.target as HTMLFormElement;
const formData = new FormData(form);
const productTypesValue = formData.get('product_types');
const productTypes = typeof productTypesValue === 'string' ? 
productTypesValue.split(',').map((t: string) => t.trim()).filter((t: string) => t !== '') : 
[];
const supplierData = {
name: formData.get('name') as string,
email: formData.get('email') as string,
phone: formData.get('phone') as string,
contact_person: formData.get('contact_person') as string,
street: formData.get('street') as string,
postal_code: formData.get('postal_code') as string,
city: formData.get('city') as string,
product_types: productTypes,
notes: formData.get('notes') as string,
status: formData.get('status') as string
};
updateSupplier({
...supplierData
});
}}
className="p-6 space-y-6"
>
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
<div className="md:col-span-2">
<label className="block text-sm font-medium text-gray-700 mb-2">Firmenname *</label>
<input
type="text"
name="name"
defaultValue={editingSupplier.name}
className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
required
/>
</div>

<div>
<label className="block text-sm font-medium text-gray-700 mb-2">Ansprechpartner *</label>
<input
type="text"
name="contact_person"
defaultValue={editingSupplier.contact_person}
className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
required
/>
</div>

<div>
<label className="block text-sm font-medium text-gray-700 mb-2">E-Mail *</label>
<input
type="email"
name="email"
defaultValue={editingSupplier.email}
className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
required
/>
</div>

<div>
<label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
<input
type="tel"
name="phone"
defaultValue={editingSupplier.phone || ''}
className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
/>
</div>

<div>
<label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
<select
name="status"
defaultValue={editingSupplier.status || 'active'}
className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020] cursor-pointer pr-8"
>
<option value="active">Aktiv</option>
<option value="inactive">Inaktiv</option>
</select>
</div>

<div>
<label className="block text-sm font-medium text-gray-700 mb-2">Straße</label>
<input
type="text"
name="street"
defaultValue={editingSupplier.street || ''}
className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
/>
</div>

<div>
<label className="block text-sm font-medium text-gray-700 mb-2">PLZ</label>
<input
type="text"
name="postal_code"
defaultValue={editingSupplier.postal_code || ''}
className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
/>
</div>

<div>
<label className="block text-sm font-medium text-gray-700 mb-2">Ort</label>
<input
type="text"
name="city"
defaultValue={editingSupplier.city || ''}
className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
/>
</div>

<div className="md:col-span-2">
<label className="block text-sm font-medium text-gray-700 mb-2">Produkttypen (komma-getrennt)</label>
<input
type="text"
name="product_types"
defaultValue={editingSupplier.product_types?.join(', ') || ''}
className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
placeholder="Buchenholz, Eichenholz, Nadelholz"
/>
</div>

<div className="md:col-span-2">
<label className="block text-sm font-medium text-gray-700 mb-2">Notizen</label>
<textarea
name="notes"
rows={3}
defaultValue={editingSupplier.notes || ''}
className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C04020]"
placeholder="Zusätzliche Informationen..."
/>
</div>
</div>

<div className="flex gap-4 pt-4 border-t border-gray-200">
<button
type="submit"
className="bg-[#C04020] hover:bg-[#A03318] text-white px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
>
Änderungen speichern
</button>
<button
type="button"
onClick={() => {
setIsEditModalOpen(false);
setEditingSupplier(null);
}}
className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap"
>
Abbrechen
</button>
</div>
</form>
</div>
</div>
)}
  </div>
);
}