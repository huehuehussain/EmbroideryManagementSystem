const pool = require('../config/database');
const CONSTANTS = require('../utils/constants');

class DashboardController {
  static async getProductionSummary(req, res) {
    try {
      const { start_date, end_date } = req.query;

      let query = `
        SELECT 
          COUNT(*) as total_orders,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_orders,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
          SUM(quantity_completed) as total_items_produced,
          SUM(total_cost) as total_cost
        FROM work_orders
        WHERE 1 = 1
      `;
      const values = [];

      if (start_date) {
        query += ` AND created_at >= $${values.length + 1}`;
        values.push(start_date);
      }
      if (end_date) {
        query += ` AND created_at <= $${values.length + 1}`;
        values.push(end_date);
      }

      const result = await pool.query(query, values);
      const summary = result.rows[0];

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        summary,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_ERROR).json({
        error: error.message,
      });
    }
  }

  static async getMachineUtilization(req, res) {
    try {
      const result = await pool.query(`
        SELECT 
          m.id,
          m.name,
          m.status,
          COUNT(wo.id) as total_orders,
          SUM(CASE WHEN wo.status = 'in_progress' THEN 1 ELSE 0 END) as active_orders,
          SUM(CASE WHEN wo.status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
          AVG(CAST(wo.quantity_completed as DECIMAL) / NULLIF(wo.quantity_to_produce, 0)) as utilization_percentage
        FROM machines m
        LEFT JOIN work_orders wo ON m.id = wo.machine_id
        GROUP BY m.id, m.name, m.status
        ORDER BY m.name
      `);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        machineUtilization: result.rows,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_ERROR).json({
        error: error.message,
      });
    }
  }

  static async getOperatorPerformance(req, res) {
    try {
      const result = await pool.query(`
        SELECT 
          u.id,
          u.name,
          COUNT(os.id) as total_shifts,
          SUM(os.output_quantity) as total_output,
          AVG(os.quality_score) as average_quality,
          COUNT(DISTINCT os.shift_date) as working_days
        FROM users u
        LEFT JOIN operators_shifts os ON u.id = os.operator_id
        WHERE u.role = 'operator'
        GROUP BY u.id, u.name
        ORDER BY total_output DESC NULLS LAST
      `);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        operatorPerformance: result.rows,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_ERROR).json({
        error: error.message,
      });
    }
  }

  static async getInventoryUsage(req, res) {
    try {
      const { start_date, end_date } = req.query;

      let query = `
        SELECT 
          it.id,
          it.item_name,
          it.quantity_available,
          it.minimum_stock_level,
          it.unit_cost,
          (it.minimum_stock_level - it.quantity_available) as shortage
        FROM inventory_items it
        WHERE it.quantity_available <= it.minimum_stock_level
        ORDER BY shortage DESC
      `;

      const result = await pool.query(query);

      // Get reorder alerts
      const alertsResult = await pool.query(
        `SELECT * FROM alerts WHERE alert_type = 'reorder' AND is_resolved = false`
      );

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        lowStockItems: result.rows,
        reorderAlerts: alertsResult.rows,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_ERROR).json({
        error: error.message,
      });
    }
  }

  static async getPendingAlerts(req, res) {
    try {
      const result = await pool.query(`
        SELECT * FROM alerts 
        WHERE is_resolved = false 
        ORDER BY created_at DESC 
        LIMIT 20
      `);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        alerts: result.rows,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_ERROR).json({
        error: error.message,
      });
    }
  }

  static async getDashboardOverview(req, res) {
    try {
      const summary = await pool.query(`
        SELECT 
          COUNT(*) as total_work_orders,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
        FROM work_orders
      `);

      const machines = await pool.query(`
        SELECT COUNT(*) as total, 
               SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
               SUM(CASE WHEN status = 'busy' THEN 1 ELSE 0 END) as busy
        FROM machines
      `);

      const alerts = await pool.query(`
        SELECT COUNT(*) as total, 
               SUM(CASE WHEN is_resolved = false THEN 1 ELSE 0 END) as unresolved
        FROM alerts
      `);

      const customers = await pool.query(`
        SELECT COUNT(DISTINCT customer_email) as total_customers FROM customer_orders
      `);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        workOrders: summary.rows[0],
        machines: machines.rows[0],
        alerts: alerts.rows[0],
        customers: customers.rows[0],
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_ERROR).json({
        error: error.message,
      });
    }
  }
}

module.exports = DashboardController;
