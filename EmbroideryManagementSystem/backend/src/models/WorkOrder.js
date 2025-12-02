const pool = require('../config/database');

class WorkOrder {
  static async findById(id) {
    const result = await pool.query(
      `SELECT wo.*, 
              m.name as machine_name, 
              d.design_name,
              co.order_number,
              u.name as operator_name
       FROM work_orders wo
       LEFT JOIN machines m ON wo.machine_id = m.id
       LEFT JOIN designs d ON wo.design_id = d.id
       LEFT JOIN customer_orders co ON wo.customer_order_id = co.id
       LEFT JOIN users u ON wo.assigned_operator_id = u.id
       WHERE wo.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async findByNumber(workOrderNumber) {
    const result = await pool.query(
      `SELECT wo.*, 
              m.name as machine_name, 
              d.design_name,
              co.order_number,
              u.name as operator_name
       FROM work_orders wo
       LEFT JOIN machines m ON wo.machine_id = m.id
       LEFT JOIN designs d ON wo.design_id = d.id
       LEFT JOIN customer_orders co ON wo.customer_order_id = co.id
       LEFT JOIN users u ON wo.assigned_operator_id = u.id
       WHERE wo.work_order_number = $1`,
      [workOrderNumber]
    );
    return result.rows[0];
  }

  static async getAll() {
    const result = await pool.query(
      `SELECT wo.*, 
              m.name as machine_name, 
              d.design_name,
              co.order_number,
              u.name as operator_name
       FROM work_orders wo
       LEFT JOIN machines m ON wo.machine_id = m.id
       LEFT JOIN designs d ON wo.design_id = d.id
       LEFT JOIN customer_orders co ON wo.customer_order_id = co.id
       LEFT JOIN users u ON wo.assigned_operator_id = u.id
       ORDER BY wo.created_at DESC`
    );
    return result.rows;
  }

  static async create(workOrderData) {
    const {
      work_order_number,
      machine_id,
      design_id,
      customer_order_id,
      quantity_to_produce,
      thread_colors_required,
      thread_quantities,
      estimated_production_time,
      assigned_operator_id,
    } = workOrderData;

    const result = await pool.query(
      `INSERT INTO work_orders (work_order_number, machine_id, design_id, customer_order_id, quantity_to_produce, thread_colors_required, thread_quantities, estimated_production_time, assigned_operator_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [work_order_number, machine_id, design_id, customer_order_id, quantity_to_produce, thread_colors_required, thread_quantities, estimated_production_time, assigned_operator_id]
    );
    return result.rows[0];
  }

  static async updateStatus(id, status, startTime = null, endTime = null) {
    const query = `UPDATE work_orders SET status = $1, actual_start_time = COALESCE($2, actual_start_time), actual_end_time = $3 WHERE id = $4 RETURNING *`;
    const result = await pool.query(query, [status, startTime, endTime, id]);
    return result.rows[0];
  }

  static async updateCost(id, costData) {
    const { thread_cost, machine_cost, labor_cost, overhead_cost, total_cost } = costData;
    const result = await pool.query(
      `UPDATE work_orders SET thread_cost = $1, machine_cost = $2, labor_cost = $3, overhead_cost = $4, total_cost = $5 WHERE id = $6 RETURNING *`,
      [thread_cost, machine_cost, labor_cost, overhead_cost, total_cost, id]
    );
    return result.rows[0];
  }

  static async updateCompletedQuantity(id, quantity) {
    const result = await pool.query(
      `UPDATE work_orders SET quantity_completed = $1 WHERE id = $2 RETURNING *`,
      [quantity, id]
    );
    return result.rows[0];
  }
}

module.exports = WorkOrder;
