const pool = require('../config/database');

// Safety: require explicit --yes flag to run destructive operation
if (!process.argv.includes('--yes')) {
  console.log('\nThis script will permanently DELETE demo rows inserted by the seeder.');
  console.log('If you are sure, re-run with: node ./src/utils/remove_demo_data.js --yes\n');
  process.exit(0);
}

async function deleteRows(table, column, values) {
  if (!values || values.length === 0) return 0;
  try {
    const q = `DELETE FROM ${table} WHERE ${column} = ANY($1::text[]) RETURNING id`;
    const res = await pool.query(q, [values]);
    console.log(`Deleted ${res.rowCount} rows from ${table}`);
    return res.rowCount;
  } catch (err) {
    console.error(`Error deleting from ${table}:`, err.message || err);
    return 0;
  }
}

async function main() {
  try {
    console.log('Removing demo data (seed entries) from database...');

    // Values added by seed.js (keep in sync with seed.js)
    const demoUsers = [
      'admin@embroidery.com',
      'manager@embroidery.com',
      'alice@embroidery.com',
      'bob@embroidery.com',
      'charlie@embroidery.com',
    ];

    const demoMachines = [
      'Machine A1',
      'Machine A2',
      'Machine B1',
      'Machine B2',
    ];

    const demoThreads = [
      'Red Thread',
      'Blue Thread',
      'Green Thread',
      'Yellow Thread',
      'Black Thread',
      'White Thread',
      'Gold Thread',
    ];

    const demoInventoryItems = [
      'Needles Size 75/11',
      'Needles Size 90/14',
      'Backing Cloth Standard',
      'Backing Cloth Premium',
      'Tear Away Stabilizer',
      'Heat Away Stabilizer',
    ];

    const demoDesigns = [
      'Rose Flower',
      'Butterfly Wings',
      'Abstract Pattern',
      'Floral Border',
      'Geometric Shapes',
    ];

    const demoCustomerOrders = [
      'ORD-2024-001',
      'ORD-2024-002',
      'ORD-2024-003',
      'ORD-2024-004',
    ];

    const demoWorkOrders = [
      'WO-2024-001',
      'WO-2024-002',
      'WO-2024-003',
      'WO-2024-004',
    ];

    // Delete in order respecting FK constraints
    await deleteRows('work_orders', 'work_order_number', demoWorkOrders);
    await deleteRows('customer_orders', 'order_number', demoCustomerOrders);
    await deleteRows('designs', 'design_name', demoDesigns);
    await deleteRows('inventory_items', 'item_name', demoInventoryItems);
    await deleteRows('threads', 'name', demoThreads);
    await deleteRows('machines', 'name', demoMachines);
    await deleteRows('users', 'email', demoUsers);

    console.log('Demo data removal complete.');
  } catch (err) {
    console.error('Fatal error while removing demo data:', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

main();
