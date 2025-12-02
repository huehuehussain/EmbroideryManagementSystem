const pool = require('../config/database');

class CostingRecord {
  static async findById(id) {
    const result = await pool.query('SELECT * FROM costing_records WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async getByWorkOrderId(workOrderId) {
    const result = await pool.query('SELECT * FROM costing_records WHERE work_order_id = $1', [workOrderId]);
    return result.rows;
  }

  static async create(costingData) {
    const { work_order_id, thread_cost, machine_cost, labor_cost, overhead_cost, total_cost, cost_breakdown, calculated_by } =
      costingData;

    const result = await pool.query(
      `INSERT INTO costing_records (work_order_id, thread_cost, machine_cost, labor_cost, overhead_cost, total_cost, cost_breakdown, calculated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [work_order_id, thread_cost, machine_cost, labor_cost, overhead_cost, total_cost, cost_breakdown, calculated_by]
    );
    return result.rows[0];
  }
}

module.exports = CostingRecord;
