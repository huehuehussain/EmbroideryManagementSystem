const express = require('express');
const DashboardController = require('../controllers/DashboardController');
const { AuditLogController, AlertController } = require('../controllers/AuditLogController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware.authenticateToken);

// Dashboard endpoints
router.get('/overview', DashboardController.getDashboardOverview);
router.get('/production-summary', DashboardController.getProductionSummary);
router.get('/machine-utilization', DashboardController.getMachineUtilization);
router.get('/operator-performance', DashboardController.getOperatorPerformance);
router.get('/inventory-usage', DashboardController.getInventoryUsage);
router.get('/pending-alerts', DashboardController.getPendingAlerts);

// Audit log endpoints
router.get('/audit-logs', AuditLogController.getAllAuditLogs);
router.get('/audit-logs/:id', AuditLogController.getAuditLogById);
router.get('/audit-logs/export/:format', AuditLogController.exportAuditLogs);

// Alert endpoints
router.get('/alerts', AlertController.getAllAlerts);
router.get('/alerts/unresolved', AlertController.getUnresolvedAlerts);
router.patch('/alerts/:id/resolve', AlertController.resolveAlert);

module.exports = router;
