import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useUIStore } from "../store/uiStore";
import { cn } from "../utils/cn";
import { LayoutDashboard, BookOpen, Video, FileText, Settings, HelpCircle, LogOut, Image as ImageIcon } from "lucide-react";

export function Sidebar() {
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "My Courses", href: "/my-courses", icon: BookOpen },
    { label: "Live Classes", href: "/live", icon: Video },
    { label: "Practice Sheets", href: "/practice", icon: FileText },
    { label: "AI Image Gen", href: "/image-generator", icon: ImageIcon },
  ];

  const accountItems = [
    { label: "Settings", href: "/settings", icon: Settings },
    { label: "Support", href: "/support", icon: HelpCircle },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-60 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-[64px] left-0 z-60 h-[calc(100vh-64px)] w-[260px] bg-[var(--color-surface)] border-r border-[var(--color-border)] transition-transform duration-250 ease-out lg:translate-x-0 overflow-y-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full py-6">
          <div className="px-6 mb-2 text-xs font-semibold text-[var(--color-text-muted)] tracking-wider uppercase">
            MAIN
          </div>
          <nav className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-[var(--color-primary-pale)] text-[var(--color-primary)] font-semibold border-l-4 border-[var(--color-primary)]"
                      : "text-[var(--color-text)] hover:bg-[var(--color-hover)]"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="px-6 mt-8 mb-2 text-xs font-semibold text-[var(--color-text-muted)] tracking-wider uppercase">
            ACCOUNT
          </div>
          <nav className="space-y-1 px-3">
            {accountItems.map((item) => {
              const isActive = location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-[var(--color-primary-pale)] text-[var(--color-primary)] font-semibold border-l-4 border-[var(--color-primary)]"
                      : "text-[var(--color-text)] hover:bg-[var(--color-hover)]"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={() => {
                clearAuth();
                window.location.href = "/login";
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-[var(--color-error)] hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </nav>
        </div>
      </aside>
    </>
  );
}
