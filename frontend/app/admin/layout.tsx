'use client';

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { BookOpen, Users, GraduationCap, Settings, LogOut, Home, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigationItems = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Students', href: '/admin/students', icon: Users },
  { name: 'Teachers', href: '/admin/teachers', icon: GraduationCap },
  { name: 'Classes', href: '/admin/classes', icon: BookOpen },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { logout, user } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  return (
    <ProtectedRoute allowedRoles={['school']}>
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar */}
        <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center px-6 py-4 border-b">
              <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">QuranAkh</h1>
            </div>

            {/* User Info */}
            <div className="px-6 py-4 border-b bg-gray-50">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.fullName?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.fullName || 'Administrator'}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.role || 'admin'}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-6 py-4 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="px-6 py-4 border-t">
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="pl-64">
          <main className="p-8">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}