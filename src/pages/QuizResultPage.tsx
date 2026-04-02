import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, BookOpen, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { motion } from 'framer-motion';

export function QuizResultPage() {
  const { quizId, attemptId } = useParams<{ quizId: string, attemptId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [quiz, setQuiz] = useState<any>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && quizId && attemptId) {
      fetchResultData();
    }
  }, [user, quizId, attemptId]);

  const fetchResultData = async () => {
    setIsLoading(true);
    try {
      // Fetch quiz details
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();
        
      if (quizError) throw quizError;
      setQuiz(quizData);

      // Fetch attempt details
      const { data: attemptData, error: attemptError } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('id', attemptId)
        .single();

      if (attemptError) throw attemptError;
      
      // Calculate rank dynamically
      const { count: higherScoresCount } = await supabase
        .from('quiz_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('quiz_id', quizId)
        .eq('status', 'completed')
        .gt('score', attemptData.score);
        
      const { count: sameScoreFasterCount } = await supabase
        .from('quiz_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('quiz_id', quizId)
        .eq('status', 'completed')
        .eq('score', attemptData.score)
        .lt('time_taken_seconds', attemptData.time_taken_seconds);

      const calculatedRank = (higherScoresCount || 0) + (sameScoreFasterCount || 0) + 1;
      
      setAttempt({ ...attemptData, calculatedRank });

      // Fetch questions and options
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select(`
          *,
          options:question_options(*)
        `)
        .eq('quiz_id', quizId)
        .order('display_order', { ascending: true });

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);

      // Fetch answers
      const { data: answersData, error: answersError } = await supabase
        .from('quiz_answers')
        .select('*')
        .eq('attempt_id', attemptId);
        
      if (answersError) throw answersError;
      
      const answersMap: Record<string, string> = {};
      answersData?.forEach(a => {
        answersMap[a.question_id] = a.selected_option_id;
      });
      setAnswers(answersMap);

    } catch (error: any) {
      console.error('Error fetching result:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-dark pb-20">
        <div className="h-16 bg-primary" />
        <div className="max-w-3xl mx-auto p-4 space-y-4 mt-8">
          <Skeleton className="h-48 w-full rounded-2xl mb-8" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!quiz || !attempt) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-dark p-4">
        <h2 className="text-2xl font-bold text-text-primary mb-2">Result Not Found</h2>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-primary text-white rounded-xl">Go Back</button>
      </div>
    );
  }

  const isPassed = attempt.score >= (quiz.pass_marks || 0);
  const totalQuestions = questions.length;
  const answeredQuestions = Object.keys(answers).length;
  const skippedQuestions = totalQuestions - answeredQuestions;
  
  let correctCount = 0;
  let wrongCount = 0;
  
  questions.forEach(q => {
    const selectedOptionId = answers[q.id];
    if (selectedOptionId) {
      const selectedOption = q.options.find((o: any) => o.id === selectedOptionId);
      if (selectedOption?.is_correct) {
        correctCount++;
      } else {
        wrongCount++;
      }
    }
  });

  const percentage = Math.max(0, Math.min(100, Math.round((attempt.score / quiz.total_marks) * 100))) || 0;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-surface-dark pb-24"
    >
      <header className="bg-primary text-white h-16 flex items-center px-4 sticky top-0 z-30 shadow-md">
        <button onClick={() => navigate(`/chapter/${quiz.chapter_id}/quizzes`)} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors mr-3">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-medium truncate" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>ফলাফল: {quiz.title}</h1>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Score Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-border p-8 mb-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-blue-400" />
          
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-8 border-surface-dark mb-6 relative">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" fill="none" stroke="#e2e8f0" strokeWidth="8" />
              <circle 
                cx="50" cy="50" r="46" fill="none" 
                stroke={isPassed ? "#22c55e" : "#ef4444"} 
                strokeWidth="8" 
                strokeDasharray={`${percentage * 2.89} 289`}
                strokeLinecap="round"
              />
            </svg>
            <div className="text-center">
              <span className="text-3xl font-bold text-text-primary">{attempt.score}</span>
              <span className="text-sm text-text-secondary block">/ {quiz.total_marks}</span>
            </div>
          </div>

          <h2 className={`text-2xl font-bold mb-2 ${isPassed ? 'text-green-600' : 'text-red-600'}`} style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>
            {isPassed ? 'উত্তীর্ণ' : 'অনুত্তীর্ণ'}
          </h2>
          
          {attempt.calculatedRank > 0 && (
            <p className="text-text-secondary font-medium mb-6" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>
              আপনার র‍্যাঙ্ক: {attempt.calculatedRank}
            </p>
          )}

          <div className="grid grid-cols-4 gap-4 max-w-lg mx-auto mt-8">
            <div className="bg-green-50 rounded-xl p-3">
              <div className="text-2xl font-bold text-green-600">{correctCount}</div>
              <div className="text-xs text-green-800 font-medium" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>সঠিক</div>
            </div>
            <div className="bg-red-50 rounded-xl p-3">
              <div className="text-2xl font-bold text-red-600">{wrongCount}</div>
              <div className="text-xs text-red-800 font-medium" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>ভুল</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-2xl font-bold text-gray-600">{skippedQuestions}</div>
              <div className="text-xs text-gray-800 font-medium" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>বাদ</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-3">
              <div className="text-xl font-bold text-blue-600 mt-1">{Math.floor(attempt.time_taken_seconds / 60)}m</div>
              <div className="text-xs text-blue-800 font-medium" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>সময়</div>
            </div>
          </div>
          
          <div className="flex gap-4 justify-center mt-8">
            <Button onClick={() => navigate(`/quiz/${quiz.id}`)} variant="outline" className="gap-2">
              <RotateCcw className="w-4 h-4" />
              পুনরায় দিন
            </Button>
            <Button onClick={() => navigate(`/chapter/${quiz.chapter_id}/quizzes`)} className="gap-2">
              <BookOpen className="w-4 h-4" />
              অধ্যায়ে ফিরুন
            </Button>
          </div>
        </div>

        {/* Question Review */}
        <h3 className="text-xl font-bold text-text-primary mb-6" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>উত্তরপত্র পর্যালোচনা</h3>
        
        <div className="space-y-6">
          {questions.map((q, index) => {
            const selectedOptionId = answers[q.id];
            const isAnswered = !!selectedOptionId;
            const selectedOption = q.options.find((o: any) => o.id === selectedOptionId);
            const isCorrect = selectedOption?.is_correct;

            return (
              <div key={q.id} className="bg-white rounded-2xl shadow-sm border border-border p-6">
                <div className="flex gap-4 mb-6">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 text-white ${
                    !isAnswered ? 'bg-gray-400' : isCorrect ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-text-primary" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>{q.question_text}</h4>
                    <p className="text-xs text-text-secondary mt-1">
                      Marks: {isCorrect ? `+${q.marks || 1}` : isAnswered ? `-${quiz.negative_per_wrong || 0}` : '0'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pl-12">
                  {q.options.map((opt: any) => {
                    const isSelected = selectedOptionId === opt.id;
                    let optionClass = "border-border opacity-60";
                    
                    if (opt.is_correct) {
                      optionClass = "border-green-500 bg-green-50 text-green-800 font-medium";
                    } else if (isSelected && !opt.is_correct) {
                      optionClass = "border-red-500 bg-red-50 text-red-800";
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`w-full text-left p-4 rounded-xl border-2 flex items-center gap-3 ${optionClass}`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          opt.is_correct ? 'border-green-500 bg-green-500' :
                          isSelected && !opt.is_correct ? 'border-red-500 bg-red-500' :
                          'border-gray-300'
                        }`}>
                          {(isSelected || opt.is_correct) && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <span style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>{opt.option_text}</span>
                        
                        {opt.is_correct && <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />}
                        {isSelected && !opt.is_correct && <XCircle className="w-5 h-5 text-red-500 ml-auto" />}
                      </div>
                    );
                  })}
                </div>

                {q.explanation && (
                  <div className="mt-6 pl-12">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 flex gap-3">
                      <AlertCircle className="w-5 h-5 shrink-0 text-blue-500" />
                      <div>
                        <span className="font-bold block mb-1" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>ব্যাখ্যা:</span>
                        <span style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>{q.explanation}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </motion.div>
  );
}
