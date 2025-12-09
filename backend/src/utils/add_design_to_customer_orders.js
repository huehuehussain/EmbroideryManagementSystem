const pool = require('../config/database');

async function runMigration() {
  try {
    console.log('Running migration: add design_id to customer_orders...');

    // Add design_id column if it doesn't exist
    await pool.query(`
      ALTER TABLE customer_orders
      ADD COLUMN IF NOT EXISTS design_id INT REFERENCES designs(id) ON DELETE RESTRICT;
    `);

    console.log('✓ Added design_id column to customer_orders');

    // Create index for design_id
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_customer_orders_design_id ON customer_orders(design_id);
    `);

    console.log('✓ Created index for design_id');

    // Create the cost calculation procedure
    await pool.query(`
      CREATE OR REPLACE FUNCTION fn_calculate_order_cost(
        p_design_id INT,
        p_quantity INT
      )
      RETURNS TABLE(
        total_cost DECIMAL,
        material_cost DECIMAL,
        machine_cost DECIMAL,
        labor_cost DECIMAL,
        overhead_cost DECIMAL,
        cost_per_unit DECIMAL
      ) AS $$
      DECLARE
        v_material_cost DECIMAL := 0;
        v_machine_cost DECIMAL := 30;
        v_labor_cost DECIMAL := 15;
        v_overhead_cost DECIMAL := 15;
        v_cost_per_unit DECIMAL;
        v_total_cost DECIMAL;
      BEGIN
        -- Calculate material cost from inventory items used in design
        SELECT COALESCE(SUM(ii.unit_cost * dii.quantity_required), 0)
        INTO v_material_cost
        FROM design_inventory_items dii
        JOIN inventory_items ii ON ii.id = dii.inventory_item_id
        WHERE dii.design_id = p_design_id;

        -- Calculate cost per unit (material + fixed costs)
        v_cost_per_unit := v_material_cost + v_machine_cost + v_labor_cost + v_overhead_cost;

        -- Calculate total cost
        v_total_cost := v_cost_per_unit * p_quantity;

        -- Return results
        RETURN QUERY SELECT
          v_total_cost,
          v_material_cost,
          v_machine_cost,
          v_labor_cost,
          v_overhead_cost,
          v_cost_per_unit;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✓ Created fn_calculate_order_cost procedure');

    console.log('\n✓ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
