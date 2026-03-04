'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ProcessingStatusProps {
  sessionId: string;
}

export default function ProcessingStatus({ sessionId }: ProcessingStatusProps) {
  const router = useRouter();
  const [dots, setDots] = useState('');

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 500);

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        const session = await res.json();
        if (session.status !== 'processing') {
          router.push(`/session/${sessionId}`);
        }
      } catch {}
    }, 3000);

    return () => { clearInterval(dotInterval); clearInterval(pollInterval); };
  }, [sessionId, router]);

  return (
    <div className="flex flex-col items-center py-16 gap-5">
      <div className="w-10 h-10 border-2 border-zinc-200 border-t-zinc-700 rounded-full animate-spin" />
      <div className="text-center">
        <p className="text-zinc-700 font-medium">Анализирую{dots}</p>
        <p className="text-zinc-400 text-sm mt-1">Обычно 1–3 минуты</p>
      </div>
    </div>
  );
}
