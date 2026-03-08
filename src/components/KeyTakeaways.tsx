'use client';

import { FeedbackResult } from '@/lib/types';

interface KeyTakeawaysProps {
  feedback: FeedbackResult;
}

export default function KeyTakeaways({ feedback }: KeyTakeawaysProps) {
  const mistakes = feedback.segments
    .filter(s => s.highlight === 'red' && s.comment)
    .map(s => s.comment!);

  const strengths = feedback.segments
    .filter(s => s.highlight === 'green' && s.comment)
    .map(s => s.comment!);

  // Deduplicate similar comments
  const uniqueMistakes = [...new Set(mistakes)];
  const uniqueStrengths = [...new Set(strengths)];

  if (uniqueMistakes.length === 0 && uniqueStrengths.length === 0) return null;

  return (
    <details className="p-5 rounded-xl bg-zinc-50 border border-zinc-200 group">
      <summary className="text-xs font-medium text-zinc-600 uppercase tracking-wider cursor-pointer list-none flex items-center gap-2">
        <svg
          className="w-4 h-4 text-zinc-400 transition-transform group-open:rotate-90"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        Ключевые выводы
      </summary>

      <div className="mt-4">
        {uniqueMistakes.length > 0 && (
          <div className="mb-4">
            <ul className="space-y-2">
              {uniqueMistakes.map((comment, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="text-red-500 font-medium text-sm mt-0.5 shrink-0">&#10005;</span>
                  <span className="text-sm text-zinc-700 leading-relaxed">{comment}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {uniqueStrengths.length > 0 && (
          <div>
            <ul className="space-y-2">
              {uniqueStrengths.map((comment, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-medium text-sm mt-0.5 shrink-0">&#10003;</span>
                  <span className="text-sm text-zinc-700 leading-relaxed">{comment}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </details>
  );
}
