import { useMemo, useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, PlayCircle } from 'lucide-react';
import { useCatalog } from '../contexts/CatalogContext';
import { useVideoProgress } from '../hooks/useVideoProgress';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { Skeleton } from '../components/ui/Skeleton';

export function ChaptersPage() {
  const { cycleId } = useParams<{ cycleId: string }>();
  const navigate = useNavigate();
  const { catalog, isLoading } = useCatalog();
  const { isCompleted } = useVideoProgress();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="h-16 bg-primary" />
        <div className="max-w-4xl mx-auto p-4 space-y-4">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Cycle Not Found</h2>
        <p className="text-gray-600 mb-6">The cycle you are looking for does not exist.</p>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Return Home
        </button>
      </div>
    );
  }

  const { subject, cycle } = data;

  return (
    <div className={`min-h-screen bg-gray-50 pb-20 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <header className="bg-primary text-white h-16 flex items-center px-4 sticky top-0 z-30 shadow-md">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors mr-3"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-medium truncate">{cycle.name}</h1>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: subject.name, href: `/subject/${subject.id}` },
          { label: cycle.name }
        ]} />

        <h1 className="text-2xl font-bold text-gray-900 mb-6">{cycle.name} Chapters</h1>

        {cycle.chapters.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <p className="text-gray-500 font-medium">No content yet. Check back soon! 📚</p>
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
                  className="group block bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-primary/30 transition-all duration-200 hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                      {chapter.name}
                    </h3>
                    <div className="flex items-center text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      <PlayCircle className="w-4 h-4 mr-1.5" />
                      {totalVideos} classes
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                      <span>Progress</span>
                      <span className={percent === 100 ? 'text-success' : 'text-primary'}>
                        {completedVideos} of {totalVideos} completed
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
    </div>
  );
}
