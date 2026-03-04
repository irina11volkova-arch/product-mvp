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
    <div className="p-5 rounded-xl bg-zinc-50 border border-zinc-200">
      <h3 className="text-xs font-medium text-zinc-600 uppercase tracking-wider mb-4">
        Ключевые выводы
      </h3>

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
  );
}
