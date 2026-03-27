import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useCatalog } from '../../contexts/CatalogContext';
import { Users, Video, BookOpen, Layers, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const AdminDashboard: React.FC = () => {
  const { catalog, refreshCatalog, isLoading: isCatalogLoading } = useCatalog();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalViews: 0,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count: usersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        const { count: viewsCount } = await supabase
          .from('activity_logs')
          .select('*', { count: 'exact', head: true })
          .eq('action', 'watch_video');

        setStats({
          totalUsers: usersCount || 0,
          activeUsers: usersCount || 0, // Simplified for now
          totalViews: viewsCount || 0,
        });

        const { data: logsData } = await supabase
          .from('activity_logs')
          .select(`
            *,
            profiles:user_id (display_name, email)
          `)
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (logsData) {
          setRecentLogs(logsData);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  const handleRefreshCatalog = async () => {
    setIsRefreshing(true);
    try {
      await refreshCatalog();
    } catch (error) {
      console.error('Failed to refresh catalog:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const totalCycles = catalog?.subjects.reduce((acc, s) => acc + s.cycles.length, 0) || 0;

  const statCards = [
    { label: 'Total Subjects', value: catalog?.subjects.length || 0, icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Total Cycles', value: totalCycles, icon: Layers, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Total Videos', value: catalog?.total_videos || 0, icon: Video, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-green-500', bg: 'bg-green-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard Overview</h1>
          <p className="text-text-secondary text-sm">Platform statistics and quick actions</p>
        </div>
        <Button 
          onClick={handleRefreshCatalog} 
          isLoading={isRefreshing || isCatalogLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Refresh Catalog Cache
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">{stat.label}</p>
                <p className="text-3xl font-bold text-text-primary mt-2">{stat.value}</p>
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentLogs.length > 0 ? (
              recentLogs.map((log) => (
                <div key={log.id} className="flex flex-col border-b border-border pb-3 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-text-primary">
                      {log.profiles?.display_name || log.profiles?.email || 'Unknown User'}
                    </span>
                    <span className="text-xs text-text-muted">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-sm text-text-secondary mt-1">
                    {log.action.replace('_', ' ')}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-text-secondary">No recent activity.</p>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-text-primary mb-4">System Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-text-secondary">Database Connection</span>
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Operational</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-text-secondary">Backend API</span>
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Operational</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-text-secondary">Telegram MTProto</span>
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Connected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
