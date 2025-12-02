const pool = require('../config/database');

class InventoryItem {
  static async findById(id) {
    const result = await pool.query('SELECT * FROM inventory_items WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async getAll() {
    const result = await pool.query('SELECT * FROM inventory_items ORDER BY item_name ASC');
    return result.rows;
  }

  static async create(itemData) {
    const {
      item_name,
      item_type,
      description,
      quantity_available,
      minimum_stock_level,
      unit_cost,
      supplier,
      reorder_quantity,
      unit_measurement,
    } = itemData;

    const result = await pool.query(
      `INSERT INTO inventory_items (item_name, item_type, description, quantity_available, minimum_stock_level, unit_cost, supplier, reorder_quantity, unit_measurement)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [item_name, item_type, description, quantity_available, minimum_stock_level, unit_cost, supplier, reorder_quantity, unit_measurement]
    );
    return result.rows[0];
  }

  static async update(id, itemData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(itemData).forEach((key) => {
      fields.push(`${key} = $${paramCount++}`);
      values.push(itemData[key]);
    });

    values.push(id);

    if (fields.length === 0) return null;

    const result = await pool.query(
      `UPDATE inventory_items SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async deductStock(id, quantity) {
    const result = await pool.query(
      `UPDATE inventory_items SET quantity_available = quantity_available - $1 WHERE id = $2 RETURNING *`,
      [quantity, id]
    );
    return result.rows[0];
  }

  static async checkLowStock(id) {
    const item = await this.findById(id);
    return item && item.quantity_available <= item.minimum_stock_level;
  }

  static async getLowStockItems() {
    const result = await pool.query(
      `SELECT * FROM inventory_items WHERE quantity_available <= minimum_stock_level ORDER BY quantity_available ASC`
    );
    return result.rows;
  }
}

module.exports = InventoryItem;
