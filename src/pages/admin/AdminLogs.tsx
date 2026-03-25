import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Badge } from '../../components/ui/Badge';
import { Search, Filter } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  details: any;
  created_at: string;
  profiles?: { display_name: string };
}

export const AdminLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data, error } = await supabase
          .from('activity_logs')
          .select(`
            *,
            profiles:user_id (display_name)
          `)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        setLogs(data || []);
      } catch (error) {
        console.error('Error fetching logs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const getActionColor = (action: string) => {
    if (action.includes('watch')) return 'primary';
    if (action.includes('create')) return 'success';
    if (action.includes('delete')) return 'danger';
    if (action.includes('update')) return 'warning';
    return 'default';
  };

  const filteredLogs = logs.filter(log => {
    const searchLower = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(searchLower) ||
      log.profiles?.display_name?.toLowerCase().includes(searchLower) ||
      JSON.stringify(log.details).toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Activity Logs</h1>
          <p className="text-text-secondary text-sm">Monitor platform usage and events</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background shadow-sm overflow-hidden">
        <div className="border-b border-border bg-surface px-4 py-3 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Filter size={16} />
            Filter
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-text-secondary">
            <thead className="bg-surface text-xs uppercase text-text-primary border-b border-border">
              <tr>
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Action</th>
                <th className="px-6 py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center">Loading logs...</td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center">No activity found matching search</td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-border hover:bg-surface/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-text-primary">
                      {log.profiles?.display_name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getActionColor(log.action) as any}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-text-muted truncate max-w-xs">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
