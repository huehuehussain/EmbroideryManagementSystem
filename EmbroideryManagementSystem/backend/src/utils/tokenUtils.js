const jwt = require('jwt-simple');
require('dotenv').config();

const SECRET = process.env.JWT_SECRET || 'your_secret_key';

const tokenUtils = {
  generateToken: (payload) => {
    const token = jwt.encode(payload, SECRET);
    return token;
  },

  verifyToken: (token) => {
    try {
      const payload = jwt.decode(token, SECRET);
      return payload;
    } catch (error) {
      return null;
    }
  },

  decodeToken: (token) => {
    try {
      return jwt.decode(token, SECRET);
    } catch (error) {
      return null;
    }
  },
};

module.exports = tokenUtils;
