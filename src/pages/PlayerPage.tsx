import React, { useMemo, useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCatalog } from '../contexts/CatalogContext';
import { useAuth } from '../contexts/AuthContext';
import { logActivity, saveProgress } from '../lib/supabase';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { Skeleton } from '../components/ui/Skeleton';
import { FileText, Clock, AlertCircle, PlayCircle } from 'lucide-react';

export const PlayerPage: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const { catalog, isLoading: isCatalogLoading } = useCatalog();
  const { user } = useAuth();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  // Reset state when video changes
  useEffect(() => {
    setIsLoading(true);
    setError(null);
  }, [videoId]);

  // 30-second timeout for video loading
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (isLoading && !error) {
      timeoutId = setTimeout(() => {
        setError("Video is taking too long. Tap Retry.");
        setIsLoading(false);
      }, 30000);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading, error]);

  const handleTimeUpdate = async () => {
    if (!user || !video || !videoRef.current) return;
    const currentTime = videoRef.current.currentTime;
    const duration = videoRef.current.duration;
    
    if (duration <= 0) return;
    
    // Only update history every 10 seconds to avoid spamming the DB
    if (Math.floor(currentTime) % 10 !== 0) return;

    const progressPercent = Math.min(100, Math.max(0, Math.floor((currentTime / duration) * 100)));
    await saveProgress(user.id, video.id, progressPercent);
  };

  const handleVideoEnd = async () => {
    if (!user || !video) return;
    await saveProgress(user.id, video.id, 100);
  };

  const handleVideoError = () => {
    setError("Failed to load video stream. The backend server might be sleeping or unreachable.");
    setIsLoading(false);
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    if (videoRef.current && videoId) {
      videoRef.current.src = `https://nexusedu-backend-0bjq.onrender.com/api/stream/${videoId}`;
      videoRef.current.load();
    }
  };

  if (isCatalogLoading) {
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

  const streamUrl = `https://nexusedu-backend-0bjq.onrender.com/api/stream/${videoId}`;

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
            <div className="relative w-full overflow-hidden rounded-xl bg-black aspect-video shadow-lg">
              {error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface text-text-primary p-6 text-center z-10">
                  <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                  <p className="font-medium mb-4">{error}</p>
                  <button 
                    onClick={handleRetry}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : null}

              <video
                ref={videoRef}
                controls
                playsInline
                preload="auto"
                src={streamUrl}
                style={{ width: '100%', aspectRatio: '16/9', backgroundColor: '#000' }}
                onError={handleVideoError}
                onCanPlay={() => { setIsLoading(false); setError(null); }}
                onWaiting={() => setIsLoading(true)}
                onPlaying={() => { setIsLoading(false); setError(null); }}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleVideoEnd}
                onContextMenu={(e) => e.preventDefault()}
              />
              
              {isLoading && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 pointer-events-none z-10">
                  <svg className="w-12 h-12 text-white animate-spin mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-white font-medium">Loading from Telegram... 10-15 seconds</p>
                </div>
              )}
            </div>
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
