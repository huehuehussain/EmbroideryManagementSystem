const express = require('express');
const InventoryController = require('../controllers/InventoryController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware.authenticateToken);

router.get('/', InventoryController.getAllItems);
router.get('/low-stock', InventoryController.getLowStockItems);
router.post('/bulk/deduct', InventoryController.bulkDeductStock);
router.get('/:id', InventoryController.getItemById);
router.post('/', InventoryController.createItem);
router.patch('/:id', InventoryController.updateItem);
router.delete('/:id', InventoryController.deleteItem);
router.post('/:id/deduct', InventoryController.deductStock);
router.post('/:id/restock', InventoryController.restockItem);

module.exports = router;
