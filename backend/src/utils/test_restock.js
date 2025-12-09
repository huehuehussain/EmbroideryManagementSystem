const pool = require('../config/database');

async function testRestockFeature() {
  try {
    console.log('Testing restock feature...\n');

    // Update an inventory item to have low stock
    const updateRes = await pool.query(
      `UPDATE inventory_items 
       SET quantity_available = 10
       WHERE item_name = 'Lurex'
       RETURNING *`
    );

    if (updateRes.rows.length > 0) {
      const item = updateRes.rows[0];
      console.log('✓ Updated inventory item to low stock:');
      console.log(`  Item: ${item.item_name}`);
      console.log(`  Available: ${item.quantity_available}`);
      console.log(`  Minimum Level: ${item.minimum_stock_level}`);
      console.log(`  Is Low Stock: ${item.quantity_available <= item.minimum_stock_level}\n`);

      // Now test the restock
      console.log('Testing restock endpoint...');
      console.log('Expected behavior:');
      console.log('1. Restock button should appear on Inventory page');
      console.log('2. Click button to open restock modal');
      console.log('3. Enter quantity (e.g., 50)');
      console.log('4. Click "Confirm Restock"');
      console.log('5. Available quantity should increase by 50\n');
    } else {
      console.log('No inventory item found to update');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testRestockFeature();
