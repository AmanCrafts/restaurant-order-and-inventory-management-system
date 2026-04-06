import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Button, Badge } from '../../components/common';
import { KitchenService } from '../../services';
import type { Order } from '../../types';
import {
  ChefHat,
  CheckCircle2,
  Flame,
  UtensilsCrossed,
} from 'lucide-react';

export const Kitchen: React.FC = () => {
  const { user } = useAuth();
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [cookingOrders, setCookingOrders] = useState<Order[]>([]);
  const [readyOrders, setReadyOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'cooking' | 'ready'>('pending');

  useEffect(() => {
    if (user?.restaurantId) {
      fetchOrders();
      // Poll every 10 seconds
      const interval = setInterval(fetchOrders, 10000);
      return () => clearInterval(interval);
    }
  }, [user?.restaurantId]);

  const fetchOrders = async () => {
    if (!user?.restaurantId) return;

    try {
      const [pending, cooking, ready] = await Promise.all([
        KitchenService.getPendingOrders(user.restaurantId),
        KitchenService.getCookingOrders(user.restaurantId),
        KitchenService.getReadyOrders(user.restaurantId),
      ]);
      setPendingOrders(pending);
      setCookingOrders(cooking);
      setReadyOrders(ready);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startCooking = async (orderId: string) => {
    try {
      await KitchenService.startCooking(orderId);
      fetchOrders();
    } catch (error) {
      console.error('Error starting cooking:', error);
    }
  };

  const markReady = async (orderId: string) => {
    try {
      await KitchenService.markReady(orderId);
      fetchOrders();
    } catch (error) {
      console.error('Error marking ready:', error);
    }
  };

  const getOrderCard = (order: Order, type: 'pending' | 'cooking' | 'ready') => (
    <Card key={order.id} className="relative">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm font-medium">
              Table {order.table?.tableNumber || order.tableId.slice(0, 8)}
            </span>
            <span className="text-sm text-gray-500">
              {new Date(order.createdAt).toLocaleTimeString()}
            </span>
          </div>
        </div>
        <Badge
          variant={type === 'pending' ? 'warning' : type === 'cooking' ? 'info' : 'success'}
        >
          {type === 'pending' ? 'New' : type === 'cooking' ? 'Cooking' : 'Ready'}
        </Badge>
      </div>

      <div className="space-y-2 mb-4">
        {order.items?.map((item) => (
          <div key={item.id} className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{item.quantity}x</span>
              <span>{item.menuItem?.name || 'Unknown Item'}</span>
            </div>
            <span className="text-sm text-gray-500">
              {item.menuItem?.preparationTime || 0} min
            </span>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
        <div className="text-sm text-gray-500">
          {order.items?.length || 0} items
        </div>
        <div>
          {type === 'pending' && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Flame size={16} />}
              onClick={() => startCooking(order.id)}
            >
              Start Cooking
            </Button>
          )}
          {type === 'cooking' && (
            <Button
              variant="success"
              size="sm"
              leftIcon={<CheckCircle2 size={16} />}
              onClick={() => markReady(order.id)}
            >
              Mark Ready
            </Button>
          )}
          {type === 'ready' && (
            <Badge variant="success">Waiting for pickup</Badge>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kitchen Display</h1>
          <p className="text-gray-600">Manage incoming orders</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            {readyOrders.length} ready
          </div>
          <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
            {cookingOrders.length} cooking
          </div>
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
            {pendingOrders.length} pending
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'pending'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Pending ({pendingOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('cooking')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'cooking'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Cooking ({cookingOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('ready')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'ready'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Ready ({readyOrders.length})
        </button>
      </div>

      {/* Orders Grid */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeTab === 'pending' && pendingOrders.length === 0 && (
            <div className="col-span-full text-center py-12">
              <UtensilsCrossed className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p className="text-gray-500">No pending orders</p>
            </div>
          )}
          {activeTab === 'cooking' && cookingOrders.length === 0 && (
            <div className="col-span-full text-center py-12">
              <ChefHat className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p className="text-gray-500">Nothing cooking right now</p>
            </div>
          )}
          {activeTab === 'ready' && readyOrders.length === 0 && (
            <div className="col-span-full text-center py-12">
              <CheckCircle2 className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p className="text-gray-500">No ready orders</p>
            </div>
          )}

          {activeTab === 'pending' && pendingOrders.map((order) => getOrderCard(order, 'pending'))}
          {activeTab === 'cooking' && cookingOrders.map((order) => getOrderCard(order, 'cooking'))}
          {activeTab === 'ready' && readyOrders.map((order) => getOrderCard(order, 'ready'))}
        </div>
      )}
    </div>
  );
};
