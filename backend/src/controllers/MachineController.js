const Machine = require('../models/Machine');
const CONSTANTS = require('../utils/constants');

class MachineController {
  static async getAllMachines(req, res) {
    try {
      const machines = await Machine.getAll();
      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        machines,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_ERROR).json({
        error: error.message,
      });
    }
  }

  static async getMachineById(req, res) {
    try {
      const { id } = req.params;
      const machine = await Machine.findById(id);

      if (!machine) {
        return res.status(CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
          error: 'Machine not found',
        });
      }

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        machine,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_ERROR).json({
        error: error.message,
      });
    }
  }

  static async createMachine(req, res) {
    try {
      const machine = await Machine.create(req.body);

      res.status(CONSTANTS.HTTP_STATUS.CREATED).json({
        message: 'Machine created successfully',
        machine,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        error: error.message,
      });
    }
  }

  static async updateMachine(req, res) {
    try {
      const { id } = req.params;
      const machine = await Machine.update(id, req.body);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Machine updated successfully',
        machine,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        error: error.message,
      });
    }
  }

  static async validateThreadColors(req, res) {
    try {
      const { id } = req.params;
      const { thread_colors } = req.body;

      if (!thread_colors || !Array.isArray(thread_colors)) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          error: 'Thread colors array is required',
        });
      }

      const isValid = await Machine.validateThreadColors(id, thread_colors);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        isValid,
        message: isValid ? 'Machine supports all required thread colors' : 'Machine does not support all thread colors',
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        error: error.message,
      });
    }
  }

  static async validateCapacity(req, res) {
    try {
      const { id } = req.params;
      const { estimated_stitches } = req.body;

      if (estimated_stitches === undefined) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          error: 'Estimated stitches is required',
        });
      }

      const isValid = await Machine.validateCapacity(id, estimated_stitches);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        isValid,
        message: isValid ? 'Machine can handle estimated stitches' : 'Machine capacity exceeded',
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        error: error.message,
      });
    }
  }

  static async deleteMachine(req, res) {
    try {
      const { id } = req.params;
      const machine = await Machine.findById(id);

      if (!machine) {
        return res.status(CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
          error: 'Machine not found',
        });
      }

      await Machine.delete(id);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Machine deleted successfully',
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        error: error.message,
      });
    }
  }
}

module.exports = MachineController;
