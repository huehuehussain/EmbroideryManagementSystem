const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function updateProcedures() {
  try {
    console.log('Updating database procedures...');

    // Read the procedures file
    const proceduresPath = path.join(__dirname, '..', 'config', 'procedures.sql');
    const proceduresSQL = fs.readFileSync(proceduresPath, 'utf8');

    // Execute the entire procedures file
    await pool.query(proceduresSQL);

    console.log('✅ All procedures updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating procedures:', error.message);
    process.exit(1);
  }
}

updateProcedures();
