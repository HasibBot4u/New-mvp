import { useState } from 'react';

export function useVideoProgress() {
  const [updateTrigger, setUpdateTrigger] = useState(0);

  const triggerUpdate = () => setUpdateTrigger(prev => prev + 1);

  const getProgress = (videoId: string): number => {
    const val = localStorage.getItem(`nexusedu_progress_${videoId}`);
    return val ? parseFloat(val) : 0;
  };

  const setProgress = (videoId: string, time: number) => {
    localStorage.setItem(`nexusedu_progress_${videoId}`, String(time));
    localStorage.setItem(`nexusedu_last_watched_${videoId}`, String(Date.now()));
    triggerUpdate();
  };

  const isCompleted = (videoId: string): boolean => {
    return localStorage.getItem(`nexusedu_complete_${videoId}`) === 'true';
  };

  const setCompleted = (videoId: string, completed: boolean) => {
    if (completed) {
      localStorage.setItem(`nexusedu_complete_${videoId}`, 'true');
    } else {
      localStorage.removeItem(`nexusedu_complete_${videoId}`);
    }
    triggerUpdate();
  };

  const getNotes = (videoId: string): string => {
    return localStorage.getItem(`nexusedu_notes_${videoId}`) || '';
  };

  const setNotes = (videoId: string, notes: string) => {
    localStorage.setItem(`nexusedu_notes_${videoId}`, notes);
    triggerUpdate();
  };

  const getStats = () => {
    let completedCount = 0;
    let totalSecondsWatched = 0;
    const inProgressVideos: { videoId: string; progress: number; lastWatched: number }[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      if (key.startsWith('nexusedu_complete_') && localStorage.getItem(key) === 'true') {
        completedCount++;
      } else if (key.startsWith('nexusedu_progress_')) {
        const videoId = key.replace('nexusedu_progress_', '');
        const progress = parseFloat(localStorage.getItem(key) || '0');
        if (progress > 0) {
          totalSecondsWatched += progress;
          if (localStorage.getItem(`nexusedu_complete_${videoId}`) !== 'true') {
            const lastWatched = parseInt(localStorage.getItem(`nexusedu_last_watched_${videoId}`) || '0', 10);
            inProgressVideos.push({ videoId, progress, lastWatched });
          }
          // For streak, we just use a simple mock based on progress existence for now, 
          // or we could track actual dates in a separate key. Let's track dates in a separate key if needed, 
          // but for now we'll just return a placeholder or calculate from a 'nexusedu_watch_dates' key.
        }
      }
    }

    const watchDatesStr = localStorage.getItem('nexusedu_watch_dates');
    const watchDates: string[] = watchDatesStr ? JSON.parse(watchDatesStr) : [];
    
    // Calculate streak
    let streak = 0;
    if (watchDates.length > 0) {
      const sortedDates = [...new Set(watchDates)].sort().reverse();
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      let currentDate = sortedDates[0] === today || sortedDates[0] === yesterday ? sortedDates[0] : null;
      
      if (currentDate) {
        streak = 1;
        let checkDate = new Date(currentDate);
        for (let i = 1; i < sortedDates.length; i++) {
          checkDate.setDate(checkDate.getDate() - 1);
          const expectedDateStr = checkDate.toISOString().split('T')[0];
          if (sortedDates[i] === expectedDateStr) {
            streak++;
          } else {
            break;
          }
        }
      }
    }

    return {
      completedCount,
      hoursWatched: Math.round((totalSecondsWatched / 3600) * 10) / 10,
      streak,
      inProgressVideos
    };
  };

  const recordWatchDate = () => {
    const today = new Date().toISOString().split('T')[0];
    const watchDatesStr = localStorage.getItem('nexusedu_watch_dates');
    const watchDates: string[] = watchDatesStr ? JSON.parse(watchDatesStr) : [];
    if (!watchDates.includes(today)) {
      watchDates.push(today);
      localStorage.setItem('nexusedu_watch_dates', JSON.stringify(watchDates));
      triggerUpdate();
    }
  };

  return {
    getProgress,
    setProgress,
    isCompleted,
    setCompleted,
    getNotes,
    setNotes,
    getStats,
    recordWatchDate,
    updateTrigger
  };
}
