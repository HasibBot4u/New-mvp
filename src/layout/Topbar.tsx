import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useUIStore } from "../store/uiStore";
import { Menu, Bell, Moon, Sun } from "lucide-react";

export function Topbar() {
  const { user } = useAuthStore();
  const { theme, toggleTheme, sidebarOpen, setSidebarOpen, unreadNotifications } = useUIStore();

  return (
    <header className="fixed top-0 left-0 right-0 h-[64px] z-30 bg-[var(--color-primary)] text-white shadow-[var(--shadow-topbar)] flex items-center justify-between px-4 lg:px-8">
      <div className="flex items-center gap-4">
        <button
          className="lg:hidden p-2 -ml-2 rounded-md hover:bg-white/10"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu className="w-6 h-6" />
        </button>
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center font-bold text-[var(--color-primary)]">
            A
          </div>
          <span className="font-bold text-lg hidden sm:block">Apar's Classroom</span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="relative">
          <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[var(--color-accent)] rounded-full border-2 border-[var(--color-primary)]" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center text-sm font-semibold">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
        </div>
      </div>
    </header>
  );
}
