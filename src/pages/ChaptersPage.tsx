import { useMemo, useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, PlayCircle, HelpCircle } from 'lucide-react';
import { useCatalog } from '../contexts/CatalogContext';
import { useVideoProgress } from '../hooks/useVideoProgress';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { Skeleton } from '../components/ui/Skeleton';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

export function ChaptersPage() {
  const { cycleId } = useParams<{ cycleId: string }>();
  const navigate = useNavigate();
  const { catalog, isLoading } = useCatalog();
  const { isCompleted } = useVideoProgress();
  const [quizCounts, setQuizCounts] = useState<Record<string, number>>({});

  const data = useMemo(() => {
    if (!catalog || !cycleId) return null;

    for (const subject of catalog.subjects) {
      const cycle = subject.cycles.find((c: any) => c.id === cycleId);
      if (cycle) {
        return { subject, cycle };
      }
    }
    return null;
  }, [catalog, cycleId]);

  useEffect(() => {
    if (data?.cycle?.chapters) {
      const fetchQuizCounts = async () => {
        try {
          const chapterIds = data.cycle.chapters.map((c: any) => c.id);
          const { data: quizzes, error } = await supabase
            .from('quizzes')
            .select('chapter_id')
            .in('chapter_id', chapterIds)
            .eq('is_published', true);
            
          if (error) throw error;
          
          const counts: Record<string, number> = {};
          quizzes?.forEach(q => {
            counts[q.chapter_id] = (counts[q.chapter_id] || 0) + 1;
          });
          setQuizCounts(counts);
        } catch (error: any) {
          if (error.code !== 'PGRST205') {
            console.error('Error fetching quiz counts:', error);
          }
        }
      };
      fetchQuizCounts();
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-dark pb-20">
        <div className="h-16 bg-primary" />
        <div className="max-w-4xl mx-auto p-4 space-y-4">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-dark p-4">
        <h2 className="text-2xl font-bold text-text-primary mb-2">Cycle Not Found</h2>
        <p className="text-text-secondary mb-6">The cycle you are looking for does not exist.</p>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors"
        >
          Return Home
        </button>
      </div>
    );
  }

  const { subject, cycle } = data;

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
        <h1 className="text-lg font-medium truncate" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>{cycle.name}</h1>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: subject.name, href: `/subject/${subject.id}` },
          { label: cycle.name }
        ]} />

        <h1 className="text-3xl font-extrabold text-text-primary mb-8 mt-4" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>{cycle.name} চ্যাপ্টারসমূহ</h1>

        {cycle.chapters.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-border shadow-sm">
            <p className="text-text-secondary font-medium" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>এখনো কোনো কন্টেন্ট যোগ করা হয়নি। 📚</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cycle.chapters.map((chapter: any) => {
              const totalVideos = chapter.videos.length;
              let completedVideos = 0;
              
              chapter.videos.forEach((v: any) => {
                if (isCompleted(v.id)) completedVideos++;
              });

              const percent = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

              return (
                <Link
                  key={chapter.id}
                  to={`/chapter/${chapter.id}`}
                  className="group block bg-white rounded-2xl shadow-sm border border-border p-6 hover:shadow-md hover:border-primary/30 transition-all duration-200 hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-text-primary group-hover:text-primary transition-colors" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>
                      {chapter.name}
                    </h3>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center text-sm font-medium text-text-secondary bg-surface-dark px-3 py-1.5 rounded-full border border-border">
                        <PlayCircle className="w-4 h-4 mr-1.5 text-primary" />
                        <span style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>{totalVideos} ক্লাস</span>
                      </div>
                      {quizCounts[chapter.id] > 0 && (
                        <div className="flex items-center text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                          <HelpCircle className="w-3.5 h-3.5 mr-1 text-blue-600" />
                          <span style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>{quizCounts[chapter.id]} MCQ</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-xs font-semibold text-text-secondary mb-2">
                      <span style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>প্রগ্রেস</span>
                      <span className={percent === 100 ? 'text-success' : 'text-primary'}>
                        {percent}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ease-out ${percent === 100 ? 'bg-success' : 'bg-primary'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </motion.div>
  );
}
