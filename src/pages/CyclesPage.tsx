import React, { useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useCatalog } from '../contexts/CatalogContext';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { Skeleton } from '../components/ui/Skeleton';
import { Layers } from 'lucide-react';

export const CyclesPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { catalog, isLoading } = useCatalog();

  const subject = useMemo(() => {
    return catalog?.subjects.find((s) => s.id === subjectId);
  }, [catalog, subjectId]);

  const cycles = useMemo(() => {
    return subject?.cycles || [];
  }, [subject]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-6 w-64 mb-8" />
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!subject) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Breadcrumb
          items={[
            { label: subject.name }
          ]}
        />
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary tracking-tight">Revision Cycles</h1>
        <p className="text-text-secondary mt-2">Select a cycle to view chapters</p>
      </div>

      {cycles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Layers className="mx-auto h-12 w-12 text-text-muted mb-4" />
          <h3 className="text-lg font-medium text-text-primary">No cycles found</h3>
          <p className="text-text-secondary mt-1">There are currently no cycles available for this subject.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cycles.map((cycle) => (
            <Link
              key={cycle.id}
              to={`/subject/${subjectId}/cycle/${cycle.id}`}
              className="group flex flex-col justify-between rounded-xl border border-border bg-surface p-6 transition-all hover:border-primary/50 hover:shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-text-primary group-hover:text-primary transition-colors">
                    {cycle.name}
                  </h2>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {cycle.display_order}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm font-medium text-primary">
                View Chapters &rarr;
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
