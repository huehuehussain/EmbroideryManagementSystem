const pool = require('../config/database');

class User {
  static async findById(id) {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }

  static async create(userData) {
    const { name, email, password_hash, role, phone, department } = userData;
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, phone, department)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, email, password_hash, role, phone, department]
    );
    return result.rows[0];
  }

  static async update(id, userData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(userData).forEach((key) => {
      fields.push(`${key} = $${paramCount++}`);
      values.push(userData[key]);
    });

    values.push(id);

    if (fields.length === 0) return null;

    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async getAll() {
    const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    return result.rows;
  }

  static async delete(id) {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
  }
}

module.exports = User;
