const WorkOrder = require('../models/WorkOrder');
const Design = require('../models/Design');
const Machine = require('../models/Machine');
const InventoryItem = require('../models/InventoryItem');
const CostingRecord = require('../models/CostingRecord');
const Alert = require('../models/Alert');
const CONSTANTS = require('../utils/constants');
const pool = require('../config/database');

class WorkOrderService {
  static async createWorkOrder(workOrderData, userId) {
    const {
      work_order_number,
      machine_id,
      design_id,
      customer_order_id,
      quantity_to_produce,
      thread_colors_required,
      thread_quantities,
      estimated_production_time,
      assigned_operator_id,
    } = workOrderData;

    // Validate design is approved
    const design = await Design.findById(design_id);
    if (!design || design.status !== 'approved') {
      throw new Error(CONSTANTS.ERRORS.DESIGN_NOT_APPROVED);
    }

    // Validate machine supports thread colors
    const isThreadColorValid = await Machine.validateThreadColors(machine_id, thread_colors_required);
    if (!isThreadColorValid) {
      throw new Error(CONSTANTS.ERRORS.MACHINE_INCOMPATIBLE);
    }

    // Create work order
    const workOrder = await WorkOrder.create({
      work_order_number,
      machine_id,
      design_id,
      customer_order_id,
      quantity_to_produce,
      thread_colors_required,
      thread_quantities,
      estimated_production_time,
      assigned_operator_id,
    });

    return workOrder;
  }

  static async startWorkOrder(workOrderId, userId) {
    const workOrder = await WorkOrder.findById(workOrderId);

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    if (workOrder.status !== CONSTANTS.WORK_ORDER_STATUS.PENDING) {
      throw new Error('Work order can only be started from pending status');
    }

    // Deduct inventory
    await this.deductInventory(workOrder);

    // Update work order status
    const updated = await WorkOrder.updateStatus(
      workOrderId,
      CONSTANTS.WORK_ORDER_STATUS.IN_PROGRESS,
      new Date()
    );

    return updated;
  }

  static async deductInventory(workOrder) {
    const threadColors = workOrder.thread_colors_required || [];
    const quantities = workOrder.thread_quantities || [];

    for (let i = 0; i < threadColors.length; i++) {
      const color = threadColors[i];
      const quantity = quantities[i];

      // Get thread by color (simplified - in real app, link colors to thread IDs)
      const result = await pool.query('SELECT * FROM threads WHERE color = $1', [color]);
      if (result.rows.length > 0) {
        const thread = result.rows[0];
        const available = parseFloat(thread.quantity_in_stock);

        if (available < quantity) {
          throw new Error(`${CONSTANTS.ERRORS.INSUFFICIENT_INVENTORY}: ${color}`);
        }

        // Deduct stock
        await pool.query(
          'UPDATE threads SET quantity_in_stock = quantity_in_stock - $1 WHERE id = $2',
          [quantity, thread.id]
        );

        // Check if stock is now below minimum
        const updated = await pool.query('SELECT * FROM threads WHERE id = $1', [thread.id]);
        const updatedThread = updated.rows[0];
        if (updatedThread.quantity_in_stock <= updatedThread.minimum_stock_level) {
          await Alert.create({
            alert_type: CONSTANTS.ALERT_TYPES.REORDER,
            entity_type: 'thread',
            entity_id: thread.id,
            title: `Reorder Alert: ${thread.name}`,
            message: `Thread "${thread.name}" (${color}) stock is below minimum level.`,
          });
        }
      }
    }
  }

  static async completeWorkOrder(workOrderId, quantityCompleted, userId) {
    const workOrder = await WorkOrder.findById(workOrderId);

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    // Update completed quantity and status
    const updated = await WorkOrder.updateStatus(
      workOrderId,
      CONSTANTS.WORK_ORDER_STATUS.COMPLETED,
      null,
      new Date()
    );

    await WorkOrder.updateCompletedQuantity(workOrderId, quantityCompleted);

    return updated;
  }

  static async updateWorkOrderStatus(workOrderId, status, userId) {
    const workOrder = await WorkOrder.findById(workOrderId);

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    const validStatuses = Object.values(CONSTANTS.WORK_ORDER_STATUS);
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }

    const updated = await WorkOrder.updateStatus(workOrderId, status);
    return updated;
  }

  static async calculateCost(workOrderId, userId) {
    const workOrder = await WorkOrder.findById(workOrderId);

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    // Thread cost calculation
    const threadCost = await this.calculateThreadCost(workOrder);

    // Machine cost calculation (per hour * estimated hours)
    const estimatedHours = (workOrder.estimated_production_time || 60) / 60;
    const machineCost = CONSTANTS.MACHINE_COST_PER_HOUR * estimatedHours;

    // Labor cost calculation
    const laborCost = CONSTANTS.LABOR_COST_PER_HOUR * estimatedHours;

    // Overhead cost
    const subtotal = threadCost + machineCost + laborCost;
    const overheadCost = subtotal * CONSTANTS.OVERHEAD_PERCENTAGE;

    // Total cost
    const totalCost = threadCost + machineCost + laborCost + overheadCost;

    // Update work order with costs
    const costData = {
      thread_cost: threadCost,
      machine_cost: machineCost,
      labor_cost: laborCost,
      overhead_cost: overheadCost,
      total_cost: totalCost,
    };

    await WorkOrder.updateCost(workOrderId, costData);

    // Create costing record
    const costingRecord = await CostingRecord.create({
      work_order_id: workOrderId,
      ...costData,
      calculated_by: userId,
      cost_breakdown: JSON.stringify({
        threadBreakdown: workOrder.thread_colors_required,
        threadQuantities: workOrder.thread_quantities,
        estimatedHours,
      }),
    });

    return { ...costData, costingRecord };
  }

  static async calculateThreadCost(workOrder) {
    let totalThreadCost = 0;

    const threadColors = workOrder.thread_colors_required || [];
    const quantities = workOrder.thread_quantities || [];

    for (let i = 0; i < threadColors.length; i++) {
      const color = threadColors[i];
      const quantity = quantities[i];

      const result = await pool.query('SELECT * FROM threads WHERE color = $1', [color]);
      if (result.rows.length > 0) {
        const thread = result.rows[0];
        totalThreadCost += thread.unit_cost * quantity;
      }
    }

    return totalThreadCost;
  }

  static async getWorkOrderById(workOrderId) {
    return await WorkOrder.findById(workOrderId);
  }

  static async getAllWorkOrders() {
    return await WorkOrder.getAll();
  }
}

module.exports = WorkOrderService;
