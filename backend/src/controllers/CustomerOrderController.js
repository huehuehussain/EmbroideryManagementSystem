const CustomerOrder = require('../models/CustomerOrder');
const CONSTANTS = require('../utils/constants');

class CustomerOrderController {
  static async getAllOrders(req, res) {
    try {
      const orders = await CustomerOrder.getAll();

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        orders,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_ERROR).json({
        error: error.message,
      });
    }
  }

  static async getOrderById(req, res) {
    try {
      const { id } = req.params;
      const order = await CustomerOrder.findById(id);

      if (!order) {
        return res.status(CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
          error: 'Customer order not found',
        });
      }

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        order,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_ERROR).json({
        error: error.message,
      });
    }
  }

  static async createOrder(req, res) {
    try {
      const orderData = req.body;

      if (!orderData.order_number || !orderData.customer_name) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          error: 'Order number and customer name are required',
        });
      }

      // Generate unique order number if not provided
      if (!orderData.order_number) {
        orderData.order_number = `ORD-${Date.now()}`;
      }

      const order = await CustomerOrder.create(orderData);

      res.status(CONSTANTS.HTTP_STATUS.CREATED).json({
        message: 'Customer order created successfully',
        order,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        error: error.message,
      });
    }
  }

  static async updateOrder(req, res) {
    try {
      const { id } = req.params;
      const order = await CustomerOrder.update(id, req.body);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Customer order updated successfully',
        order,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        error: error.message,
      });
    }
  }

  static async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          error: 'Status is required',
        });
      }

      const order = await CustomerOrder.updateStatus(id, status);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Order status updated successfully',
        order,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        error: error.message,
      });
    }
  }

  static async deleteOrder(req, res) {
    try {
      const { id } = req.params;
      const order = await CustomerOrder.findById(id);

      if (!order) {
        return res.status(CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
          error: 'Customer order not found',
        });
      }

      await CustomerOrder.delete(id);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Customer order deleted successfully',
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        error: error.message,
      });
    }
  }
}

module.exports = CustomerOrderController;
