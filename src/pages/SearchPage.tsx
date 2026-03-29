import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, BookOpen, PlayCircle, ArrowLeft, X } from 'lucide-react';
import { useSearch } from '../hooks/useSearch';

export function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { results: searchResults } = useSearch(searchQuery);
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
        <h1 className="text-lg font-medium">Search</h1>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            autoFocus
            placeholder="Search videos, chapters, subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm shadow-sm transition-shadow"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {searchQuery && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {searchResults.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {searchResults.map((result) => (
                  <li key={`${result.type}-${result.id}`}>
                    <Link
                      to={result.url}
                      className="block px-4 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0 mr-4">
                          {result.type === 'video' && <PlayCircle className="w-6 h-6 text-primary" />}
                          {result.type === 'chapter' && <BookOpen className="w-6 h-6 text-secondary" />}
                          {result.type === 'subject' && <BookOpen className="w-6 h-6 text-gray-400" />}
                        </div>
                        <div>
                          <p className="text-base font-medium text-gray-900">{result.title}</p>
                          <p className="text-sm text-gray-500">{result.subtitle}</p>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-12 text-center text-gray-500">
                No results found for '{searchQuery}'
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
