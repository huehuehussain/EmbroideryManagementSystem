const InventoryItem = require('../models/InventoryItem');
const Alert = require('../models/Alert');
const CONSTANTS = require('../utils/constants');

class InventoryService {
  static async getAllInventoryItems() {
    return await InventoryItem.getAll();
  }

  static async getInventoryItemById(id) {
    return await InventoryItem.findById(id);
  }

  static async createInventoryItem(itemData) {
    return await InventoryItem.create(itemData);
  }

  static async updateInventoryItem(id, itemData) {
    const updated = await InventoryItem.update(id, itemData);

    // Check if stock is now low
    if (itemData.quantity_available !== undefined) {
      const item = await InventoryItem.findById(id);
      if (item.quantity_available <= item.minimum_stock_level) {
        await Alert.create({
          alert_type: CONSTANTS.ALERT_TYPES.LOW_INVENTORY,
          entity_type: 'inventory_item',
          entity_id: id,
          title: `Low Inventory Alert: ${item.item_name}`,
          message: `Item "${item.item_name}" stock is below minimum level.`,
        });
      }
    }

    return updated;
  }

  static async deductInventoryItem(id, quantity, userId = null) {
    const item = await InventoryItem.findById(id);

    if (!item) {
      throw new Error('Inventory item not found');
    }

    const available = parseFloat(item.quantity_available);
    if (available < quantity) {
      throw new Error(`${CONSTANTS.ERRORS.INSUFFICIENT_INVENTORY}: ${item.item_name}`);
    }

    const updated = await InventoryItem.deductStock(id, quantity);

    // Check if stock is now below minimum
    if (updated.quantity_available <= updated.minimum_stock_level) {
      await Alert.create({
        alert_type: CONSTANTS.ALERT_TYPES.REORDER,
        entity_type: 'inventory_item',
        entity_id: id,
        title: `Reorder Alert: ${item.item_name}`,
        message: `Item "${item.item_name}" stock is below minimum level.`,
      });
    }

    return updated;
  }

  static async getLowStockItems() {
    return await InventoryItem.getLowStockItems();
  }

  static async bulkDeductInventory(itemIds, quantities) {
    const results = [];

    for (let i = 0; i < itemIds.length; i++) {
      try {
        const updated = await this.deductInventoryItem(itemIds[i], quantities[i]);
        results.push({ id: itemIds[i], success: true, item: updated });
      } catch (error) {
        results.push({ id: itemIds[i], success: false, error: error.message });
      }
    }

    return results;
  }
}

module.exports = InventoryService;
