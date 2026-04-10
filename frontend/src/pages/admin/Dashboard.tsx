import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Badge, Button } from '../../components/common';
import {
  Users,
  UtensilsCrossed,
  Package,
  Table2,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
} from 'lucide-react';
import { TableService, OrderService, BillService, InventoryService, StaffService } from '../../services';
import { OrderStatus, type Order } from '../../types';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const restaurantId = user?.restaurantId;

  const [stats, setStats] = useState({
    totalStaff: 0,
    totalTables: 0,
    occupiedTables: 0,
    activeOrders: 0,
    lowStockItems: 0,
    todayRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (restaurantId) {
      fetchDashboardData();
    }
  }, [restaurantId]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch all data in parallel
      const [staffStats, tableStats, orders, inventoryAlerts, billStats] = await Promise.all([
        StaffService.getStats(restaurantId!),
        TableService.getStats(restaurantId!),
        OrderService.getAll({ restaurantId }),
        InventoryService.getLowStock(restaurantId!),
        BillService.getStats(restaurantId!),
      ]);

      const activeOrders = orders.filter(
        (order) =>
          order.status !== OrderStatus.CLOSED &&
          order.status !== OrderStatus.BILLED
      );

      setStats({
        totalStaff: staffStats.totalStaff || 0,
        totalTables: tableStats.totalTables || 0,
        occupiedTables: tableStats.occupiedTables || 0,
        activeOrders: activeOrders.length,
        lowStockItems: inventoryAlerts.length,
        todayRevenue: billStats.paidAmount || 0,
      });

      setRecentOrders(orders.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  const statCards = [
    {
      title: 'Total Staff',
      value: stats.totalStaff,
      icon: Users,
      color: 'bg-blue-500',
      link: '/staff',
    },
    {
      title: 'Tables',
      value: `${stats.occupiedTables}/${stats.totalTables} occupied`,
      icon: Table2,
      color: 'bg-purple-500',
      link: '/tables',
    },
    {
      title: 'Active Orders',
      value: stats.activeOrders,
      icon: ShoppingCart,
      color: 'bg-orange-500',
      link: '/orders',
    },
    {
      title: "Today's Revenue",
      value: `$${stats.todayRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-green-500',
      link: '/bills',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.name}!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card
            key={stat.title}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => (window.location.href = stat.link)}
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color} text-white`}>
                <stat.icon size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Low Stock Alert */}
      {stats.lowStockItems > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center">
          <AlertTriangle className="text-yellow-600 mr-3" size={24} />
          <div className="flex-1">
            <p className="text-yellow-800 font-medium">
              {stats.lowStockItems} item(s) running low on stock
            </p>
            <p className="text-yellow-600 text-sm">
              Some inventory items have fallen below their reorder threshold.
            </p>
          </div>
          <Button variant="warning" size="sm" onClick={() => (window.location.href = '/inventory')}>
            View Inventory
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card title="Recent Orders" subtitle="Latest order activity">
          <div className="space-y-4">
            {recentOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent orders</p>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="font-medium">
                      Table {order.table?.tableNumber || order.tableId}
                    </p>
                    <p className="text-sm text-gray-500">
                      {order.items?.length || 0} items • ${order.items?.reduce(
                        (sum, item) => sum + item.price * item.quantity,
                        0
                      ).toFixed(2)}
                    </p>
                  </div>
                  <div>{getOrderStatusBadge(order.status)}</div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card title="Quick Actions">
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="secondary"
              onClick={() => (window.location.href = '/staff')}
              leftIcon={<Users size={18} />}
            >
              Manage Staff
            </Button>
            <Button
              variant="secondary"
              onClick={() => (window.location.href = '/menu')}
              leftIcon={<UtensilsCrossed size={18} />}
            >
              Update Menu
            </Button>
            <Button
              variant="secondary"
              onClick={() => (window.location.href = '/inventory')}
              leftIcon={<Package size={18} />}
            >
              Check Inventory
            </Button>
            <Button
              variant="secondary"
              onClick={() => (window.location.href = '/tables')}
              leftIcon={<Table2 size={18} />}
            >
              Manage Tables
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
