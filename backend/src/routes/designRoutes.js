const express = require('express');
const DesignController = require('../controllers/DesignController');
const authMiddleware = require('../middleware/authMiddleware');
const CONSTANTS = require('../utils/constants');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/designs/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.dst', '.pes', '.exp', '.jef', '.vip', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

router.use(authMiddleware.authenticateToken);

router.get('/', DesignController.getAllDesigns);
router.get('/:id', DesignController.getDesignById);

router.post('/upload', upload.single('design_file'), DesignController.uploadDesign);
router.patch('/:id/approve', authMiddleware.authorizeRole(CONSTANTS.ROLES.ADMIN, CONSTANTS.ROLES.MANAGER), DesignController.approveDesign);
router.patch('/:id/reject', authMiddleware.authorizeRole(CONSTANTS.ROLES.ADMIN, CONSTANTS.ROLES.MANAGER), DesignController.rejectDesign);
router.patch('/:id/review', authMiddleware.authorizeRole(CONSTANTS.ROLES.ADMIN, CONSTANTS.ROLES.MANAGER), DesignController.reviewDesign);

module.exports = router;
