import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, PlayCircle, FileText, ListVideo, Info } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCatalog } from '../contexts/CatalogContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { VideoPlayer } from '../components/shared/VideoPlayer';
import { useVideoProgress } from '../hooks/useVideoProgress';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { Skeleton } from '../components/ui/Skeleton';

export function PlayerPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const { catalog, isLoading } = useCatalog();
  const { user, profile } = useAuth();
  const { isCompleted, setCompleted, getNotes, setNotes } = useVideoProgress();
  
  const [activeTab, setActiveTab] = useState<'about' | 'notes' | 'list'>('about');
  const [notesText, setNotesText] = useState('');
  const [visible, setVisible] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);

  useEffect(() => {
    setVisible(true);
    if (videoId) {
      setNotesText(getNotes(videoId));
    }
  }, [videoId]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotesText(e.target.value);
    if (videoId) setNotes(videoId, e.target.value);
  };

  const clearNotes = () => {
    setNotesText('');
    if (videoId) setNotes(videoId, '');
  };

  const videoContext = useMemo(() => {
    if (!catalog || !videoId) return null;

    for (const subject of catalog.subjects) {
      for (const cycle of subject.cycles) {
        for (const chapter of cycle.chapters) {
          const index = chapter.videos.findIndex((v: any) => v.id === videoId);
          if (index !== -1) {
            return {
              subject,
              cycle,
              chapter,
              video: chapter.videos[index],
              allVideos: chapter.videos,
              prevVideo: index > 0 ? chapter.videos[index - 1] : null,
              nextVideo: index < chapter.videos.length - 1 ? chapter.videos[index + 1] : null,
            };
          }
        }
      }
    }
    return null;
  }, [catalog, videoId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="h-16 bg-primary" />
        <div className="w-full aspect-video bg-black" />
        <div className="max-w-4xl mx-auto p-4 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!videoContext) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Video Not Found</h2>
        <p className="text-gray-600 mb-6">The video you are looking for does not exist or has been removed.</p>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Return Home
        </button>
      </div>
    );
  }

  const { subject, cycle, chapter, video, allVideos, prevVideo, nextVideo } = videoContext;
  const completed = isCompleted(video.id);

  const handleComplete = async (vid: string, isChecked: boolean) => {
    setCompleted(vid, isChecked);
    if (isChecked && videoContext) {
      let allCompleted = true;
      for (const ch of cycle.chapters) {
        for (const v of ch.videos) {
          if (!isCompleted(v.id) && v.id !== vid) {
            allCompleted = false;
            break;
          }
        }
        if (!allCompleted) break;
      }
      if (allCompleted) {
        setShowCertificate(true);
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
        if (user) {
          try {
            await supabase.from('cycle_completions').upsert({
              user_id: user.id,
              cycle_id: cycle.id
            }, { onConflict: 'user_id, cycle_id' });
          } catch (e) {
            console.error('Error saving cycle completion:', e);
          }
        }
      }
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 pb-20 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Topbar */}
      <header className="bg-primary text-white h-16 flex items-center px-4 sticky top-0 z-30 shadow-md">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors mr-3"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-medium truncate">{video.title}</h1>
      </header>

      {/* Video Player Area */}
      <div className="w-full bg-black">
        <div className={`mx-auto transition-all duration-300 ${isTheaterMode ? 'w-full max-w-none' : 'max-w-6xl'}`}>
          <VideoPlayer 
            videoId={video.id} 
            sizeMb={video.size_mb}
            isTheaterMode={isTheaterMode}
            onToggleTheaterMode={() => setIsTheaterMode(!isTheaterMode)}
            onComplete={() => handleComplete(video.id, true)} 
          />
        </div>
      </div>

      <main className={`mx-auto px-4 py-6 transition-all duration-300 ${isTheaterMode ? 'max-w-6xl' : 'max-w-4xl'}`}>
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: subject.name, href: `/subject/${subject.id}` },
          { label: cycle.name, href: `/cycle/${cycle.id}` },
          { label: chapter.name, href: `/chapter/${chapter.id}` },
          { label: video.title }
        ]} />

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{video.title}</h1>
            <p className="text-sm text-gray-500">{chapter.name} • {video.duration}</p>
          </div>
          <label className="flex items-center space-x-2 cursor-pointer bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors">
            <input 
              type="checkbox" 
              checked={completed}
              onChange={(e) => handleComplete(video.id, e.target.checked)}
              className="w-5 h-5 rounded text-primary focus:ring-primary border-gray-300"
            />
            <span className={`font-medium ${completed ? 'text-success' : 'text-gray-700'}`}>
              Mark as complete
            </span>
          </label>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6 flex space-x-6">
          <button
            onClick={() => setActiveTab('about')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'about' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>About</span>
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'notes' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Notes</span>
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'list' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <ListVideo className="w-4 h-4" />
            <span>All Videos</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          {activeTab === 'about' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Lesson Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 block mb-1">Subject</span>
                  <span className="font-medium text-gray-900">{subject.name}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Cycle</span>
                  <span className="font-medium text-gray-900">{cycle.name}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Chapter</span>
                  <span className="font-medium text-gray-900">{chapter.name}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Duration</span>
                  <span className="font-medium text-gray-900">{video.duration}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Personal Notes</h3>
                <div className="flex space-x-4">
                  <button 
                    onClick={() => {
                      import('jspdf').then(({ jsPDF }) => {
                        const doc = new jsPDF();
                        doc.setFontSize(20);
                        doc.text(`Notes: ${video.title}`, 20, 20);
                        doc.setFontSize(12);
                        const splitText = doc.splitTextToSize(notesText, 170);
                        doc.text(splitText, 20, 30);
                        doc.save(`${video.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_notes.pdf`);
                      });
                    }}
                    className="text-sm text-primary hover:text-primary/80 font-medium"
                  >
                    Export PDF
                  </button>
                  <button 
                    onClick={clearNotes}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear Notes
                  </button>
                </div>
              </div>
              <textarea
                value={notesText}
                onChange={handleNotesChange}
                placeholder="Type your notes here... They are saved automatically."
                className="w-full h-48 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </div>
          )}

          {activeTab === 'list' && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Videos in {chapter.name}</h3>
              {allVideos.map((v: any, idx: number) => {
                const isPlaying = v.id === video.id;
                const isDone = isCompleted(v.id);
                
                return (
                  <Link
                    key={v.id}
                    to={`/watch/${v.id}`}
                    className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                      isPlaying ? 'bg-primary/5 border border-primary/20' : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-8 text-center text-sm font-medium text-gray-400">
                        {(idx + 1).toString().padStart(2, '0')}
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isDone ? 'bg-success/10 text-success' : isPlaying ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {isDone ? <CheckCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                      </div>
                      <span className={`font-medium ${isPlaying ? 'text-primary' : isDone ? 'text-gray-900' : 'text-gray-700'}`}>
                        {v.title}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">{v.duration}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Prev / Next Navigation */}
        <div className="flex items-center justify-between space-x-4">
          <button
            onClick={() => prevVideo && navigate(`/watch/${prevVideo.id}`)}
            disabled={!prevVideo}
            className={`flex-1 py-3 px-4 rounded-lg font-medium flex items-center justify-center transition-colors ${
              prevVideo 
                ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            ← Previous Video
          </button>
          <button
            onClick={() => nextVideo && navigate(`/watch/${nextVideo.id}`)}
            disabled={!nextVideo}
            className={`flex-1 py-3 px-4 rounded-lg font-medium flex items-center justify-center transition-colors ${
              nextVideo 
                ? 'bg-primary text-white hover:bg-primary/90 shadow-sm' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Next Video →
          </button>
        </div>
      </main>

      {/* Certificate Modal */}
      {showCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-8 text-center relative overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <button 
              onClick={() => setShowCertificate(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Congratulations!</h2>
            <p className="text-gray-600 mb-8">You have successfully completed all videos in this cycle.</p>
            
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8 relative">
              <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-100 rounded-bl-full flex items-start justify-end p-3">
                <span className="text-2xl">🏆</span>
              </div>
              <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Certificate of Completion</p>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{cycle.name}</h3>
              <p className="text-gray-600 mb-2 text-left">Subject: <span className="font-medium text-gray-900">{subject.name}</span></p>
              <p className="text-gray-600 mb-2 text-left">Student: <span className="font-medium text-gray-900">{profile?.display_name || user?.email}</span></p>
              <p className="text-gray-600 text-left">Date: <span className="font-medium text-gray-900">{new Date().toLocaleDateString()}</span></p>
            </div>
            
            <button 
              onClick={() => setShowCertificate(false)}
              className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
            >
              Continue Learning
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
