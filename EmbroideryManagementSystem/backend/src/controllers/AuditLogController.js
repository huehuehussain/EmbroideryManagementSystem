const Alert = require('../models/Alert');
const CONSTANTS = require('../utils/constants');
const pool = require('../config/database');

class AuditLogController {
  static async getAllAuditLogs(req, res) {
    try {
      const { user_id, entity_type, start_date, end_date, limit = 100, offset = 0 } = req.query;

      let query = 'SELECT * FROM audit_logs WHERE 1 = 1';
      const values = [];

      if (user_id) {
        query += ` AND user_id = $${values.length + 1}`;
        values.push(user_id);
      }

      if (entity_type) {
        query += ` AND entity_type = $${values.length + 1}`;
        values.push(entity_type);
      }

      if (start_date) {
        query += ` AND created_at >= $${values.length + 1}`;
        values.push(start_date);
      }

      if (end_date) {
        query += ` AND created_at <= $${values.length + 1}`;
        values.push(end_date);
      }

      query += ' ORDER BY created_at DESC';
      query += ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
      values.push(parseInt(limit), parseInt(offset));

      const result = await pool.query(query, values);

      // Get total count
      let countQuery = 'SELECT COUNT(*) FROM audit_logs WHERE 1 = 1';
      const countValues = [];

      if (user_id) {
        countQuery += ` AND user_id = $${countValues.length + 1}`;
        countValues.push(user_id);
      }

      if (entity_type) {
        countQuery += ` AND entity_type = $${countValues.length + 1}`;
        countValues.push(entity_type);
      }

      if (start_date) {
        countQuery += ` AND created_at >= $${countValues.length + 1}`;
        countValues.push(start_date);
      }

      if (end_date) {
        countQuery += ` AND created_at <= $${countValues.length + 1}`;
        countValues.push(end_date);
      }

      const countResult = await pool.query(countQuery, countValues);
      const total = parseInt(countResult.rows[0].count);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        logs: result.rows,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_ERROR).json({
        error: error.message,
      });
    }
  }

  static async getAuditLogById(req, res) {
    try {
      const { id } = req.params;
      const result = await pool.query('SELECT * FROM audit_logs WHERE id = $1', [id]);

      if (result.rows.length === 0) {
        return res.status(CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
          error: 'Audit log not found',
        });
      }

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        log: result.rows[0],
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_ERROR).json({
        error: error.message,
      });
    }
  }

  static async exportAuditLogs(req, res) {
    try {
      const { format = 'csv' } = req.query;

      const result = await pool.query(`
        SELECT 
          al.id,
          al.action,
          al.entity_type,
          al.entity_id,
          u.name as user_name,
          al.created_at,
          al.ip_address
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        ORDER BY al.created_at DESC
      `);

      const logs = result.rows;

      if (format === 'csv') {
        let csv = 'ID,Action,Entity Type,Entity ID,User,Created At,IP Address\n';
        logs.forEach((log) => {
          csv += `${log.id},"${log.action}","${log.entity_type}",${log.entity_id},"${log.user_name}","${log.created_at}","${log.ip_address}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="audit_logs.csv"');
        res.send(csv);
      } else if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="audit_logs.json"');
        res.json({ logs });
      }
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_ERROR).json({
        error: error.message,
      });
    }
  }
}

class AlertController {
  static async getAllAlerts(req, res) {
    try {
      const alerts = await Alert.getAll();

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        alerts,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_ERROR).json({
        error: error.message,
      });
    }
  }

  static async getUnresolvedAlerts(req, res) {
    try {
      const alerts = await Alert.getUnresolved();

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        alerts,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_ERROR).json({
        error: error.message,
      });
    }
  }

  static async resolveAlert(req, res) {
    try {
      const { id } = req.params;
      const alert = await Alert.resolve(id, req.user.id);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Alert resolved successfully',
        alert,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        error: error.message,
      });
    }
  }
}

module.exports = { AuditLogController, AlertController };
