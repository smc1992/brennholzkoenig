-- Migration: Add quantity discount field to products table
-- This allows individual products to have quantity discounts enabled/disabled
-- Only products with has_quantity_discount = true will get the 25 SRM discount

ALTER TABLE products 
ADD COLUMN has_quantity_discount BOOLEAN DEFAULT false;

-- Add comment to explain the field
COMMENT ON COLUMN products.has_quantity_discount IS 'Enables quantity discount (€2.50 off) for orders of 25+ SRM for this specific product';

-- Set Industrieholz Buche Klasse 2 to have quantity discount
-- Update based on product name since we don't have the exact ID
UPDATE products 
SET has_quantity_discount = true 
WHERE name ILIKE '%Industrieholz Buche Klasse 2%' 
   OR name ILIKE '%Industrieholz Buche Klasse II%';

-- Create index for performance
CREATE INDEX idx_products_quantity_discount ON products(has_quantity_discount) WHERE has_quantity_discount = true;

-- Add to Database type definition (for TypeScript)
-- This will need to be manually added to lib/supabase.ts