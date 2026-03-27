import React, { useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCatalog } from '../contexts/CatalogContext';
import { useAuth } from '../contexts/AuthContext';
import { logActivity, saveProgress } from '../lib/supabase';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { VideoPlayer } from '../components/video/VideoPlayer';
import { Skeleton } from '../components/ui/Skeleton';
import { FileText, Clock, AlertCircle, PlayCircle } from 'lucide-react';

export const PlayerPage: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const { catalog, isLoading } = useCatalog();
  const { user } = useAuth();

  const { subject, cycle, chapter, video } = useMemo(() => {
    if (!catalog) return { subject: null, cycle: null, chapter: null, video: null };
    for (const s of catalog.subjects) {
      for (const c of s.cycles) {
        for (const ch of c.chapters) {
          const v = ch.videos.find(v => v.id === videoId);
          if (v) {
            return { subject: s, cycle: c, chapter: ch, video: v };
          }
        }
      }
    }
    return { subject: null, cycle: null, chapter: null, video: null };
  }, [catalog, videoId]);

  // Log activity
  useEffect(() => {
    if (!user || !video) return;
    logActivity(user.id, 'watch_video', { 
      entity_type: 'video',
      entity_id: video.id,
      title: video.title 
    });
  }, [user, video]);

  const handleProgress = async (currentTime: number, duration: number) => {
    if (!user || !video || duration <= 0) return;
    
    // Only update history every 10 seconds to avoid spamming the DB
    if (Math.floor(currentTime) % 10 !== 0) return;

    const progressPercent = Math.min(100, Math.max(0, Math.floor((currentTime / duration) * 100)));
    await saveProgress(user.id, video.id, progressPercent);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 max-w-5xl">
        <Skeleton className="h-6 w-96 mb-6" />
        <Skeleton className="w-full aspect-video rounded-xl mb-6" />
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    );
  }

  if (!video || !chapter || !cycle || !subject) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-text-primary mb-2">Video Not Found</h2>
        <p className="text-text-secondary mb-6">The video you are looking for does not exist or has been removed.</p>
        <Link to="/" className="text-primary hover:underline font-medium">
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 max-w-6xl">
      <div className="mb-6">
        <Breadcrumb
          items={[
            { label: subject.name, href: `/subject/${subject.id}` },
            { label: cycle.name, href: `/subject/${subject.id}/cycle/${cycle.id}` },
            { label: chapter.name, href: `/subject/${subject.id}/cycle/${cycle.id}/chapter/${chapter.id}` },
            { label: video.title }
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="mb-6">
            <VideoPlayer 
              videoId={video.id} 
              onProgress={handleProgress}
            />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">{video.title}</h1>
            
            <div className="flex items-center gap-4 text-sm text-text-secondary mb-6 pb-6 border-b border-border">
              <div className="flex items-center">
                <Clock size={16} className="mr-1" />
                {video.duration || 'Unknown duration'}
              </div>
              <div className="flex items-center">
                <FileText size={16} className="mr-1" />
                {video.size_mb ? `${video.size_mb} MB` : 'Unknown size'}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-xl border border-border bg-surface p-5 sticky top-24">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Up Next in {chapter.name}</h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
              {chapter.videos
                .map(v => (
                  <Link
                    key={v.id}
                    to={`/video/${v.id}`}
                    className={`flex gap-3 p-2 rounded-lg transition-colors ${
                      v.id === video.id 
                        ? 'bg-primary/10 border border-primary/20' 
                        : 'hover:bg-background border border-transparent'
                    }`}
                  >
                    <div className="relative w-24 h-16 shrink-0 rounded bg-black flex items-center justify-center overflow-hidden">
                      {v.id === video.id ? (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">PLAYING</span>
                        </div>
                      ) : (
                        <PlayCircle size={20} className="text-white/50" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-medium truncate ${v.id === video.id ? 'text-primary' : 'text-text-primary'}`}>
                        {v.title}
                      </h4>
                      <p className="text-xs text-text-secondary mt-1">Part {v.display_order}</p>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
