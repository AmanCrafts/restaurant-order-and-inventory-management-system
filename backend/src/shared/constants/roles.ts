export enum UserRole {
  ADMIN = 'ADMIN',
  WAITER = 'WAITER',
  COOK = 'COOK',
}

export const RolePermissions = {
  [UserRole.ADMIN]: [
    'manage_restaurant',
    'manage_staff',
    'manage_menu',
    'manage_inventory',
    'view_orders',
    'manage_bills',
    'view_reports',
  ],
  [UserRole.WAITER]: [
    'create_order',
    'update_order',
    'view_order',
    'manage_bill',
    'view_menu',
  ],
  [UserRole.COOK]: ['view_kitchen_orders', 'update_order_status', 'view_menu'],
};
