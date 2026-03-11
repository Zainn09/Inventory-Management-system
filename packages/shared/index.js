// Role definitions
const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier'
};

// Permission matrix
const PERMISSIONS = {
  // Products
  'products.create': [ROLES.ADMIN, ROLES.MANAGER],
  'products.update': [ROLES.ADMIN, ROLES.MANAGER],
  'products.delete': [ROLES.ADMIN],
  'products.view': [ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER],
  'products.adjust_stock': [ROLES.ADMIN, ROLES.MANAGER],

  // Orders
  'orders.create': [ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER],
  'orders.view': [ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER],
  'orders.view_all': [ROLES.ADMIN, ROLES.MANAGER],

  // Returns
  'returns.create': [ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER],
  'returns.view': [ROLES.ADMIN, ROLES.MANAGER],

  // Customers
  'customers.create': [ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER],
  'customers.update': [ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER],
  'customers.view': [ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER],

  // Reports
  'reports.view': [ROLES.ADMIN, ROLES.MANAGER],
  'reports.profit': [ROLES.ADMIN],
  'reports.export': [ROLES.ADMIN],

  // Users
  'users.manage': [ROLES.ADMIN],

  // Settings
  'settings.manage': [ROLES.ADMIN],

  // Barcodes
  'barcodes.print': [ROLES.ADMIN, ROLES.MANAGER],
  'barcodes.scan': [ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER],

  // Suppliers
  'suppliers.manage': [ROLES.ADMIN, ROLES.MANAGER],

  // Audit
  'audit.view': [ROLES.ADMIN]
};

// Order types
const ORDER_TYPES = {
  POS_SALE: 'pos_sale',
  ONLINE_ORDER: 'online_order'
};

// Order statuses
const ORDER_STATUSES = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  RETURNED: 'returned',
  PARTIALLY_RETURNED: 'partially_returned'
};

// Metal types
const METAL_TYPES = {
  GOLD: 'gold',
  SILVER: 'silver',
  PLATINUM: 'platinum',
  DIAMOND: 'diamond',
  OTHER: 'other'
};

// Payment methods
const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  UPI: 'upi',
  BANK_TRANSFER: 'bank_transfer',
  MIXED: 'mixed'
};

// Inventory actions
const INVENTORY_ACTIONS = {
  ADDED: 'added',
  SOLD: 'sold',
  RETURNED: 'returned',
  ADJUSTED: 'adjusted',
  DAMAGED: 'damaged'
};

function hasPermission(role, permission) {
  const allowed = PERMISSIONS[permission];
  return allowed ? allowed.includes(role) : false;
}

module.exports = {
  ROLES,
  PERMISSIONS,
  ORDER_TYPES,
  ORDER_STATUSES,
  METAL_TYPES,
  PAYMENT_METHODS,
  INVENTORY_ACTIONS,
  hasPermission
};
