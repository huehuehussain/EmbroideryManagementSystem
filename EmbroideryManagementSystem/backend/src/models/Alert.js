const pool = require('../config/database');

class Alert {
  static async findById(id) {
    const result = await pool.query('SELECT * FROM alerts WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async getUnresolved() {
    const result = await pool.query('SELECT * FROM alerts WHERE is_resolved = false ORDER BY created_at DESC');
    return result.rows;
  }

  static async getAll() {
    const result = await pool.query('SELECT * FROM alerts ORDER BY created_at DESC');
    return result.rows;
  }

  static async create(alertData) {
    const { alert_type, entity_type, entity_id, title, message } = alertData;
    const result = await pool.query(
      `INSERT INTO alerts (alert_type, entity_type, entity_id, title, message)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [alert_type, entity_type, entity_id, title, message]
    );
    return result.rows[0];
  }

  static async resolve(id, resolvedBy) {
    const result = await pool.query(
      `UPDATE alerts SET is_resolved = true, resolved_by = $1, resolved_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [resolvedBy, id]
    );
    return result.rows[0];
  }

  static async deleteOldAlerts(daysOld = 30) {
    await pool.query(`DELETE FROM alerts WHERE created_at < NOW() - INTERVAL '${daysOld} days' AND is_resolved = true`);
  }
}

module.exports = Alert;
