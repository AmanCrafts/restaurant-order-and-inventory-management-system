import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Button, Badge } from '../../components/common';
import { InventoryService } from '../../services';
import type { InventoryItem } from '../../types';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  AlertTriangle,
  Package,
  TrendingDown,
} from 'lucide-react';

export const InventoryManagement: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);

  useEffect(() => {
    if (user?.restaurantId) {
      fetchInventory();
    }
  }, [user?.restaurantId]);

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const data = await InventoryService.getByRestaurant(user!.restaurantId);
      setItems(data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (showLowStock) {
      return matchesSearch && item.quantity <= item.reorderThreshold;
    }
    return matchesSearch;
  });

  const lowStockCount = items.filter((item) => item.quantity <= item.reorderThreshold).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Track and manage your restaurant inventory</p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={18} />}>
          Add Item
        </Button>
      </div>

      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center">
          <AlertTriangle className="text-yellow-600 mr-3" size={24} />
          <div className="flex-1">
            <p className="text-yellow-800 font-medium">
              {lowStockCount} item(s) below reorder threshold
            </p>
          </div>
          <Button
            variant="warning"
            size="sm"
            onClick={() => setShowLowStock(!showLowStock)}
          >
            {showLowStock ? 'Show All' : 'Show Low Stock'}
          </Button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <Button
          variant={showLowStock ? 'warning' : 'secondary'}
          onClick={() => setShowLowStock(!showLowStock)}
          leftIcon={<TrendingDown size={18} />}
        >
          {showLowStock ? 'Show All' : 'Low Stock Only'}
        </Button>
      </div>

      {/* Inventory Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Item</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Quantity</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Unit</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    No inventory items found
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Package className="text-gray-400" size={20} />
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-500">
                            Reorder at: {item.reorderThreshold} {item.unit}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-medium ${
                        item.quantity <= item.reorderThreshold ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {item.quantity} {item.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{item.unit}</td>
                    <td className="py-3 px-4">
                      {item.quantity <= item.reorderThreshold ? (
                        <Badge variant="danger">Low Stock</Badge>
                      ) : (
                        <Badge variant="success">In Stock</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded-md text-gray-600">
                          <Edit2 size={16} />
                        </button>
                        <button className="p-2 hover:bg-red-50 rounded-md text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
