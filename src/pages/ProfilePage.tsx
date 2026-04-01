import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Settings, LogOut, Award, Clock,
  Flame, ChevronRight, Shield
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
    completedCount: 0,
    hoursWatched: 0,
    streak: 0,
  });
  const [isSigningOut, setIsSigningOut] = useState(false);
  const hasRefreshed = useRef(false);

  useEffect(() => {
    // Load stats immediately from localStorage — instant
    setStats(getStats());

    // Refresh profile from database once in background
    // Use a ref to prevent double-refresh in StrictMode
    if (!hasRefreshed.current) {
      hasRefreshed.current = true;
      refreshProfile().catch(console.error);
    }
  }, []);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (e) {
      console.error('Sign out failed:', e);
      // Nuclear option — works even if Supabase is down
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace('/login');
    } finally {
      setIsSigningOut(false);
    }
  };

  // Use live profile first, fall back to cache
  const cachedProfile = (() => {
    try {
      const raw = localStorage.getItem('nexusedu_profile_cache');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })();

  const displayProfile = profile || cachedProfile;
  const isAdmin = displayProfile?.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-primary text-white pt-12 pb-6 
                         px-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-1">Profile</h1>
          <p className="text-white/70 text-sm">
            Manage your account and settings
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Profile' },
        ]} />

        {/* User Info Card */}
        <div className="bg-white rounded-xl shadow-sm border 
                        border-gray-100 p-6 flex items-center 
                        space-x-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full 
                          flex items-center justify-center 
                          text-primary flex-shrink-0">
            <User className="w-8 h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 
                           truncate">
              {displayProfile?.display_name ||
               user?.email?.split('@')[0] ||
               'Student'}
            </h2>
            <p className="text-gray-500 text-sm truncate">
              {user?.email || displayProfile?.email || '...'}
            </p>
            {!displayProfile && user && (
              <p className="text-xs text-orange-400 mt-0.5">
                Syncing profile...
              </p>
            )}
          </div>
          {isAdmin && (
            <span className="flex-shrink-0 bg-amber-100 
                             text-amber-800 px-3 py-1 
                             rounded-full text-xs font-bold 
                             flex items-center gap-1 
                             uppercase tracking-wider">
              <Shield className="w-3 h-3" />
              Admin
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              icon: Award,
              value: stats.completedCount,
              label: 'Completed',
              color: 'text-blue-500',
              bg: 'bg-blue-50',
            },
            {
              icon: Clock,
              value: stats.hoursWatched,
              label: 'Hours',
              color: 'text-purple-500',
              bg: 'bg-purple-50',
            },
            {
              icon: Flame,
              value: stats.streak,
              label: 'Streak',
              color: 'text-orange-500',
              bg: 'bg-orange-50',
            },
          ].map(({ icon: Icon, value, label, color, bg }) => (
            <div key={label}
              className="bg-white rounded-xl shadow-sm border 
                         border-gray-100 p-4 flex flex-col 
                         items-center justify-center text-center">
              <div className={`w-10 h-10 ${bg} rounded-full 
                              flex items-center justify-center 
                              mb-2`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {value}
              </span>
              <span className="text-xs text-gray-500 font-medium 
                               uppercase tracking-wider mt-1">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Menu */}
        <div className="bg-white rounded-xl shadow-sm border 
                        border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 
                           uppercase tracking-wider">
              Account
            </h3>
          </div>

          {/* Admin Dashboard — only when role === 'admin' */}
          {isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              className="w-full flex items-center justify-between 
                         p-4 hover:bg-amber-50 transition-colors 
                         border-b border-gray-100 group"
            >
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-amber-500" />
                <span className="font-medium text-amber-700">
                  Admin Dashboard
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 
                                       group-hover:text-amber-500 
                                       transition-colors" />
            </button>
          )}

          {/* App Settings */}
          <button
            onClick={() => showToast('App settings coming soon!')}
            className="w-full flex items-center justify-between 
                       p-4 hover:bg-gray-50 transition-colors 
                       border-b border-gray-100 group"
          >
            <div className="flex items-center space-x-3 
                            text-gray-700">
              <Settings className="w-5 h-5" />
              <span className="font-medium">App Settings</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="w-full flex items-center p-4 
                       hover:bg-red-50 transition-colors 
                       disabled:opacity-60 disabled:cursor-wait"
          >
            <LogOut className="w-5 h-5 text-red-500 mr-3 
                               flex-shrink-0" />
            <span className="font-medium text-red-600">
              {isSigningOut ? 'Signing out...' : 'Sign Out'}
            </span>
          </button>
        </div>

        {/* Debug panel — only visible in dev mode */}
        {import.meta.env.DEV && (
          <details className="bg-gray-100 rounded-xl p-4">
            <summary className="text-xs text-gray-500 
                                cursor-pointer font-mono">
              Debug info
            </summary>
            <pre className="text-xs text-gray-600 mt-2 
                            overflow-auto">
              {JSON.stringify({
                userId: user?.id,
                email: user?.email,
                role: displayProfile?.role,
                isBlocked: displayProfile?.is_blocked,
                source: profile ? 'live' : 
                  (cachedProfile ? 'cache' : 'none'),
              }, null, 2)}
            </pre>
          </details>
        )}
      </main>
    </div>
  );
}

export default ProfilePage;
