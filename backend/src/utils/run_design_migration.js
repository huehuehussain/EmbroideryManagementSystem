const pool = require('../config/database');

async function runMigration() {
  try {
    console.log('Running migration: add design_inventory_items table and remove design fields...');

    // Create junction table for designs and inventory items
    await pool.query(`
      CREATE TABLE IF NOT EXISTS design_inventory_items (
        id SERIAL PRIMARY KEY,
        design_id INT NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
        inventory_item_id INT NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(design_id, inventory_item_id)
      )
    `);
    console.log('✓ Created design_inventory_items table');

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_design_inventory_design_id 
      ON design_inventory_items(design_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_design_inventory_item_id 
      ON design_inventory_items(inventory_item_id)
    `);
    console.log('✓ Created indexes');

    // Drop estimated_stitches column if it exists
    await pool.query(`
      ALTER TABLE designs 
      DROP COLUMN IF EXISTS estimated_stitches
    `);
    console.log('✓ Dropped estimated_stitches column');

    // Drop estimated_thread_usage column if it exists
    await pool.query(`
      ALTER TABLE designs 
      DROP COLUMN IF EXISTS estimated_thread_usage
    `);
    console.log('✓ Dropped estimated_thread_usage column');

    // Delete work orders first (they reference designs)
    const woResult = await pool.query('DELETE FROM work_orders');
    console.log(`✓ Deleted ${woResult.rowCount} work orders`);

    // Delete all current designs
    const result = await pool.query('DELETE FROM designs');
    console.log(`✓ Deleted ${result.rowCount} designs`);

    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Error running migration:', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

runMigration();
