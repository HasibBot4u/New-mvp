import { useState, useEffect, useMemo } from 'react';
import { useCatalog } from '../contexts/CatalogContext';

export interface SearchResult {
  id: string;
  title: string;
  type: 'video' | 'chapter' | 'subject';
  subtitle: string;
  url: string;
}

export function useSearch(query: string) {
  const { catalog, isLoading } = useCatalog();
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const results = useMemo(() => {
    if (!debouncedQuery.trim() || !catalog) return [];

    const lowerQuery = debouncedQuery.toLowerCase();
    const matches: SearchResult[] = [];

    catalog.subjects.forEach((subject: any) => {
      if (subject.title.toLowerCase().includes(lowerQuery)) {
        matches.push({
          id: subject.id,
          title: subject.title,
          type: 'subject',
          subtitle: 'Subject',
          url: `/subject/${subject.id}`
        });
      }

      subject.cycles.forEach((cycle: any) => {
        cycle.chapters.forEach((chapter: any) => {
          if (chapter.title.toLowerCase().includes(lowerQuery)) {
            matches.push({
              id: chapter.id,
              title: chapter.title,
              type: 'chapter',
              subtitle: `${subject.title} > ${cycle.title}`,
              url: `/chapter/${chapter.id}`
            });
          }

          chapter.videos.forEach((video: any) => {
            if (video.title.toLowerCase().includes(lowerQuery)) {
              matches.push({
                id: video.id,
                title: video.title,
                type: 'video',
                subtitle: `${subject.title} > ${cycle.title} > ${chapter.title}`,
                url: `/watch/${video.id}`
              });
            }
          });
        });
      });
    });

    return matches.slice(0, 10); // Limit to 10 results
  }, [debouncedQuery, catalog]);

  return { results, isLoading };
}
