const pool = require('../config/database');

async function checkInventoryData() {
  try {
    console.log('Checking inventory items data...\n');

    const result = await pool.query(
      `SELECT id, item_name, item_type, quantity_available, minimum_stock_level, unit_cost, supplier
       FROM inventory_items
       ORDER BY id DESC
       LIMIT 10`
    );

    console.log('Current inventory items:');
    result.rows.forEach(item => {
      console.log(`
  ID: ${item.id}
  Name: ${item.item_name}
  Type: ${item.item_type}
  Available: ${item.quantity_available}
  Min Level: ${item.minimum_stock_level}
  Unit Cost: ${item.unit_cost}
  Supplier: ${item.supplier || 'N/A'}
  `);
    });

    console.log('\n\nTesting update on first item...');
    if (result.rows.length > 0) {
      const firstItem = result.rows[0];
      const testUpdate = await pool.query(
        `UPDATE inventory_items 
         SET quantity_available = 50
         WHERE id = $1
         RETURNING *`,
        [firstItem.id]
      );
      console.log('Update successful:', testUpdate.rows[0]);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkInventoryData();
