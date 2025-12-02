const express = require('express');
const InventoryController = require('../controllers/InventoryController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware.authenticateToken);

router.get('/', InventoryController.getAllItems);
router.get('/low-stock', InventoryController.getLowStockItems);
router.get('/:id', InventoryController.getItemById);
router.post('/', InventoryController.createItem);
router.patch('/:id', InventoryController.updateItem);
router.post('/:id/deduct', InventoryController.deductStock);
router.post('/bulk/deduct', InventoryController.bulkDeductStock);

module.exports = router;
