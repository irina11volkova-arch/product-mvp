'use client';

import { FeedbackResult, TranscriptSegment } from '@/lib/types';

interface TranscriptViewProps {
  feedback: FeedbackResult;
}

export default function TranscriptView({ feedback }: TranscriptViewProps) {
  return (
    <div className="space-y-6">
      {/* Overall status */}
      <div className="p-5 rounded-xl bg-zinc-50 border border-zinc-100">
        <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Результат</h3>
        <p className="text-zinc-800 leading-relaxed">{feedback.overall_status}</p>
      </div>

      {/* Rapport note */}
      <div className="p-5 rounded-xl bg-indigo-50 border border-indigo-100">
        <h3 className="text-xs font-medium text-indigo-500 uppercase tracking-wider mb-2">Раппорт</h3>
        <p className="text-zinc-700 leading-relaxed">{feedback.rapport_note}</p>
      </div>

      {/* Transcript */}
      <div>
        <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Транскрипция</h3>
        <div className="space-y-0.5">
          {feedback.segments.map((segment, i) => (
            <SegmentBlock key={i} segment={segment} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SegmentBlock({ segment }: { segment: TranscriptSegment }) {
  const bgClass = segment.highlight === 'green'
    ? 'bg-emerald-50 border-l-emerald-500'
    : segment.highlight === 'red'
    ? 'bg-red-50 border-l-red-500'
    : 'bg-white border-l-zinc-200';

  return (
    <div>
      <div className={`p-3 rounded-lg border-l-4 ${bgClass}`}>
        <div className="flex items-start gap-3">
          <span className="text-xs font-mono text-zinc-500 pt-0.5 shrink-0 min-w-[70px]">
            {segment.speaker}
          </span>
          <p className="text-zinc-700 text-sm leading-relaxed">{segment.text}</p>
        </div>
      </div>

      {segment.comment && (
        <div className={`ml-6 mt-0.5 mb-2 p-3 rounded-lg text-sm ${
          segment.highlight === 'green'
            ? 'bg-emerald-50/50 text-emerald-700'
            : 'bg-red-50/50 text-red-700'
        }`}>
          {segment.comment}
        </div>
      )}
    </div>
  );
}
