const pool = require('../config/database');
const CONSTANTS = require('../utils/constants');

class InventoryService {
  /**
   * Get all inventory items
   */
  static async getAllInventoryItems() {
    const result = await pool.query(
      `SELECT * FROM inventory_items ORDER BY item_name ASC`
    );
    return result.rows;
  }

  /**
   * Get inventory item by ID
   */
  static async getInventoryItemById(id) {
    const result = await pool.query(
      `SELECT * FROM inventory_items WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Create inventory item
   */
  static async createInventoryItem(itemData) {
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
      `INSERT INTO inventory_items (
        item_name, item_type, description, quantity_available,
        minimum_stock_level, unit_cost, supplier, reorder_quantity,
        unit_measurement
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        item_name,
        item_type,
        description,
        quantity_available,
        minimum_stock_level,
        unit_cost,
        supplier,
        reorder_quantity,
        unit_measurement,
      ]
    );

    return result.rows[0];
  }

  /**
   * Update inventory item
   */
  static async updateInventoryItem(id, itemData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Dynamically build the UPDATE query based on provided fields
    const allowedFields = ['item_name', 'item_type', 'quantity_available', 'minimum_stock_level', 'unit_cost', 'supplier'];
    
    allowedFields.forEach((field) => {
      if (itemData[field] !== undefined && itemData[field] !== null) {
        fields.push(`${field} = $${paramCount++}`);
        values.push(itemData[field]);
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE inventory_items 
       SET ${fields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (!result.rows[0]) {
      throw new Error('Inventory item not found');
    }

    return result.rows[0];
  }

  /**
   * Delete inventory item
   */
  static async deleteInventoryItem(id) {
    const result = await pool.query(
      `DELETE FROM inventory_items WHERE id = $1 RETURNING *`,
      [id]
    );

    return result.rows[0] || null;
  }

  /**
   * Deduct inventory item - calls database function fn_deduct_inventory_item
   * Database handles: validation, deduction, alert creation
   */
  static async deductInventoryItem(id, quantity, userId = null) {
    try {
      const result = await pool.query(
        `SELECT * FROM fn_deduct_inventory_item($1, $2)`,
        [id, quantity]
      );

      const { success, message } = result.rows[0];

      if (!success) {
        throw new Error(message);
      }

      return await this.getInventoryItemById(id);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Get low stock items
   */
  static async getLowStockItems() {
    const result = await pool.query(
      `SELECT * FROM inventory_items 
       WHERE quantity_available <= minimum_stock_level
       ORDER BY quantity_available ASC`
    );
    return result.rows;
  }

  /**
   * Bulk deduct inventory
   */
  static async bulkDeductInventory(itemIds, quantities) {
    const results = [];

    for (let i = 0; i < itemIds.length; i++) {
      try {
        const updated = await this.deductInventoryItem(itemIds[i], quantities[i]);
        results.push({ id: itemIds[i], success: true, item: updated });
      } catch (error) {
        results.push({ id: itemIds[i], success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Restock inventory item - adds quantity to current stock
   */
  static async restockInventoryItem(id, quantity) {
    if (!quantity || quantity <= 0) {
      throw new Error('Restock quantity must be greater than 0');
    }

    try {
      const result = await pool.query(
        `UPDATE inventory_items 
         SET quantity_available = quantity_available + $1
         WHERE id = $2
         RETURNING *`,
        [quantity, id]
      );

      if (result.rows.length === 0) {
        throw new Error('Inventory item not found');
      }

      return result.rows[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

module.exports = InventoryService;