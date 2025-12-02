const express = require('express');
const OperatorShiftController = require('../controllers/OperatorShiftController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware.authenticateToken);

router.get('/', OperatorShiftController.getAllShifts);
router.get('/:id', OperatorShiftController.getShiftById);
router.get('/operator/:operator_id', OperatorShiftController.getOperatorShifts);
router.post('/', OperatorShiftController.createShift);
router.patch('/:id', OperatorShiftController.updateShift);

module.exports = router;
