const pool = require('../config/database');
const passwordUtils = require('./passwordUtils');

async function createAdminUser() {
  try {
    console.log('Creating admin user...');

    // Check if user already exists
    const existingUser = await pool.query(
      `SELECT id FROM users WHERE email = $1`,
      ['admin@embroidery.com']
    );

    if (existingUser.rows.length > 0) {
      console.log('Admin user already exists with ID:', existingUser.rows[0].id);
      process.exit(0);
    }

    // Create admin user
    const adminPassword = await passwordUtils.hashPassword('admin123');
    
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, phone, department)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, role`,
      ['Admin User', 'admin@embroidery.com', adminPassword, 'admin', '1234567890', 'Management']
    );

    console.log('✓ Admin user created successfully');
    console.log('  ID:', result.rows[0].id);
    console.log('  Email:', result.rows[0].email);
    console.log('  Role:', result.rows[0].role);
    console.log('  Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating user:', error.message);
    process.exit(1);
  }
}

createAdminUser();
