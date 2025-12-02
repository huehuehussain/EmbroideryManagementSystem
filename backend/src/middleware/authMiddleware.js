const tokenUtils = require('../utils/tokenUtils');
const CONSTANTS = require('../utils/constants');

const authMiddleware = {
  authenticateToken: (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(CONSTANTS.HTTP_STATUS.UNAUTHORIZED).json({
        error: CONSTANTS.ERRORS.UNAUTHORIZED,
      });
    }

    const payload = tokenUtils.verifyToken(token);
    if (!payload) {
      return res.status(CONSTANTS.HTTP_STATUS.UNAUTHORIZED).json({
        error: CONSTANTS.ERRORS.UNAUTHORIZED,
      });
    }

    req.user = payload;
    next();
  },

  authorizeRole: (...allowedRoles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(CONSTANTS.HTTP_STATUS.UNAUTHORIZED).json({
          error: CONSTANTS.ERRORS.UNAUTHORIZED,
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(CONSTANTS.HTTP_STATUS.FORBIDDEN).json({
          error: 'Access forbidden: Insufficient permissions',
        });
      }

      next();
    };
  },
};

module.exports = authMiddleware;
