const OperatorShift = require('../models/OperatorShift');
const CONSTANTS = require('../utils/constants');

class OperatorShiftController {
  static async getAllShifts(req, res) {
    try {
      const { start_date, end_date } = req.query;
      const shifts = await OperatorShift.getAll(start_date, end_date);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        shifts,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_ERROR).json({
        error: error.message,
      });
    }
  }

  static async getShiftById(req, res) {
    try {
      const { id } = req.params;
      const shift = await OperatorShift.findById(id);

      if (!shift) {
        return res.status(CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
          error: 'Operator shift not found',
        });
      }

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        shift,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_ERROR).json({
        error: error.message,
      });
    }
  }

  static async getOperatorShifts(req, res) {
    try {
      const { operator_id } = req.params;
      const { start_date, end_date } = req.query;

      const shifts = await OperatorShift.getByOperatorId(operator_id, start_date, end_date);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        shifts,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_ERROR).json({
        error: error.message,
      });
    }
  }

  static async createShift(req, res) {
    try {
      const shiftData = req.body;

      if (!shiftData.operator_id || !shiftData.shift_date || !shiftData.shift_start_time) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          error: 'Operator ID, shift date, and shift start time are required',
        });
      }

      const shift = await OperatorShift.create(shiftData);

      res.status(CONSTANTS.HTTP_STATUS.CREATED).json({
        message: 'Operator shift created successfully',
        shift,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        error: error.message,
      });
    }
  }

  static async updateShift(req, res) {
    try {
      const { id } = req.params;
      const shift = await OperatorShift.update(id, req.body);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Operator shift updated successfully',
        shift,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        error: error.message,
      });
    }
  }
}

module.exports = OperatorShiftController;
