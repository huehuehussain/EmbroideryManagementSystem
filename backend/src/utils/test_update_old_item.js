const pool = require('../config/database');
const InventoryService = require('../services/InventoryService');

async function testUpdateOldItem() {
  try {
    console.log('Testing update on old inventory items...\n');

    // Get an old item (ID 7 - Polyster)
    const item = await InventoryService.getInventoryItemById(7);
    console.log('Original item:', item);

    // Try to update it
    const updateData = {
      item_name: 'Polyster_Updated',
      quantity_available: 50000,
      minimum_stock_level: 200,
    };

    console.log('\nAttempting update with:', updateData);
    const updated = await InventoryService.updateInventoryItem(7, updateData);
    console.log('\nUpdate successful! Result:', updated);

    // Verify it changed
    const verified = await InventoryService.getInventoryItemById(7);
    console.log('\nVerified updated item:', verified);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testUpdateOldItem();
