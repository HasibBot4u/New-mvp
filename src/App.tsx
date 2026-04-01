import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CatalogProvider } from './contexts/CatalogContext';
import { ToastProvider } from './components/ui/Toast';
import { BottomNav } from './components/layout/BottomNav';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { SubjectsPage } from './pages/SubjectsPage';
import { CyclesPage } from './pages/CyclesPage';
import { ChaptersPage } from './pages/ChaptersPage';
import { VideoListPage } from './pages/VideoListPage';
import { PlayerPage } from './pages/PlayerPage';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { ProgressPage } from './pages/ProgressPage';
import { NotesPage } from './pages/NotesPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminContent } from './pages/admin/AdminContent';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminLogs } from './pages/admin/AdminLogs';

import { AdminSystem } from './pages/admin/AdminSystem';

const ProtectedRoute: React.FC<{ 
  children: React.ReactNode 
}> = ({ children }) => {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center 
                      bg-gray-50 flex-col gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 
                        border-t-primary rounded-full 
                        animate-spin" />
        <p className="text-gray-500 text-sm">Loading NexusEdu...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profile?.is_blocked === true) {
    return (
      <Navigate
        to="/login"
        state={{ blocked: true }}
        replace
      />
    );
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col">
      <main className="flex-1">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
          <Route path="/subjects" element={<ProtectedRoute><SubjectsPage /></ProtectedRoute>} />
          <Route path="/subject/:subjectId" element={<ProtectedRoute><CyclesPage /></ProtectedRoute>} />
          <Route path="/cycle/:cycleId" element={<ProtectedRoute><ChaptersPage /></ProtectedRoute>} />
          <Route path="/chapter/:chapterId" element={<ProtectedRoute><VideoListPage /></ProtectedRoute>} />
          <Route path="/watch/:videoId" element={<ProtectedRoute><PlayerPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/progress" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
          <Route path="/notes" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />

          <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="content" element={<AdminContent />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="logs" element={<AdminLogs />} />
            <Route path="system" element={<AdminSystem />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <CatalogProvider>
        <ToastProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AppContent />
          </Router>
        </ToastProvider>
      </CatalogProvider>
    </AuthProvider>
  );
};

export default App;
