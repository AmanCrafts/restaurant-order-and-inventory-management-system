import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  UtensilsCrossed,
  Package,
  Table,
  ClipboardList,
  ChefHat,
  Receipt,
  Bell,
  LogOut,
  Menu,
  X,
  User,
} from 'lucide-react';
import { UserRole } from '../../types';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} />, roles: [UserRole.ADMIN] },
  { label: 'Staff', path: '/staff', icon: <Users size={20} />, roles: [UserRole.ADMIN] },
  { label: 'Menu', path: '/menu', icon: <UtensilsCrossed size={20} />, roles: [UserRole.ADMIN] },
  { label: 'Inventory', path: '/inventory', icon: <Package size={20} />, roles: [UserRole.ADMIN] },
  { label: 'Tables', path: '/tables', icon: <Table size={20} />, roles: [UserRole.ADMIN] },
  { label: 'Orders', path: '/waiter/orders', icon: <ClipboardList size={20} />, roles: [UserRole.WAITER] },
  { label: 'Kitchen', path: '/kitchen', icon: <ChefHat size={20} />, roles: [UserRole.COOK, UserRole.ADMIN] },
  { label: 'Bills', path: '/bills', icon: <Receipt size={20} />, roles: [UserRole.ADMIN, UserRole.WAITER] },
];

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const filteredNavItems = navItems.filter((item) => hasRole(item.roles));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 h-16">
        <div className="h-full px-4 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden md:block p-2 rounded-md hover:bg-gray-100 mr-2"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 rounded-md hover:bg-gray-100 mr-2"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <UtensilsCrossed className="text-white" size={20} />
              </div>
              <span className="text-xl font-semibold text-gray-900">RestaurantOS</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-gray-100 relative">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User size={16} className="text-blue-600" />
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-md hover:bg-gray-100"
                title="Logout"
              >
                <LogOut size={20} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar - Desktop */}
        <aside
          className={`fixed left-0 top-16 bottom-0 bg-white border-r border-gray-200 z-40 transition-all duration-300 hidden md:block ${
            isSidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
          }`}
        >
          <nav className="p-4 space-y-1">
            {filteredNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Sidebar - Mobile */}
        {showMobileMenu && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowMobileMenu(false)}
            />
            <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <span className="font-semibold">Menu</span>
                <button onClick={() => setShowMobileMenu(false)}>
                  <X size={20} />
                </button>
              </div>
              <nav className="p-4 space-y-1">
                {filteredNavItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setShowMobileMenu(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main
          className={`flex-1 transition-all duration-300 ${
            isSidebarOpen ? 'md:ml-64' : ''
          }`}
        >
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
};
