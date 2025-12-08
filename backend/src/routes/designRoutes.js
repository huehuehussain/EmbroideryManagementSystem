const express = require('express');
const DesignController = require('../controllers/DesignController');
const authMiddleware = require('../middleware/authMiddleware');
const CONSTANTS = require('../utils/constants');

const router = express.Router();

router.use(authMiddleware.authenticateToken);

router.get('/', DesignController.getAllDesigns);
router.get('/:id', DesignController.getDesignById);

router.post('/', DesignController.createDesign);
router.patch('/:id', DesignController.updateDesign);
router.delete('/:id', DesignController.deleteDesign);
router.patch('/:id/approve', authMiddleware.authorizeRole(CONSTANTS.ROLES.ADMIN, CONSTANTS.ROLES.MANAGER), DesignController.approveDesign);
router.patch('/:id/reject', authMiddleware.authorizeRole(CONSTANTS.ROLES.ADMIN, CONSTANTS.ROLES.MANAGER), DesignController.rejectDesign);
router.patch('/:id/review', authMiddleware.authorizeRole(CONSTANTS.ROLES.ADMIN, CONSTANTS.ROLES.MANAGER), DesignController.reviewDesign);

module.exports = router;

