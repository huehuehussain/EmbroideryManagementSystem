const express = require('express');
const WorkOrderController = require('../controllers/WorkOrderController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware.authenticateToken);

router.post('/', WorkOrderController.createWorkOrder);
router.get('/', WorkOrderController.getAllWorkOrders);
router.get('/:id', WorkOrderController.getWorkOrderById);
router.post('/:id/start', WorkOrderController.startWorkOrder);
router.post('/:id/complete', WorkOrderController.completeWorkOrder);
router.patch('/:id/status', WorkOrderController.updateWorkOrderStatus);
router.post('/:id/calculate-cost', WorkOrderController.calculateCost);

module.exports = router;
