const pool = require('../config/database');
const passwordUtils = require('./passwordUtils');

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Create users
    const adminPassword = await passwordUtils.hashPassword('admin123');
    const operatorPassword = await passwordUtils.hashPassword('operator123');
    const managerPassword = await passwordUtils.hashPassword('manager123');

    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, phone, department)
       VALUES 
       ('Admin User', 'admin@embroidery.com', $1, 'admin', '1234567890', 'Management'),
       ('John Manager', 'manager@embroidery.com', $2, 'manager', '1234567891', 'Production'),
       ('Alice Operator', 'alice@embroidery.com', $3, 'operator', '1234567892', 'Operations'),
       ('Bob Operator', 'bob@embroidery.com', $3, 'operator', '1234567893', 'Operations'),
       ('Charlie Operator', 'charlie@embroidery.com', $3, 'operator', '1234567894', 'Operations')`,
      [adminPassword, managerPassword, operatorPassword]
    );

    console.log('✓ Users created');

    // Create machines
    await pool.query(`
      INSERT INTO machines (name, model, capacity_stitches_per_hour, supported_thread_colors, location, status)
      VALUES 
      ('Machine A1', 'Barudan Embroidery Machine', 5000, ARRAY['Red', 'Blue', 'Green', 'Yellow', 'Black'], 'Floor 1', 'available'),
      ('Machine A2', 'Tajima Embroidery Machine', 6000, ARRAY['Red', 'Blue', 'Green', 'Yellow', 'Black', 'White'], 'Floor 1', 'available'),
      ('Machine B1', 'Melco Embroidery Machine', 5500, ARRAY['Red', 'Blue', 'Black', 'White', 'Gold'], 'Floor 2', 'available'),
      ('Machine B2', 'Brother Embroidery Machine', 4800, ARRAY['Red', 'Blue', 'Green', 'Black'], 'Floor 2', 'available')
    `);

    console.log('✓ Machines created');

    // Create threads
    await pool.query(`
      INSERT INTO threads (name, color, supplier, unit_cost, quantity_in_stock, minimum_stock_level, unit_measurement)
      VALUES 
      ('Red Thread', 'Red', 'Thread Supplier Inc', 2.50, 500, 100, 'meter'),
      ('Blue Thread', 'Blue', 'Thread Supplier Inc', 2.50, 450, 100, 'meter'),
      ('Green Thread', 'Green', 'Premium Threads', 3.00, 300, 100, 'meter'),
      ('Yellow Thread', 'Yellow', 'Premium Threads', 3.00, 200, 100, 'meter'),
      ('Black Thread', 'Black', 'Thread Supplier Inc', 2.50, 600, 100, 'meter'),
      ('White Thread', 'White', 'Premium Threads', 2.75, 400, 100, 'meter'),
      ('Gold Thread', 'Gold', 'Luxury Threads', 5.00, 150, 50, 'meter')
    `);

    console.log('✓ Threads created');

    // Create inventory items
    await pool.query(`
      INSERT INTO inventory_items (item_name, item_type, description, quantity_available, minimum_stock_level, unit_cost, supplier, reorder_quantity, unit_measurement)
      VALUES 
      ('Needles Size 75/11', 'needle', 'Embroidery needles for regular fabric', 1000, 200, 0.50, 'Needle Supplier', 500, 'pieces'),
      ('Needles Size 90/14', 'needle', 'Embroidery needles for medium fabric', 800, 200, 0.55, 'Needle Supplier', 500, 'pieces'),
      ('Backing Cloth Standard', 'backing_cloth', 'Standard stabilizer backing', 50, 10, 15.00, 'Fabric Suppliers Co', 25, 'yards'),
      ('Backing Cloth Premium', 'backing_cloth', 'Premium quality backing cloth', 30, 10, 25.00, 'Luxury Fabrics', 20, 'yards'),
      ('Tear Away Stabilizer', 'stabilizer', 'Tear away stabilizer for embroidery', 100, 20, 8.00, 'Stabilizer Co', 50, 'yards'),
      ('Heat Away Stabilizer', 'stabilizer', 'Heat away stabilizer for delicate fabrics', 60, 15, 12.00, 'Premium Stabilizers', 40, 'yards')
    `);

    console.log('✓ Inventory items created');

    // Create designs
    await pool.query(`
      INSERT INTO designs (design_name, designer_name, status, estimated_stitches)
      VALUES 
      ('Rose Flower', 'Designer A', 'approved', 5000),
      ('Butterfly Wings', 'Designer B', 'approved', 4500),
      ('Abstract Pattern', 'Designer A', 'approved', 6000),
      ('Floral Border', 'Designer C', 'submitted', 5500),
      ('Geometric Shapes', 'Designer B', 'reviewed', 4000)
    `);

    console.log('✓ Designs created');

    // Create customer orders
    await pool.query(`
      INSERT INTO customer_orders (order_number, customer_name, customer_email, customer_phone, delivery_address, required_delivery_date, total_quantity, total_price, status)
      VALUES 
      ('ORD-2024-001', 'ABC Textiles', 'contact@abc.com', '555-0001', '123 Business St', '2024-12-15', 100, 5000.00, 'pending'),
      ('ORD-2024-002', 'XYZ Fashion', 'sales@xyz.com', '555-0002', '456 Fashion Ave', '2024-12-20', 200, 8500.00, 'pending'),
      ('ORD-2024-003', 'Premium Wear', 'info@premiumwear.com', '555-0003', '789 Elite Rd', '2024-12-10', 150, 7200.00, 'in_progress'),
      ('ORD-2024-004', 'Classic Designs', 'order@classic.com', '555-0004', '321 Heritage Ln', '2024-12-25', 250, 12000.00, 'pending')
    `);

    console.log('✓ Customer orders created');

    // Create work orders
    await pool.query(`
      INSERT INTO work_orders (work_order_number, machine_id, design_id, customer_order_id, quantity_to_produce, thread_colors_required, thread_quantities, estimated_production_time, status, assigned_operator_id)
      VALUES 
      ('WO-2024-001', 1, 1, 1, 100, ARRAY['Red', 'Green'], ARRAY[50, 30], 240, 'pending', 3),
      ('WO-2024-002', 2, 2, 2, 200, ARRAY['Blue', 'Yellow'], ARRAY[100, 50], 300, 'pending', 4),
      ('WO-2024-003', 1, 3, 3, 150, ARRAY['Black', 'Gold'], ARRAY[75, 25], 270, 'in_progress', 3),
      ('WO-2024-004', 3, 1, 4, 250, ARRAY['Red', 'White'], ARRAY[125, 75], 360, 'pending', 5)
    `);

    console.log('✓ Work orders created');

    // Create operator shifts
    await pool.query(`
      INSERT INTO operators_shifts (operator_id, work_order_id, machine_id, shift_date, shift_start_time, shift_end_time, output_quantity, quality_score)
      VALUES 
      (3, 3, 1, CURRENT_DATE, CURRENT_TIMESTAMP - INTERVAL '8 hours', CURRENT_TIMESTAMP - INTERVAL '4 hours', 50, 4.5),
      (4, 2, 2, CURRENT_DATE, CURRENT_TIMESTAMP - INTERVAL '8 hours', CURRENT_TIMESTAMP - INTERVAL '4 hours', 60, 4.7),
      (5, 1, 1, CURRENT_DATE - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '32 hours', CURRENT_TIMESTAMP - INTERVAL '28 hours', 40, 4.3)
    `);

    console.log('✓ Operator shifts created');

    // Create alerts
    await pool.query(`
      INSERT INTO alerts (alert_type, entity_type, entity_id, title, message, is_resolved)
      VALUES 
      ('low_inventory', 'thread', 4, 'Low Stock: Yellow Thread', 'Yellow Thread stock is below minimum level', false),
      ('reorder', 'inventory_item', 4, 'Reorder Required: Premium Backing', 'Premium backing cloth needs to be reordered', false),
      ('machine_maintenance', 'machine', 1, 'Maintenance Due: Machine A1', 'Machine A1 is due for maintenance', false)
    `);

    console.log('✓ Alerts created');

    console.log('\n✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();
