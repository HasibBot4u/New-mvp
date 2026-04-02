import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Medal, Search, ChevronDown } from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';
import { motion } from 'framer-motion';

export function LeaderboardPage() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>('');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  useEffect(() => {
    if (selectedQuizId) {
      fetchLeaderboard(selectedQuizId);
    }
  }, [selectedQuizId]);

  const fetchQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('id, title, chapter_id, chapters(title)')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuizzes(data || []);
      if (data && data.length > 0) {
        setSelectedQuizId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    }
  };

  const fetchLeaderboard = async (quizId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select(`
          score,
          rank,
          submitted_at,
          profiles (
            display_name
          )
        `)
        .eq('quiz_id', quizId)
        .eq('status', 'completed')
        .order('score', { ascending: false })
        .order('time_taken_seconds', { ascending: true })
        .limit(20);

      if (error) throw error;
      setLeaderboard(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const maskName = (name: string) => {
    if (!name || name.length <= 2) return name;
    return name.substring(0, 2) + '***' + name.substring(name.length - 1);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-surface-dark pb-24"
    >
      <header className="bg-primary text-white h-16 flex items-center px-4 sticky top-0 z-30 shadow-md">
        <Trophy className="w-6 h-6 mr-3" />
        <h1 className="text-lg font-medium" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>লিডারবোর্ড</h1>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8 relative">
          <select
            value={selectedQuizId}
            onChange={(e) => setSelectedQuizId(e.target.value)}
            className="w-full appearance-none bg-white border border-border rounded-xl px-4 py-3 pr-10 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            style={{ fontFamily: 'Hind Siliguri, sans-serif' }}
          >
            {quizzes.map(q => (
              <option key={q.id} value={q.id}>
                {q.chapters?.title ? `${q.chapters.title} - ` : ''}{q.title}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none" />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-border">
            <Search className="w-12 h-12 text-text-secondary mx-auto mb-4 opacity-50" />
            <h2 className="text-lg font-medium text-text-primary mb-1" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>কোনো ফলাফল নেই</h2>
            <p className="text-sm text-text-secondary" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>এই কুইজে এখনও কেউ অংশগ্রহণ করেনি।</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 bg-surface-dark border-b border-border text-xs font-bold text-text-secondary uppercase tracking-wider">
              <div className="col-span-2 text-center">Rank</div>
              <div className="col-span-6">Student</div>
              <div className="col-span-4 text-right">Score</div>
            </div>
            
            <div className="divide-y divide-border">
              {leaderboard.map((entry, index) => {
                const rank = index + 1;
                return (
                  <div key={index} className={`grid grid-cols-12 gap-4 p-4 items-center transition-colors hover:bg-surface-dark ${rank <= 3 ? 'bg-yellow-50/30' : ''}`}>
                    <div className="col-span-2 flex justify-center">
                      {rank === 1 ? <Medal className="w-8 h-8 text-yellow-500" /> :
                       rank === 2 ? <Medal className="w-8 h-8 text-gray-400" /> :
                       rank === 3 ? <Medal className="w-8 h-8 text-amber-600" /> :
                       <span className="font-bold text-text-secondary">{rank}</span>}
                    </div>
                    <div className="col-span-6">
                      <div className="font-medium text-text-primary truncate" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>
                        {maskName(entry.profiles?.display_name || 'Student')}
                      </div>
                      <div className="text-xs text-text-secondary mt-0.5">
                        {new Date(entry.submitted_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="col-span-4 text-right">
                      <div className="font-bold text-primary text-lg">{entry.score}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </motion.div>
  );
}
