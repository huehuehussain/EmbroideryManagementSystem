const pool = require('../config/database');

class Design {
  static async findById(id) {
    const result = await pool.query('SELECT * FROM designs WHERE id = $1', [id]);
    return result.rows[0];
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
    return result.rows;
  }

  static async create(designData) {
    const {
      design_name,
      designer_name,
      estimated_stitches,
      estimated_thread_usage,
    } = designData;

    const result = await pool.query(
      `INSERT INTO designs (design_name, designer_name, estimated_stitches, estimated_thread_usage)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [design_name, designer_name, estimated_stitches, estimated_thread_usage]
    );
    return result.rows[0];
  }

  static async updateStatus(id, status, approvedById = null, rejectionReason = null) {
    const query = `UPDATE designs SET status = $1, approved_by = $2, rejection_reason = $3, approval_date = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *`;
    const result = await pool.query(query, [status, approvedById, rejectionReason, id]);
    return result.rows[0];
  }

  static async update(id, designData) {
    const {
      design_name,
      designer_name,
      estimated_stitches,
      estimated_thread_usage,
    } = designData;

    const query = `UPDATE designs 
                   SET design_name = $1, designer_name = $2, estimated_stitches = $3, 
                       estimated_thread_usage = $4, updated_at = CURRENT_TIMESTAMP
                   WHERE id = $5 RETURNING *`;
    
    const result = await pool.query(query, [
      design_name,
      designer_name,
      estimated_stitches,
      estimated_thread_usage,
      id,
    ]);
    
    return result.rows[0];
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
