const express = require('express');
const CustomerOrderController = require('../controllers/CustomerOrderController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware.authenticateToken);

router.get('/', CustomerOrderController.getAllOrders);
router.get('/:id', CustomerOrderController.getOrderById);
router.post('/', CustomerOrderController.createOrder);
router.patch('/:id', CustomerOrderController.updateOrder);
router.patch('/:id/status', CustomerOrderController.updateOrderStatus);

module.exports = router;
