const WorkOrderService = require('../services/WorkOrderService');
const CONSTANTS = require('../utils/constants');

class WorkOrderController {
  static async createWorkOrder(req, res) {
    try {
      const workOrder = await WorkOrderService.createWorkOrder(req.body, req.user.id);
      res.status(CONSTANTS.HTTP_STATUS.CREATED).json({
        message: 'Work order created successfully',
        workOrder,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        error: error.message,
      });
    }
  }

  static async getAllWorkOrders(req, res) {
    try {
      const workOrders = await WorkOrderService.getAllWorkOrders();
      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        workOrders,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_ERROR).json({
        error: error.message,
      });
    }
  }

  static async getWorkOrderById(req, res) {
    try {
      const { id } = req.params;
      const workOrder = await WorkOrderService.getWorkOrderById(id);

      if (!workOrder) {
        return res.status(CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
          error: 'Work order not found',
        });
      }

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        workOrder,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_ERROR).json({
        error: error.message,
      });
    }
  }

  static async startWorkOrder(req, res) {
    try {
      const { id } = req.params;
      const workOrder = await WorkOrderService.startWorkOrder(id, req.user.id);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Work order started successfully',
        workOrder,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        error: error.message,
      });
    }
  }

  static async completeWorkOrder(req, res) {
    try {
      const { id } = req.params;
      const { quantity_completed } = req.body;

      if (!quantity_completed) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          error: 'Quantity completed is required',
        });
      }

      const workOrder = await WorkOrderService.completeWorkOrder(id, quantity_completed, req.user.id);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Work order completed successfully',
        workOrder,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        error: error.message,
      });
    }
  }

  static async updateWorkOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          error: 'Status is required',
        });
      }

      const workOrder = await WorkOrderService.updateWorkOrderStatus(id, status, req.user.id);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Work order status updated successfully',
        workOrder,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        error: error.message,
      });
    }
  }

  static async calculateCost(req, res) {
    try {
      const { id } = req.params;
      const costData = await WorkOrderService.calculateCost(id, req.user.id);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Cost calculated successfully',
        costData,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        error: error.message,
      });
    }
  }
}

module.exports = WorkOrderController;
