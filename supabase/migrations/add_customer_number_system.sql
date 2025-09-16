-- Migration: Add customer number system
-- This adds automatic customer number generation for all customers

-- Add customer_number column to customers table
ALTER TABLE customers 
ADD COLUMN customer_number TEXT UNIQUE;

-- Create sequence for customer numbers starting at 10001
CREATE SEQUENCE IF NOT EXISTS customer_number_seq START 10001;

-- Function to generate customer number
CREATE OR REPLACE FUNCTION generate_customer_number()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    customer_number TEXT;
BEGIN
    -- Get next number from sequence
    SELECT nextval('customer_number_seq') INTO next_number;
    
    -- Format as KD-XXXXX (KD = Kunde)
    customer_number := 'KD-' || LPAD(next_number::TEXT, 5, '0');
    
    RETURN customer_number;
END;
$$ LANGUAGE plpgsql;

-- Function to assign customer number on insert
CREATE OR REPLACE FUNCTION assign_customer_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Only assign if customer_number is not already set
    IF NEW.customer_number IS NULL THEN
        NEW.customer_number := generate_customer_number();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-assign customer numbers
DROP TRIGGER IF EXISTS trigger_assign_customer_number ON customers;
CREATE TRIGGER trigger_assign_customer_number
    BEFORE INSERT ON customers
    FOR EACH ROW
    EXECUTE FUNCTION assign_customer_number();

-- Update existing customers with customer numbers
UPDATE customers 
SET customer_number = generate_customer_number()
WHERE customer_number IS NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_customers_customer_number ON customers(customer_number);

-- Add comment
COMMENT ON COLUMN customers.customer_number IS 'Unique customer number in format KD-XXXXX, automatically generated';

-- Add customer_number to orders table for easier access
ALTER TABLE orders 
ADD COLUMN customer_number TEXT;

-- Function to get customer number from email
CREATE OR REPLACE FUNCTION get_customer_number_by_email(customer_email TEXT)
RETURNS TEXT AS $$
DECLARE
    cust_number TEXT;
BEGIN
    SELECT customer_number INTO cust_number
    FROM customers 
    WHERE email = customer_email
    LIMIT 1;
    
    RETURN cust_number;
END;
$$ LANGUAGE plpgsql;

-- Function to update order with customer number
CREATE OR REPLACE FUNCTION update_order_customer_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Try to get customer number from customer_id first
    IF NEW.customer_id IS NOT NULL THEN
        SELECT customer_number INTO NEW.customer_number
        FROM customers 
        WHERE id = NEW.customer_id;
    END IF;
    
    -- If no customer_id but we have email, try to find by email
    IF NEW.customer_number IS NULL AND NEW.delivery_email IS NOT NULL THEN
        NEW.customer_number := get_customer_number_by_email(NEW.delivery_email);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-assign customer number to orders
DROP TRIGGER IF EXISTS trigger_update_order_customer_number ON orders;
CREATE TRIGGER trigger_update_order_customer_number
    BEFORE INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_order_customer_number();

-- Update existing orders with customer numbers
UPDATE orders 
SET customer_number = (
    SELECT customer_number 
    FROM customers 
    WHERE customers.id = orders.customer_id 
       OR customers.email = orders.delivery_email
    LIMIT 1
)
WHERE customer_number IS NULL;

-- Add index for orders customer_number
CREATE INDEX IF NOT EXISTS idx_orders_customer_number ON orders(customer_number);

-- Add comment
COMMENT ON COLUMN orders.customer_number IS 'Customer number copied from customers table for easier access';