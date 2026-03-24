import { Outlet, Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { Topbar } from "./Topbar";
import { Sidebar } from "./Sidebar";

export function AppLayout() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <Topbar />
      <Sidebar />
      <main className="pt-[64px] lg:ml-[260px] min-h-screen transition-all duration-300">
        <div className="p-4 md:p-6 lg:p-8 max-w-[1280px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
