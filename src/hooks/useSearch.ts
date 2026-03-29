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
      if (subject.name.toLowerCase().includes(lowerQuery)) {
        matches.push({
          id: subject.id,
          title: subject.name,
          type: 'subject',
          subtitle: 'Subject',
          url: `/subject/${subject.id}`
        });
      }

      subject.cycles.forEach((cycle: any) => {
        if (cycle.name.toLowerCase().includes(lowerQuery)) {
          matches.push({
            id: cycle.id,
            title: cycle.name,
            type: 'subject', // or 'cycle' if we had it, but 'subject' is fine or maybe we can just route to cycle
            subtitle: `${subject.name}`,
            url: `/cycle/${cycle.id}`
          });
        }

        cycle.chapters.forEach((chapter: any) => {
          if (chapter.name.toLowerCase().includes(lowerQuery)) {
            matches.push({
              id: chapter.id,
              title: chapter.name,
              type: 'chapter',
              subtitle: `${subject.name} > ${cycle.name}`,
              url: `/chapter/${chapter.id}`
            });
          }

          chapter.videos.forEach((video: any) => {
            if (video.title.toLowerCase().includes(lowerQuery)) {
              matches.push({
                id: video.id,
                title: video.title,
                type: 'video',
                subtitle: `${subject.name} > ${cycle.name} > ${chapter.name}`,
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
