import React, { useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useCatalog } from '../contexts/CatalogContext';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { Skeleton } from '../components/ui/Skeleton';
import { PlayCircle, Clock } from 'lucide-react';
import { Badge } from '../components/ui/Badge';

export const VideoListPage: React.FC = () => {
  const { subjectId, cycleId, chapterId } = useParams<{ subjectId: string; cycleId: string; chapterId: string }>();
  const { catalog, isLoading } = useCatalog();

  const subject = useMemo(() => {
    return catalog?.subjects.find((s) => s.id === subjectId);
  }, [catalog, subjectId]);

  const cycle = useMemo(() => {
    return subject?.cycles.find((c) => c.id === cycleId);
  }, [subject, cycleId]);

  const chapter = useMemo(() => {
    return cycle?.chapters.find((c) => c.id === chapterId);
  }, [cycle, chapterId]);

  const videos = useMemo(() => {
    return chapter?.videos || [];
  }, [chapter]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-6 w-96 mb-8" />
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!subject || !cycle || !chapter) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Breadcrumb
          items={[
            { label: subject.name, href: `/subject/${subject.id}` },
            { label: cycle.name, href: `/subject/${subject.id}/cycle/${cycle.id}` },
            { label: chapter.name }
          ]}
        />
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary tracking-tight">{chapter.name}</h1>
        <p className="text-text-secondary mt-2">{videos.length} videos available</p>
      </div>

      {videos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <PlayCircle className="mx-auto h-12 w-12 text-text-muted mb-4" />
          <h3 className="text-lg font-medium text-text-primary">No videos found</h3>
          <p className="text-text-secondary mt-1">There are currently no videos available in this chapter.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {videos.map((video) => (
            <Link
              key={video.id}
              to={`/video/${video.id}`}
              className="group flex items-center gap-4 rounded-lg border border-border bg-surface p-4 transition-all hover:border-primary/50 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <PlayCircle size={20} />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="truncate text-base font-medium text-text-primary group-hover:text-primary transition-colors">
                  {video.title}
                </h3>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                {video.duration && (
                  <div className="hidden sm:flex items-center text-xs text-text-secondary">
                    <Clock size={14} className="mr-1" />
                    {video.duration}
                  </div>
                )}
                <Badge variant="outline" className="hidden sm:inline-flex">
                  Part {video.display_order}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
