const pool = require('../config/database');

class Thread {
  static async findById(id) {
    const result = await pool.query('SELECT * FROM threads WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findByColor(color) {
    const result = await pool.query('SELECT * FROM threads WHERE color = $1', [color]);
    return result.rows[0];
  }

  static async getAll() {
    const result = await pool.query('SELECT * FROM threads ORDER BY name ASC');
    return result.rows;
  }

  static async create(threadData) {
    const { name, color, supplier, unit_cost, quantity_in_stock, minimum_stock_level } = threadData;
    const result = await pool.query(
      `INSERT INTO threads (name, color, supplier, unit_cost, quantity_in_stock, minimum_stock_level)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, color, supplier, unit_cost, quantity_in_stock, minimum_stock_level]
    );
    return result.rows[0];
  }

  static async updateStock(id, quantityDeducted) {
    const result = await pool.query(
      `UPDATE threads SET quantity_in_stock = quantity_in_stock - $1 WHERE id = $2 RETURNING *`,
      [quantityDeducted, id]
    );
    return result.rows[0];
  }

  static async checkLowStock(id) {
    const thread = await this.findById(id);
    return thread && thread.quantity_in_stock <= thread.minimum_stock_level;
  }
}

module.exports = Thread;
