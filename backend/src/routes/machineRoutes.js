const express = require('express');
const MachineController = require('../controllers/MachineController');
const authMiddleware = require('../middleware/authMiddleware');
const CONSTANTS = require('../utils/constants');

const router = express.Router();

router.use(authMiddleware.authenticateToken);

router.get('/', MachineController.getAllMachines);
router.get('/:id', MachineController.getMachineById);

router.post('/', authMiddleware.authorizeRole(CONSTANTS.ROLES.ADMIN, CONSTANTS.ROLES.MANAGER), MachineController.createMachine);
router.patch('/:id', authMiddleware.authorizeRole(CONSTANTS.ROLES.ADMIN, CONSTANTS.ROLES.MANAGER), MachineController.updateMachine);

router.post('/:id/validate-colors', MachineController.validateThreadColors);
router.post('/:id/validate-capacity', MachineController.validateCapacity);

module.exports = router;
