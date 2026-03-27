import React from 'react';
import { Link } from 'react-router-dom';
import { useCatalog } from '../contexts/CatalogContext';
import { BookOpen, FlaskConical, Calculator } from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';

export const HomePage: React.FC = () => {
  const { catalog, isLoading, error } = useCatalog();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="rounded-xl bg-red-50 p-8 text-red-800">
          <h2 className="text-xl font-bold mb-2">Error Loading Catalog</h2>
          <p className="mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const getSubjectIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('physics')) return <BookOpen size={32} className="text-blue-500" />;
    if (lowerName.includes('chemistry')) return <FlaskConical size={32} className="text-green-500" />;
    if (lowerName.includes('math')) return <Calculator size={32} className="text-purple-500" />;
    return <BookOpen size={32} className="text-primary" />;
  };

  const getSubjectColor = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('physics')) return 'bg-blue-50 hover:bg-blue-100 border-blue-200';
    if (lowerName.includes('chemistry')) return 'bg-green-50 hover:bg-green-100 border-green-200';
    if (lowerName.includes('math')) return 'bg-purple-50 hover:bg-purple-100 border-purple-200';
    return 'bg-surface hover:bg-surface-hover border-border';
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary tracking-tight">Subjects</h1>
        <p className="text-text-secondary mt-2">Select a subject to view available courses</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {catalog?.subjects.map((subject) => (
          <Link
            key={subject.id}
            to={`/subject/${subject.id}`}
            className={`group relative flex flex-col items-center justify-center rounded-2xl border p-8 text-center transition-all duration-200 hover:shadow-md ${getSubjectColor(subject.name)}`}
          >
            <div className="mb-4 rounded-full bg-white p-4 shadow-sm transition-transform duration-200 group-hover:scale-110">
              {getSubjectIcon(subject.name)}
            </div>
            <h2 className="text-xl font-semibold text-text-primary">{subject.name}</h2>
            {subject.description && (
              <p className="mt-2 text-sm text-text-secondary line-clamp-2">
                {subject.description}
              </p>
            )}
            <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              View Cycles &rarr;
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
