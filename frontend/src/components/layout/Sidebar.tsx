'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  Truck, 
  LogOut,
  Tag,
  Layers,
  Building2,
  Box,
  Warehouse
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { Role } from '@/types/auth';
import { useState } from 'react';
import UserProfileModal from '@/components/users/UserProfileModal';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Warehouses', href: '/warehouses', icon: Warehouse },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Batch Lots', href: '/batch-lots', icon: Box },
  { name: 'Categories', href: '/categories', icon: Layers },
  { name: 'Brands', href: '/brands', icon: Tag },
  { name: 'Units', href: '/units', icon: Building2 },
  { name: 'Suppliers', href: '/suppliers', icon: Truck },
  { name: 'Purchase Orders', href: '/purchase-orders', icon: ShoppingCart },
  { name: 'User Management', href: '/users', icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Helper to safely get username
  const getUsernameInitial = () => {
    if (!user?.username) return 'U';
    const name = typeof user.username === 'string' ? user.username : 'User';
    return name.charAt(0).toUpperCase();
  };

  // Helper to safely get role name
  const getRoleName = () => {
    if (!user?.role) return 'Unauthorized';
    if (typeof user.role === 'object' && user.role !== null) {
      // If role is the populated object { _id, name, slug, code }
      const role = user.role as Role;
      return role.name || role.code || 'User';
    }
    return String(user.role);
  };

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 text-white">
      <div className="flex h-16 items-center justify-center border-b border-slate-800">
        <h1 className="text-xl font-bold tracking-wider text-blue-400">WAREHOUSE</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-800 p-4">
        <div 
          onClick={() => setIsProfileModalOpen(true)}
          className="mb-4 flex items-center space-x-3 px-2 py-2 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors"
          title="Edit Profile"
        >
          <div className="h-9 w-9 rounded-full bg-blue-500 flex items-center justify-center font-bold">
            {getUsernameInitial()}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">{String(user?.username || 'User')}</p>
            <p className="truncate text-xs text-slate-500 capitalize">
              {getRoleName()}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-red-900/20 hover:text-red-400 transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          <span>Sign out</span>
        </button>
      </div>

      <UserProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        user={user}
      />
    </div>
  );
}
