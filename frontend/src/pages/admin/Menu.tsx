import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Button, Badge } from '../../components/common';
import { AddCategoryModal, AddMenuItemModal } from '../../components/modals';
import { MenuService } from '../../services';
import type { MenuCategory, MenuItem } from '../../types';
import { Plus, Edit2, Trash2, Search, DollarSign, Clock } from 'lucide-react';

export const MenuManagement: React.FC = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);

  useEffect(() => {
    if (user?.restaurantId) {
      fetchMenu();
    }
  }, [user?.restaurantId]);

  const fetchMenu = async () => {
    setIsLoading(true);
    try {
      const data = await MenuService.getByRestaurant(user!.restaurantId);
      setCategories(data);
      if (data.length > 0 && !selectedCategory) {
        setSelectedCategory(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching menu:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentCategory = categories.find((c) => c.id === selectedCategory);

  const filteredItems = currentCategory?.items?.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-600">Manage your restaurant menu</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" leftIcon={<Plus size={18} />} onClick={() => setShowCategoryModal(true)}>
            Add Category
          </Button>
          <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => setShowItemModal(true)}>
            Add Item
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <Card className="lg:col-span-1">
          <h3 className="font-medium text-gray-900 mb-4">Categories</h3>
          <div className="space-y-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span>{category.name}</span>
                  <span className="text-sm text-gray-500">
                    {category.items?.length || 0}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Items List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <Card title={currentCategory?.name || 'Items'}>
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : filteredItems.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No items found</p>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{item.name}</h4>
                        {!item.isAvailable && (
                          <Badge variant="neutral">Unavailable</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <DollarSign size={14} />
                          {item.price.toFixed(2)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {item.preparationTime} min
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded-md text-gray-600">
                        <Edit2 size={16} />
                      </button>
                      <button className="p-2 hover:bg-red-50 rounded-md text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <AddCategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSuccess={fetchMenu}
        restaurantId={user?.restaurantId || ''}
      />
      <AddMenuItemModal
        isOpen={showItemModal}
        onClose={() => setShowItemModal(false)}
        onSuccess={fetchMenu}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
};
