const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function runMigration() {
  try {
    console.log('Running migration: Add customer_id and customer_name to work_orders...');

    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'config', 'migration_add_customer_to_work_orders.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split by semicolon and filter out empty statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    // Execute each statement
    for (const statement of statements) {
      try {
        console.log('\nExecuting:', statement.substring(0, 80) + '...');
        await pool.query(statement);
        console.log('✓ Success');
      } catch (error) {
        // Some statements might fail (e.g., IF NOT EXISTS), continue
        if (error.message.includes('already exists') || error.message.includes('does not exist')) {
          console.log('⚠ Skipped (already exists or not applicable)');
        } else {
          console.error('✗ Error:', error.message);
          throw error;
        }
      }
    }

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
