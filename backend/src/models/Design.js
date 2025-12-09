const pool = require('../config/database');

class Design {
  static async findById(id) {
    const designResult = await pool.query('SELECT * FROM designs WHERE id = $1', [id]);
    const design = designResult.rows[0];
    
    if (design) {
      const itemsResult = await pool.query(
        `SELECT ii.*, dii.quantity_required FROM inventory_items ii
         JOIN design_inventory_items dii ON ii.id = dii.inventory_item_id
         WHERE dii.design_id = $1`,
        [id]
      );
      design.inventory_items = itemsResult.rows;
    }
    
    return design;
  }

  static async getAll(status = null) {
    let query = 'SELECT * FROM designs';
    const values = [];

    if (status) {
      query += ' WHERE status = $1';
      values.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, values);
    
    // Fetch inventory items for each design
    for (const design of result.rows) {
      const itemsResult = await pool.query(
        `SELECT ii.*, dii.quantity_required FROM inventory_items ii
         JOIN design_inventory_items dii ON ii.id = dii.inventory_item_id
         WHERE dii.design_id = $1`,
        [design.id]
      );
      design.inventory_items = itemsResult.rows;
    }
    
    return result.rows;
  }

  static async create(designData, inventoryItems = []) {
    const {
      design_name,
      designer_name,
    } = designData;

    const result = await pool.query(
      `INSERT INTO designs (design_name, designer_name)
       VALUES ($1, $2) RETURNING *`,
      [design_name, designer_name]
    );
    
    const design = result.rows[0];
    
    // Add inventory items with quantities
    if (inventoryItems && inventoryItems.length > 0) {
      for (const item of inventoryItems) {
        await pool.query(
          `INSERT INTO design_inventory_items (design_id, inventory_item_id, quantity_required)
           VALUES ($1, $2, $3)`,
          [design.id, item.id, item.quantity_required || 0]
        );
      }
      
      // Fetch the full design with items
      const itemsResult = await pool.query(
        `SELECT ii.*, dii.quantity_required FROM inventory_items ii
         JOIN design_inventory_items dii ON ii.id = dii.inventory_item_id
         WHERE dii.design_id = $1`,
        [design.id]
      );
      design.inventory_items = itemsResult.rows;
    } else {
      design.inventory_items = [];
    }
    
    return design;
  }

  static async updateStatus(id, status, approvedById = null, rejectionReason = null) {
    const query = `UPDATE designs SET status = $1, approved_by = $2, rejection_reason = $3, approval_date = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *`;
    const result = await pool.query(query, [status, approvedById, rejectionReason, id]);
    return result.rows[0];
  }

  static async update(id, designData, inventoryItems = []) {
    const {
      design_name,
      designer_name,
    } = designData;

    const query = `UPDATE designs 
                   SET design_name = $1, designer_name = $2, updated_at = CURRENT_TIMESTAMP
                   WHERE id = $3 RETURNING *`;
    
    const result = await pool.query(query, [
      design_name,
      designer_name,
      id,
    ]);
    
    const design = result.rows[0];
    
    // Update inventory items
    await pool.query('DELETE FROM design_inventory_items WHERE design_id = $1', [id]);
    
    if (inventoryItems && inventoryItems.length > 0) {
      for (const item of inventoryItems) {
        await pool.query(
          `INSERT INTO design_inventory_items (design_id, inventory_item_id, quantity_required)
           VALUES ($1, $2, $3)`,
          [id, item.id, item.quantity_required || 0]
        );
      }
      
      const itemsResult = await pool.query(
        `SELECT ii.*, dii.quantity_required FROM inventory_items ii
         JOIN design_inventory_items dii ON ii.id = dii.inventory_item_id
         WHERE dii.design_id = $1`,
        [id]
      );
      design.inventory_items = itemsResult.rows;
    } else {
      design.inventory_items = [];
    }
    
    return design;
  }

  static async delete(id) {
    const query = `DELETE FROM designs WHERE id = $1 RETURNING *`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async isApproved(id) {
    const design = await this.findById(id);
    return design && design.status === 'approved';
  }
}

module.exports = Design;
