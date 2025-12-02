const pool = require('../config/database');

class OperatorShift {
  static async findById(id) {
    const result = await pool.query(
      `SELECT os.*, u.name as operator_name, m.name as machine_name, wo.work_order_number
       FROM operators_shifts os
       LEFT JOIN users u ON os.operator_id = u.id
       LEFT JOIN machines m ON os.machine_id = m.id
       LEFT JOIN work_orders wo ON os.work_order_id = wo.id
       WHERE os.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async getByOperatorId(operatorId, startDate = null, endDate = null) {
    let query = `SELECT os.*, u.name as operator_name, m.name as machine_name, wo.work_order_number
                 FROM operators_shifts os
                 LEFT JOIN users u ON os.operator_id = u.id
                 LEFT JOIN machines m ON os.machine_id = m.id
                 LEFT JOIN work_orders wo ON os.work_order_id = wo.id
                 WHERE os.operator_id = $1`;
    const values = [operatorId];

    if (startDate) {
      query += ` AND os.shift_date >= $${values.length + 1}`;
      values.push(startDate);
    }
    if (endDate) {
      query += ` AND os.shift_date <= $${values.length + 1}`;
      values.push(endDate);
    }

    query += ' ORDER BY os.shift_date DESC';
    const result = await pool.query(query, values);
    return result.rows;
  }

  static async getAll(startDate = null, endDate = null) {
    let query = `SELECT os.*, u.name as operator_name, m.name as machine_name, wo.work_order_number
                 FROM operators_shifts os
                 LEFT JOIN users u ON os.operator_id = u.id
                 LEFT JOIN machines m ON os.machine_id = m.id
                 LEFT JOIN work_orders wo ON os.work_order_id = wo.id
                 WHERE 1 = 1`;
    const values = [];

    if (startDate) {
      query += ` AND os.shift_date >= $${values.length + 1}`;
      values.push(startDate);
    }
    if (endDate) {
      query += ` AND os.shift_date <= $${values.length + 1}`;
      values.push(endDate);
    }

    query += ' ORDER BY os.shift_date DESC';
    const result = await pool.query(query, values);
    return result.rows;
  }

  static async create(shiftData) {
    const {
      operator_id,
      work_order_id,
      machine_id,
      shift_date,
      shift_start_time,
      shift_end_time,
      output_quantity,
      quality_score,
      notes,
    } = shiftData;

    const result = await pool.query(
      `INSERT INTO operators_shifts (operator_id, work_order_id, machine_id, shift_date, shift_start_time, shift_end_time, output_quantity, quality_score, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [operator_id, work_order_id, machine_id, shift_date, shift_start_time, shift_end_time, output_quantity, quality_score, notes]
    );
    return result.rows[0];
  }

  static async update(id, shiftData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(shiftData).forEach((key) => {
      fields.push(`${key} = $${paramCount++}`);
      values.push(shiftData[key]);
    });

    values.push(id);

    if (fields.length === 0) return null;

    const result = await pool.query(
      `UPDATE operators_shifts SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }
}

module.exports = OperatorShift;
