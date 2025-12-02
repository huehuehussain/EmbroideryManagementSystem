const AuthService = require('../services/AuthService');
const CONSTANTS = require('../utils/constants');

class AuthController {
  static async register(req, res) {
    try {
      const { name, email, password, role, phone, department } = req.body;

      if (!name || !email || !password) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          error: 'Name, email, and password are required',
        });
      }

      const user = await AuthService.register({
        name,
        email,
        password,
        role,
        phone,
        department,
      });

      res.status(CONSTANTS.HTTP_STATUS.CREATED).json({
        message: 'User registered successfully',
        user,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        error: error.message,
      });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          error: 'Email and password are required',
        });
      }

      const result = await AuthService.login(email, password);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Login successful',
        token: result.token,
        user: result.user,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.UNAUTHORIZED).json({
        error: error.message,
      });
    }
  }

  static async validateToken(req, res) {
    try {
      const token = req.headers['authorization']?.split(' ')[1];

      if (!token) {
        return res.status(CONSTANTS.HTTP_STATUS.UNAUTHORIZED).json({
          error: 'Token not provided',
        });
      }

      const payload = AuthService.validateToken(token);

      if (!payload) {
        return res.status(CONSTANTS.HTTP_STATUS.UNAUTHORIZED).json({
          error: 'Invalid token',
        });
      }

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Token is valid',
        payload,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.UNAUTHORIZED).json({
        error: error.message,
      });
    }
  }
}

module.exports = AuthController;
