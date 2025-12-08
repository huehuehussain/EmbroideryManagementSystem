-- Add customer_id and customer_name columns to work_orders table
-- These columns will store denormalized customer information for quick access

ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS customer_id INT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);

-- Add foreign key constraint for customer_id if not already present
ALTER TABLE work_orders
  ADD CONSTRAINT fk_work_orders_customer_id 
  FOREIGN KEY (customer_id) REFERENCES customer_orders(id) ON DELETE RESTRICT;

-- Populate customer_id and customer_name from existing customer_order_id
UPDATE work_orders wo
SET 
  customer_id = co.id,
  customer_name = co.customer_name
FROM customer_orders co
WHERE wo.customer_order_id = co.id
  AND (wo.customer_id IS NULL OR wo.customer_name IS NULL);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_work_orders_customer_id ON work_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_customer_name ON work_orders(customer_name);

-- Verify the changes
SELECT id, work_order_number, customer_id, customer_name, customer_order_id 
FROM work_orders 
LIMIT 5;
