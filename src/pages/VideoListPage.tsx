import { useMemo, useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Play, Clock, ArrowLeft, CheckCircle } from 'lucide-react';
import { useCatalog } from '../contexts/CatalogContext';
import { useVideoProgress } from '../hooks/useVideoProgress';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { Skeleton } from '../components/ui/Skeleton';
import { api } from '../lib/api';

export function VideoListPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();
  const { catalog, isLoading } = useCatalog();
  const { isCompleted, getProgress } = useVideoProgress();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  const data = useMemo(() => {
    if (!catalog || !chapterId) return null;

    for (const subject of catalog.subjects) {
      for (const cycle of subject.cycles) {
        const chapter = cycle.chapters.find((c: any) => c.id === chapterId);
        if (chapter) {
          return { subject, cycle, chapter };
        }
      }
    }
    return null;
  }, [catalog, chapterId]);

  const videos = useMemo(() => {
    if (!data) return [];
    return data.chapter.videos || [];
  }, [data]);

  useEffect(() => {
    if (!videos || videos.length === 0) return;
    
    // Fire prefetch for all videos in this chapter
    // Stagger by 200ms each to avoid hammering the backend
    videos.forEach((video: any, index: number) => {
      setTimeout(() => {
        api.prefetchVideo(video.id);
      }, index * 200);
    });
  }, [videos]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="h-16 bg-primary" />
        <div className="max-w-4xl mx-auto p-4 space-y-4">
          <Skeleton className="h-8 w-64 mb-6" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <div className="space-y-3 mt-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Chapter Not Found</h2>
        <p className="text-gray-600 mb-6">The chapter you are looking for does not exist.</p>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Return Home
        </button>
      </div>
    );
  }

  const { subject, cycle, chapter } = data;

  const completedCount = videos.filter((v: any) => isCompleted(v.id)).length;
  const progressPercent = videos.length > 0 ? Math.round((completedCount / videos.length) * 100) : 0;

  return (
    <div className={`min-h-screen bg-gray-50 pb-20 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <header className="bg-primary text-white h-16 flex items-center px-4 sticky top-0 z-30 shadow-md">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors mr-3"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-medium truncate">{chapter.name}</h1>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: subject.name, href: `/subject/${subject.id}` },
          { label: cycle.name, href: `/cycle/${cycle.id}` },
          { label: chapter.name }
        ]} />

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{chapter.name}</h1>
          <p className="text-gray-600 mb-6">{subject.name} • {cycle.name}</p>
          
          <div className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
            <span>Progress</span>
            <span>{completedCount} of {videos.length} videos completed</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-success transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          {videos.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <p className="text-gray-500 font-medium">No videos available in this chapter yet.</p>
            </div>
          ) : (
            videos.map((video: any, index: number) => {
              const isDone = isCompleted(video.id);
              const progress = getProgress(video.id);
              const hasProgress = progress > 10 && !isDone;

              return (
                <Link
                  key={video.id}
                  to={`/watch/${video.id}`}
                  className="group flex items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all duration-150 transform hover:-translate-y-0.5"
                >
                  <div className="w-10 text-center text-gray-400 font-medium mr-4">
                    {(index + 1).toString().padStart(2, '0')}
                  </div>
                  
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 mr-4 transition-colors ${
                    isDone ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white'
                  }`}>
                    {isDone ? <CheckCircle className="w-6 h-6" /> : <Play className="w-5 h-5 ml-1" />}
                  </div>
                  
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className={`font-medium truncate mb-1 ${isDone ? 'text-success' : 'text-gray-900'}`}>
                      {video.title}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-1.5" />
                      {video.duration}
                      {hasProgress && (
                        <span className="ml-3 px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-semibold">
                          Continue
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
