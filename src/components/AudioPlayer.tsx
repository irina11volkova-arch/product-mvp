'use client';

import { useRef, useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';

export interface AudioPlayerRef {
  seekTo: (time: number) => void;
  getCurrentTime: () => number;
}

interface AudioPlayerProps {
  sessionId: string;
}

const AudioPlayer = forwardRef<AudioPlayerRef, AudioPlayerProps>(({ sessionId }, ref) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);

  useImperativeHandle(ref, () => ({
    seekTo: (time: number) => {
      if (audioRef.current) {
        audioRef.current.currentTime = time;
        audioRef.current.play();
        setIsPlaying(true);
      }
    },
    getCurrentTime: () => audioRef.current?.currentTime ?? 0,
  }));

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);
    const onError = () => setError(true);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * duration;
  }, [duration]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (error) return null;

  return (
    <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-zinc-200 px-6 py-3">
      <audio ref={audioRef} src={`/api/audio/${sessionId}`} preload="metadata" />
      <div className="max-w-3xl mx-auto flex items-center gap-4">
        <button
          onClick={togglePlay}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-900 hover:bg-zinc-700 transition-colors shrink-0"
        >
          {isPlaying ? (
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <span className="text-xs text-zinc-500 font-mono w-10 text-right shrink-0">
          {formatTime(currentTime)}
        </span>

        <div
          className="flex-1 h-2 bg-zinc-200 rounded-full cursor-pointer relative group"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-zinc-900 rounded-full transition-all"
            style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-zinc-900 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
          />
        </div>

        <span className="text-xs text-zinc-500 font-mono w-10 shrink-0">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
});

AudioPlayer.displayName = 'AudioPlayer';

export default AudioPlayer;
