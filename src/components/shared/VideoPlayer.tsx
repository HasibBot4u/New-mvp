import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Rewind, FastForward, PictureInPicture } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { useVideoProgress } from '../../hooks/useVideoProgress';
import { useAuth } from '../../contexts/AuthContext';
import { saveProgress } from '../../lib/supabase';
import { api } from '../../lib/api';

interface VideoPlayerProps {
  videoId: string;
  onComplete?: () => void;
}

export function VideoPlayer({ videoId, onComplete }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const { getProgress, setProgress, isCompleted, setCompleted } = useVideoProgress();
  const { user } = useAuth();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [chapters, setChapters] = useState<{ title: string; time: number; percent: number }[]>([]);

  const streamUrl = api.getVideoStreamUrl(videoId);

  const startVideo = useCallback(async () => {
    if (hasStarted || !videoRef.current) return;
    const video = videoRef.current;
    
    setHasStarted(true);
    setIsBuffering(true);
    
    // Step 1: Set src with cache-busting to force fresh request
    video.src = streamUrl;
    
    // Step 2: Load metadata first (fast — just gets file size/duration)
    video.load();
    
    // Step 3: Attempt to play as soon as any data arrives
    video.addEventListener('loadedmetadata', () => {
      video.play().catch(() => {});
    }, { once: true });
  }, [streamUrl, hasStarted]);

  // Load saved settings
  useEffect(() => {
    const savedVolume = localStorage.getItem('nexusedu_volume');
    if (savedVolume) {
      setVolume(parseFloat(savedVolume));
      if (videoRef.current) videoRef.current.volume = parseFloat(savedVolume);
    }

    const savedSpeed = localStorage.getItem('nexusedu_speed');
    if (savedSpeed) {
      setPlaybackSpeed(parseFloat(savedSpeed));
      if (videoRef.current) videoRef.current.playbackRate = parseFloat(savedSpeed);
    }

    const savedProgress = getProgress(videoId);
    if (savedProgress > 10 && videoRef.current) {
      // We will seek once duration is known to ensure it's < 95%
    }
  }, [videoId]);

  const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00';
    const h = Math.floor(time / 3600);
    const m = Math.floor((time % 3600) / 60);
    const s = Math.floor(time % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const showVideoToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 1000);
  };

  const togglePlay = useCallback(() => {
    if (!hasStarted) {
      startVideo();
      return;
    }
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((e) => {
            if (e.name === 'NotSupportedError') {
              // Video failed to load or source is unsupported. Try reloading.
              if (videoRef.current) {
                videoRef.current.src = streamUrl;
                videoRef.current.load();
                videoRef.current.play().catch(() => {});
              }
            } else if (e.name !== 'AbortError') {
              console.error('Play failed:', e);
            }
          });
        }
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying, hasStarted, startVideo, streamUrl]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
    localStorage.setItem('nexusedu_volume', String(newVolume));
  };

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
      if (newMuted) {
        setVolume(0);
      } else {
        const savedVolume = localStorage.getItem('nexusedu_volume');
        const restoreVol = savedVolume ? parseFloat(savedVolume) : 1;
        setVolume(restoreVol > 0 ? restoreVol : 1);
        videoRef.current.volume = restoreVol > 0 ? restoreVol : 1;
      }
    }
  }, [isMuted]);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen().catch(err => console.error(err));
    } else {
      await document.exitFullscreen().catch(err => console.error(err));
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleSeek = useCallback((amount: number) => {
    if (!hasStarted) return;
    if (videoRef.current) {
      videoRef.current.currentTime += amount;
      showVideoToast(amount > 0 ? '+10s' : '-10s');
    }
  }, [hasStarted]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hasStarted) return;
    if (progressRef.current && videoRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = pos * duration;
    }
  };

  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) videoRef.current.playbackRate = speed;
    localStorage.setItem('nexusedu_speed', String(speed));
    setShowSpeedMenu(false);
    showToast(`Speed changed to ${speed}x`);
  };

  const togglePiP = async () => {
    if (!hasStarted) return;
    if (videoRef.current && document.pictureInPictureEnabled) {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      
      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowleft':
          e.preventDefault();
          handleSeek(-10);
          break;
        case 'arrowright':
          e.preventDefault();
          handleSeek(10);
          break;
        case 'arrowup':
          e.preventDefault();
          if (videoRef.current) {
            const newVol = Math.min(1, videoRef.current.volume + 0.1);
            videoRef.current.volume = newVol;
            setVolume(newVol);
            setIsMuted(newVol === 0);
            localStorage.setItem('nexusedu_volume', String(newVol));
            showVideoToast(`Volume ${Math.round(newVol * 100)}%`);
          }
          break;
        case 'arrowdown':
          e.preventDefault();
          if (videoRef.current) {
            const newVol = Math.max(0, videoRef.current.volume - 0.1);
            videoRef.current.volume = newVol;
            setVolume(newVol);
            setIsMuted(newVol === 0);
            localStorage.setItem('nexusedu_volume', String(newVol));
            showVideoToast(`Volume ${Math.round(newVol * 100)}%`);
          }
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, handleSeek, toggleMute, toggleFullscreen]);

  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      if (isPlaying) {
        timeout = setTimeout(() => setShowControls(false), 3000);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', () => {
        if (isPlaying) setShowControls(false);
      });
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', () => {});
      }
      clearTimeout(timeout);
    };
  }, [isPlaying]);

  const lastLocalSaveTimeRef = useRef<number>(0);
  const lastSupabaseSaveTimeRef = useRef<number>(0);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);

    // Update buffered amount
    if (videoRef.current.buffered.length > 0) {
      setBuffered(videoRef.current.buffered.end(videoRef.current.buffered.length - 1));
    }

    // Save progress every 5 seconds locally
    if (Math.abs(time - lastLocalSaveTimeRef.current) >= 5) {
      lastLocalSaveTimeRef.current = time;
      setProgress(videoId, time);
    }
    
    // Save progress to Supabase every 30 seconds
    if (user && duration > 0 && Math.abs(time - lastSupabaseSaveTimeRef.current) >= 30) {
      lastSupabaseSaveTimeRef.current = time;
      const percent = Math.floor((time / duration) * 100);
      saveProgress(user.id, videoId, percent).catch(console.error);
    }

    // Auto-mark complete at 85%
    if (duration > 0 && time / duration > 0.85 && !isCompleted(videoId)) {
      setCompleted(videoId, true);
      if (onComplete) onComplete();
    }
  };

  useEffect(() => {
    // Generate dummy chapters for videos longer than 10 minutes (600s)
    if (duration > 600) {
      const interval = Math.max(300, Math.floor(duration / 5)); // At least 5 mins, max 5 chapters
      const newChapters = [];
      let currentTime = 0;
      let part = 1;
      
      newChapters.push({
        title: 'Introduction',
        time: 0,
        percent: 0
      });

      currentTime += interval;
      
      while (currentTime < duration - 60) { // Don't add a chapter too close to the end
        newChapters.push({
          title: `Topic ${part}`,
          time: currentTime,
          percent: (currentTime / duration) * 100
        });
        currentTime += interval;
        part++;
      }
      
      setChapters(newChapters);
    } else {
      setChapters([]);
    }
  }, [duration]);

  const handleDurationChange = () => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration;
    setDuration(dur);

    // Resume playback logic
    const savedProgress = getProgress(videoId);
    if (savedProgress > 10 && savedProgress < dur * 0.95) {
      videoRef.current.currentTime = savedProgress;
      showToast(`Resumed from ${formatTime(savedProgress)}`);
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="relative w-full bg-black aspect-video group overflow-hidden"
      onDoubleClick={toggleFullscreen}
    >
      <video
        ref={videoRef}
        playsInline
        preload="metadata"
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={handleDurationChange}
        onWaiting={() => setIsBuffering(true)}
        onCanPlay={() => setIsBuffering(false)}
        onPlaying={() => { setIsBuffering(false); setIsPlaying(true); }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => { setIsPlaying(false); setShowControls(true); }}
        onError={(e) => {
          const video = e.target as HTMLVideoElement;
          console.error("Video Error:", video.error);
        }}
        onContextMenu={(e) => e.preventDefault()}
        onClick={togglePlay}
      />

      {/* Initial Play Overlay */}
      {!hasStarted && (
        <div 
          className="absolute inset-0 bg-black flex flex-col items-center justify-center cursor-pointer z-20"
          onClick={startVideo}
        >
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 hover:bg-white/20 hover:scale-110 transition-all duration-200">
            <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
          </div>
          <p className="text-white/60 text-sm font-medium">Tap to play</p>
        </div>
      )}

      {/* Loading Spinner */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 border-4 border-white/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {/* Center Toast */}
      {toastMessage && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/60 text-white px-4 py-2 rounded-full text-lg font-medium animate-fade-in">
            {toastMessage}
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress Bar */}
        <div 
          ref={progressRef}
          className="w-full h-1.5 bg-white/20 cursor-pointer relative group/progress"
          onClick={handleProgressClick}
        >
          {/* Buffered */}
          <div 
            className="absolute top-0 left-0 h-full bg-white/30"
            style={{ width: `${(buffered / duration) * 100}%` }}
          />
          {/* Current */}
          <div 
            className="absolute top-0 left-0 h-full bg-primary"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />

          {/* Chapter Markers */}
          {chapters.map((chapter, index) => (
            <div
              key={index}
              className="absolute top-0 bottom-0 w-0.5 bg-black/50 group-hover/progress:bg-black/80 transition-colors z-10 group/marker"
              style={{ left: `${chapter.percent}%` }}
            >
              {/* Tooltip for chapter */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/marker:opacity-100 transition-opacity bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none z-30">
                {chapter.title} • {formatTime(chapter.time)}
              </div>
            </div>
          ))}

          {/* Hover indicator (simplified) */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity z-20"
            style={{ left: `calc(${(currentTime / duration) * 100}% - 6px)` }}
          />
        </div>

        {/* Control Bar */}
        <div className="h-12 px-3 flex items-center justify-between text-white">
          <div className="flex items-center space-x-4">
            <button onClick={togglePlay} className="hover:text-primary transition-colors">
              {isPlaying ? <Pause className="w-5 h-5" fill="currentColor" /> : <Play className="w-5 h-5" fill="currentColor" />}
            </button>
            <button onClick={() => handleSeek(-10)} className="hover:text-primary transition-colors">
              <Rewind className="w-5 h-5" />
            </button>
            <button onClick={() => handleSeek(10)} className="hover:text-primary transition-colors">
              <FastForward className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-2 group/volume">
              <button onClick={toggleMute} className="hover:text-primary transition-colors">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input 
                type="range" 
                min="0" max="1" step="0.05" 
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 opacity-0 group-hover/volume:w-20 group-hover/volume:opacity-100 transition-all duration-200 accent-primary"
              />
            </div>

            <span className="text-[13px] font-mono opacity-90">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center space-x-4 relative">
            <div className="relative">
              <button 
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="text-sm font-medium hover:text-primary transition-colors px-2"
              >
                {playbackSpeed}x
              </button>
              
              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-gray-900 rounded-md py-1 shadow-lg border border-gray-800 w-24">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                    <button
                      key={speed}
                      onClick={() => changeSpeed(speed)}
                      className={`w-full text-left px-4 py-1.5 text-sm hover:bg-gray-800 ${speed === playbackSpeed ? 'text-primary font-medium' : 'text-white'}`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {document.pictureInPictureEnabled && (
              <button onClick={togglePiP} className="hover:text-primary transition-colors">
                <PictureInPicture className="w-5 h-5" />
              </button>
            )}
            
            <button onClick={toggleFullscreen} className="hover:text-primary transition-colors">
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
