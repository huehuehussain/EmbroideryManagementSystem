const pool = require('../config/database');
const CONSTANTS = require('../utils/constants');

const auditMiddleware = async (req, res, next) => {
  res.on('finish', async () => {
    try {
      if (req.user && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        const auditLog = {
          action: `${req.method} ${req.path}`,
          entity_type: req.path.split('/')[2] || 'unknown',
          entity_id: req.body?.id || req.params?.id || null,
          user_id: req.user.id,
          new_values: req.method !== 'DELETE' ? JSON.stringify(req.body) : null,
          ip_address: req.ip,
          user_agent: req.headers['user-agent'],
        };

        await pool.query(
          `INSERT INTO audit_logs (action, entity_type, entity_id, user_id, new_values, ip_address, user_agent)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            auditLog.action,
            auditLog.entity_type,
            auditLog.entity_id,
            auditLog.user_id,
            auditLog.new_values,
            auditLog.ip_address,
            auditLog.user_agent,
          ]
        );
      }
    } catch (error) {
      console.error('Audit logging error:', error);
    }
  });

  next();
};

module.exports = auditMiddleware;
