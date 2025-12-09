const pool = require('../config/database');

async function addQuantityToDesignInventory() {
  try {
    console.log('Running migration: add quantity column to design_inventory_items...');

    // Check if column exists, if not add it
    await pool.query(`
      ALTER TABLE design_inventory_items 
      ADD COLUMN IF NOT EXISTS quantity_required DECIMAL(10, 2) DEFAULT 0
    `);
    console.log('✓ Added quantity_required column to design_inventory_items');

    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Error running migration:', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

addQuantityToDesignInventory();
