import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Button, Badge } from '../../components/common';
import { BillService } from '../../services';
import type { Bill } from '../../types';
import { BillStatus } from '../../types';
import { DollarSign, CreditCard, Receipt } from 'lucide-react';

export const Bills: React.FC = () => {
  const { user } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBills: 0,
    totalRevenue: 0,
    pendingAmount: 0,
    paidAmount: 0,
  });

  useEffect(() => {
    if (user?.restaurantId) {
      fetchBills();
    }
  }, [user?.restaurantId]);

  const fetchBills = async () => {
    setIsLoading(true);
    try {
      const [billsData, statsData] = await Promise.all([
        BillService.getAll({ restaurantId: user!.restaurantId }),
        BillService.getStats(user!.restaurantId),
      ]);
      setBills(billsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayBill = async (billId: string) => {
    try {
      await BillService.pay(billId);
      fetchBills();
    } catch (error) {
      console.error('Error paying bill:', error);
    }
  };

  const getStatusBadge = (status: BillStatus) => {
    switch (status) {
      case BillStatus.PAID:
        return <Badge variant="success">Paid</Badge>;
      case BillStatus.PENDING:
        return <Badge variant="warning">Pending</Badge>;
      case BillStatus.CANCELLED:
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bills</h1>
          <p className="text-gray-600">Manage billing and payments</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Receipt className="text-blue-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Bills</p>
              <p className="text-2xl font-semibold">{stats.totalBills}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="text-green-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-semibold">${stats.totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <CreditCard className="text-yellow-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-semibold">${stats.pendingAmount.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="text-green-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Collected</p>
              <p className="text-2xl font-semibold">${stats.paidAmount.toFixed(2)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Bills List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Bill ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Table</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
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
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    No bills found
                  </td>
                </tr>
              ) : (
                bills.map((bill) => (
                  <tr key={bill.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-sm">{bill.id.slice(0, 8)}</td>
                    <td className="py-3 px-4">
                      Table {bill.order?.table?.tableNumber || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">${bill.totalAmount.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">
                        Subtotal: ${bill.subtotal.toFixed(2)}
                      </div>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(bill.status)}</td>
                    <td className="py-3 px-4">
                      {bill.status === BillStatus.PENDING && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handlePayBill(bill.id)}
                        >
                          Mark Paid
                        </Button>
                      )}
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
