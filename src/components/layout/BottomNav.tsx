import { Home, User, Search, BookOpen, TrendingUp } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export function BottomNav() {
  const location = useLocation();
  const path = location.pathname;

  // Hide BottomNav on login, admin, and watch pages
  if (path === '/login' || path.startsWith('/admin') || path.startsWith('/watch')) {
    return null;
  }

  const navItems = [
    { icon: Home, label: 'Home', to: '/' },
    { icon: Search, label: 'Search', to: '/search' },
    { icon: BookOpen, label: 'Subjects', to: '/subjects' },
    { icon: TrendingUp, label: 'Progress', to: '/progress' },
    { icon: User, label: 'Profile', to: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 md:hidden pb-safe">
      <div className="flex justify-around items-center h-14">
        {navItems.map((item) => {
          const isActive = path === item.to || (item.to !== '/' && path.startsWith(item.to));
          return (
            <Link
              key={item.label}
              to={item.to}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? 'text-primary' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'fill-current' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
