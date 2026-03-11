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
  'inventory.view_logs': [ROLES.ADMIN, ROLES.MANAGER],
};

// Order types
export const ORDER_TYPES = {
  POS_SALE: 'pos_sale',
  ONLINE_ORDER: 'online_order',
};

// Order statuses
export const ORDER_STATUSES = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  RETURNED: 'returned',
  PARTIALLY_RETURNED: 'partially_returned',
  CANCELLED: 'cancelled',
};

// Metal types
export const METAL_TYPES = {
  GOLD: 'gold',
  SILVER: 'silver',
  PLATINUM: 'platinum',
  DIAMOND: 'diamond',
  OTHER: 'other',
};

// Payment methods
export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  UPI: 'upi',
  CREDIT: 'credit',
};

// Inventory actions
export const INVENTORY_ACTIONS = {
  ADD: 'add',
  REDUCE: 'reduce',
  RETURN: 'return',
  ADJUST: 'adjust',
};

// Printer types
export const PRINTER_TYPES = {
  THERMAL_80MM: 'thermal_80mm',
  LABEL_50X25: 'label_50x25',
  A4_STANDARD: 'a4_standard',
};

// Display modes
export const DISPLAY_MODES = {
  KIOSK: 'kiosk',
  WINDOWED: 'windowed',
};

// Barcode formats
export const BARCODE_FORMATS = {
  CODE128: 'CODE128',
  EAN13: 'EAN13',
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
