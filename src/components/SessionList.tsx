'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Session } from '@/lib/types';

export default function SessionList() {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    fetch('/api/sessions')
      .then((r) => r.json())
      .then(setSessions);
  }, []);

  if (sessions.length === 0) return null;

  return (
    <div className="w-full">
      <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
        История
      </h2>
      <div className="space-y-1.5">
        {sessions.map((s) => (
          <Link
            key={s.id}
            href={`/session/${s.id}`}
            className="flex items-center justify-between p-3 rounded-xl
                       hover:bg-zinc-50 transition-colors group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                s.status === 'done' ? 'bg-emerald-500' :
                s.status === 'error' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'
              }`} />
              <span className="text-zinc-700 text-sm truncate group-hover:text-zinc-900">
                {s.title}
              </span>
            </div>
            <span className="text-xs text-zinc-500 shrink-0 ml-3">
              {s.status === 'processing' ? 'Обработка...' :
               s.status === 'error' ? 'Ошибка' : ''}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
