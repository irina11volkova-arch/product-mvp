'use client';

import { useState, useEffect, useRef, useCallback, use } from 'react';
import Link from 'next/link';
import TranscriptView from '@/components/TranscriptView';
import KeyTakeaways from '@/components/KeyTakeaways';
import RawTranscriptView from '@/components/RawTranscriptView';
import AudioPlayer, { AudioPlayerRef } from '@/components/AudioPlayer';
import { Session, FeedbackResult } from '@/lib/types';
import { scoreColor } from '@/lib/utils';
import { useToast } from '@/components/Toast';

export default function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const playerRef = useRef<AudioPlayerRef>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSession = async () => {
      const res = await fetch(`/api/sessions/${id}`);
      if (res.ok) setSession(await res.json());
      setLoading(false);
    };
    fetchSession();

    const interval = setInterval(async () => {
      const res = await fetch(`/api/sessions/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSession(data);
        if (data.status !== 'processing') clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [id]);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleSegmentClick = useCallback((startTime: number) => {
    playerRef.current?.seekTo(startTime);
  }, []);

  const handleFeedbackDislike = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast('Ссылка скопирована — отправь Родиону', 'info');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p className="text-zinc-500">Сессия не найдена</p>
        <Link href="/partnerka" className="text-zinc-600 hover:text-zinc-900 text-sm transition-colors">
          На главную
        </Link>
      </div>
    );
  }

  const feedback: FeedbackResult | null = session.feedback_json
    ? JSON.parse(session.feedback_json)
    : null;

  const rawSegments = session.transcript_json
    ? JSON.parse(session.transcript_json)
    : null;

  const isTranscriptionOnly = session.mode === 'transcription';
  const hasAudio = !!session.audio_path;

  return (
    <main className="min-h-screen">
      {hasAudio && session.status === 'done' && (
        <AudioPlayer ref={playerRef} sessionId={id} onTimeUpdate={handleTimeUpdate} />
      )}

      <div className="max-w-3xl mx-auto px-6 py-12">
        <header className="mb-8 animate-fade-in">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">{session.title}</h1>
              <p className="text-zinc-500 text-sm mt-1">
                {new Date(session.created_at).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            {session.score != null && (
              <div className={`px-4 py-2 rounded-xl text-lg font-semibold ${scoreColor(session.score)}`}>
                {session.score}/10
              </div>
            )}
          </div>
        </header>

        {session.status === 'processing' && (
          <div className="flex flex-col items-center py-16 gap-4">
            <div className="w-10 h-10 border-2 border-zinc-200 border-t-zinc-700 rounded-full animate-spin" />
            <p className="text-zinc-600">
              {isTranscriptionOnly ? 'Транскрибирую...' : 'Анализирую звонок...'}
            </p>
          </div>
        )}

        {session.status === 'error' && (
          <div className="p-5 rounded-xl bg-red-50 border border-red-100 mb-8">
            <p className="text-red-600 text-sm">
              {session.error_message || 'Ошибка при обработке'}
            </p>
          </div>
        )}

        {session.status === 'done' && isTranscriptionOnly && rawSegments && (
          <div className="animate-fade-in">
            <RawTranscriptView
              segments={rawSegments}
              currentTime={hasAudio ? currentTime : undefined}
              onSegmentClick={hasAudio ? handleSegmentClick : undefined}
            />
          </div>
        )}

        {session.status === 'done' && !isTranscriptionOnly && feedback && (
          <div className="animate-fade-in space-y-6">
            <KeyTakeaways feedback={feedback} />
            <TranscriptView
              feedback={feedback}
              currentTime={hasAudio ? currentTime : undefined}
              onSegmentClick={hasAudio ? handleSegmentClick : undefined}
            />

            <div className="mt-10 pt-6 border-t border-zinc-200 flex justify-center">
              <button
                onClick={handleFeedbackDislike}
                className="group flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-200
                           hover:border-red-200 hover:bg-red-50 transition-all text-sm"
              >
                <svg className="w-4 h-4 text-zinc-500 group-hover:text-red-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.498 15.25H4.372c-1.026 0-1.945-.694-2.054-1.715a12.137 12.137 0 01-.068-1.285c0-2.848.992-5.464 2.649-7.521C5.287 4.247 5.886 4 6.504 4h4.016a4.5 4.5 0 011.423.23l3.114 1.04a4.5 4.5 0 001.423.23h1.294M7.498 15.25c.618 0 .991.724.725 1.282A7.471 7.471 0 007.5 19.75 2.25 2.25 0 009.75 22a.75.75 0 00.75-.75v-.633c0-.573.11-1.14.322-1.672.304-.76.93-1.33 1.653-1.715a9.04 9.04 0 002.86-2.4c.498-.634 1.226-1.08 2.032-1.08h.384" />
                </svg>
                <span className="text-zinc-500 group-hover:text-red-600">
                  AI-фидбек не понравился
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
