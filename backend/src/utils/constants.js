const CONSTANTS = {
  ROLES: {
    ADMIN: 'admin',
    MANAGER: 'manager',
    OPERATOR: 'operator',
  },

  WORK_ORDER_STATUS: {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    DELIVERED: 'delivered',
  },

  DESIGN_STATUS: {
    SUBMITTED: 'submitted',
    REVIEWED: 'reviewed',
    APPROVED: 'approved',
    REJECTED: 'rejected',
  },

  ALERT_TYPES: {
    REORDER: 'reorder',
    MACHINE_MAINTENANCE: 'machine_maintenance',
    LOW_INVENTORY: 'low_inventory',
    OVERDUE_ORDER: 'overdue_order',
  },

  ITEM_TYPES: {
    THREAD: 'thread',
    NEEDLE: 'needle',
    BACKING_CLOTH: 'backing_cloth',
    STABILIZER: 'stabilizer',
    OTHER: 'other',
  },

  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_ERROR: 500,
  },

  ERRORS: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    UNAUTHORIZED: 'Unauthorized access',
    NOT_FOUND: 'Resource not found',
    VALIDATION_ERROR: 'Validation error',
    DESIGN_NOT_APPROVED: 'Design must be approved before production',
    MACHINE_INCOMPATIBLE: 'Machine does not support required thread colors',
    INSUFFICIENT_INVENTORY: 'Insufficient inventory for this order',
    INVALID_MACHINE_CAPACITY: 'Machine capacity exceeded',
  },

  MACHINE_COST_PER_HOUR: 50,
  LABOR_COST_PER_HOUR: 15,
  OVERHEAD_PERCENTAGE: 0.15,
};

module.exports = CONSTANTS;
