import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, Clock, Flame, PlayCircle, X, ArrowLeft, User } from 'lucide-react';
import { useCatalog } from '../contexts/CatalogContext';
import { useAuth } from '../contexts/AuthContext';
import { useVideoProgress } from '../hooks/useVideoProgress';
import { useSearch } from '../hooks/useSearch';
import { Skeleton } from '../components/ui/Skeleton';

export function HomePage() {
  const { catalog, isLoading, error, refreshCatalog } = useCatalog();
  const { user } = useAuth();
  const { getStats, updateTrigger } = useVideoProgress();
  const [searchQuery, setSearchQuery] = useState('');
  const { results: searchResults } = useSearch(searchQuery);
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    setVisible(true);
    
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        setDeferredPrompt(null);
        setShowInstallBanner(false);
      });
    }
  };

  const stats = useMemo(() => getStats(), [updateTrigger]);

  const continueWatching = useMemo(() => {
    if (!catalog) return [];
    const inProgress = stats.inProgressVideos.sort((a, b) => b.lastWatched - a.lastWatched).slice(0, 5);
    
    return inProgress.map(p => {
      for (const subject of catalog.subjects) {
        for (const cycle of subject.cycles) {
          for (const chapter of cycle.chapters) {
            const video = chapter.videos.find((v: any) => v.id === p.videoId);
            if (video) {
              return { video, subject, chapter, progress: p.progress };
            }
          }
        }
      }
      return null;
    }).filter(Boolean) as any[];
  }, [catalog, stats.inProgressVideos]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Failed to load content</h2>
        <p className="text-gray-600 mb-6">Check your connection and try again.</p>
        <button 
          onClick={refreshCatalog}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 pb-24 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <header className="bg-primary text-white pt-12 pb-6 px-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">NexusEdu</h1>
            <Link to="/profile" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
              <User className="w-5 h-5" />
            </Link>
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search videos, chapters, subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-10 py-3 border-transparent rounded-xl leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-white sm:text-sm shadow-sm transition-shadow"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}

            {/* Search Results Dropdown */}
            {searchQuery && (
              <div className="absolute z-50 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 max-h-96 overflow-y-auto">
                {searchResults.length > 0 ? (
                  <ul className="py-2">
                    {searchResults.map((result) => (
                      <li key={`${result.type}-${result.id}`}>
                        <Link
                          to={result.url}
                          className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                          onClick={() => setSearchQuery('')}
                        >
                          <div className="flex items-center">
                            <div className="flex-shrink-0 mr-3">
                              {result.type === 'video' && <PlayCircle className="w-5 h-5 text-primary" />}
                              {result.type === 'chapter' && <BookOpen className="w-5 h-5 text-secondary" />}
                              {result.type === 'subject' && <BookOpen className="w-5 h-5 text-gray-400" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{result.title}</p>
                              <p className="text-xs text-gray-500">{result.subtitle}</p>
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-6 text-center text-gray-500">
                    No videos found for '{searchQuery}'
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {user && (
          <div className="mb-8 animate-fade-in">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Progress</h2>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                <BookOpen className="w-6 h-6 text-primary mb-2" />
                <span className="text-2xl font-bold text-gray-900">{stats.completedCount}</span>
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Completed</span>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                <Clock className="w-6 h-6 text-secondary mb-2" />
                <span className="text-2xl font-bold text-gray-900">{stats.hoursWatched}</span>
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Hours</span>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                <Flame className="w-6 h-6 text-orange-500 mb-2" />
                <span className="text-2xl font-bold text-gray-900">{stats.streak}</span>
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Day Streak</span>
              </div>
            </div>

            {continueWatching.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <PlayCircle className="w-5 h-5 mr-2 text-primary" />
                  Continue Watching
                </h3>
                <div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide snap-x">
                  {continueWatching.map((item) => {
                    // Estimate duration in seconds to calculate percentage
                    const timeParts = item.video.duration.split(':').map(Number);
                    let durationSecs = 0;
                    if (timeParts.length === 3) durationSecs = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
                    else if (timeParts.length === 2) durationSecs = timeParts[0] * 60 + timeParts[1];
                    
                    const percent = durationSecs > 0 ? Math.min(100, Math.round((item.progress / durationSecs) * 100)) : 0;

                    return (
                      <Link 
                        key={item.video.id} 
                        to={`/watch/${item.video.id}`}
                        className="flex-none w-64 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden snap-start hover:-translate-y-1 hover:shadow-md transition-all duration-200"
                      >
                        <div className="h-2 bg-primary" />
                        <div className="p-4">
                          <p className="text-xs font-semibold text-primary mb-1 uppercase tracking-wider">{item.subject.name}</p>
                          <h4 className="font-bold text-gray-900 mb-1 line-clamp-2 h-10">{item.video.title}</h4>
                          <p className="text-xs text-gray-500 mb-3 truncate">{item.chapter.name}</p>
                          
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                            <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
                          </div>
                          <div className="flex justify-between items-center text-xs font-medium">
                            <span className="text-gray-500">{percent}% watched</span>
                            <span className="text-primary">Continue →</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <h2 className="text-xl font-bold text-gray-900 mb-4">Subjects</h2>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
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

      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50 animate-in slide-in-from-bottom-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold">
                N
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Install NexusEdu</h4>
                <p className="text-xs text-gray-500">Add to home screen for quick access</p>
              </div>
            </div>
            <button 
              onClick={() => setShowInstallBanner(false)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={handleInstallClick}
            className="w-full py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors text-sm"
          >
            Install App
          </button>
        </div>
      )}
    </div>
  );
}
