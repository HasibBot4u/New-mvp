import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Clock, HelpCircle, Trophy } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { motion } from 'framer-motion';

export function QuizListPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (chapterId && user) {
      fetchQuizzes();
    }
  }, [chapterId, user]);

  const fetchQuizzes = async () => {
    setIsLoading(true);
    try {
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*, questions(count)')
        .eq('chapter_id', chapterId)
        .eq('is_published', true)
        .order('display_order', { ascending: true });

      if (quizError) throw quizError;
      setQuizzes(quizData || []);

      const { data: attemptData, error: attemptError } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', user!.id)
        .in('quiz_id', (quizData || []).map(q => q.id));

      if (attemptError && attemptError.code !== 'PGRST116') throw attemptError;

      const attemptMap: Record<string, any> = {};
      attemptData?.forEach(a => {
        if (!attemptMap[a.quiz_id] || a.score > attemptMap[a.quiz_id].score) {
          attemptMap[a.quiz_id] = a;
        }
      });
      setAttempts(attemptMap);

    } catch (error: any) {
      if (error.code !== 'PGRST205') {
        console.error('Error fetching quizzes:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-dark pb-20">
        <div className="h-16 bg-primary" />
        <div className="max-w-3xl mx-auto p-4 space-y-4 mt-8">
          <Skeleton className="h-12 w-3/4 mb-8" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-surface-dark pb-24"
    >
      <header className="bg-primary text-white h-16 flex items-center px-4 sticky top-0 z-30 shadow-md">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors mr-3">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-medium truncate" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>MCQ Quizzes</h1>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {quizzes.length === 0 ? (
          <div className="text-center py-12">
            <HelpCircle className="w-16 h-16 text-text-secondary mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-medium text-text-primary mb-2" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>কোনো কুইজ নেই</h2>
            <p className="text-text-secondary" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>এই অধ্যায়ে এখনও কোনো কুইজ যোগ করা হয়নি।</p>
          </div>
        ) : (
          <div className="space-y-4">
            {quizzes.map(quiz => {
              const attempt = attempts[quiz.id];
              const questionCount = quiz.questions?.[0]?.count || 0;
              
              return (
                <div key={quiz.id} className="bg-white rounded-2xl shadow-sm border border-border p-5">
                  <h3 className="text-lg font-bold text-text-primary mb-2" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>{quiz.title}</h3>
                  
                  <div className="flex flex-wrap gap-4 mb-4 text-sm text-text-secondary">
                    <div className="flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4" />
                      <span>{questionCount} Questions</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>{quiz.time_limit_minutes} Mins</span>
                    </div>
                    {attempt && attempt.status === 'completed' && (
                      <div className="flex items-center gap-1.5 text-primary font-medium">
                        <Trophy className="w-4 h-4" />
                        <span>Best Score: {attempt.score}/{quiz.total_marks}</span>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    onClick={() => navigate(`/quiz/${quiz.id}`)}
                    className="w-full sm:w-auto"
                  >
                    {attempt && attempt.status === 'completed' ? 'আবার শুরু করুন' : 'শুরু করুন'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </motion.div>
  );
}
