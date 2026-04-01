import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, FileText, ArrowRight, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCatalog } from '../contexts/CatalogContext';
import { supabase } from '../lib/supabase';
import { Skeleton } from '../components/ui/Skeleton';

interface Note {
  id: string;
  video_id: string;
  content: string;
  updated_at: string;
}

export function NotesPage() {
  const { user } = useAuth();
  const { catalog } = useCatalog();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchNotes() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('video_notes')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });
          
        if (error) throw error;
        setNotes(data || []);
      } catch (err) {
        console.error('Error fetching notes:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchNotes();
  }, [user]);

  const deleteNote = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    
    try {
      const { error } = await supabase
        .from('video_notes')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      setNotes(notes.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  const getVideoDetails = (videoId: string) => {
    if (!catalog) return null;
    for (const subject of catalog.subjects) {
      for (const cycle of subject.cycles) {
        for (const chapter of cycle.chapters) {
          const video = chapter.videos.find((v: any) => v.id === videoId);
          if (video) {
            return { subject, cycle, chapter, video };
          }
        }
      }
    }
    return null;
  };

  const filteredNotes = notes.filter(note => {
    if (!searchQuery) return true;
    const details = getVideoDetails(note.video_id);
    const searchLower = searchQuery.toLowerCase();
    
    return (
      note.content.toLowerCase().includes(searchLower) ||
      (details && details.video.title.toLowerCase().includes(searchLower)) ||
      (details && details.chapter.name.toLowerCase().includes(searchLower))
    );
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Notes</h1>
          <p className="text-gray-600">Review and manage all your chapter notes.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search notes or videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {filteredNotes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notes found</h3>
          <p className="text-gray-500">
            {searchQuery ? "Try adjusting your search terms." : "You haven't taken any notes yet. Start watching videos to add some!"}
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredNotes.map(note => {
            const details = getVideoDetails(note.video_id);
            if (!details) return null;
            
            return (
              <div key={note.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <Link to={`/watch/${note.video_id}`} className="group">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors flex items-center gap-2">
                        {details.video.title}
                        <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-500 mt-1">
                      {details.subject.name} • {details.cycle.name} • {details.chapter.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-400">
                      {new Date(note.updated_at).toLocaleDateString()}
                    </span>
                    <button 
                      onClick={() => deleteNote(note.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 text-gray-700 whitespace-pre-wrap text-sm border border-gray-100">
                  {note.content}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
