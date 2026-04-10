import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Button, Badge } from '../../components/common';
import { AddTableModal, EditTableModal } from '../../components/modals';
import { TableService } from '../../services';
import type { Table } from '../../types';
import { TableStatus } from '../../types';
import {
  Plus,
  Edit2,
  Trash2,
  Users,
  CheckCircle2,
  Circle,
} from 'lucide-react';

export const TablesManagement: React.FC = () => {
  const { user } = useAuth();
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    occupied: 0,
    free: 0,
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);

  useEffect(() => {
    if (user?.restaurantId) {
      fetchTables();
    }
  }, [user?.restaurantId]);

  const fetchTables = async () => {
    setIsLoading(true);
    try {
      const [tablesData, statsData] = await Promise.all([
        TableService.getAll({ restaurantId: user!.restaurantId }),
        TableService.getStats(user!.restaurantId),
      ]);
      setTables(tablesData.sort((a, b) => a.tableNumber - b.tableNumber));
      setStats({
        total: statsData.totalTables,
        occupied: statsData.occupiedTables,
        free: statsData.freeTables,
      });
    } catch (error) {
      console.error('Error fetching tables:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: TableStatus) => {
    if (status === TableStatus.OCCUPIED) {
      return <Badge variant="danger">Occupied</Badge>;
    }
    return <Badge variant="success">Free</Badge>;
  };

  const getStatusIcon = (status: TableStatus) => {
    if (status === TableStatus.OCCUPIED) {
      return <Circle className="text-red-500" size={24} />;
    }
    return <CheckCircle2 className="text-green-500" size={24} />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Table Management</h1>
          <p className="text-gray-600">Manage your restaurant tables</p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => setShowAddModal(true)}>
          Add Table
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="text-blue-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Tables</p>
              <p className="text-2xl font-semibold">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle2 className="text-green-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Available</p>
              <p className="text-2xl font-semibold">{stats.free}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <Circle className="text-red-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Occupied</p>
              <p className="text-2xl font-semibold">{stats.occupied}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Modals */}
      <AddTableModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchTables}
        restaurantId={user?.restaurantId || ''}
      />
      <EditTableModal
        isOpen={!!editingTable}
        onClose={() => setEditingTable(null)}
        onSuccess={fetchTables}
        table={editingTable}
      />

      {/* Tables Grid */}
      <Card>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {tables.map((table) => (
              <div
                key={table.id}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  table.status === TableStatus.OCCUPIED
                    ? 'bg-red-50 border-red-200'
                    : 'bg-green-50 border-green-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-2xl font-bold">#{table.tableNumber}</span>
                  {getStatusIcon(table.status)}
                </div>
                <div className="mt-2">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Users size={14} />
                    {table.capacity} seats
                  </div>
                  <div className="mt-2">{getStatusBadge(table.status)}</div>
                </div>
                <div className="mt-3 flex gap-1">
                  <button
                    className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-gray-600"
                    onClick={() => setEditingTable(table)}
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
