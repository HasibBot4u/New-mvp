import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Settings, LogOut, Award, Clock, Flame, 
  ChevronRight, Shield 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useVideoProgress } from '../hooks/useVideoProgress';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { useToast } from '../components/ui/Toast';

export function ProfilePage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { getStats } = useVideoProgress();
  const { showToast } = useToast();
  const [stats, setStats] = useState({ 
    completedCount: 0, hoursWatched: 0, streak: 0 
  });
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Load stats immediately — do NOT wait for profile
  useEffect(() => {
    setStats(getStats());
    // Refresh profile in background — does not block render
    refreshProfile().catch(console.error);
  }, []);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      navigate('/login');
    } catch (e) {
      console.error('Sign out failed:', e);
      // Force sign out
      localStorage.clear();
      window.location.href = '/login';
    } finally {
      setIsSigningOut(false);
    }
  };

  // Show page immediately even if user/profile not loaded yet
  // Use cached values from localStorage if available
  const cachedProfileStr = localStorage.getItem(
    'nexusedu_profile_cache'
  );
  const cachedProfile = cachedProfileStr 
    ? JSON.parse(cachedProfileStr) 
    : null;
  const displayProfile = profile || cachedProfile;
  const displayUser = user;

  const isAdmin = displayProfile?.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-primary text-white pt-12 pb-6 px-4 
                         sticky top-0 z-30 shadow-md">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-1">Profile</h1>
          <p className="text-white/70 text-sm">
            Manage your account
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Profile' }
        ]} />

        {/* User Info Card */}
        <div className="bg-white rounded-xl shadow-sm border 
                        border-gray-100 p-6 flex items-center 
                        space-x-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full 
                          flex items-center justify-center 
                          text-primary">
            <User className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">
              {displayProfile?.display_name || 
               displayUser?.email?.split('@')[0] || 
               'Student'}
            </h2>
            <p className="text-gray-500 text-sm">
              {displayUser?.email || 'Loading...'}
            </p>
            {!displayProfile && (
              <p className="text-xs text-orange-500 mt-1">
                Loading profile...
              </p>
            )}
          </div>
          {isAdmin && (
            <div className="bg-amber-100 text-amber-800 px-3 
                            py-1 rounded-full text-xs font-bold 
                            flex items-center uppercase 
                            tracking-wider">
              <Shield className="w-3 h-3 mr-1" />
              Admin
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl shadow-sm border 
                          border-gray-100 p-4 flex flex-col 
                          items-center justify-center text-center">
            <Award className="w-5 h-5 text-blue-500 mb-2" />
            <span className="text-2xl font-bold text-gray-900">
              {stats.completedCount}
            </span>
            <span className="text-xs text-gray-500 font-medium 
                             uppercase tracking-wider mt-1">
              Completed
            </span>
          </div>
          <div className="bg-white rounded-xl shadow-sm border 
                          border-gray-100 p-4 flex flex-col 
                          items-center justify-center text-center">
            <Clock className="w-5 h-5 text-purple-500 mb-2" />
            <span className="text-2xl font-bold text-gray-900">
              {stats.hoursWatched}
            </span>
            <span className="text-xs text-gray-500 font-medium 
                             uppercase tracking-wider mt-1">
              Hours
            </span>
          </div>
          <div className="bg-white rounded-xl shadow-sm border 
                          border-gray-100 p-4 flex flex-col 
                          items-center justify-center text-center">
            <Flame className="w-5 h-5 text-orange-500 mb-2" />
            <span className="text-2xl font-bold text-gray-900">
              {stats.streak}
            </span>
            <span className="text-xs text-gray-500 font-medium 
                             uppercase tracking-wider mt-1">
              Streak
            </span>
          </div>
        </div>

        {/* Settings Menu */}
        <div className="bg-white rounded-xl shadow-sm border 
                        border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 
                           uppercase tracking-wider">
              Account
            </h3>
          </div>

          {/* ADMIN DASHBOARD BUTTON — shows when role=admin */}
          {isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              className="w-full flex items-center justify-between 
                         p-4 hover:bg-amber-50 transition-colors 
                         border-b border-gray-100"
            >
              <div className="flex items-center space-x-3 
                              text-amber-700">
                <Shield className="w-5 h-5 text-amber-500" />
                <span className="font-medium">Admin Dashboard</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          )}

          {/* App Settings — shows toast instead of freezing */}
          <button
            onClick={() => showToast('App settings coming soon!')}
            className="w-full flex items-center justify-between 
                       p-4 hover:bg-gray-50 transition-colors 
                       border-b border-gray-100"
          >
            <div className="flex items-center space-x-3 
                            text-gray-700">
              <Settings className="w-5 h-5" />
              <span className="font-medium">App Settings</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          {/* Sign Out — handles offline/slow Supabase */}
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="w-full flex items-center justify-between 
                       p-4 hover:bg-red-50 transition-colors 
                       disabled:opacity-50"
          >
            <div className="flex items-center space-x-3 
                            text-red-600">
              <LogOut className="w-5 h-5" />
              <span className="font-medium">
                {isSigningOut ? 'Signing out...' : 'Sign Out'}
              </span>
            </div>
          </button>
        </div>

        {/* Debug info — only shown in development */}
        {import.meta.env.DEV && (
          <div className="bg-gray-100 rounded-xl p-4 text-xs 
                          text-gray-500 font-mono">
            <p>User: {displayUser?.id || 'null'}</p>
            <p>Profile: {displayProfile ? 
              JSON.stringify({ 
                role: displayProfile.role, 
                email: displayProfile.email 
              }) : 'null'}</p>
            <p>Source: {profile ? 'live' : 
              (cachedProfile ? 'cache' : 'none')}</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default ProfilePage;
