import React, { useState } from 'react';
import { useCatalog } from '../../contexts/CatalogContext';
import { Button } from '../../components/ui/Button';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

export const AdminContent: React.FC = () => {
  const { catalog, isLoading } = useCatalog();
  const [activeTab, setActiveTab] = useState<'subjects' | 'cycles' | 'chapters' | 'videos'>('subjects');
  const [searchQuery, setSearchQuery] = useState('');

  if (isLoading) {
    return <div>Loading content...</div>;
  }

  const tabs = [
    { id: 'subjects', label: 'Subjects', count: catalog?.subjects.length || 0 },
    { id: 'cycles', label: 'Cycles', count: catalog?.cycles.length || 0 },
    { id: 'chapters', label: 'Chapters', count: catalog?.chapters.length || 0 },
    { id: 'videos', label: 'Videos', count: catalog?.videos.length || 0 },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'subjects':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-text-secondary">
              <thead className="bg-surface text-xs uppercase text-text-primary border-b border-border">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {catalog?.subjects.map((subject) => (
                  <tr key={subject.id} className="border-b border-border hover:bg-surface/50">
                    <td className="px-6 py-4 font-medium text-text-primary">{subject.name}</td>
                    <td className="px-6 py-4 truncate max-w-xs">{subject.description}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Edit2 size={14} /></Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600"><Trash2 size={14} /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'cycles':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-text-secondary">
              <thead className="bg-surface text-xs uppercase text-text-primary border-b border-border">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Subject</th>
                  <th className="px-6 py-3">Order</th>
                  <th className="px-6 py-3">Channel ID</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {catalog?.cycles.map((cycle) => {
                  const subject = catalog.subjects.find(s => s.id === cycle.subject_id);
                  return (
                    <tr key={cycle.id} className="border-b border-border hover:bg-surface/50">
                      <td className="px-6 py-4 font-medium text-text-primary">{cycle.name}</td>
                      <td className="px-6 py-4"><Badge variant="outline">{subject?.name}</Badge></td>
                      <td className="px-6 py-4">{cycle.order_index}</td>
                      <td className="px-6 py-4 font-mono text-xs">{cycle.telegram_channel_id}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Edit2 size={14} /></Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600"><Trash2 size={14} /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      // Add similar tables for chapters and videos
      default:
        return <div className="p-8 text-center text-text-secondary">Select a tab to view content</div>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Content Management</h1>
          <p className="text-text-secondary text-sm">Manage subjects, cycles, chapters, and videos</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus size={16} />
          Add New {activeTab.slice(0, -1)}
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-background shadow-sm overflow-hidden">
        <div className="border-b border-border bg-surface px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:bg-background hover:text-text-primary'
                }`}
              >
                {tab.label}
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-border text-text-secondary'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        
        {renderContent()}
      </div>
    </div>
  );
};
