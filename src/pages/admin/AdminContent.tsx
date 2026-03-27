import React, { useState } from 'react';
import { useCatalog } from '../../contexts/CatalogContext';
import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

export const AdminContent: React.FC = () => {
  const { catalog, isLoading } = useCatalog();
  const [activeTab, setActiveTab] = useState<'subjects' | 'cycles' | 'chapters' | 'videos'>('subjects');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  if (isLoading) {
    return <div>Loading content...</div>;
  }

  const allCycles = catalog?.subjects.flatMap(s => s.cycles) || [];
  const allChapters = allCycles.flatMap(c => c.chapters) || [];
  const allVideos = allChapters.flatMap(c => c.videos) || [];

  const filteredSubjects = catalog?.subjects.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredCycles = allCycles.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.telegram_channel_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredChapters = allChapters.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVideos = allVideos.filter(v => 
    v.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: 'subjects', label: 'Subjects', count: filteredSubjects.length },
    { id: 'cycles', label: 'Cycles', count: filteredCycles.length },
    { id: 'chapters', label: 'Chapters', count: filteredChapters.length },
    { id: 'videos', label: 'Videos', count: filteredVideos.length },
  ];

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({});
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const table = activeTab;
      const dataToSave = { ...formData };
      delete dataToSave.id;
      delete dataToSave.created_at;
      delete dataToSave.updated_at;
      delete dataToSave.cycles;
      delete dataToSave.chapters;
      delete dataToSave.videos;

      if (activeTab === 'videos') {
        const chapter = allChapters.find(c => c.id === dataToSave.chapter_id);
        const cycle = allCycles.find(c => c.id === chapter?.cycle_id);
        if (cycle) {
          dataToSave.telegram_channel_id = cycle.telegram_channel_id;
        }
      }

      if (editingItem) {
        const { error } = await supabase.from(table).update(dataToSave).eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(table).insert(dataToSave);
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      await api.refreshCatalog();
      window.location.reload();
    } catch (error) {
      console.error(`Error saving ${activeTab}:`, error);
      alert(`Failed to save ${activeTab.slice(0, -1)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (table: string, id: string) => {
    if (!window.confirm(`Are you sure you want to delete this ${table.slice(0, -1)}?`)) return;
    
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      
      // Refresh catalog after deletion
      await api.refreshCatalog();
      window.location.reload();
    } catch (error) {
      console.error(`Error deleting from ${table}:`, error);
      alert(`Failed to delete ${table.slice(0, -1)}`);
    }
  };

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
                {filteredSubjects.map((subject) => (
                  <tr key={subject.id} className="border-b border-border hover:bg-surface/50">
                    <td className="px-6 py-4 font-medium text-text-primary">{subject.name}</td>
                    <td className="px-6 py-4 truncate max-w-xs">{subject.description}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(subject)}><Edit2 size={14} /></Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600" onClick={() => handleDelete('subjects', subject.id)}><Trash2 size={14} /></Button>
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
                {filteredCycles.map((cycle) => {
                  const subject = catalog?.subjects.find(s => s.cycles.some(c => c.id === cycle.id));
                  return (
                    <tr key={cycle.id} className="border-b border-border hover:bg-surface/50">
                      <td className="px-6 py-4 font-medium text-text-primary">{cycle.name}</td>
                      <td className="px-6 py-4"><Badge variant="outline">{subject?.name}</Badge></td>
                      <td className="px-6 py-4">{cycle.display_order}</td>
                      <td className="px-6 py-4 font-mono text-xs">{cycle.telegram_channel_id}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(cycle)}><Edit2 size={14} /></Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600" onClick={() => handleDelete('cycles', cycle.id)}><Trash2 size={14} /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      case 'chapters':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-text-secondary">
              <thead className="bg-surface text-xs uppercase text-text-primary border-b border-border">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Cycle</th>
                  <th className="px-6 py-3">Subject</th>
                  <th className="px-6 py-3">Order</th>
                  <th className="px-6 py-3">Videos</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredChapters.map((chapter) => {
                  const cycle = allCycles.find(c => c.id === chapter.cycle_id);
                  const subject = catalog?.subjects.find(s => s.cycles.some(c => c.id === cycle?.id));
                  return (
                    <tr key={chapter.id} className="border-b border-border hover:bg-surface/50">
                      <td className="px-6 py-4 font-medium text-text-primary">{chapter.name}</td>
                      <td className="px-6 py-4"><Badge variant="outline">{cycle?.name}</Badge></td>
                      <td className="px-6 py-4"><Badge variant="outline">{subject?.name}</Badge></td>
                      <td className="px-6 py-4">{chapter.display_order}</td>
                      <td className="px-6 py-4 text-text-secondary">{chapter.videos.length}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(chapter)}><Edit2 size={14} /></Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600" onClick={() => handleDelete('chapters', chapter.id)}><Trash2 size={14} /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      case 'videos':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-text-secondary">
              <thead className="bg-surface text-xs uppercase text-text-primary border-b border-border">
                <tr>
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Chapter</th>
                  <th className="px-6 py-3">Cycle</th>
                  <th className="px-6 py-3">Order</th>
                  <th className="px-6 py-3">Duration</th>
                  <th className="px-6 py-3">Size</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVideos.map((video) => {
                  const chapter = allChapters.find(c => c.id === video.chapter_id);
                  const cycle = allCycles.find(c => c.id === chapter?.cycle_id);
                  return (
                    <tr key={video.id} className="border-b border-border hover:bg-surface/50">
                      <td className="px-6 py-4 font-medium text-text-primary truncate max-w-xs">{video.title}</td>
                      <td className="px-6 py-4"><Badge variant="outline">{chapter?.name}</Badge></td>
                      <td className="px-6 py-4"><Badge variant="outline">{cycle?.name}</Badge></td>
                      <td className="px-6 py-4">{video.display_order}</td>
                      <td className="px-6 py-4 text-text-secondary">{video.duration}</td>
                      <td className="px-6 py-4 text-text-secondary">{video.size_mb} MB</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(video)}><Edit2 size={14} /></Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600" onClick={() => handleDelete('videos', video.id)}><Trash2 size={14} /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
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
        <Button className="flex items-center gap-2" onClick={handleAdd}>
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? `Edit ${activeTab.slice(0, -1)}` : `Add New ${activeTab.slice(0, -1)}`}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {activeTab === 'subjects' && (
            <>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Display Order</label>
                <input
                  type="number"
                  required
                  value={formData.display_order || 0}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </>
          )}

          {activeTab === 'cycles' && (
            <>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Subject</label>
                <select
                  required
                  value={formData.subject_id || ''}
                  onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select Subject</option>
                  {catalog?.subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Telegram Channel ID</label>
                <input
                  type="text"
                  required
                  value={formData.telegram_channel_id || ''}
                  onChange={(e) => setFormData({ ...formData, telegram_channel_id: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Display Order</label>
                <input
                  type="number"
                  required
                  value={formData.display_order || 0}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </>
          )}

          {activeTab === 'chapters' && (
            <>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Cycle</label>
                <select
                  required
                  value={formData.cycle_id || ''}
                  onChange={(e) => setFormData({ ...formData, cycle_id: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select Cycle</option>
                  {allCycles.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Display Order</label>
                <input
                  type="number"
                  required
                  value={formData.display_order || 0}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </>
          )}

          {activeTab === 'videos' && (
            <>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Chapter</label>
                <select
                  required
                  value={formData.chapter_id || ''}
                  onChange={(e) => setFormData({ ...formData, chapter_id: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select Chapter</option>
                  {allChapters.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Telegram Message ID</label>
                <input
                  type="number"
                  required
                  value={formData.telegram_message_id || ''}
                  onChange={(e) => setFormData({ ...formData, telegram_message_id: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Duration (e.g., 45:30)</label>
                  <input
                    type="text"
                    value={formData.duration || ''}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Size (MB)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.size_mb || ''}
                    onChange={(e) => setFormData({ ...formData, size_mb: parseFloat(e.target.value) })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Display Order</label>
                <input
                  type="number"
                  required
                  value={formData.display_order || 0}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
