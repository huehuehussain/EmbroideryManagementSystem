const User = require('../models/User');
const passwordUtils = require('../utils/passwordUtils');
const tokenUtils = require('../utils/tokenUtils');
const CONSTANTS = require('../utils/constants');

class AuthService {
  static async register(userData) {
    const { name, email, password, role = CONSTANTS.ROLES.OPERATOR, phone, department } = userData;

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const passwordHash = await passwordUtils.hashPassword(password);

    const user = await User.create({
      name,
      email,
      password_hash: passwordHash,
      role,
      phone,
      department,
    });

    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }

  static async login(email, password) {
    const user = await User.findByEmail(email);

    if (!user) {
      throw new Error(CONSTANTS.ERRORS.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await passwordUtils.comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error(CONSTANTS.ERRORS.INVALID_CREDENTIALS);
    }

    if (!user.is_active) {
      throw new Error('User account is inactive');
    }

    const token = tokenUtils.generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
  }

  static async validateToken(token) {
    return tokenUtils.verifyToken(token);
  }
}

module.exports = AuthService;
