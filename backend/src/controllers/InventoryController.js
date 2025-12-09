const InventoryService = require('../services/InventoryService');
const CONSTANTS = require('../utils/constants');

class InventoryController {
  static async getAllItems(req, res) {
    try {
      const items = await InventoryService.getAllInventoryItems();
      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        items,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_ERROR).json({
        error: error.message,
      });
    }
  }

  static async getItemById(req, res) {
    try {
      const { id } = req.params;
      const item = await InventoryService.getInventoryItemById(id);

      if (!item) {
        return res.status(CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
          error: 'Inventory item not found',
        });
      }

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        item,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_ERROR).json({
        error: error.message,
      });
    }
  }

  static async createItem(req, res) {
    try {
      const item = await InventoryService.createInventoryItem(req.body);

      res.status(CONSTANTS.HTTP_STATUS.CREATED).json({
        message: 'Inventory item created successfully',
        item,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        error: error.message,
      });
    }
  }

  static async updateItem(req, res) {
    try {
      const { id } = req.params;
      const item = await InventoryService.updateInventoryItem(id, req.body);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Inventory item updated successfully',
        item,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        error: error.message,
      });
    }
  }

  static async deleteItem(req, res) {
    try {
      const { id } = req.params;
      const item = await InventoryService.deleteInventoryItem(id);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Inventory item deleted successfully',
        item,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        error: error.message,
      });
    }
  }

  static async deductStock(req, res) {
    try {
      const { id } = req.params;
      const { quantity } = req.body;

      if (!quantity) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          error: 'Quantity is required',
        });
      }

      const item = await InventoryService.deductInventoryItem(id, quantity, req.user.id);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Stock deducted successfully',
        item,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        error: error.message,
      });
    }
  }

  static async getLowStockItems(req, res) {
    try {
      const items = await InventoryService.getLowStockItems();

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        items,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_ERROR).json({
        error: error.message,
      });
    }
  }

  static async bulkDeductStock(req, res) {
    try {
      const { itemIds, quantities } = req.body;

      if (!itemIds || !quantities) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          error: 'ItemIds and quantities are required',
        });
      }

      const results = await InventoryService.bulkDeductInventory(itemIds, quantities);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Bulk deduction processed',
        results,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        error: error.message,
      });
    }
  }

  static async restockItem(req, res) {
    try {
      const { id } = req.params;
      const { quantity } = req.body;

      if (!quantity || quantity <= 0) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          error: 'Restock quantity must be greater than 0',
        });
      }

      const item = await InventoryService.restockInventoryItem(id, quantity);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Inventory item restocked successfully',
        item,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        error: error.message,
      });
    }
  }
}

module.exports = InventoryController;