const pool = require('../config/database');
const CONSTANTS = require('../utils/constants');

class WorkOrderService {
  /**
   * Create work order - validation happens in DB via triggers
   * ✓ Design approval validated by DB trigger
   * ✓ Machine compatibility validated by DB trigger
   */
  static async createWorkOrder(workOrderData, userId) {
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

    try {
      // Fetch customer information from customer_orders table
      const customerResult = await pool.query(
        `SELECT id, customer_name FROM customer_orders WHERE id = $1`,
        [customer_order_id]
      );

      const customerData = customerResult.rows[0];
      if (!customerData) {
        throw new Error('Customer order not found');
      }

      const result = await pool.query(
        `INSERT INTO work_orders (
          work_order_number, machine_id, design_id, customer_order_id,
          customer_id, customer_name,
          quantity_to_produce, thread_colors_required, thread_quantities,
          estimated_production_time, assigned_operator_id, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          work_order_number,
          machine_id,
          design_id,
          customer_order_id,
          customerData.id,
          customerData.customer_name,
          quantity_to_produce,
          thread_colors_required,
          thread_quantities,
          estimated_production_time,
          assigned_operator_id,
          CONSTANTS.WORK_ORDER_STATUS.PENDING,
        ]
      );

      return result.rows[0];
    } catch (error) {
      // Database triggers will validate design approval and machine compatibility
      throw new Error(error.message || 'Failed to create work order');
    }
  }

  /**
   * Get all work orders
   */
  static async getAllWorkOrders() {
    const result = await pool.query(
      `SELECT wo.*, m.name as machine_name, d.design_name, co.order_number, co.customer_name
       FROM work_orders wo
       LEFT JOIN machines m ON wo.machine_id = m.id
       LEFT JOIN designs d ON wo.design_id = d.id
       LEFT JOIN customer_orders co ON wo.customer_order_id = co.id
       ORDER BY wo.created_at DESC`
    );
    return result.rows;
  }

  /**
   * Get work order by ID
   */
  static async getWorkOrderById(workOrderId) {
    const result = await pool.query(
      `SELECT wo.*, m.name as machine_name, d.design_name, co.order_number, co.customer_name,
              u.name as operator_name
       FROM work_orders wo
       LEFT JOIN machines m ON wo.machine_id = m.id
       LEFT JOIN designs d ON wo.design_id = d.id
       LEFT JOIN customer_orders co ON wo.customer_order_id = co.id
       LEFT JOIN users u ON wo.assigned_operator_id = u.id
       WHERE wo.id = $1`,
      [workOrderId]
    );
    return result.rows[0] || null;
  }

  /**
   * Start work order - calls database procedure sp_start_work_order
   * Database handles: design validation, machine validation, inventory deduction, alert creation
   */
  static async startWorkOrder(workOrderId, userId) {
    try {
      const result = await pool.query(
        `SELECT * FROM sp_start_work_order($1)`,
        [workOrderId]
      );

      const { success, message } = result.rows[0];

      if (!success) {
        throw new Error(message);
      }

      return await this.getWorkOrderById(workOrderId);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Complete work order - calls database procedure sp_complete_work_order
   */
  static async completeWorkOrder(workOrderId, quantityCompleted, userId) {
    try {
      const result = await pool.query(
        `SELECT * FROM sp_complete_work_order($1, $2)`,
        [workOrderId, quantityCompleted]
      );

      const { success, message } = result.rows[0];

      if (!success) {
        throw new Error(message);
      }

      return await this.getWorkOrderById(workOrderId);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Update work order status - database trigger validates transitions
   * Valid transitions: pending → in_progress → completed → delivered
   */
  static async updateWorkOrderStatus(workOrderId, status, userId) {
    try {
      const result = await pool.query(
        `UPDATE work_orders SET status = $1 WHERE id = $2 RETURNING *`,
        [status, workOrderId]
      );

      if (result.rows.length === 0) {
        throw new Error('Work order not found');
      }

      return result.rows[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Calculate cost - calls database function fn_calculate_work_order_cost
   * Formula: ThreadCost + MachineCost($50/hr) + LaborCost($15/hr) + Overhead(15%)
   */
  static async calculateCost(workOrderId, userId) {
    try {
      const workOrder = await this.getWorkOrderById(workOrderId);
      if (!workOrder) {
        throw new Error('Work order not found');
      }

      // Call database function
      const result = await pool.query(
        `SELECT * FROM fn_calculate_work_order_cost($1, $2)`,
        [workOrderId, workOrder.estimated_production_time || 0]
      );

      const costData = result.rows[0];
      return {
        thread_cost: parseFloat(costData.thread_cost_out),
        machine_cost: parseFloat(costData.machine_cost_out),
        labor_cost: parseFloat(costData.labor_cost_out),
        overhead_cost: parseFloat(costData.overhead_cost_out),
        total_cost: parseFloat(costData.total_cost_out),
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Update work order (only pending orders can be updated)
   */
  static async updateWorkOrder(workOrderId, updateData, userId) {
    try {
      const workOrder = await this.getWorkOrderById(workOrderId);
      if (!workOrder) {
        throw new Error('Work order not found');
      }

      // Only allow updating pending work orders
      if (workOrder.status !== CONSTANTS.WORK_ORDER_STATUS.PENDING) {
        throw new Error('Can only update pending work orders');
      }

      const {
        machine_id,
        design_id,
        quantity_to_produce,
        thread_colors_required,
        thread_quantities,
        estimated_production_time,
        assigned_operator_id,
      } = updateData;

      const result = await pool.query(
        `UPDATE work_orders SET 
         machine_id = COALESCE($1, machine_id),
         design_id = COALESCE($2, design_id),
         quantity_to_produce = COALESCE($3, quantity_to_produce),
         thread_colors_required = COALESCE($4, thread_colors_required),
         thread_quantities = COALESCE($5, thread_quantities),
         estimated_production_time = COALESCE($6, estimated_production_time),
         assigned_operator_id = COALESCE($7, assigned_operator_id),
         updated_at = CURRENT_TIMESTAMP
         WHERE id = $8
         RETURNING *`,
        [
          machine_id,
          design_id,
          quantity_to_produce,
          thread_colors_required,
          thread_quantities,
          estimated_production_time,
          assigned_operator_id,
          workOrderId,
        ]
      );

      return result.rows[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Delete work order (only pending orders can be deleted)
   */
  static async deleteWorkOrder(workOrderId, userId) {
    try {
      const workOrder = await this.getWorkOrderById(workOrderId);
      if (!workOrder) {
        throw new Error('Work order not found');
      }

      // Only allow deleting pending work orders
      if (workOrder.status !== CONSTANTS.WORK_ORDER_STATUS.PENDING) {
        throw new Error('Can only delete pending work orders');
      }

      const result = await pool.query(
        `DELETE FROM work_orders WHERE id = $1 RETURNING *`,
        [workOrderId]
      );

      return result.rows[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

module.exports = WorkOrderService;
