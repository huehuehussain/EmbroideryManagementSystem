const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

async function updateProcedures() {
  try {
    console.log('Updating procedures in database...');

    // Read the procedures SQL file
    const proceduresPath = path.join(__dirname, '../config/procedures.sql');
    const proceduresSQL = fs.readFileSync(proceduresPath, 'utf-8');

    // Execute the procedures
    await pool.query(proceduresSQL);

    console.log('✓ Procedures updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error updating procedures:', error.message);
    process.exit(1);
  }
}

updateProcedures();
