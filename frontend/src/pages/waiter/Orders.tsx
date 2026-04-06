import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Button, Badge } from '../../components/common';
import { OrderService, TableService, MenuService } from '../../services';
import { OrderStatus } from '../../types';
import type { Order, Table, MenuItem, MenuCategory } from '../../types';
import {
  Plus,
  ChefHat,
  Utensils,
  Receipt,
  Clock,
  Minus,
  Plus as PlusIcon,
} from 'lucide-react';

interface OrderItemInput {
  menuItemId: string;
  quantity: number;
  menuItem: MenuItem;
}

export const WaiterOrders: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [orderItems, setOrderItems] = useState<OrderItemInput[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    if (user?.restaurantId) {
      fetchData();
    }
  }, [user?.restaurantId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [ordersData, tablesData, menuData] = await Promise.all([
        OrderService.getAll({ restaurantId: user!.restaurantId }),
        TableService.getAll({ restaurantId: user!.restaurantId }),
        MenuService.getByRestaurant(user!.restaurantId),
      ]);
      setOrders(ordersData.filter((o) => o.status !== OrderStatus.CLOSED));
      setTables(tablesData.filter((t) => t.status === 'FREE'));
      setCategories(menuData);
      if (menuData.length > 0) {
        setMenuItems(menuData.flatMap((c) => c.items || []));
        setSelectedCategory(menuData[0].id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getOrderStatusBadge = (status: OrderStatus) => {
    const variants: Record<OrderStatus, 'default' | 'warning' | 'success' | 'danger' | 'info'> = {
      [OrderStatus.CREATED]: 'default',
      [OrderStatus.SENT_TO_KITCHEN]: 'info',
      [OrderStatus.COOKING]: 'warning',
      [OrderStatus.READY]: 'success',
      [OrderStatus.SERVED]: 'success',
      [OrderStatus.BILLED]: 'default',
      [OrderStatus.CLOSED]: 'default',
    };
    return <Badge variant={variants[status]}>{status.replace(/_/g, ' ')}</Badge>;
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COOKING:
        return <ChefHat size={18} className="text-orange-500" />;
      case OrderStatus.READY:
        return <Utensils size={18} className="text-green-500" />;
      case OrderStatus.BILLED:
        return <Receipt size={18} className="text-blue-500" />;
      default:
        return <Clock size={18} className="text-gray-500" />;
    }
  };

  const addItemToOrder = (menuItem: MenuItem) => {
    setOrderItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === menuItem.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === menuItem.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [
        ...prev,
        {
          menuItemId: menuItem.id,
          quantity: 1,
          menuItem,
        },
      ];
    });
  };

  const updateItemQuantity = (menuItemId: string, delta: number) => {
    setOrderItems((prev) => {
      return prev
        .map((i) => {
          if (i.menuItemId === menuItemId) {
            return { ...i, quantity: Math.max(0, i.quantity + delta) };
          }
          return i;
        })
        .filter((i) => i.quantity > 0);
    });
  };

  const createOrder = async () => {
    if (!selectedTable || orderItems.length === 0) return;

    try {
      await OrderService.create({
        restaurantId: user!.restaurantId,
        tableId: selectedTable,
        items: orderItems.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
        })),
      });
      setShowCreateModal(false);
      setOrderItems([]);
      setSelectedTable('');
      fetchData();
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const sendToKitchen = async (orderId: string) => {
    try {
      await OrderService.sendToKitchen(orderId);
      fetchData();
    } catch (error) {
      console.error('Error sending to kitchen:', error);
    }
  };

  const serveOrder = async (orderId: string) => {
    try {
      await OrderService.serve(orderId);
      fetchData();
    } catch (error) {
      console.error('Error serving order:', error);
    }
  };

  const filteredMenuItems = selectedCategory
    ? menuItems.filter((item) => item.categoryId === selectedCategory && item.isAvailable)
    : menuItems.filter((item) => item.isAvailable);

  const orderTotal = orderItems.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600">Manage customer orders</p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus size={18} />}
          onClick={() => setShowCreateModal(true)}
        >
          New Order
        </Button>
      </div>

      {/* Orders List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            No active orders
          </div>
        ) : (
          orders.map((order) => (
            <Card key={order.id} className="relative">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(order.status)}
                    <span className="font-semibold text-lg">
                      Table {order.table?.tableNumber || order.tableId.slice(0, 8)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {order.items?.length || 0} items
                  </p>
                </div>
                <div>{getOrderStatusBadge(order.status)}</div>
              </div>

              <div className="space-y-1 mb-4">
                {order.items?.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.quantity}x {item.menuItem?.name || 'Unknown'}
                    </span>
                    <span className="font-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
                {(order.items?.length || 0) > 3 && (
                  <p className="text-sm text-gray-500">
                    +{order.items!.length - 3} more items
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <div className="font-semibold">
                  Total: $
                  {order.items
                    ?.reduce((sum, i) => sum + i.price * i.quantity, 0)
                    .toFixed(2) || '0.00'}
                </div>
                <div className="flex gap-2">
                  {order.status === OrderStatus.CREATED && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => sendToKitchen(order.id)}
                    >
                      Send to Kitchen
                    </Button>
                  )}
                  {order.status === OrderStatus.READY && (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => serveOrder(order.id)}
                    >
                      Mark Served
                    </Button>
                  )}
                  {order.status === OrderStatus.SERVED && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => (window.location.href = `/bills`)}
                    >
                      Generate Bill
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Create New Order</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setOrderItems([]);
                  setSelectedTable('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Table
                </label>
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a table</option>
                  {tables.map((table) => (
                    <option key={table.id} value={table.id}>
                      Table {table.tableNumber} ({table.capacity} seats)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <div className="mb-3 flex gap-2 overflow-x-auto">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                          selectedCategory === cat.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {filteredMenuItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => addItemToOrder(item)}
                        className="p-3 border border-gray-200 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition-colors"
                      >
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-500">
                          ${item.price.toFixed(2)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-3">Order Summary</h3>
                  <div className="space-y-2 mb-4">
                    {orderItems.map((item) => (
                      <div
                        key={item.menuItemId}
                        className="flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="text-sm">{item.menuItem.name}</div>
                          <div className="text-xs text-gray-500">
                            ${item.menuItem.price.toFixed(2)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              updateItemQuantity(item.menuItemId, -1)
                            }
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() =>
                              updateItemQuantity(item.menuItemId, 1)
                            }
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <PlusIcon size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>${orderTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowCreateModal(false);
                  setOrderItems([]);
                  setSelectedTable('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={!selectedTable || orderItems.length === 0}
                onClick={createOrder}
              >
                Create Order
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
