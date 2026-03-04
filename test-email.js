const testOrderData = {
  orderNumber: "TEST-001",
  totalAmount: 150.50,
  createdAt: new Date().toISOString(),
  deliveryDate: "2024-01-15",
  paymentMethod: "Rechnung",
  notes: "Testbestellung",
  items: [
    {
      name: "Buche Brennholz",
      quantity: 2,
      price: 65.00,
      unit: "Raummeter"
    },
    {
      name: "Anzündhilfe",
      quantity: 1,
      price: 20.50,
      unit: "Paket"
    }
  ]
};

const testCustomerData = {
  name: "Max Mustermann",
  email: "test@example.com",
  phone: "+49 123 456789",
  deliveryAddress: "Musterstraße 123, 12345 Musterstadt"
};

fetch('http://localhost:3000/api/send-order-email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    orderData: testOrderData,
    customerData: testCustomerData
  })
})
.then(response => response.json())
.then(data => {
  console.log('Response:', data);
})
.catch(error => {
  console.error('Error:', error);
});