import React, { useState } from 'react';
import { useCatalog } from '../../contexts/CatalogContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Plus, Edit2, Trash2, Search, Upload, PlayCircle, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';

export const AdminContent: React.FC = () => {
  const { catalog, isLoading, refreshCatalog } = useCatalog();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'subjects' | 'cycles' | 'chapters' | 'videos'>('subjects');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Bulk Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState('');
  
  // Stream Test State
  const [streamTestResult, setStreamTestResult] = useState<{status: 'success' | 'error' | 'testing' | null, message: string}>({status: null, message: ''});

  if (isLoading) {
    return (
      <div className="space-y-6 pb-20 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-surface rounded w-1/4"></div>
          <div className="h-10 bg-surface rounded w-32"></div>
        </div>
        <div className="h-12 bg-surface rounded-xl"></div>
        <div className="h-96 bg-surface rounded-xl"></div>
      </div>
    );
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
    setStreamTestResult({status: null, message: ''});
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({});
    setStreamTestResult({status: null, message: ''});
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
      await refreshCatalog();
      showToast(`${activeTab.slice(0, -1)} saved successfully`);
    } catch (error) {
      console.error(`Error saving ${activeTab}:`, error);
      showToast(`Failed to save ${activeTab.slice(0, -1)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (table: string, id: string) => {
    if (!window.confirm(`Are you sure you want to delete this ${table.slice(0, -1)}?`)) return;
    
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      
      await refreshCatalog();
      showToast(`${table.slice(0, -1)} deleted successfully`);
    } catch (error) {
      console.error(`Error deleting from ${table}:`, error);
      showToast(`Failed to delete ${table.slice(0, -1)}`);
    }
  };

  const toggleVideoActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('videos').update({ is_active: !currentStatus }).eq('id', id);
      if (error) throw error;
      await refreshCatalog();
      showToast(`Video ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error toggling video status:', error);
      showToast('Failed to update video status');
    }
  };

  const testStream = async () => {
    if (!editingItem?.id) return;
    
    setStreamTestResult({ status: 'testing', message: 'Testing stream connection...' });
    
    try {
      const backend = localStorage.getItem('working_backend') || 'https://nexusedu-backend-0bjq.onrender.com';
      const response = await fetch(`${backend}/api/stream/${editingItem.id}`, {
        headers: {
          'Range': 'bytes=0-1024'
        }
      });
      
      if (response.status === 206 || response.status === 200) {
        setStreamTestResult({ status: 'success', message: `Success! Received ${response.status} from backend.` });
      } else {
        setStreamTestResult({ status: 'error', message: `Error: Received status ${response.status}` });
      }
    } catch (error: any) {
      setStreamTestResult({ status: 'error', message: `Network error: ${error.message}` });
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
            <table className="w-full text-left text-sm text-text-secondary whitespace-nowrap">
              <thead className="bg-surface text-xs uppercase text-text-primary border-b border-border">
                <tr>
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Chapter</th>
                  <th className="px-6 py-3">Msg ID</th>
                  <th className="px-6 py-3">Channel ID</th>
                  <th className="px-6 py-3">Duration</th>
                  <th className="px-6 py-3">Active</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVideos.map((video) => {
                  const chapter = allChapters.find(c => c.id === video.chapter_id);
                  return (
                    <tr key={video.id} className="border-b border-border hover:bg-surface/50">
                      <td className="px-6 py-4 font-medium text-text-primary truncate max-w-[200px]" title={video.title}>{video.title}</td>
                      <td className="px-6 py-4"><Badge variant="outline">{chapter?.name}</Badge></td>
                      <td className="px-6 py-4 font-mono text-xs">{video.telegram_message_id}</td>
                      <td className="px-6 py-4 font-mono text-xs">{video.telegram_channel_id}</td>
                      <td className="px-6 py-4 text-text-secondary">{video.duration}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleVideoActive(video.id, video.is_active !== false)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${video.is_active !== false ? 'bg-green-500' : 'bg-gray-600'}`}
                        >
                          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${video.is_active !== false ? 'translate-x-5' : 'translate-x-1'}`} />
                        </button>
                      </td>
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
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Content Management</h1>
          <p className="text-text-secondary text-sm">Manage subjects, cycles, chapters, and videos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="flex items-center gap-2" onClick={handleAdd}>
            <Plus size={16} />
            Add New {activeTab.slice(0, -1)}
          </Button>
        </div>
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

      {/* Add/Edit Modal */}
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
              
              {editingItem && (
                <div className="pt-4 border-t border-border mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-text-primary">Stream Test</label>
                    <button
                      type="button"
                      onClick={testStream}
                      disabled={streamTestResult.status === 'testing'}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-md text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      Test Connection
                    </button>
                  </div>
                  
                  {streamTestResult.status && (
                    <div className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                      streamTestResult.status === 'success' ? 'bg-green-500/10 text-green-500' :
                      streamTestResult.status === 'error' ? 'bg-red-500/10 text-red-500' :
                      'bg-blue-500/10 text-blue-500'
                    }`}>
                      {streamTestResult.status === 'success' && <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                      {streamTestResult.status === 'error' && <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                      {streamTestResult.status === 'testing' && <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin shrink-0 mt-0.5" />}
                      <span>{streamTestResult.message}</span>
                    </div>
                  )}
                </div>
              )}
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

      {/* Bulk Import Section (Videos Tab Only) */}
      {activeTab === 'videos' && (
        <div className="mt-8 rounded-xl border border-border bg-background shadow-sm overflow-hidden">
          <div 
            className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setIsImportModalOpen(!isImportModalOpen)}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Upload size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-primary">Bulk Import Videos</h2>
                <p className="text-sm text-text-secondary">Import multiple videos into a specific chapter via JSON</p>
              </div>
            </div>
            <div className={`transform transition-transform ${isImportModalOpen ? 'rotate-180' : ''}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>
          
          {isImportModalOpen && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Target Chapter</label>
                    <select
                      value={formData.bulk_chapter_id || ''}
                      onChange={(e) => setFormData({ ...formData, bulk_chapter_id: e.target.value })}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Select a chapter...</option>
                      {allChapters.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
                    <h4 className="font-bold mb-2 flex items-center gap-2">
                      <CheckCircle size={16} /> Expected JSON Format
                    </h4>
                    <pre className="text-xs bg-white p-2 rounded border border-blue-100 overflow-x-auto">
{`[
  {
    "title": "Video Title",
    "telegram_file_id": "...",
    "telegram_message_id": 123,
    "display_order": 1
  }
]`}
                    </pre>
                  </div>
                </div>
                
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">JSON Data</label>
                    <textarea
                      value={importJson}
                      onChange={(e) => {
                        setImportJson(e.target.value);
                        setImportProgress('');
                      }}
                      placeholder="Paste JSON array here..."
                      className="w-full h-48 rounded-md border border-border bg-background px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      disabled={isImporting}
                    />
                  </div>
                  
                  {importProgress && (
                    <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                      importProgress.includes('Error') || importProgress.includes('failed') 
                        ? 'bg-red-50 text-red-700 border border-red-100' 
                        : 'bg-green-50 text-green-700 border border-green-100'
                    }`}>
                      {importProgress.includes('Error') || importProgress.includes('failed') ? <XCircle size={16} /> : <CheckCircle size={16} />}
                      {importProgress}
                    </div>
                  )}
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={async () => {
                        if (!formData.bulk_chapter_id) {
                          setImportProgress('Error: Please select a target chapter first.');
                          return;
                        }
                        
                        try {
                          setIsImporting(true);
                          setImportProgress('Validating JSON...');
                          
                          let items;
                          try {
                            items = JSON.parse(importJson);
                          } catch (e) {
                            throw new Error('Invalid JSON format. Please check for syntax errors.');
                          }
                          
                          if (!Array.isArray(items)) {
                            throw new Error('JSON must be an array of objects.');
                          }
                          
                          if (items.length === 0) {
                            throw new Error('JSON array is empty.');
                          }
                          
                          // Validate required fields
                          for (let i = 0; i < items.length; i++) {
                            const item = items[i];
                            if (!item.title) throw new Error(`Item at index ${i} is missing 'title'`);
                            if (!item.telegram_message_id) throw new Error(`Item at index ${i} is missing 'telegram_message_id'`);
                          }
                          
                          setImportProgress(`Validation passed. Importing ${items.length} videos...`);
                          
                          // Get channel ID from chapter
                          const chapter = allChapters.find(c => c.id === formData.bulk_chapter_id);
                          const cycle = allCycles.find(c => c.id === chapter?.cycle_id);
                          const channelId = cycle?.telegram_channel_id || '';
                          
                          // Prepare data
                          const dataToInsert = items.map(item => ({
                            ...item,
                            chapter_id: formData.bulk_chapter_id,
                            telegram_channel_id: channelId,
                            is_active: true
                          }));
                          
                          const { error } = await supabase.from('videos').insert(dataToInsert);
                          
                          if (error) throw error;
                          
                          setImportProgress(`Successfully imported ${items.length} videos! Refreshing catalog...`);
                          await refreshCatalog();
                          
                          showToast(`Successfully imported ${items.length} videos`);
                          setImportJson('');
                          setTimeout(() => {
                            setImportProgress('');
                            setIsImportModalOpen(false);
                          }, 3000);
                          
                        } catch (error: any) {
                          console.error('Import error:', error);
                          setImportProgress(`Error: ${error.message}`);
                        } finally {
                          setIsImporting(false);
                        }
                      }} 
                      disabled={isImporting || !importJson.trim()}
                      className="flex items-center gap-2"
                    >
                      {isImporting ? 'Importing...' : (
                        <>
                          <Upload size={16} />
                          Validate & Import
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
