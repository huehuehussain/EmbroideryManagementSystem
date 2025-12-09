-- Migration: Add design-inventory items relationship and remove unused fields

-- Create junction table for designs and inventory items (many-to-many)
CREATE TABLE IF NOT EXISTS design_inventory_items (
  id SERIAL PRIMARY KEY,
  design_id INT NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  inventory_item_id INT NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(design_id, inventory_item_id)
);

CREATE INDEX IF NOT EXISTS idx_design_inventory_design_id ON design_inventory_items(design_id);
CREATE INDEX IF NOT EXISTS idx_design_inventory_item_id ON design_inventory_items(inventory_item_id);

-- Remove unused columns from designs table
ALTER TABLE designs 
DROP COLUMN IF EXISTS estimated_stitches,
DROP COLUMN IF EXISTS estimated_thread_usage;

-- Delete all current designs
DELETE FROM designs;

COMMIT;
