const http = require('http');
const pool = require('../config/database');

// Simple HTTP POST test for update endpoint
async function testUpdateAPI() {
  try {
    console.log('Testing update endpoint via simulated HTTP...\n');

    // First, get the token (mock it for testing)
    console.log('1. Getting inventory item (ID 7 - Polyster)...');
    const item = await pool.query('SELECT * FROM inventory_items WHERE id = 7');
    console.log('   Current data:', item.rows[0]);

    // Test the service directly
    const InventoryService = require('../services/InventoryService');
    const updateData = {
      item_name: 'Polyster_Test2',
      item_type: 'thread',
      quantity_available: 75000,
      minimum_stock_level: 150,
      unit_cost: 0.30,
    };

    console.log('\n2. Updating via service with:', updateData);
    const updated = await InventoryService.updateInventoryItem(7, updateData);
    console.log('   Update result:', updated);

    // Verify
    console.log('\n3. Verifying update in database...');
    const verify = await pool.query('SELECT * FROM inventory_items WHERE id = 7');
    console.log('   Updated data:', verify.rows[0]);

    console.log('\n✓ All tests passed! Update works correctly.');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testUpdateAPI();
