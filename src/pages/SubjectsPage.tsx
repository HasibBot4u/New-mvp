import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCatalog } from '../contexts/CatalogContext';
import { Skeleton } from '../components/ui/Skeleton';

export function SubjectsPage() {
  const { catalog, isLoading } = useCatalog();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <div className={`min-h-screen bg-gray-50 pb-24 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <header className="bg-primary text-white h-16 flex items-center px-4 sticky top-0 z-30 shadow-md">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors mr-3"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-medium">All Subjects</h1>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {catalog?.subjects.map((subject: any) => (
              <Link
                key={subject.id}
                to={`/subject/${subject.id}`}
                className="group relative bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-primary/30 transition-all duration-200 hover:-translate-y-1 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                <h3 className="text-xl font-bold text-gray-900 mb-2 relative z-10">{subject.name}</h3>
                <p className="text-sm text-gray-500 relative z-10">
                  {subject.cycles.length} Cycles
                </p>
                <div className="mt-4 flex items-center text-primary font-medium text-sm relative z-10">
                  Explore <ArrowLeft className="w-4 h-4 ml-1 rotate-180" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
