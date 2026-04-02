import { useMemo, useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Play, Clock, ArrowLeft, CheckCircle, HelpCircle } from 'lucide-react';
import { useCatalog } from '../contexts/CatalogContext';
import { useVideoProgress } from '../hooks/useVideoProgress';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { Skeleton } from '../components/ui/Skeleton';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

export function VideoListPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();
  const { catalog, isLoading } = useCatalog();
  const { isCompleted, getProgress } = useVideoProgress();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);

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

  useEffect(() => {
    if (chapterId) {
      fetchQuizzes();
    }
  }, [chapterId]);

  const fetchQuizzes = async () => {
    setIsLoadingQuizzes(true);
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('chapter_id', chapterId)
        .eq('is_published', true)
        .order('created_at', { ascending: true });
        
      if (error) {
        // Ignore missing table error gracefully
        if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
          setQuizzes([]);
          return;
        }
        throw error;
      }
      setQuizzes(data || []);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      setQuizzes([]);
    } finally {
      setIsLoadingQuizzes(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-dark pb-20">
        <div className="h-16 bg-primary" />
        <div className="max-w-4xl mx-auto p-4 space-y-4">
          <Skeleton className="h-8 w-64 mb-6" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="space-y-3 mt-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-dark p-4">
        <h2 className="text-2xl font-bold text-text-primary mb-2">Chapter Not Found</h2>
        <p className="text-text-secondary mb-6">The chapter you are looking for does not exist.</p>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors"
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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-surface-dark pb-20"
    >
      <header className="bg-primary text-white h-16 flex items-center px-4 sticky top-0 z-30 shadow-md">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors mr-3"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-medium truncate" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>{chapter.name}</h1>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: subject.name, href: `/subject/${subject.id}` },
          { label: cycle.name, href: `/cycle/${cycle.id}` },
          { label: chapter.name }
        ]} />

        <div className="bg-white rounded-2xl shadow-sm border border-border p-6 mb-8 mt-4">
          <h1 className="text-2xl font-bold text-text-primary mb-2" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>{chapter.name}</h1>
          <p className="text-text-secondary mb-6" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>{subject.name} • {cycle.name}</p>
          
          <div className="flex items-center justify-between text-sm font-medium text-text-secondary mb-2">
            <span style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>প্রগ্রেস</span>
            <span style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>{completedCount} / {videos.length} ভিডিও সম্পন্ন</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-success transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="space-y-4">
          {videos.length === 0 && quizzes.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-border shadow-sm">
              <p className="text-text-secondary font-medium" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>এই চ্যাপ্টারে এখনো কোনো কন্টেন্ট যোগ করা হয়নি।</p>
            </div>
          ) : (
            <>
              {videos.map((video: any, index: number) => {
                const isDone = isCompleted(video.id);
                const progress = getProgress(video.id);
                const hasProgress = progress > 10 && !isDone;

                return (
                  <Link
                    key={video.id}
                    to={`/watch/${video.id}`}
                    className="group flex flex-col bg-white rounded-xl shadow-sm border border-border hover:border-primary/30 hover:shadow-md transition-all duration-200 overflow-hidden"
                  >
                    <div className="flex items-center p-4">
                      <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-text-secondary font-bold mr-4 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                        {(index + 1).toString().padStart(2, '0')}
                      </div>
                      
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mr-4 transition-colors ${
                        isDone ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white'
                      }`}>
                        {isDone ? <CheckCircle className="w-5 h-5" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </div>
                      
                      <div className="flex-1 min-w-0 pr-4">
                        <h3 className={`font-semibold truncate mb-1 ${isDone ? 'text-success' : 'text-text-primary group-hover:text-primary transition-colors'}`} style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>
                          {video.title}
                        </h3>
                        <div className="flex items-center text-sm text-text-secondary">
                          <Clock className="w-3.5 h-3.5 mr-1.5" />
                          {video.duration}
                          {hasProgress && (
                            <span className="ml-3 px-2 py-0.5 bg-accent/10 text-accent rounded text-xs font-bold" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>
                              চলমান
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {hasProgress && (
                      <div className="w-full h-1 bg-gray-100">
                        <div className="h-full bg-accent" style={{ width: `${Math.min(100, (progress / 100) * 100)}%` }} />
                      </div>
                    )}
                  </Link>
                );
              })}

              {!isLoadingQuizzes && quizzes.length > 0 && (
                <div className="mt-8 pt-6 border-t border-border">
                  <Link
                    to={`/chapter/${chapterId}/quizzes`}
                    className="flex items-center justify-center w-full py-4 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-bold transition-colors"
                    style={{ fontFamily: 'Hind Siliguri, sans-serif' }}
                  >
                    <HelpCircle className="w-5 h-5 mr-2" />
                    এই অধ্যায়ের MCQ দাও
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </motion.div>
  );
}
