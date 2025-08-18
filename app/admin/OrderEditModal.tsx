import React, { useState } from 'react';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  street: string;
  house_number: string;
  postal_code: string;
  city: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  product_category: string;
  quantity: number;
  unit_price: number;
}

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  updated_at: string;
  status: string;
  delivery_type: string;
  delivery_price: number;
  notes: string;
  customers: Customer;
  order_items: OrderItem[];
  total_amount: number;
}

interface FormDataItem {
  id: string;
  product_name: string;
  product_category: string;
  quantity: number;
  unit_price: number;
}

interface FormDataCustomer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  street: string;
  house_number: string;
  postal_code: string;
  city: string;
}

interface FormData {
  customer: FormDataCustomer;
  delivery_type: string;
  delivery_price: string | number;
  notes: string;
  items: FormDataItem[];
}

interface OrderEditModalProps {
  order: Order;
  onSave: (orderId: string, updatedData: any) => Promise<void>;
  onClose: () => void;
}

const OrderEditModal: React.FC<OrderEditModalProps> = ({ order, onSave, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [formData, setFormData] = useState<FormData>({
    customer: {
      id: order.customers.id,
      first_name: order.customers.first_name,
      last_name: order.customers.last_name,
      email: order.customers.email,
      phone: order.customers.phone,
      street: order.customers.street,
      house_number: order.customers.house_number,
      postal_code: order.customers.postal_code,
      city: order.customers.city
    },
    delivery_type: order.delivery_type,
    delivery_price: order.delivery_price,
    notes: order.notes || '',
    items: order.order_items.map(item => ({
      id: item.id,
      product_name: item.product_name,
      product_category: item.product_category,
      quantity: item.quantity,
      unit_price: item.unit_price
    }))
  });

  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      customer: {
        ...formData.customer,
        [name]: value
      }
    });
  };

  const handleOrderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const updatedItems = [...formData.items];
    const item = { ...updatedItems[index] };
    
    if (field === 'quantity' || field === 'unit_price') {
      item[field as 'quantity' | 'unit_price'] = typeof value === 'string' ? parseFloat(value) || 0 : value;
    } else {
      item[field as 'product_name' | 'product_category'] = value as string;
    }
    
    updatedItems[index] = item;
    setFormData({
      ...formData,
      items: updatedItems
    });
  };

  const addItem = () => {
    const newItem: FormDataItem = {
      id: `temp-${Date.now()}`,
      product_name: '',
      product_category: '',
      quantity: 1,
      unit_price: 0
    };
    
    setFormData({
      ...formData,
      items: [...formData.items, newItem]
    });
  };

  const removeItem = (index: number) => {
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);
    setFormData({
      ...formData,
      items: updatedItems
    });
  };

  const calculateItemTotal = (item: FormDataItem): number => {
    return item.quantity * item.unit_price;
  };

  const calculateOrderTotal = (): number => {
    const itemsTotal = formData.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    const deliveryPrice = parseFloat(formData.delivery_price.toString()) || 0;
    return itemsTotal + deliveryPrice;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // Convert form data to the format expected by the API
      const updatedData = {
        customer: formData.customer,
        delivery_type: formData.delivery_type,
        delivery_price: parseFloat(formData.delivery_price.toString()) || 0,
        notes: formData.notes,
        items: formData.items.map(item => ({
          id: item.id,
          product_name: item.product_name,
          product_category: item.product_category,
          quantity: item.quantity,
          unit_price: item.unit_price
        }))
      };

      await onSave(order.id, updatedData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Bestellung #{order.order_number} bearbeiten</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Kundeninformationen</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vorname</label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.customer.first_name}
                      onChange={handleCustomerChange}
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nachname</label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.customer.last_name}
                      onChange={handleCustomerChange}
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.customer.email}
                      onChange={handleCustomerChange}
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.customer.phone}
                      onChange={handleCustomerChange}
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Straße</label>
                    <input
                      type="text"
                      name="street"
                      value={formData.customer.street}
                      onChange={handleCustomerChange}
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hausnummer</label>
                    <input
                      type="text"
                      name="house_number"
                      value={formData.customer.house_number}
                      onChange={handleCustomerChange}
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PLZ</label>
                    <input
                      type="text"
                      name="postal_code"
                      value={formData.customer.postal_code}
                      onChange={handleCustomerChange}
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stadt</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.customer.city}
                      onChange={handleCustomerChange}
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Lieferinformationen</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lieferart</label>
                  <select
                    name="delivery_type"
                    value={formData.delivery_type}
                    onChange={handleOrderChange}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="pickup">Abholung</option>
                    <option value="delivery">Lieferung</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lieferkosten (€)</label>
                  <input
                    type="number"
                    name="delivery_price"
                    value={formData.delivery_price}
                    onChange={handleOrderChange}
                    step="0.01"
                    min="0"
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notizen</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleOrderChange}
                    rows={4}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold mb-3">Bestellte Artikel</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left">Produkt</th>
                    <th className="p-2 text-left">Kategorie</th>
                    <th className="p-2 text-right">Menge</th>
                    <th className="p-2 text-right">Preis (€)</th>
                    <th className="p-2 text-right">Gesamt (€)</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={item.id} className="border-b">
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.product_name}
                          onChange={(e) => handleItemChange(index, 'product_name', e.target.value)}
                          className="w-full p-1 border border-gray-300 rounded"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.product_category}
                          onChange={(e) => handleItemChange(index, 'product_category', e.target.value)}
                          className="w-full p-1 border border-gray-300 rounded"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          min="1"
                          className="w-full p-1 border border-gray-300 rounded text-right"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                          step="0.01"
                          min="0"
                          className="w-full p-1 border border-gray-300 rounded text-right"
                        />
                      </td>
                      <td className="p-2 text-right">
                        {calculateItemTotal(item).toFixed(2)}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="p-2">
                      <button
                        type="button"
                        onClick={addItem}
                        className="flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Artikel hinzufügen
                      </button>
                    </td>
                    <td className="p-2 text-right font-semibold">Gesamtsumme:</td>
                    <td className="p-2 text-right font-semibold">
                      {calculateOrderTotal().toFixed(2)} €
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded shadow-sm text-gray-700 hover:bg-gray-100"
                disabled={isSubmitting}
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Speichern...' : 'Änderungen speichern'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OrderEditModal;
