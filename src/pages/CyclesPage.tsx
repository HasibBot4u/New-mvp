import { useMemo, useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { useCatalog } from '../contexts/CatalogContext';
import { useVideoProgress } from '../hooks/useVideoProgress';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { Skeleton } from '../components/ui/Skeleton';

export function CyclesPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const { catalog, isLoading } = useCatalog();
  const { isCompleted } = useVideoProgress();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  const subject = useMemo(() => {
    return catalog?.subjects.find((s: any) => s.id === subjectId);
  }, [catalog, subjectId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="h-16 bg-primary" />
        <div className="max-w-4xl mx-auto p-4 space-y-4">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Subject Not Found</h2>
        <p className="text-gray-600 mb-6">The subject you are looking for does not exist.</p>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 pb-20 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <header className="bg-primary text-white h-16 flex items-center px-4 sticky top-0 z-30 shadow-md">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors mr-3"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-medium truncate">{subject.name}</h1>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: subject.name }
        ]} />

        <h1 className="text-2xl font-bold text-gray-900 mb-6">{subject.name} Cycles</h1>

        {subject.cycles.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <p className="text-gray-500 font-medium">No content yet. Check back soon! 📚</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              return (
                <Link
                  key={cycle.id}
                  to={`/cycle/${cycle.id}`}
                  className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-primary/30 transition-all duration-200 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    {hasProgress && (
                      <span className="text-xs font-semibold text-success bg-success/10 px-2 py-1 rounded-full">
                        {completedVideos} / {totalVideos} completed
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{cycle.name}</h3>
                  <p className="text-sm text-gray-500 font-medium">
                    {cycle.chapters.length} chapters • {totalVideos} videos
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
