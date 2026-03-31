import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, Database, Users, Activity, ShieldAlert, Settings, ArrowLeft, LogOut } from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { profile, isLoading, signOut } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
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
    { to: '/admin/users', icon: Users, label: 'User Management' },
    { to: '/admin/logs', icon: Activity, label: 'Activity Logs' },
    { to: '/admin/system', icon: Settings, label: 'System Controls' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-background">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-border bg-surface hidden md:flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">
                {profile?.display_name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-surface rounded-full"></div>
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-primary truncate max-w-[140px]">{profile?.display_name || 'Admin'}</h2>
              <p className="text-xs text-text-secondary">Administrator</p>
            </div>
          </div>
        </div>
        <nav className="px-4 py-4 space-y-1 flex-1 overflow-y-auto">
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
          
          <div className="my-4 border-t border-border"></div>
          
          <NavLink
            to="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-background hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={18} />
            Back to App
          </NavLink>
        </nav>
        
        <div className="p-4 border-t border-border mt-auto">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-surface z-50 flex overflow-x-auto p-2 hide-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center p-2 min-w-[64px] rounded-lg text-xs font-medium transition-colors ${
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
        <div className="w-px h-8 bg-border mx-2 self-center shrink-0"></div>
        <NavLink
          to="/"
          className="flex flex-col items-center p-2 min-w-[64px] rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={20} className="mb-1" />
          <span className="sr-only">Back to App</span>
        </NavLink>
        <button
          onClick={handleSignOut}
          className="flex flex-col items-center p-2 min-w-[64px] rounded-lg text-xs font-medium text-red-500 hover:text-red-600 transition-colors"
        >
          <LogOut size={20} className="mb-1" />
          <span className="sr-only">Sign Out</span>
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 md:p-8 pb-20 md:pb-8">
        <Outlet />
      </main>
    </div>
  );
};
