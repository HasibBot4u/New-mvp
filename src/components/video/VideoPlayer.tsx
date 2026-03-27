import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';

interface VideoPlayerProps {
  videoId: string;
  posterUrl?: string;
  onProgress?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  videoId, 
  posterUrl,
  onProgress,
  onEnded 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const streamUrl = api.getVideoStreamUrl(videoId);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (onProgress) {
        onProgress(video.currentTime, video.duration);
      }
    };

    const handleEnded = () => {
      if (onEnded) onEnded();
    };

    const handleError = (e: Event) => {
      console.error('Video error:', e);
      // The backend might be asleep (Render free tier) or unreachable
      setError('Failed to load video stream. The backend server might be sleeping or unreachable.');
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setError(null);
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handlePlaying = () => {
      setIsLoading(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
    };
  }, [onProgress, onEnded]);

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-black aspect-video shadow-lg">
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface text-text-primary p-6 text-center">
          <svg className="w-12 h-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-medium mb-2">{error}</p>
          <p className="text-sm text-text-secondary mb-4">If this is the first request in a while, it may take up to 50 seconds to wake up.</p>
          <button 
            onClick={handleRetry}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
          >
            Retry Video
          </button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            src={streamUrl}
            poster={posterUrl}
            controls
            controlsList="nodownload"
            className="w-full h-full object-contain"
            preload="metadata"
            crossOrigin="anonymous"
          >
            Your browser does not support the video tag.
          </video>
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
              <svg className="w-12 h-12 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
        </>
      )}
    </div>
  );
};
