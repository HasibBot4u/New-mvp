import React, { useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useCatalog } from '../contexts/CatalogContext';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { Skeleton } from '../components/ui/Skeleton';
import { BookMarked } from 'lucide-react';

export const ChaptersPage: React.FC = () => {
  const { subjectId, cycleId } = useParams<{ subjectId: string; cycleId: string }>();
  const { catalog, isLoading } = useCatalog();

  const subject = useMemo(() => {
    return catalog?.subjects.find((s) => s.id === subjectId);
  }, [catalog, subjectId]);

  const cycle = useMemo(() => {
    return catalog?.cycles.find((c) => c.id === cycleId);
  }, [catalog, cycleId]);

  const chapters = useMemo(() => {
    return catalog?.chapters.filter((c) => c.cycle_id === cycleId).sort((a, b) => a.order_index - b.order_index) || [];
  }, [catalog, cycleId]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-6 w-64 mb-8" />
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!subject || !cycle) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Breadcrumb
          items={[
            { label: subject.name, href: `/subject/${subject.id}` },
            { label: cycle.name }
          ]}
        />
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary tracking-tight">Chapters</h1>
        <p className="text-text-secondary mt-2">Select a chapter to view videos</p>
      </div>

      {chapters.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <BookMarked className="mx-auto h-12 w-12 text-text-muted mb-4" />
          <h3 className="text-lg font-medium text-text-primary">No chapters found</h3>
          <p className="text-text-secondary mt-1">There are currently no chapters available for this cycle.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {chapters.map((chapter) => (
            <Link
              key={chapter.id}
              to={`/subject/${subjectId}/cycle/${cycleId}/chapter/${chapter.id}`}
              className="group flex items-start gap-4 rounded-xl border border-border bg-surface p-5 transition-all hover:border-primary/50 hover:shadow-sm"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BookMarked size={24} />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-text-primary group-hover:text-primary transition-colors">
                  {chapter.name}
                </h2>
                {chapter.description && (
                  <p className="mt-1 text-sm text-text-secondary line-clamp-2">
                    {chapter.description}
                  </p>
                )}
                <div className="mt-2 text-xs font-medium text-text-muted">
                  Chapter {chapter.order_index}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
