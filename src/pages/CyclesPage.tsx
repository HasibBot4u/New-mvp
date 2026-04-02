import { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { BookOpen, ArrowLeft, PlayCircle, ChevronRight } from 'lucide-react';
import { useCatalog } from '../contexts/CatalogContext';
import { useVideoProgress } from '../hooks/useVideoProgress';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { Skeleton } from '../components/ui/Skeleton';
import { motion } from 'framer-motion';

export function CyclesPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const { catalog, isLoading } = useCatalog();
  const { isCompleted } = useVideoProgress();

  const subject = useMemo(() => {
    return catalog?.subjects.find((s: any) => s.id === subjectId);
  }, [catalog, subjectId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-dark pb-20">
        <div className="h-16 bg-primary" />
        <div className="max-w-4xl mx-auto p-4 space-y-4">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-dark p-4">
        <h2 className="text-2xl font-bold text-text-primary mb-2">Subject Not Found</h2>
        <p className="text-text-secondary mb-6">The subject you are looking for does not exist.</p>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors"
        >
          Return Home
        </button>
      </div>
    );
  }

  const getSubjectStyle = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('physics') || lowerName.includes('পদার্থ')) {
      return { bg: 'from-blue-600 to-indigo-600', icon: '⚛️', color: 'text-blue-600' };
    }
    if (lowerName.includes('chemistry') || lowerName.includes('রসায়ন')) {
      return { bg: 'from-teal-500 to-emerald-600', icon: '🧪', color: 'text-emerald-600' };
    }
    if (lowerName.includes('math') || lowerName.includes('গণিত')) {
      return { bg: 'from-orange-500 to-red-500', icon: '📐', color: 'text-orange-600' };
    }
    return { bg: 'from-primary to-primary-light', icon: '📚', color: 'text-primary' };
  };

  const style = getSubjectStyle(subject.name);

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
        <h1 className="text-lg font-medium truncate" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>{subject.name}</h1>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: subject.name }
        ]} />

        <h1 className="text-3xl font-extrabold text-text-primary mb-8 mt-4" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>{subject.name} সাইকেলসমূহ</h1>

        {subject.cycles.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-border shadow-sm">
            <p className="text-text-secondary font-medium" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>এখনো কোনো কন্টেন্ট যোগ করা হয়নি। 📚</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subject.cycles.map((cycle: any) => {
              let totalVideos = 0;
              let completedVideos = 0;
              
              cycle.chapters.forEach((ch: any) => {
                totalVideos += ch.videos.length;
                ch.videos.forEach((v: any) => {
                  if (isCompleted(v.id)) completedVideos++;
                });
              });

              const hasProgress = completedVideos > 0;
              const percent = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

              return (
                <div
                  key={cycle.id}
                  className="bg-white rounded-2xl shadow-md border border-border overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col group"
                >
                  <div className={`h-24 bg-gradient-to-br ${style.bg} relative overflow-hidden flex items-center justify-center`}>
                    <div className="absolute inset-0 bg-black/10"></div>
                    <span className="text-4xl relative z-10 drop-shadow-md opacity-50 group-hover:scale-110 transition-transform">{style.icon}</span>
                  </div>
                  
                  <div className="p-6 flex-grow flex flex-col">
                    <h3 className="text-xl font-bold text-text-primary mb-4">{cycle.name}</h3>
                    
                    <div className="flex items-center gap-4 mb-6 text-sm font-medium text-text-secondary">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4" />
                        <span style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>{cycle.chapters.length} চ্যাপ্টার</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <PlayCircle className="w-4 h-4" />
                        <span style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>{totalVideos} ভিডিও</span>
                      </div>
                    </div>

                    {hasProgress && (
                      <div className="mb-6">
                        <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                          <span className="text-text-secondary" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>প্রগ্রেস</span>
                          <span className={style.color}>{percent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full bg-gradient-to-r ${style.bg}`} style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-auto pt-4">
                      <Link
                        to={`/cycle/${cycle.id}`}
                        className="w-full py-2.5 bg-accent text-white font-bold rounded-xl flex items-center justify-center hover:bg-accent-dark transition-colors shadow-sm hover:shadow-accent/30"
                        style={{ fontFamily: 'Hind Siliguri, sans-serif' }}
                      >
                        দেখুন <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </motion.div>
  );
}
