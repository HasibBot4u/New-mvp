import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PlayCircle, BookOpen, User, ChevronRight, CheckCircle2, MessageCircle, Trophy, Video } from 'lucide-react';
import { useCatalog } from '../contexts/CatalogContext';
import { useAuth } from '../contexts/AuthContext';
import { useVideoProgress } from '../hooks/useVideoProgress';
import { Skeleton } from '../components/ui/Skeleton';
import { motion } from 'framer-motion';

export function HomePage() {
  const { catalog, isLoading, error, refreshCatalog } = useCatalog();
  const { user } = useAuth();
  const { getStats, updateTrigger } = useVideoProgress();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-dark p-4">
        <h2 className="text-2xl font-bold text-text-primary mb-2">Failed to load content</h2>
        <p className="text-text-secondary mb-6">Check your connection and try again.</p>
        <button 
          onClick={refreshCatalog}
          className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Subject card mapping based on name
  const getSubjectStyle = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('physics') || lowerName.includes('পদার্থ')) {
      return { bg: 'from-blue-600 to-indigo-600', icon: '⚛️', color: 'text-blue-600' };
    }
    if (lowerName.includes('chemistry') || lowerName.includes('রসায়ন')) {
      return { bg: 'from-teal-500 to-emerald-600', icon: '🧪', color: 'text-emerald-600' };
    }
    if (lowerName.includes('math') || lowerName.includes('গণিত')) {
      return { bg: 'from-orange-500 to-red-500', icon: '📐', color: 'text-orange-600' };
    }
    return { bg: 'from-primary to-primary-light', icon: '📚', color: 'text-primary' };
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-surface-dark pb-24"
    >
      {/* Fixed Navbar */}
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-primary shadow-md py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary font-bold text-xl shadow-sm">
              N
            </div>
            <span className="text-white font-bold text-xl tracking-tight">NexusEdu</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-white/90 font-medium text-sm">
            <a href="#courses" className="hover:text-white transition-colors" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>কোর্সসমূহ</a>
            <a href="#tests" className="hover:text-white transition-colors" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>মডেল টেস্ট</a>
            <a href="#live" className="hover:text-white transition-colors" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>লাইভ ক্লাস</a>
            <a href="#qa" className="hover:text-white transition-colors" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>Q&A</a>
          </div>

          <div>
            {user ? (
              <Link to="/profile" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors text-white">
                <User className="w-5 h-5" />
              </Link>
            ) : (
              <Link to="/login" className="px-5 py-2 bg-white text-primary rounded-xl font-semibold text-sm hover:bg-gray-100 transition-colors shadow-sm">
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 md:px-8 bg-gradient-to-br from-primary via-primary-light to-primary-lighter text-white relative overflow-hidden">
        {/* Abstract background shapes */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between relative z-10">
          <div className="md:w-3/5 mb-12 md:mb-0">
            <p className="text-blue-200 font-medium mb-2 text-lg md:text-xl" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>সেরা শিক্ষার্থীরা</p>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-4 leading-tight tracking-tight">
              NexusEdu-তে <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">পড়ে</span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100/80 mb-8 font-medium" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>
              পদার্থবিজ্ঞান · রসায়ন · উচ্চতর গণিত
            </p>
            
            <div className="flex flex-wrap gap-4">
              <a href="#courses" className="px-8 py-3.5 bg-accent text-white rounded-xl font-bold text-base hover:bg-accent-dark transition-all shadow-lg hover:shadow-accent/30 active:scale-95" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>
                কোর্স দেখুন
              </a>
              <Link to={user ? "/dashboard" : "/login"} className="px-8 py-3.5 bg-white/10 border border-white/20 text-white rounded-xl font-bold text-base hover:bg-white/20 transition-all backdrop-blur-sm active:scale-95" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>
                বিনামূল্যে শুরু করুন
              </Link>
            </div>
          </div>
          
          <div className="md:w-2/5 flex justify-center md:justify-end">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-200">
                    <Video className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">1,400+</p>
                    <p className="text-sm text-blue-200 font-medium" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>এইচডি ভিডিও ক্লাস</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center text-accent-light">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">12,000+</p>
                    <p className="text-sm text-blue-200 font-medium" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>সফল শিক্ষার্থী</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-200">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">18</p>
                    <p className="text-sm text-blue-200 font-medium" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>একাডেমিক সাইকেল</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <div className="bg-white border-b border-border shadow-sm relative z-20 -mt-6 mx-4 md:mx-auto max-w-5xl rounded-2xl p-6 flex flex-wrap justify-center md:justify-between gap-6 md:gap-0">
        <div className="flex flex-col items-center px-4">
          <span className="text-3xl font-extrabold text-primary mb-1">৩ টি</span>
          <span className="text-sm text-text-secondary font-medium" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>বিষয়</span>
        </div>
        <div className="hidden md:block w-px h-12 bg-border"></div>
        <div className="flex flex-col items-center px-4">
          <span className="text-3xl font-extrabold text-primary mb-1">১৮ টি</span>
          <span className="text-sm text-text-secondary font-medium" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>সাইকেল</span>
        </div>
        <div className="hidden md:block w-px h-12 bg-border"></div>
        <div className="flex flex-col items-center px-4">
          <span className="text-3xl font-extrabold text-primary mb-1">৩০০+</span>
          <span className="text-sm text-text-secondary font-medium" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>ক্লাস</span>
        </div>
        <div className="hidden md:block w-px h-12 bg-border"></div>
        <div className="flex flex-col items-center px-4">
          <span className="text-3xl font-extrabold text-primary mb-1">সেরা</span>
          <span className="text-sm text-text-secondary font-medium" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>শিক্ষক</span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-16">
        
        {/* Continue Watching */}
        {user && continueWatching.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>
              এগিয়ে যাও <span className="ml-2">🔥</span>
            </h2>
            <div className="flex overflow-x-auto space-x-6 pb-6 scrollbar-hide snap-x">
              {continueWatching.map((item) => {
                const durationStr = item.video.duration || '00:00:00';
                const timeParts = durationStr.split(':').map(Number);
                let durationSecs = 0;
                if (timeParts.length === 3) durationSecs = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
                else if (timeParts.length === 2) durationSecs = timeParts[0] * 60 + timeParts[1];
                
                const percent = durationSecs > 0 ? Math.min(100, Math.round((item.progress / durationSecs) * 100)) : 0;
                const style = getSubjectStyle(item.subject.name);

                return (
                  <Link 
                    key={item.video.id} 
                    to={`/watch/${item.video.id}`}
                    className="flex-none w-72 bg-white rounded-2xl shadow-sm border border-border overflow-hidden snap-start hover:-translate-y-1 hover:shadow-md transition-all duration-300 group"
                  >
                    <div className={`h-2 bg-gradient-to-r ${style.bg}`} />
                    <div className="p-5">
                      <p className={`text-xs font-bold ${style.color} mb-2 uppercase tracking-wider`}>{item.subject.name}</p>
                      <h4 className="font-bold text-text-primary mb-2 line-clamp-2 h-12 leading-tight group-hover:text-primary transition-colors">{item.video.title}</h4>
                      <p className="text-xs text-text-secondary mb-4 truncate">{item.chapter.name}</p>
                      
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                        <div className={`h-full bg-gradient-to-r ${style.bg}`} style={{ width: `${percent}%` }} />
                      </div>
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-text-secondary" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>{percent}% দেখা হয়েছে</span>
                        <span className={style.color} style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>চালু রাখুন →</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Subjects Section */}
        <section id="courses" className="mb-20">
          <h2 className="text-3xl font-extrabold text-text-primary mb-8 text-center" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>আমাদের কোর্সসমূহ</h2>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-80 w-full rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {catalog?.subjects.map((subject: any) => {
                const style = getSubjectStyle(subject.name);
                // Count total videos
                const totalVideos = subject.cycles.reduce((acc: number, cycle: any) => {
                  return acc + cycle.chapters.reduce((chAcc: number, chapter: any) => chAcc + chapter.videos.length, 0);
                }, 0);

                return (
                  <div key={subject.id} className="bg-white rounded-2xl shadow-md border border-border overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
                    <div className={`h-32 bg-gradient-to-br ${style.bg} relative overflow-hidden flex items-center justify-center`}>
                      <div className="absolute inset-0 bg-black/10"></div>
                      <span className="text-6xl relative z-10 drop-shadow-lg">{style.icon}</span>
                    </div>
                    <div className="p-6 flex-grow flex flex-col">
                      <h3 className="text-2xl font-bold text-text-primary mb-1" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>{subject.name}</h3>
                      <p className="text-sm text-text-secondary mb-4" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>HSC সম্পূর্ণ সিলেবাস</p>
                      
                      <div className="flex items-center gap-4 mb-6 text-sm font-medium text-text-secondary">
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          <span>{subject.cycles.length} সাইকেল</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <PlayCircle className="w-4 h-4" />
                          <span>{totalVideos}+ ক্লাস</span>
                        </div>
                      </div>
                      
                      <div className="mt-auto">
                        <Link
                          to={`/subject/${subject.id}`}
                          className="w-full py-3 bg-accent/10 text-accent-dark font-bold rounded-xl flex items-center justify-center hover:bg-accent hover:text-white transition-colors"
                          style={{ fontFamily: 'Hind Siliguri, sans-serif' }}
                        >
                          কোর্স দেখুন <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Features Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-extrabold text-text-primary mb-10 text-center" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>কেন NexusEdu?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-border text-center hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-4">
                <Video className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>HD ভিডিও ক্লাস</h3>
              <p className="text-sm text-text-secondary" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>সেরা কোয়ালিটির রেকর্ডেড ক্লাস যা বাফারিং ছাড়াই দেখা যায়।</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-border text-center hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>মডেল টেস্ট</h3>
              <p className="text-sm text-text-secondary" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>অধ্যায়ভিত্তিক পরীক্ষা দিয়ে নিজের প্রস্তুতি যাচাই করো।</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-border text-center hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 mx-auto mb-4">
                <Trophy className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>লিডারবোর্ড</h3>
              <p className="text-sm text-text-secondary" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>সারা দেশের শিক্ষার্থীদের সাথে প্রতিযোগিতা করো।</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-border text-center hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mx-auto mb-4">
                <MessageCircle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>Q&A সিস্টেম</h3>
              <p className="text-sm text-text-secondary" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>যেকোনো প্রশ্নের উত্তর পেয়ে যাও খুব সহজেই।</p>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-primary text-white pt-16 pb-8 px-4 md:px-8 mt-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary font-bold text-xl">
                N
              </div>
              <span className="text-white font-bold text-2xl tracking-tight">NexusEdu</span>
            </div>
            <p className="text-blue-200 text-sm leading-relaxed max-w-md" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>
              বাংলাদেশের অন্যতম সেরা এড-টেক প্ল্যাটফর্ম। একাডেমিক থেকে শুরু করে এডমিশন পর্যন্ত আমরা আছি তোমার সাথে।
            </p>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-blue-200">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms & Conditions</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-blue-200">
              <li>support@nexusedu.com</li>
              <li>+880 1234-567890</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 text-center text-sm text-blue-300">
          © 2026 NexusEdu. All rights reserved.
        </div>
      </footer>
    </motion.div>
  );
}
