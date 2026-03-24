import { Outlet, Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export function AuthLayout() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-lighter)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--color-surface)] rounded-xl shadow-[var(--shadow-modal)] p-8">
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 bg-[var(--color-primary)] text-white rounded-lg flex items-center justify-center text-2xl font-bold">
            A
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
