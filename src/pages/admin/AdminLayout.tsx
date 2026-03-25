import React from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, Database, Users, Activity, ShieldAlert } from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { profile, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center max-w-md">
          <ShieldAlert className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-red-800 mb-2">Access Denied</h2>
          <p className="text-red-700">You do not have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/admin/content', icon: Database, label: 'Content Management' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/logs', icon: Activity, label: 'Activity Logs' },
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-background">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-border bg-surface hidden md:block">
        <div className="p-6">
          <h2 className="text-lg font-bold text-text-primary tracking-tight">Admin Panel</h2>
          <p className="text-xs text-text-secondary mt-1">Manage NexusEdu platform</p>
        </div>
        <nav className="px-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-secondary hover:bg-background hover:text-text-primary'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-surface z-50 flex justify-around p-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center p-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`
            }
          >
            <item.icon size={20} className="mb-1" />
            <span className="sr-only">{item.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 md:p-8 pb-20 md:pb-8">
        <Outlet />
      </main>
    </div>
  );
};
