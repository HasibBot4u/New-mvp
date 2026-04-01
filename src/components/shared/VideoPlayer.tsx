import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Rewind, FastForward, PictureInPicture } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { useVideoProgress } from '../../hooks/useVideoProgress';
import { useAuth } from '../../contexts/AuthContext';
import { saveProgress } from '../../lib/supabase';

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
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [chapters, setChapters] = useState<{ title: string; time: number; percent: number }[]>([]);

  const startVideo = async () => {
    if (!videoRef.current) return;
    
    setHasStarted(true);
    setIsStarting(true);
    setHasError(false);
    setErrorMessage('');

    const BACKENDS = [
      'https://nexusedu-backend-0bjq.onrender.com',
      'https://edbe7e18-233b-4ff5-bed9-83c4e0edd51e-00-25a1ryv2rxe0o.sisko.replit.dev'
    ];
    
    // Step 1: Find a working backend
    let workingBackend = localStorage.getItem('working_backend') || '';
    
    // Verify cached backend is still alive
    if (workingBackend) {
      try {
        const check = await fetch(`${workingBackend}/`, {
          signal: AbortSignal.timeout(5000)
        });
        if (!check.ok) workingBackend = '';
      } catch {
        workingBackend = '';
      }
    }
    
    // Try all backends if cache is stale
    if (!workingBackend) {
      for (const backend of BACKENDS) {
        try {
          const res = await fetch(`${backend}/`, {
            signal: AbortSignal.timeout(8000)
          });
          if (res.ok) {
            workingBackend = backend;
            localStorage.setItem('working_backend', backend);
            break;
          }
        } catch {
          continue;
        }
      }
    }
    
    if (!workingBackend) {
      setIsStarting(false);
      setHasError(true);
      setErrorMessage('Cannot reach video server. Check your connection.');
      return;
    }

    // Step 2: Prefetch with retries
    // Render.com can take up to 60s to wake up
    setErrorMessage('Preparing video...');
    let prefetchOk = false;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const prefetchRes = await fetch(
          workingBackend + '/api/prefetch/' + videoId,
          { signal: AbortSignal.timeout(15000) }
        );
        if (prefetchRes.ok) {
          const data = await prefetchRes.json();
          if (data.status === 'not_found') {
            setIsStarting(false);
            setHasError(true);
            setErrorMessage(
              'Video not found in catalog. ' +
              'Check that it is added in the admin panel.'
            );
            return;
          }
          if (data.status === 'not_linked') {
            setIsStarting(false);
            setHasError(true);
            setErrorMessage(
              'Video is not linked to Telegram. ' +
              'Set the Message ID in the admin panel.'
            );
            return;
          }
          prefetchOk = true;
          break;
        }
      } catch (e) {
        console.warn(
          'Prefetch attempt ' + attempt + ' failed:', e
        );
        if (attempt < 3) {
          setErrorMessage(
            'Server is waking up... attempt ' + 
            attempt + '/3'
          );
          await new Promise(r => setTimeout(r, 5000));
        }
      }
    }
    
    if (!prefetchOk) {
      console.warn(
        'All prefetch attempts failed, trying direct stream'
      );
      // Continue anyway — the stream might still work
    }

    // Step 3: Now set the video src — the message is cached so
    // the first byte will arrive almost instantly
    setIsStarting(false);
    setIsBuffering(true);
    setErrorMessage('');
    
    const video = videoRef.current;
    const streamUrl = `${workingBackend}/api/stream/${videoId}`;
    video.src = streamUrl;
    video.load();

    // Start playing when enough data arrives
    const onCanPlay = () => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          if (err.name !== 'AbortError') {
            console.error('play() rejected:', err);
            setIsBuffering(false);
            // play() rejection is usually autoplay policy, not a real error
            // Just show the play button again
            setIsPlaying(false);
          }
        });
      }
    };
    video.addEventListener('canplay', onCanPlay, { once: true });
    
    // Safety timeout — if canplay never fires in 20 seconds
    const timer = setTimeout(() => {
      video.removeEventListener('canplay', onCanPlay);
      if (!video.currentTime) {
        setIsBuffering(false);
        setHasError(true);
        setHasStarted(false);
        setErrorMessage(
          'Video is taking too long to start. ' +
          'The server may still be waking up. ' +
          'Please tap Retry in 30 seconds.'
        );
      }
    }, 20000);
    
    video.addEventListener('playing', () => {
      clearTimeout(timer);
      setIsBuffering(false);
    }, { once: true });
  };

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
    if (!hasStarted || !videoRef.current) {
      if (!isStarting) startVideo();
      return;
    }
    const video = videoRef.current;
    if (video.paused || video.ended) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          if (error.name !== 'AbortError') {
            console.error('play() rejected:', error);
          }
        });
      }
    } else {
      video.pause();
    }
  }, [hasStarted, isStarting, videoId]);

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
          const errCode = video.error?.code;
          // Code 4 = MEDIA_ERR_SRC_NOT_SUPPORTED
          // Code 2 = MEDIA_ERR_NETWORK  
          // Code 3 = MEDIA_ERR_DECODE
          if (hasStarted && errCode) {
            setIsBuffering(false);
            setHasError(true);
            setHasStarted(false);
            if (errCode === 4) {
              setErrorMessage(
                'Video format not supported or server returned an error. ' +
                'Tap Retry — the server may need 30 seconds to warm up.'
              );
            } else if (errCode === 2) {
              setErrorMessage(
                'Network error while loading video. ' +
                'Check your connection and tap Retry.'
              );
            } else {
              setErrorMessage(
                'Video failed to load (error ' + errCode + '). Tap Retry.'
              );
            }
          }
        }}
        onContextMenu={(e) => e.preventDefault()}
        onClick={() => { if (hasStarted) togglePlay(); }}
      />

      {/* Initial Play Overlay */}
      {!hasStarted && !hasError && (
        <div
          className="absolute inset-0 bg-black flex flex-col 
                     items-center justify-center cursor-pointer z-20"
          onClick={!isStarting ? startVideo : undefined}
        >
          {isStarting ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-14 h-14 border-4 border-white/20 
                              border-t-white rounded-full animate-spin" />
              <p className="text-white font-semibold text-base">
                {errorMessage || 'Preparing video...'}
              </p>
              <p className="text-white/50 text-xs text-center px-8">
                Connecting to server and warming cache
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-white/10 border-2 border-white/20
                              rounded-full flex items-center justify-center 
                              mb-4 hover:bg-white/20 hover:scale-105 
                              transition-all duration-200">
                <Play className="w-9 h-9 text-white ml-1" fill="currentColor" />
              </div>
              <p className="text-white font-semibold text-base mb-1">
                Tap to Play
              </p>
              <p className="text-white/40 text-xs">
                Video will start in 1–2 seconds
              </p>
            </div>
          )}
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 bg-gray-950 flex flex-col 
                        items-center justify-center z-20 px-8">
          <div className="w-16 h-16 bg-red-500/20 rounded-full 
                          flex items-center justify-center mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <p className="text-white font-bold text-base text-center mb-2">
            Video Failed to Load
          </p>
          <p className="text-white/60 text-sm text-center leading-relaxed mb-6">
            {errorMessage}
          </p>
          <button
            onClick={() => {
              setHasError(false);
              setHasStarted(false);
              setIsStarting(false);
              setErrorMessage('');
              if (videoRef.current) {
                videoRef.current.src = '';
                videoRef.current.load();
              }
            }}
            className="px-8 py-3 bg-primary text-white rounded-xl 
                       font-semibold hover:bg-primary/90 
                       active:scale-95 transition-all"
          >
            Retry
          </button>
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
