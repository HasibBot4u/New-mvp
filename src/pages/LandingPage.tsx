import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, PlayCircle, BookOpen, Users, Trophy, CheckCircle, ChevronRight, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';

export function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-surface-dark font-sans">
      {/* Sticky Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  N
                </div>
                <span className={`text-2xl font-extrabold tracking-tight ${isScrolled ? 'text-primary' : 'text-white'}`}>
                  Nexus<span className="text-accent">Edu</span>
                </span>
              </Link>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/courses" className={`font-semibold hover:text-accent transition-colors ${isScrolled ? 'text-text-primary' : 'text-white'}`} style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>কোর্সসমূহ</Link>
              <Link to="/about" className={`font-semibold hover:text-accent transition-colors ${isScrolled ? 'text-text-primary' : 'text-white'}`} style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>আমাদের সম্পর্কে</Link>
              <Link to="/success" className={`font-semibold hover:text-accent transition-colors ${isScrolled ? 'text-text-primary' : 'text-white'}`} style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>সাফল্য</Link>
              <Link to="/login" className="px-6 py-2.5 bg-accent text-white font-bold rounded-xl hover:bg-accent-dark transition-colors shadow-lg hover:shadow-accent/30" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>
                লগইন করুন
              </Link>
            </div>

            <div className="md:hidden flex items-center">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={`${isScrolled ? 'text-text-primary' : 'text-white'}`}>
                {mobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-20 px-4">
          <div className="flex flex-col space-y-4">
            <Link to="/courses" className="text-xl font-bold text-text-primary py-3 border-b border-border" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>কোর্সসমূহ</Link>
            <Link to="/about" className="text-xl font-bold text-text-primary py-3 border-b border-border" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>আমাদের সম্পর্কে</Link>
            <Link to="/success" className="text-xl font-bold text-text-primary py-3 border-b border-border" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>সাফল্য</Link>
            <Link to="/login" className="w-full text-center py-3 bg-accent text-white font-bold rounded-xl mt-4" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>লগইন করুন</Link>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-gradient-to-br from-primary-dark via-primary to-primary-light">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>
                দেশের সেরা <span className="text-accent">অনলাইন</span> শিক্ষা প্ল্যাটফর্ম
              </h1>
              <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl mx-auto lg:mx-0" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>
                এইচএসসি ও এডমিশন প্রস্তুতির জন্য দেশের সেরা শিক্ষকদের গাইডলাইন এবং মানসম্মত কন্টেন্ট এখন তোমার হাতের মুঠোয়।
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/courses" className="px-8 py-4 bg-accent text-white font-bold rounded-xl text-lg hover:bg-accent-dark transition-colors shadow-lg hover:shadow-accent/40 flex items-center justify-center gap-2" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>
                  কোর্সসমূহ দেখুন <ChevronRight className="w-5 h-5" />
                </Link>
                <Link to="/login" className="px-8 py-4 bg-white/10 text-white font-bold rounded-xl text-lg hover:bg-white/20 transition-colors backdrop-blur-sm flex items-center justify-center gap-2" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>
                  ফ্রি ক্লাস করুন <PlayCircle className="w-5 h-5" />
                </Link>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="absolute inset-0 bg-accent/20 rounded-full blur-3xl"></div>
              <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Students learning" className="relative z-10 rounded-2xl shadow-2xl border-4 border-white/20" />
              
              {/* Floating Stats Card */}
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl z-20 animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-3xl font-extrabold text-text-primary">১ লক্ষ+</p>
                    <p className="text-sm font-bold text-text-secondary" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>শিক্ষার্থী যুক্ত আছে</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Icons Section */}
      <section className="py-16 bg-surface-dark relative -mt-10 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {[
              { icon: <BookOpen className="w-8 h-8" />, title: 'সেরা কন্টেন্ট', color: 'text-blue-600', bg: 'bg-blue-50' },
              { icon: <PlayCircle className="w-8 h-8" />, title: 'লাইভ ক্লাস', color: 'text-red-600', bg: 'bg-red-50' },
              { icon: <CheckCircle className="w-8 h-8" />, title: 'মডেল টেস্ট', color: 'text-green-600', bg: 'bg-green-50' },
              { icon: <Trophy className="w-8 h-8" />, title: 'সাফল্য', color: 'text-yellow-600', bg: 'bg-yellow-50' },
            ].map((feature, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-border text-center hover:shadow-md transition-shadow">
                <div className={`w-16 h-16 mx-auto ${feature.bg} ${feature.color} rounded-2xl flex items-center justify-center mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-text-primary" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>{feature.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-text-primary mb-4" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>আমাদের জনপ্রিয় কোর্সসমূহ</h2>
            <div className="w-24 h-1.5 bg-accent mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'HSC 25 Physics Cycle 1', desc: 'ভেক্টর ও নিউটনিয়ান বলবিদ্যা', img: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80' },
              { title: 'HSC 25 Chemistry Cycle 1', desc: 'গুণগত রসায়ন', img: 'https://images.unsplash.com/photo-1603126857599-f6e157824fce?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80' },
              { title: 'HSC 25 Higher Math Cycle 1', desc: 'ম্যাট্রিক্স ও নির্ণায়ক', img: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80' },
            ].map((course, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-md border border-border overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 flex flex-col">
                <div className="h-48 relative overflow-hidden">
                  <img src={course.img} alt={course.title} className="w-full h-full object-cover" />
                  <div className="absolute top-4 left-4 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>নতুন ব্যাচ</div>
                </div>
                <div className="p-6 flex-grow flex flex-col">
                  <h3 className="text-xl font-bold text-text-primary mb-2">{course.title}</h3>
                  <p className="text-text-secondary mb-6" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>{course.desc}</p>
                  <div className="mt-auto">
                    <Link to="/login" className="w-full py-3 bg-primary/10 text-primary font-bold rounded-xl flex items-center justify-center hover:bg-primary hover:text-white transition-colors" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>
                      বিস্তারিত দেখুন <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link to="/courses" className="inline-flex items-center gap-2 text-primary font-bold hover:text-primary-hover transition-colors" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>
              সব কোর্স দেখুন <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why We Are The Best Section */}
      <section className="py-20 bg-surface-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-text-primary mb-4" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>কেন আমরা সেরা?</h2>
            <div className="w-24 h-1.5 bg-accent mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <GraduationCap />, title: 'অভিজ্ঞ শিক্ষক প্যানেল', desc: 'দেশের সেরা বিশ্ববিদ্যালয়গুলোর মেধাবী ও অভিজ্ঞ শিক্ষকদের দ্বারা ক্লাস পরিচালনা।' },
              { icon: <BookOpen />, title: 'মানসম্মত স্টাডি ম্যাটেরিয়াল', desc: 'প্রতিটি ক্লাসের সাথে রয়েছে গোছানো লেকচার শিট এবং প্র্যাকটিস প্রবলেম।' },
              { icon: <PlayCircle />, title: 'এইচডি কোয়ালিটি ভিডিও', desc: 'ল্যাগ-ফ্রি এবং বাফারিং মুক্ত হাই-কোয়ালিটি ভিডিও স্ট্রিমিং অভিজ্ঞতা।' },
              { icon: <CheckCircle />, title: 'নিয়মিত পরীক্ষা', desc: 'প্রস্তুতি যাচাইয়ের জন্য রয়েছে অধ্যায়ভিত্তিক এবং পূর্ণাঙ্গ মডেল টেস্ট।' },
              { icon: <Users />, title: 'প্রবলেম সলভিং সাপোর্ট', desc: 'যেকোনো সমস্যায় ডেডিকেটেড টিচার্স প্যানেল থেকে দ্রুত সমাধান।' },
            ].map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl border-2 border-primary/10 shadow-[8px_8px_0px_0px_rgba(26,35,126,0.1)] hover:shadow-[8px_8px_0px_0px_rgba(26,35,126,0.2)] hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-3" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>{feature.title}</h3>
                <p className="text-text-secondary leading-relaxed" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary-dark text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <Link to="/" className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary font-bold text-xl">
                  N
                </div>
                <span className="text-2xl font-extrabold tracking-tight text-white">
                  Nexus<span className="text-accent">Edu</span>
                </span>
              </Link>
              <p className="text-blue-200 mb-6 max-w-md" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>
                দেশের সেরা অনলাইন শিক্ষা প্ল্যাটফর্ম। আমরা বিশ্বাস করি মানসম্মত শিক্ষা সবার অধিকার।
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-6" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>গুরুত্বপূর্ণ লিংক</h4>
              <ul className="space-y-3">
                <li><Link to="/courses" className="text-blue-200 hover:text-white transition-colors" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>কোর্সসমূহ</Link></li>
                <li><Link to="/about" className="text-blue-200 hover:text-white transition-colors" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>আমাদের সম্পর্কে</Link></li>
                <li><Link to="/contact" className="text-blue-200 hover:text-white transition-colors" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>যোগাযোগ</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-6" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>আইনি তথ্য</h4>
              <ul className="space-y-3">
                <li><Link to="/privacy" className="text-blue-200 hover:text-white transition-colors" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>প্রাইভেসি পলিসি</Link></li>
                <li><Link to="/terms" className="text-blue-200 hover:text-white transition-colors" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>শর্তাবলী</Link></li>
                <li><Link to="/refund" className="text-blue-200 hover:text-white transition-colors" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>রিফান্ড পলিসি</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-blue-200 text-sm" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>
              &copy; {new Date().getFullYear()} NexusEdu. সর্বস্বত্ব সংরক্ষিত।
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
